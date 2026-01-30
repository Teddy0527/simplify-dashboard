export interface FieldMatcher {
  field: string;
  patterns: string[];
  priority: number;
}

export const FIELD_MATCHERS: FieldMatcher[] = [
  // === ふりがな（カタカナ）- セイ/メイの優先度を上げてfullNameKanaより先にマッチ ===
  // 「姓名（カナ）」コンテキストでも正しく検出するためパターン追加
  // 「メイン」（メインメールアドレス等）を除外するため (?!ン) を追加
  { field: 'lastNameKana', patterns: ['セイ(?![ヤユヨ])', '姓名.*カナ.*姓', '姓.*カナ', '姓.*カタカナ', 'ふりがな.*姓', '苗字.*カナ', 'カナ.*姓(?!名)'], priority: 20 },
  { field: 'firstNameKana', patterns: ['メイ(?!ン|ル)', '姓名.*カナ.*名', '名.*カナ', '名.*カタカナ', 'ふりがな.*名', 'カナ.*(?<!姓)名'], priority: 20 },
  { field: 'fullNameKana', patterns: ['フリガナ(?!.*セイ)(?!.*メイ)', 'カタカナ(?!.*セイ)(?!.*メイ)', '氏名.*カナ(?!.*セイ)', 'お名前.*カナ'], priority: 15 },

  // === ふりがな（ひらがな）- せい/めいの優先度を上げる ===
  { field: 'lastNameHiragana', patterns: ['せい(?!別)', '姓.*ひらがな', '姓.*かな(?!な)'], priority: 20 },
  { field: 'firstNameHiragana', patterns: ['(?<!建物|部屋|マンション|フリガ)めい', '名.*ひらがな', '(?<!姓)名.*かな(?!な)'], priority: 20 },
  { field: 'fullNameHiragana', patterns: ['ふりがな(?!.*せい)(?!.*めい)', 'ひらがな(?!.*せい)(?!.*めい)', 'hiragana'], priority: 15 },

  // === 氏名 - カナコンテキスト・学校名を除外 ===
  { field: 'lastName', patterns: ['(?<!建物|部屋|マンション)姓(?!別|名.*カナ|.*カナ|.*フリガナ|.*ふりがな)', '苗字(?!.*カナ)', 'last.?name', 'family.?name'], priority: 10 },
  { field: 'firstName', patterns: ['(?<!建物|部屋|マンション|フリガ|セ|メ|姓|学校|大学|氏)名(?!前|カナ|称|義|簿|.*カナ)', 'first.?name', 'given.?name'], priority: 10 },
  { field: 'fullName', patterns: ['氏名', '名前', 'お名前', 'フルネーム', 'full.?name'], priority: 5 },

  // === 連絡先 ===
  { field: 'email', patterns: ['メールアドレス', 'メール', 'mail', 'e-?mail', 'Eメール', 'email'], priority: 22 },
  { field: 'phoneNumber', patterns: ['携帯', '電話', 'tel', 'phone', '連絡先', '携帯電話', '電話番号'], priority: 10 },
  { field: 'homePhoneNumber', patterns: ['自宅.*電話', '固定電話', 'home.*phone'], priority: 8 },
  // === 電話番号（分割フィールド） ===
  { field: 'phoneAreaCode', patterns: ['市外局番', '市外', 'area.*code', '電話.*1', 'tel.*1', 'phone.*1'], priority: 12 },
  { field: 'phoneExchange', patterns: ['市内局番', '市内', 'exchange', '電話.*2', 'tel.*2', 'phone.*2'], priority: 12 },
  { field: 'phoneSubscriber', patterns: ['加入者番号', '加入者', 'subscriber', '電話.*3', 'tel.*3', 'phone.*3'], priority: 12 },

  // === 住所 - address2（建物名）を先にマッチさせる ===
  { field: 'address2', patterns: ['建物', 'マンション', 'アパート', '部屋', 'building', '方書', 'ビル名', '建物名', '部屋番号', 'apartment'], priority: 12 },
  { field: 'postalCode', patterns: ['郵便番号', '〒', 'postal(?!code[12])', 'zip(?!1|2)', 'postcode(?!1|2)', '郵便'], priority: 10 },
  // === 郵便番号（分割フィールド） ===
  { field: 'postalCode1', patterns: ['postal.*1', 'zip.*1', 'postcode.*1', '郵便.*1'], priority: 12 },
  { field: 'postalCode2', patterns: ['postal.*2', 'zip.*2', 'postcode.*2', '郵便.*2'], priority: 12 },
  { field: 'prefecture', patterns: ['都道府県', 'prefecture', '都.*道.*府.*県'], priority: 10 },
  { field: 'city', patterns: ['市区町村', 'city', '市.*区.*町.*村'], priority: 10 },
  { field: 'address1', patterns: ['番地', '丁目', '町名', '住所', 'address', '町・番地'], priority: 5 },

  // === 生年月日 - name属性パターンを追加 ===
  { field: 'birthDate', patterns: ['生年月日', '誕生日', 'birth(?!year|month|day)', 'birthday', '生まれ'], priority: 10 },
  { field: 'birthYear', patterns: ['birthyear', 'birth.?year', '生年', '誕生.*年', '生まれた年'], priority: 12 },
  { field: 'birthMonth', patterns: ['birthmonth', 'birth.?month', '誕生.*月', '生まれた月'], priority: 12 },
  { field: 'birthDay', patterns: ['birthday(?!.*誕生)', 'birth.?day', '誕生.*日(?!.*誕生日)', '生まれた日'], priority: 12 },

  // === 性別 ===
  { field: 'gender', patterns: ['性別', 'gender', 'sex'], priority: 10 },

  // === 学歴 ===
  { field: 'university', patterns: ['学校名', '大学名', '大学', 'university', 'school'], priority: 15 },
  { field: 'faculty', patterns: ['学部', 'faculty', '学部名'], priority: 10 },
  { field: 'department', patterns: ['学科', '専攻', 'department', 'major', '学科名'], priority: 10 },
  { field: 'graduationYear', patterns: ['卒業.*年', '卒年', 'graduation.*year'], priority: 10 },
  { field: 'graduationMonth', patterns: ['卒業.*月', 'graduation.*month'], priority: 10 },
  { field: 'highSchool', patterns: ['高校', '高等学校', 'high.?school'], priority: 10 },

  // === 資格 ===
  { field: 'toeicScore', patterns: ['TOEIC', 'toeic', 'トーイック', 'トイック'], priority: 10 },
  { field: 'toeflScore', patterns: ['TOEFL', 'toefl', 'トーフル'], priority: 10 },
  { field: 'qualification', patterns: ['資格', '免許', 'license', 'certification', 'qualification'], priority: 5 },

  // === 自己PR・ガクチカ ===
  { field: 'selfPR', patterns: ['自己PR', '自己ＰＲ', 'PR', '自己紹介', 'アピール', '自己アピール'], priority: 10 },
  { field: 'gakuchika', patterns: ['学生時代', '力を入れた', '頑張った', 'ガクチカ', '学業以外', '打ち込んだ'], priority: 10 },
  { field: 'strength', patterns: ['長所', '強み', 'strength', 'strong'], priority: 10 },
  { field: 'weakness', patterns: ['短所', '弱み', 'weakness', 'weak'], priority: 10 },

  // === その他 ===
  { field: 'hobby', patterns: ['趣味', '特技', 'hobby', '趣味.*特技'], priority: 10 },
  { field: 'club', patterns: ['部活', 'サークル', 'クラブ', 'club', 'circle'], priority: 10 },
  { field: 'seminarLab', patterns: ['ゼミ', '研究室', 'seminar', 'lab', '研究'], priority: 10 },
  { field: 'researchTheme', patterns: ['研究テーマ', '研究内容', 'research', 'テーマ'], priority: 10 },
];

// === スキップパターン（休暇中の電話番号など、自動入力すべきでないフィールド） ===
export const SKIP_PATTERNS: string[] = [
  '休暇中.*電話', '休暇中.*連絡', '緊急連絡先', '保証人', '保護者',
  '確認', 'confirm', '再入力', 're-?enter', 'もう一度',
  '緊急時', '帰省先', '実家'
];

export function shouldSkipField(contextText: string): boolean {
  return SKIP_PATTERNS.some(pattern => new RegExp(pattern, 'i').test(contextText));
}

export function findMatchingField(text: string): string | null {
  const normalizedText = text.toLowerCase();

  // 優先度でソート
  const sortedMatchers = [...FIELD_MATCHERS].sort((a, b) => b.priority - a.priority);

  for (const matcher of sortedMatchers) {
    for (const pattern of matcher.patterns) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(normalizedText)) {
        return matcher.field;
      }
    }
  }

  return null;
}
