# Simplify Design Protocol

> UI実装時の必須ルール。詳細は `docs/DESIGN_SYSTEM.md` を参照。

## 🚫 禁止事項

```
❌ 明朝体・セリフフォント → Inter, Noto Sans JP を使用
❌ 角丸なし（0px）→ 最小6px、標準8px
❌ 朱色・金色・抹茶色 → primary（Navy）+ gray のみ
❌ クリーム色背景 → 白 #FFFFFF を使用
❌ 縦線・下線装飾 → シンプルに
```

## 🎨 カラー

```css
/* Primary - Navy（メイン）*/
--color-primary-700: #334E68;  /* ボタン */
--color-primary-800: #243B53;  /* ホバー */
--color-primary-50:  #F0F4F8;  /* 背景アクセント */

/* Gray（テキスト）*/
--color-gray-700: #374151;  /* 本文 */
--color-gray-400: #9CA3AF;  /* プレースホルダー */
--color-gray-200: #E5E7EB;  /* ボーダー */

/* Semantic */
--color-success-600: #059669;  /* 成功・内定 */
--color-warning-600: #D97706;  /* 警告・締切 */
--color-error-600: #DC2626;    /* エラー・不合格 */
```

## 📐 サイズ

| 要素 | 角丸 | Tailwind |
|------|------|----------|
| ボタン・インプット | 8px | `rounded-lg` |
| カード | 12px | `rounded-xl` |
| モーダル | 16px | `rounded-2xl` |
| バッジ | pill | `rounded-full` |

シャドウ: `shadow-sm`（標準）、`shadow-md`（ホバー）

## 🧩 Tailwind例

```jsx
// Primary Button
<button className="px-6 py-3 bg-primary-700 hover:bg-primary-800 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200">

// Card
<div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md p-5 transition-all">

// Input
<input className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30" />

// Badge (Success)
<span className="px-3 py-1 text-xs font-semibold rounded-full bg-success-50 text-success-600">
```

## 📝 フォント

```css
font-family: 'Inter', 'Noto Sans JP', -apple-system, sans-serif;
```

## ✅ チェックリスト

- [ ] 角丸 ≥ 6px（カードは12px）
- [ ] 背景は白（#FFF）
- [ ] メインカラーは primary-700
- [ ] ホバー・フォーカス状態あり
- [ ] transition 200ms以下
