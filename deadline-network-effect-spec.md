# 要件定義書: ES締め切りデータベース（ネットワーク効果型）

## 1. 概要

### 1.1 目的

就活Simplifyのコア機能として、企業のES提出締め切りをはじめとする選考日程データベースを構築する。ユーザーが自分の選考管理をするだけで、全ユーザー共有のナレッジベースが自然に育つ「ネットワーク効果」を組み込んだ設計とする。

### 1.2 コンセプト

```
管理者がベース情報を準備（人気50〜100社）
  ↓
新規ユーザーが自分の選考状況・締切を入力する
  ↓
入力データがシグナルとして匿名蓄積される
  ↓
管理者がfact-checkし、検証済みデータとして承認
  ↓
全ユーザーに提示される情報が増え、体験が向上
  ↓
口コミで新規ユーザーが増える → さらにデータが増える
```

### 1.3 既存アーキテクチャとの関係

- **フロントエンド**: React 18 + TypeScript + Vite + Tailwind CSS
- **バックエンド**: Supabase (PostgreSQL + Auth + RLS + RPC)
- **パッケージ構成**: `packages/shared/src/` 配下の型定義・リポジトリパターン
- **既存テーブル**: profiles, user_profiles, templates, companies, applications, entry_sheets, es_questions
- **既存型定義**: `CompanyMaster`, `DeadlinePreset`, `DeadlinePresetWithCompany`, `CompanyDeadline`
- **既存リポジトリ**: `deadlinePresetRepository.ts`（RPC呼び出し済み、DB未作成）

---

## 2. データモデル

### 2.1 テーブル一覧と役割

| テーブル | 層 | 役割 |
|---------|-----|------|
| `company_masters` | グローバル（共有） | 全ユーザー共有の企業マスタ |
| `deadline_presets` | グローバル（共有） | 検証済みの締め切りデータベース（プロダクトの価値の源泉） |
| `deadline_contributions` | シグナル層 | ユーザー入力から匿名抽出された締め切り情報 |
| `deadline_change_log` | 履歴層 | 締め切り変更の全履歴 |
| `companies` | ユーザー個人 | 既存テーブル。`company_master_id` でグローバル層とリンク |
| `applications` | ユーザー個人 | 既存テーブル。`deadlines` JSONB配列で個人の締切管理 |

### 2.2 applications.deadlines JSONB配列のスキーマ

既存の `CompanyDeadline` 型がそのまま JSONB 配列の各要素に対応する。

```typescript
// 既存の types/company.ts で定義済み
interface CompanyDeadline {
  id: string;          // crypto.randomUUID()
  type: DeadlineType;  // 'es_submission' | 'internship' | 'webtest' | 'interview' | ...
  label: string;       // "本選考ES", "夏インターンES" 等
  date: string;        // YYYY-MM-DD
  time?: string;       // HH:mm（24h）
  memo?: string;
  createdAt: string;   // ISO 8601
  isPreset?: boolean;  // true = deadline_presets から取り込んだもの, false/undefined = ユーザー手入力
}
```

**シグナル送信の判定ロジック**:
- `isPreset === true` → プリセット由来なので、シグナル送信しない（既に検証済みデータ）
- `isPreset === false` または `undefined` → ユーザーが自分で入力した情報なので、シグナルとして `deadline_contributions` に送信する

### 2.3 ER図（テキスト表現）

```
company_masters (共有・グローバル)
  │
  ├── 1:N ── deadline_presets (共有・検証済み締め切り)
  │              │
  │              └── 1:N ── deadline_change_log (変更履歴)
  │
  ├── 1:N ── deadline_contributions (匿名シグナル)
  │              ↑ ユーザーの締切入力から自動生成
  │              ↓ fact-check後に deadline_presets へ昇格
  │
  └── 1:N ── companies (ユーザー個人) ← company_master_id でリンク
                │
                └── 1:1 ── applications (ユーザー個人)
                              └── deadlines JSONB配列
                                    ← preset から取り込み
                                    → contribution として匿名貢献
```

---

## 3. SQLマイグレーション

### ファイル: `supabase/migrations/002_company_master_and_deadlines.sql`

