/**
 * 電話番号をフォーマット
 * @param phone 数字のみの電話番号
 * @param withHyphen ハイフンを入れるか
 */
export function formatPhoneNumber(phone: string, withHyphen: boolean = true): string {
  const digits = phone.replace(/\D/g, '');
  
  if (!withHyphen) return digits;
  
  // 携帯電話 (090/080/070)
  if (/^0[789]0/.test(digits)) {
    return digits.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  
  // 固定電話（東京03など）
  if (/^0\d/.test(digits)) {
    if (digits.length === 10) {
      return digits.replace(/(\d{2,4})(\d{2,4})(\d{4})/, '$1-$2-$3');
    }
  }
  
  return digits;
}

/**
 * 郵便番号をフォーマット
 */
export function formatPostalCode(postalCode: string, withHyphen: boolean = true): string {
  const digits = postalCode.replace(/\D/g, '');
  
  if (!withHyphen) return digits;
  
  if (digits.length === 7) {
    return digits.replace(/(\d{3})(\d{4})/, '$1-$2');
  }
  
  return digits;
}

/**
 * 西暦を和暦に変換
 */
export function toJapaneseEra(year: number, month?: number, day?: number): string {
  const date = new Date(year, (month || 1) - 1, day || 1);
  
  const formatter = new Intl.DateTimeFormat('ja-JP-u-ca-japanese', {
    era: 'long',
    year: 'numeric',
  });
  
  return formatter.format(date);
}

/**
 * 日付をフォーマット
 */
export function formatDate(
  dateString: string,
  format: 'iso' | 'japanese' | 'slash' | 'kanji' = 'iso'
): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  switch (format) {
    case 'iso':
      return dateString; // YYYY-MM-DD
    case 'japanese':
      return toJapaneseEra(year, month, day);
    case 'slash':
      return `${year}/${month}/${day}`;
    case 'kanji':
      return `${year}年${month}月${day}日`;
    default:
      return dateString;
  }
}

/**
 * カタカナをひらがなに変換
 */
export function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 0x60);
  });
}

/**
 * ひらがなをカタカナに変換
 */
export function hiraganaToKatakana(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) + 0x60);
  });
}

/**
 * 全角数字を半角に変換
 */
export function toHalfWidth(str: string): string {
  return str.replace(/[０-９]/g, (s) => {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
}

/**
 * 半角数字を全角に変換
 */
export function toFullWidth(str: string): string {
  return str.replace(/[0-9]/g, (s) => {
    return String.fromCharCode(s.charCodeAt(0) + 0xFEE0);
  });
}
