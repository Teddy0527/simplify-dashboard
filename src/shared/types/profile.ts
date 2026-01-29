export interface Profile {
  // 基本情報
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  lastNameHiragana: string;
  firstNameHiragana: string;
  birthDate: string; // YYYY-MM-DD
  gender: 'male' | 'female' | 'other';

  // 連絡先
  email: string;
  phoneNumber: string; // 数字のみ
  homePhoneNumber?: string;

  // 住所
  postalCode: string; // 数字のみ
  prefecture: string;
  city: string;
  address1: string;
  address2?: string;

  // 休暇中連絡先
  holidayPostalCode?: string;
  holidayPrefecture?: string;
  holidayCity?: string;
  holidayAddress1?: string;
  holidayAddress2?: string;
  holidayPhoneNumber?: string;

  // 学歴
  university: string;
  faculty: string;
  department: string;
  graduationYear: number;
  graduationMonth: number;
  entranceYear?: number;
  entranceMonth?: number;
  highSchool?: string;
  highSchoolGradYear?: number;
  highSchoolGradMonth?: number;

  // 資格
  toeicScore?: number;
  toeicDate?: string;
  toeflScore?: number;
  driverLicense?: string;
  qualifications?: Qualification[];

  // その他
  hobby?: string;
  club?: string;
  seminarLab?: string;
  researchTheme?: string;
}

export interface Qualification {
  name: string;
  date: string; // YYYY-MM
}

export const DEFAULT_PROFILE: Profile = {
  lastName: '',
  firstName: '',
  lastNameKana: '',
  firstNameKana: '',
  lastNameHiragana: '',
  firstNameHiragana: '',
  birthDate: '',
  gender: 'male',
  email: '',
  phoneNumber: '',
  postalCode: '',
  prefecture: '',
  city: '',
  address1: '',
  university: '',
  faculty: '',
  department: '',
  graduationYear: new Date().getFullYear() + 1,
  graduationMonth: 3,
};