```sql
-- ============================================================
-- 002: 企業マスタ・締め切りデータベース・ネットワーク効果基盤
-- ============================================================

-- ============================================================
-- company_masters: 全ユーザー共有の企業マスタ
-- ============================================================
CREATE TABLE company_masters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_number TEXT UNIQUE,
  name TEXT NOT NULL,
  name_kana TEXT,
  industry TEXT,
  employee_count INTEGER,
  website_url TEXT,
  website_domain TEXT,
  logo_url TEXT,
  mypage_url TEXT,
  recruit_url TEXT,
  is_popular BOOLEAN DEFAULT false,
  popularity_rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_company_masters_name ON company_masters USING gin (name gin_trgm_ops);
CREATE INDEX idx_company_masters_popular ON company_masters (is_popular, popularity_rank);

ALTER TABLE company_masters ENABLE ROW LEVEL SECURITY;

-- 全認証ユーザーが閲覧可能
CREATE POLICY "Authenticated users can view company masters"
  ON company_masters FOR SELECT
  USING (auth.role() = 'authenticated');

-- 管理者のみ変更可能（profilesのis_adminで判定）
CREATE POLICY "Admins can insert company masters"
  ON company_masters FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update company masters"
  ON company_masters FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete company masters"
  ON company_masters FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE TRIGGER company_masters_updated_at
  BEFORE UPDATE ON company_masters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- deadline_presets: 検証済み締め切りデータベース（共有）
-- ============================================================
CREATE TABLE deadline_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_master_id UUID NOT NULL REFERENCES company_masters(id) ON DELETE CASCADE,
  recruitment_year INTEGER NOT NULL,
  deadline_type TEXT NOT NULL,
  label TEXT NOT NULL,
  deadline_date DATE NOT NULL,
  deadline_time TIME,
  memo TEXT,
  source TEXT NOT NULL DEFAULT 'admin_curated',
  source_url TEXT,
  verified BOOLEAN DEFAULT false,
  contributor_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(company_master_id, recruitment_year, deadline_type, label)
);

-- source の値: 'admin_curated' | 'community_verified'
-- deadline_type の値: 'es_submission' | 'internship' | 'webtest' | 'interview' | 'offer_response' | 'document' | 'event' | 'other'

CREATE INDEX idx_deadline_presets_company_year
  ON deadline_presets (company_master_id, recruitment_year);
CREATE INDEX idx_deadline_presets_date
  ON deadline_presets (deadline_date);
CREATE INDEX idx_deadline_presets_verified
  ON deadline_presets (verified) WHERE verified = true;

ALTER TABLE deadline_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view verified presets"
  ON deadline_presets FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert presets"
  ON deadline_presets FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update presets"
  ON deadline_presets FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete presets"
  ON deadline_presets FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE TRIGGER deadline_presets_updated_at
  BEFORE UPDATE ON deadline_presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- deadline_contributions: ユーザーからの匿名シグナル
-- ============================================================
CREATE TABLE deadline_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_master_id UUID NOT NULL REFERENCES company_masters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recruitment_year INTEGER NOT NULL,
  deadline_type TEXT NOT NULL,
  label TEXT NOT NULL,
  reported_date DATE NOT NULL,
  reported_time TIME,
  source_note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(company_master_id, user_id, recruitment_year, deadline_type, label)
);

-- status の値: 'pending' | 'verified' | 'rejected'
-- source_note の例: 'マイページ' | '企業HP' | '説明会' | 'リクナビ' | 'マイナビ' | 'その他'

CREATE INDEX idx_contributions_pending
  ON deadline_contributions (status, company_master_id)
  WHERE status = 'pending';
CREATE INDEX idx_contributions_company_year
  ON deadline_contributions (company_master_id, recruitment_year, deadline_type, label);

ALTER TABLE deadline_contributions ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の投稿のみ閲覧可能
CREATE POLICY "Users can view own contributions"
  ON deadline_contributions FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分の投稿のみ作成可能
CREATE POLICY "Users can insert own contributions"
  ON deadline_contributions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の投稿のみ更新可能（日付変更時）
CREATE POLICY "Users can update own contributions"
  ON deadline_contributions FOR UPDATE
  USING (auth.uid() = user_id);

-- 管理者は全件閲覧可能（集約ダッシュボード用）
CREATE POLICY "Admins can view all contributions"
  ON deadline_contributions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 管理者はステータス更新可能（検証/却下）
CREATE POLICY "Admins can update all contributions"
  ON deadline_contributions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ============================================================
-- deadline_change_log: 締め切り変更履歴
-- ============================================================
CREATE TABLE deadline_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deadline_preset_id UUID NOT NULL REFERENCES deadline_presets(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id),
  change_type TEXT NOT NULL,
  old_date DATE,
  new_date DATE,
  old_time TIME,
  new_time TIME,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- change_type の値: 'created' | 'date_changed' | 'verified' | 'rejected'

CREATE INDEX idx_change_log_preset
  ON deadline_change_log (deadline_preset_id, created_at DESC);

ALTER TABLE deadline_change_log ENABLE ROW LEVEL SECURITY;

-- 管理者のみ閲覧可能
CREATE POLICY "Admins can view change log"
  ON deadline_change_log FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- SECURITY DEFINER の RPC関数（verify_contribution等）経由でのみINSERT
-- RPC関数は SECURITY DEFINER で実行されるため、RLSをバイパスする
-- 直接INSERTは管理者のみ許可
CREATE POLICY "Admins can insert change log"
  ON deadline_change_log FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ============================================================
-- 既存テーブルへの変更
-- ============================================================

-- profiles に管理者フラグを追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- companies に company_master_id を追加（グローバル層とのリンク）
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_master_id UUID REFERENCES company_masters(id);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS website_domain TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS recruit_url TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS login_password TEXT;

CREATE INDEX idx_companies_master_id ON companies (company_master_id) WHERE company_master_id IS NOT NULL;

-- applications の deadline カラムを deadlines JSONB に変更
-- 注意: 既存データがある場合は移行が必要
ALTER TABLE applications ADD COLUMN IF NOT EXISTS deadlines JSONB DEFAULT '[]';

-- pg_trgm 拡張（企業名の部分一致検索に必要）
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

---

## 4. RPC関数

### 4.1 企業マスタ検索

```sql
-- ============================================================
-- 企業マスタの検索（名前の部分一致 + 類似度スコア）
-- ============================================================
CREATE OR REPLACE FUNCTION search_company_masters(
  search_query TEXT,
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  name_kana TEXT,
  industry TEXT,
  logo_url TEXT,
  website_url TEXT,
  website_domain TEXT,
  mypage_url TEXT,
  recruit_url TEXT,
  is_popular BOOLEAN,
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.id, cm.name, cm.name_kana, cm.industry,
    cm.logo_url, cm.website_url, cm.website_domain,
    cm.mypage_url, cm.recruit_url, cm.is_popular,
    similarity(cm.name, search_query) AS similarity_score
  FROM company_masters cm
  WHERE cm.name ILIKE '%' || search_query || '%'
     OR cm.name_kana ILIKE '%' || search_query || '%'
  ORDER BY
    cm.is_popular DESC,
    similarity(cm.name, search_query) DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.2 締め切りプリセット取得

```sql
-- ============================================================
-- 特定企業の検証済み締め切りプリセットを取得
-- 既存の deadlinePresetRepository.ts から呼ばれる
-- ============================================================
CREATE OR REPLACE FUNCTION get_deadline_presets_by_master_id(
  master_id UUID,
  target_year INTEGER DEFAULT NULL
)
RETURNS SETOF deadline_presets AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM deadline_presets
  WHERE company_master_id = master_id
    AND (target_year IS NULL OR recruitment_year = target_year)
    AND verified = true
  ORDER BY deadline_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.3 締め切りプリセット検索（企業情報付き）

```sql
-- ============================================================
-- 締め切りプリセットの横断検索（企業名での検索 + 企業情報JOINつき）
-- 既存の deadlinePresetRepository.ts から呼ばれる
-- ============================================================
CREATE OR REPLACE FUNCTION search_deadline_presets(
  search_query TEXT,
  target_year INTEGER,
  result_limit INTEGER DEFAULT 50,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  company_master_id UUID,
  company_name TEXT,
  company_industry TEXT,
  company_logo_url TEXT,
  company_website_domain TEXT,
  recruitment_year INTEGER,
  deadline_type TEXT,
  label TEXT,
  deadline_date DATE,
  deadline_time TIME,
  memo TEXT,
  source TEXT,
  source_url TEXT,
  verified BOOLEAN,
  contributor_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dp.id, dp.company_master_id,
    cm.name AS company_name,
    cm.industry AS company_industry,
    cm.logo_url AS company_logo_url,
    cm.website_domain AS company_website_domain,
    dp.recruitment_year, dp.deadline_type, dp.label,
    dp.deadline_date, dp.deadline_time, dp.memo,
    dp.source, dp.source_url, dp.verified,
    dp.contributor_count,
    dp.created_at, dp.updated_at
  FROM deadline_presets dp
  JOIN company_masters cm ON cm.id = dp.company_master_id
  WHERE dp.recruitment_year = target_year
    AND dp.verified = true
    AND (
      search_query = ''
      OR cm.name ILIKE '%' || search_query || '%'
      OR cm.name_kana ILIKE '%' || search_query || '%'
    )
  ORDER BY dp.deadline_date ASC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.4 シグナル集約ビュー（管理者用）

```sql
-- ============================================================
-- 未検証のシグナルを集約して表示（管理者ダッシュボード用）
-- 同じ企業・年度・タイプ・ラベルのシグナルをグループ化し、
-- 報告数の多い順に並べる
-- ============================================================
CREATE OR REPLACE FUNCTION get_pending_contributions_summary()
RETURNS TABLE (
  company_master_id UUID,
  company_name TEXT,
  company_industry TEXT,
  company_logo_url TEXT,
  recruitment_year INTEGER,
  deadline_type TEXT,
  label TEXT,
  most_common_date DATE,
  unique_dates_count BIGINT,
  contributor_count BIGINT,
  existing_preset_id UUID,
  existing_preset_date DATE,
  is_divergent BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH aggregated AS (
    -- まず企業・年度・タイプ・ラベル単位で集約（日付をまたいで）
    SELECT
      dc.company_master_id,
      dc.recruitment_year,
      dc.deadline_type,
      dc.label,
      -- 最も多く報告された日付を取得（MODE相当）
      (
        SELECT sub.reported_date
        FROM deadline_contributions sub
        WHERE sub.company_master_id = dc.company_master_id
          AND sub.recruitment_year = dc.recruitment_year
          AND sub.deadline_type = dc.deadline_type
          AND sub.label = dc.label
          AND sub.status = 'pending'
        GROUP BY sub.reported_date
        ORDER BY COUNT(*) DESC, sub.reported_date ASC
        LIMIT 1
      ) AS most_common_date,
      COUNT(DISTINCT dc.reported_date) AS unique_dates_count,
      COUNT(DISTINCT dc.user_id) AS contributor_count
    FROM deadline_contributions dc
    WHERE dc.status = 'pending'
    GROUP BY dc.company_master_id, dc.recruitment_year, dc.deadline_type, dc.label
  )
  SELECT
    agg.company_master_id,
    cm.name AS company_name,
    cm.industry AS company_industry,
    cm.logo_url AS company_logo_url,
    agg.recruitment_year,
    agg.deadline_type,
    agg.label,
    agg.most_common_date,
    agg.unique_dates_count,
    agg.contributor_count,
    dp.id AS existing_preset_id,
    dp.deadline_date AS existing_preset_date,
    -- 既存プリセットと最頻日付が異なる場合 true（締切変更の可能性）
    (dp.deadline_date IS NOT NULL AND dp.deadline_date != agg.most_common_date) AS is_divergent
  FROM aggregated agg
  JOIN company_masters cm ON cm.id = agg.company_master_id
  LEFT JOIN deadline_presets dp
    ON dp.company_master_id = agg.company_master_id
    AND dp.recruitment_year = agg.recruitment_year
    AND dp.deadline_type = agg.deadline_type
    AND dp.label = agg.label
    AND dp.verified = true
  ORDER BY agg.contributor_count DESC, agg.most_common_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.5 シグナル検証（管理者のワンクリック承認）

```sql
-- ============================================================
-- 管理者が集約されたシグナルを検証し、deadline_presetsに反映する
-- ============================================================
CREATE OR REPLACE FUNCTION verify_contribution(
  p_company_master_id UUID,
  p_recruitment_year INTEGER,
  p_deadline_type TEXT,
  p_label TEXT,
  p_verified_date DATE,
  p_verified_time TIME DEFAULT NULL,
  p_memo TEXT DEFAULT NULL,
  p_source_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  preset_id UUID;
  contributor_cnt BIGINT;
  old_preset_date DATE;
BEGIN
  -- 報告者数を取得
  SELECT COUNT(DISTINCT user_id) INTO contributor_cnt
  FROM deadline_contributions
  WHERE company_master_id = p_company_master_id
    AND recruitment_year = p_recruitment_year
    AND deadline_type = p_deadline_type
    AND label = p_label
    AND status = 'pending';

  -- 既存プリセットの日付を取得（変更ログ用）
  SELECT deadline_date INTO old_preset_date
  FROM deadline_presets
  WHERE company_master_id = p_company_master_id
    AND recruitment_year = p_recruitment_year
    AND deadline_type = p_deadline_type
    AND label = p_label;

  -- deadline_presets に UPSERT
  INSERT INTO deadline_presets (
    company_master_id, recruitment_year, deadline_type, label,
    deadline_date, deadline_time, memo,
    source, source_url, verified, contributor_count
  ) VALUES (
    p_company_master_id, p_recruitment_year, p_deadline_type, p_label,
    p_verified_date, p_verified_time, p_memo,
    'community_verified', p_source_url, true, contributor_cnt
  )
  ON CONFLICT (company_master_id, recruitment_year, deadline_type, label)
  DO UPDATE SET
    deadline_date = EXCLUDED.deadline_date,
    deadline_time = EXCLUDED.deadline_time,
    memo = COALESCE(EXCLUDED.memo, deadline_presets.memo),
    verified = true,
    contributor_count = EXCLUDED.contributor_count,
    source = 'community_verified',
    source_url = COALESCE(EXCLUDED.source_url, deadline_presets.source_url)
  RETURNING id INTO preset_id;

  -- contribution のステータスを更新
  UPDATE deadline_contributions
  SET status = 'verified'
  WHERE company_master_id = p_company_master_id
    AND recruitment_year = p_recruitment_year
    AND deadline_type = p_deadline_type
    AND label = p_label
    AND status = 'pending';

  -- 変更ログに記録
  INSERT INTO deadline_change_log (
    deadline_preset_id, changed_by, change_type,
    old_date, new_date, old_time, new_time, reason
  ) VALUES (
    preset_id,
    auth.uid(),
    CASE
      WHEN old_preset_date IS NULL THEN 'created'
      WHEN old_preset_date != p_verified_date THEN 'date_changed'
      ELSE 'verified'
    END,
    old_preset_date,
    p_verified_date,
    NULL,
    p_verified_time,
    contributor_cnt || '人のユーザーが報告'
  );

  RETURN preset_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.6 自動検証トリガー（閾値ベース）

```sql
-- ============================================================
-- シグナルが閾値（3人）に達したら自動で verified にする
-- 全員が同じ日付を報告している場合のみ
-- ============================================================
CREATE OR REPLACE FUNCTION check_auto_verify()
RETURNS TRIGGER AS $$
DECLARE
  cnt BIGINT;
  unique_dates BIGINT;
  common_date DATE;
  common_time TIME;
  auto_verify_threshold INTEGER := 3;
BEGIN
  -- 同じ企業・年度・タイプ・ラベルの pending シグナル数
  SELECT
    COUNT(DISTINCT user_id),
    COUNT(DISTINCT reported_date)
  INTO cnt, unique_dates
  FROM deadline_contributions
  WHERE company_master_id = NEW.company_master_id
    AND recruitment_year = NEW.recruitment_year
    AND deadline_type = NEW.deadline_type
    AND label = NEW.label
    AND status = 'pending';

  -- 閾値以上かつ全員同じ日付の場合、自動検証
  IF cnt >= auto_verify_threshold AND unique_dates = 1 THEN
    SELECT reported_date, reported_time INTO common_date, common_time
    FROM deadline_contributions
    WHERE company_master_id = NEW.company_master_id
      AND recruitment_year = NEW.recruitment_year
      AND deadline_type = NEW.deadline_type
      AND label = NEW.label
      AND status = 'pending'
    LIMIT 1;

    -- verify_contribution を呼んでプリセット化
    PERFORM verify_contribution(
      NEW.company_master_id,
      NEW.recruitment_year,
      NEW.deadline_type,
      NEW.label,
      common_date,
      common_time
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auto_verify_contributions
  AFTER INSERT ON deadline_contributions
  FOR EACH ROW
  EXECUTE FUNCTION check_auto_verify();
```

---

## 5. TypeScript型定義の変更

### 5.1 新規型: `types/deadlineContribution.ts`

```typescript
/**
 * deadline_contributions テーブルの型定義
 * ユーザーが入力した締め切り情報の匿名シグナル
 */

export type ContributionStatus = 'pending' | 'verified' | 'rejected';

export type DeadlineSourceNote =
  | 'マイページ'
  | '企業HP'
  | '説明会'
  | 'リクナビ'
  | 'マイナビ'
  | 'ワンキャリア'
  | 'その他';

/** DB row type (snake_case) */
export interface DeadlineContributionRow {
  id: string;
  company_master_id: string;
  user_id: string;
  recruitment_year: number;
  deadline_type: string;
  label: string;
  reported_date: string;
  reported_time: string | null;
  source_note: string | null;
  status: string;
  created_at: string;
}

/** App type (camelCase) */
export interface DeadlineContribution {
  id: string;
  companyMasterId: string;
  userId: string;
  recruitmentYear: number;
  deadlineType: string;
  label: string;
  reportedDate: string;
  reportedTime?: string;
  sourceNote?: DeadlineSourceNote;
  status: ContributionStatus;
  createdAt: string;
}

export function toDeadlineContribution(row: DeadlineContributionRow): DeadlineContribution {
  return {
    id: row.id,
    companyMasterId: row.company_master_id,
    userId: row.user_id,
    recruitmentYear: row.recruitment_year,
    deadlineType: row.deadline_type,
    label: row.label,
    reportedDate: row.reported_date,
    reportedTime: row.reported_time ?? undefined,
    sourceNote: (row.source_note as DeadlineSourceNote) ?? undefined,
    status: row.status as ContributionStatus,
    createdAt: row.created_at,
  };
}
```

### 5.2 新規型: `types/adminTypes.ts`

```typescript
/**
 * 管理者ダッシュボード用の型定義
 */

/** get_pending_contributions_summary RPC の戻り値 */
export interface PendingContributionSummaryRow {
  company_master_id: string;
  company_name: string;
  company_industry: string | null;
  company_logo_url: string | null;
  recruitment_year: number;
  deadline_type: string;
  label: string;
  most_common_date: string;       // 最も多く報告された日付
  unique_dates_count: number;      // 報告された日付のバリエーション数
  contributor_count: number;
  existing_preset_id: string | null;
  existing_preset_date: string | null;
  is_divergent: boolean;
}

export interface PendingContributionSummary {
  companyMasterId: string;
  companyName: string;
  companyIndustry?: string;
  companyLogoUrl?: string;
  recruitmentYear: number;
  deadlineType: string;
  label: string;
  mostCommonDate: string;
  uniqueDatesCount: number;        // 1 = 全員同じ日付（信頼度高）, 2+ = バラけている（要確認）
  contributorCount: number;
  existingPresetId?: string;
  existingPresetDate?: string;
  isDivergent: boolean;
}

export function toPendingContributionSummary(
  row: PendingContributionSummaryRow
): PendingContributionSummary {
  return {
    companyMasterId: row.company_master_id,
    companyName: row.company_name,
    companyIndustry: row.company_industry ?? undefined,
    companyLogoUrl: row.company_logo_url ?? undefined,
    recruitmentYear: row.recruitment_year,
    deadlineType: row.deadline_type,
    label: row.label,
    mostCommonDate: row.most_common_date,
    uniqueDatesCount: row.unique_dates_count,
    contributorCount: row.contributor_count,
    existingPresetId: row.existing_preset_id ?? undefined,
    existingPresetDate: row.existing_preset_date ?? undefined,
    isDivergent: row.is_divergent,
  };
}
```

### 5.3 既存型の変更: `types/deadlinePreset.ts`

以下のフィールドを各インターフェースに追加する。既存フィールドは変更なし。

```typescript
// --- DeadlinePresetRow に追加 ---
export interface DeadlinePresetRow {
  id: string;
  company_master_id: string;
  recruitment_year: number;
  deadline_type: string;
  label: string;
  deadline_date: string;
  deadline_time: string | null;
  memo: string | null;
  source: string;
  source_url: string | null;
  contributed_by: string | null;
  verified: boolean;
  contributor_count: number;  // ← 追加
  created_at: string;
  updated_at: string;
}

// --- DeadlinePreset に追加 ---
export interface DeadlinePreset {
  id: string;
  companyMasterId: string;
  recruitmentYear: number;
  deadlineType: DeadlineType;
  label: string;
  deadlineDate: string;
  deadlineTime?: string;
  memo?: string;
  source: string;
  sourceUrl?: string;
  contributedBy?: string;
  verified: boolean;
  contributorCount: number;  // ← 追加
  createdAt: string;
  updatedAt: string;
}

// --- toDeadlinePreset 変換関数を更新 ---
export function toDeadlinePreset(row: DeadlinePresetRow): DeadlinePreset {
  return {
    // ... 既存のマッピングはそのまま ...
    contributorCount: row.contributor_count,  // ← 追加
  };
}

// --- DeadlinePresetWithCompanyRow に追加 ---
export interface DeadlinePresetWithCompanyRow {
  // 既存フィールドに加えて:
  contributor_count: number;  // ← 追加
}

// --- toDeadlinePresetWithCompany 変換関数を更新 ---
export function toDeadlinePresetWithCompany(row: DeadlinePresetWithCompanyRow): DeadlinePresetWithCompany {
  return {
    // ... 既存のマッピングはそのまま ...
    contributorCount: row.contributor_count,  // ← 追加
  };
}
```

---

## 6. リポジトリ層の変更

### 6.1 新規: `repositories/deadlineContributionRepository.ts`

```typescript
/**
 * ユーザーの締め切り入力からシグナルを生成・管理するリポジトリ
 */

import { getSupabase, getCurrentUser } from '../lib/supabase';
import type { DeadlineContribution, DeadlineContributionRow } from '../types/deadlineContribution';
import { toDeadlineContribution } from '../types/deadlineContribution';

/**
 * ユーザーの締め切り入力をシグナルとして記録する
 * applications.deadlines への保存と同時に呼び出す
 *
 * @param companyMasterId - company_masters.id（紐づいている場合のみ呼び出す）
 * @param recruitmentYear - 卒業年度（例: 2026）
 * @param deadlineType - 締切種別
 * @param label - 締切ラベル（例: "本選考ES"）
 * @param reportedDate - 報告された締切日
 * @param reportedTime - 報告された締切時刻（任意）
 * @param sourceNote - 情報源（任意）
 */
export async function contributeDeadlineSignal(
  companyMasterId: string,
  recruitmentYear: number,
  deadlineType: string,
  label: string,
  reportedDate: string,
  reportedTime?: string,
  sourceNote?: string,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const { error } = await getSupabase()
    .from('deadline_contributions')
    .upsert(
      {
        company_master_id: companyMasterId,
        user_id: user.id,
        recruitment_year: recruitmentYear,
        deadline_type: deadlineType,
        label: label,
        reported_date: reportedDate,
        reported_time: reportedTime ?? null,
        source_note: sourceNote ?? null,
        status: 'pending',
      },
      {
        onConflict: 'company_master_id,user_id,recruitment_year,deadline_type,label',
      }
    );

  if (error) {
    console.error('Failed to contribute deadline signal:', error.message);
  }
}

/**
 * 自分が投稿したシグナル一覧を取得
 */
export async function getMyContributions(): Promise<DeadlineContribution[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await getSupabase()
    .from('deadline_contributions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get contributions:', error.message);
    return [];
  }

  return ((data as DeadlineContributionRow[]) ?? []).map(toDeadlineContribution);
}
```

### 6.2 新規: `repositories/adminRepository.ts`

```typescript
/**
 * 管理者ダッシュボード用のリポジトリ
 */

import { getSupabase } from '../lib/supabase';
import type { PendingContributionSummary, PendingContributionSummaryRow } from '../types/adminTypes';
import { toPendingContributionSummary } from '../types/adminTypes';

/**
 * 未検証シグナルの集約一覧を取得
 */
export async function getPendingContributionsSummary(): Promise<PendingContributionSummary[]> {
  const { data, error } = await getSupabase().rpc('get_pending_contributions_summary');

  if (error) {
    console.error('Failed to get pending contributions:', error.message);
    return [];
  }

  return ((data as PendingContributionSummaryRow[]) ?? []).map(toPendingContributionSummary);
}

/**
 * シグナルを検証してプリセットに昇格する
 */
export async function verifyContribution(params: {
  companyMasterId: string;
  recruitmentYear: number;
  deadlineType: string;
  label: string;
  verifiedDate: string;
  verifiedTime?: string;
  memo?: string;
  sourceUrl?: string;
}): Promise<string | null> {
  const { data, error } = await getSupabase().rpc('verify_contribution', {
    p_company_master_id: params.companyMasterId,
    p_recruitment_year: params.recruitmentYear,
    p_deadline_type: params.deadlineType,
    p_label: params.label,
    p_verified_date: params.verifiedDate,
    p_verified_time: params.verifiedTime ?? null,
    p_memo: params.memo ?? null,
    p_source_url: params.sourceUrl ?? null,
  });

  if (error) {
    console.error('Failed to verify contribution:', error.message);
    return null;
  }

  return data as string;
}

/**
 * シグナルを却下する
 */
export async function rejectContributions(
  companyMasterId: string,
  recruitmentYear: number,
  deadlineType: string,
  label: string,
): Promise<void> {
  const { error } = await getSupabase()
    .from('deadline_contributions')
    .update({ status: 'rejected' })
    .eq('company_master_id', companyMasterId)
    .eq('recruitment_year', recruitmentYear)
    .eq('deadline_type', deadlineType)
    .eq('label', label)
    .eq('status', 'pending');

  if (error) {
    console.error('Failed to reject contributions:', error.message);
  }
}
```

### 6.3 既存の変更: `repositories/applicationRepository.ts`

`updateCompany` 関数内で、ユーザーが deadline を追加・変更したときに `contributeDeadlineSignal` を呼び出すロジックを追加する。

**変更箇所**: `updateCompany()` 関数の末尾（Supabase への UPDATE 成功後）

```typescript
import { contributeDeadlineSignal } from './deadlineContributionRepository';

/**
 * 締切保存後にシグナルを送信するヘルパー関数
 * updateCompany() の末尾で呼び出す
 */
async function emitDeadlineSignals(company: Company): Promise<void> {
  // company_master_id がない企業はスキップ（マスタ未紐づけ）
  if (!company.companyMasterId || !company.deadlines) return;

  const recruitmentYear = getCurrentRecruitmentYear();

  for (const deadline of company.deadlines) {
    // isPreset = true のもの（プリセットから取り込んだもの）はスキップ
    // ユーザーが自分で入力したもののみシグナルとして送信
    if (deadline.isPreset) continue;

    // 日付が入っていない締切はスキップ
    if (!deadline.date) continue;

    await contributeDeadlineSignal(
      company.companyMasterId,
      recruitmentYear,
      deadline.type,
      deadline.label,
      deadline.date,
      deadline.time,
      // sourceNote: CompanyDeadline型にはsourceNoteフィールドがないため、
      // UI側で入力された場合は deadline.memo に含めるか、
      // CompanyDeadline型にsourceNoteフィールドを追加する（任意拡張）
    );
  }
}

// --- updateCompany() 内での呼び出し位置 ---
// 既存の Supabase UPDATE 処理の後に追加:
//   await emitDeadlineSignals(company);
// エラーが発生してもメインの保存処理には影響しない（fire-and-forget）
```

**追加ユーティリティ**: `utils/recruitmentYear.ts`

```typescript
/**
 * 現在の卒業年度を算出する
 * 例: 2025年3月〜2026年2月 → 2026卒
 * 日本の就活は3月広報解禁なので、3月を年度の境目とする
 */
export function getCurrentRecruitmentYear(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  // 3月以降は翌年卒、1-2月は当年卒
  return month >= 3 ? year + 1 : year;
}
```

---

## 7. データフロー詳細

### 7.1 フロー1: 管理者が初期データを投入

```
管理者ログイン
  → company_masters に企業を INSERT（50〜100社）
  → deadline_presets に締切を INSERT（source='admin_curated', verified=true）
  → deadline_change_log に 'created' を記録
```

**実装ポイント**:
- 管理者画面（または Supabase Dashboard 直接操作）で入力
- CSVインポート機能があると効率的（将来的に）
- `is_popular = true` のフラグで人気企業として表示順を上げる

### 7.2 フロー2: ユーザーが選考を管理する（シグナル生成）

```
ユーザーが企業を追加
  → company_masters から検索してマッチ → company_master_id をセット
  → deadline_presets からプリセット取得 → 「この締切をカレンダーに追加しますか？」
  → ユーザーが承認 → applications.deadlines に isPreset=true で追加

ユーザーが自分で締切を入力（マイページ等で見た情報）
  → applications.deadlines に isPreset=false で追加
  → company_master_id がある場合 → deadline_contributions に INSERT（匿名シグナル）
```

**実装ポイント**:
- 企業追加時に `search_company_masters` RPCで検索
- マッチした場合、自動で `company_master_id` を紐づけ
- 締切入力のUIに `source_note` 選択肢を追加（任意フィールド）
- `isPreset` フラグでプリセット由来かユーザー入力かを区別

### 7.3 フロー3: シグナル集約と検証

```
deadline_contributions にシグナルが蓄積
  → 自動検証トリガー: 3人以上が同じ日付を報告 → 自動で deadline_presets に昇格
  → 管理者ダッシュボード: get_pending_contributions_summary で集約ビュー表示
  → 管理者がワンクリックで承認 → verify_contribution RPC 呼び出し
  → deadline_presets に UPSERT + deadline_change_log に記録
  → 該当シグナルの status が 'verified' に更新
```

**自動検証の条件**:
- 3人以上のユーザーが同じ (company, year, type, label, date) を報告
- 全員が同じ日付を報告している（日付がバラけている場合は手動レビュー）

### 7.4 フロー4: 締め切り変更の検知

```
既存プリセット: 三菱商事 ES締切 = 4/15
  → 新しいユーザーが 4/22 を報告
  → get_pending_contributions_summary の is_divergent = true
  → 管理者ダッシュボードに「既存と異なる日付が報告されています」とアラート表示
  → 管理者が確認して承認
  → deadline_presets 更新 + deadline_change_log に 'date_changed' 記録
```

**将来的な拡張**: 締切変更時に、該当企業を applications で持つ全ユーザーに通知（Supabase Realtime or Edge Functions）

---

## 8. 管理者ダッシュボード要件

### 8.1 必要な画面

1. **企業マスタ管理画面**
   - company_masters の CRUD
   - CSVインポート機能（将来的に）
   - 人気企業フラグと順位の設定

2. **締め切りプリセット管理画面**
   - 企業ごとの deadline_presets 一覧・編集
   - 新規プリセットの直接追加（admin_curated）
   - 検証ステータスの管理

3. **シグナルレビュー画面**（最重要）
   - `get_pending_contributions_summary` の結果を表示
   - 報告者数、最頻日付、既存プリセットとの差分をカード形式で表示
   - ワンクリック承認ボタン（`verify_contribution` 呼び出し）
   - 却下ボタン（理由入力付き）
   - `is_divergent = true` の行をハイライト（締切変更の可能性）

4. **変更ログ画面**
   - deadline_change_log のタイムライン表示
   - フィルタ: 企業、年度、変更タイプ

### 8.2 管理者判定

- `profiles.is_admin` カラムで判定
- フロントエンド: ルーティングガードで管理者画面へのアクセスを制限
- バックエンド: RLSポリシーで管理者のみ INSERT/UPDATE/DELETE 可能

---

## 9. 既存コードへの影響と変更箇所

### 9.1 packages/shared/src/ の変更

| ファイル | 変更内容 |
|---------|---------|
| `types/deadlinePreset.ts` | `contributorCount` フィールド追加 |
| `types/deadlineContribution.ts` | **新規作成** |
| `types/adminTypes.ts` | **新規作成** |
| `repositories/deadlinePresetRepository.ts` | 既存 — 変更なし（RPCインターフェース互換） |
| `repositories/deadlineContributionRepository.ts` | **新規作成** |
| `repositories/adminRepository.ts` | **新規作成** |
| `repositories/applicationRepository.ts` | 締切保存時にシグナル送信ロジック追加 |
| `index.ts` | 新規型・リポジトリの export 追加 |

### 9.2 Supabase マイグレーション

DDLとRPC関数は1ファイルにまとめても、分割しても動作する。推奨は2ファイル構成:

| ファイル | 内容 | 依存関係 |
|---------|------|---------|
| `002_company_master_and_deadlines.sql` | 本ドキュメントの §3（テーブル定義 + RLS + 既存テーブル変更） | `001_initial_schema.sql` に依存 |
| `003_rpc_functions.sql` | 本ドキュメントの §4（RPC関数 + 自動検証トリガー） | `002` に依存（テーブルが存在する必要あり） |

**実行順序**: 002 → 003 の順で実行すること。`update_updated_at()` 関数は `001_initial_schema.sql` で定義済み。

### 9.3 フロントエンド（ダッシュボード）

- 企業追加フローに company_masters 検索・紐づけUIを追加
- 締切入力フォームに `source_note` 選択UIを追加（任意）
- プリセット提案UI: 企業紐づけ時に検証済みプリセットを表示
- 管理者ダッシュボード: §8 の画面を新規実装

---

## 10. 実装優先順位

### Phase 1: 基盤（管理者データ投入可能な状態）
1. マイグレーション実行（company_masters, deadline_presets, profiles.is_admin）
2. RPC関数作成（search_company_masters, get_deadline_presets_by_master_id, search_deadline_presets）
3. 管理者による company_masters と deadline_presets の初期データ投入（Supabase Dashboard直接 or 簡易管理画面）

### Phase 2: ユーザー体験（プリセット取り込み）
4. 企業追加フローで company_masters 検索・紐づけ
5. プリセット提案UI（deadline_presets → applications.deadlines への取り込み）

### Phase 3: ネットワーク効果（シグナル収集・検証）
6. deadline_contributions テーブル・RPC関数作成
7. applicationRepository にシグナル送信ロジック追加
8. 自動検証トリガー実装
9. 管理者シグナルレビュー画面

### Phase 4: 成熟（通知・分析）
10. 締切変更通知機能
11. 翌年度向けの傾向予測機能
12. ユーザーの貢献度スコア（ゲーミフィケーション）

---

## 11. 注意事項

### 11.1 プライバシー
- deadline_contributions は匿名集約のみで使用する。個々のユーザーの入力内容は他のユーザーに一切見えない
- user_id は重複排除にのみ使用し、RLSで自分の投稿のみアクセス可能
- 管理者も個人を特定できない形で集約データのみ閲覧（contributor_count のみ）

### 11.2 データ品質
- 自動検証は「全員が同一日付を報告」という厳格な条件のみ
- 日付がバラけている場合は必ず管理者レビューを経由
- source_note で情報源の信頼性も判断材料に含める

### 11.3 既存テーブルとの互換性
- applications テーブルの `deadline TEXT` カラムは残存させ、`deadlines JSONB` と並行運用
- 既存データの移行スクリプトが必要な場合は別途作成
- companies テーブルへの新カラム追加は NULL 許容で後方互換

### 11.4 スケーラビリティ
- 初期: 50-100社 × 年度あたり5-10締切 = 500-1,000行（deadline_presets）
- 成長期: 500社 × 10締切 = 5,000行（十分にPostgreSQLで処理可能）
- deadline_contributions は年度ごとにアーカイブ検討（verified/rejected は定期的にクリーンアップ可能）
