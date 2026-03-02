import { useState, useRef, useEffect } from 'react';
import { UNIVERSITY_FACULTIES } from './universityFaculties';

interface OnboardingStepProfileProps {
  lastName: string;
  firstName: string;
  graduationYear: number | null;
  university: string;
  faculty: string;
  grade: string;
  onLastNameChange: (value: string) => void;
  onFirstNameChange: (value: string) => void;
  onGraduationYearChange: (year: number) => void;
  onUniversityChange: (value: string) => void;
  onFacultyChange: (value: string) => void;
  onGradeChange: (value: string) => void;
}

const GRADE_OPTIONS = [
  { value: '', label: '選択してください' },
  { value: 'B1', label: '学部1年' },
  { value: 'B2', label: '学部2年' },
  { value: 'B3', label: '学部3年' },
  { value: 'B4', label: '学部4年' },
  { value: 'M1', label: '修士1年' },
  { value: 'M2', label: '修士2年' },
  { value: 'D', label: '博士' },
  { value: 'other', label: 'その他' },
];

const UNIVERSITY_LIST = [
  // 旧帝大
  '東京大学', '京都大学', '大阪大学', '東北大学', '名古屋大学', '九州大学', '北海道大学',
  // 首都圏国公立
  '一橋大学', '東京工業大学', '東京外国語大学', '横浜国立大学', '千葉大学', '筑波大学',
  '埼玉大学', '東京都立大学', '東京農工大学', '電気通信大学', 'お茶の水女子大学',
  // 関西国公立
  '神戸大学', '大阪公立大学', '京都府立大学', '奈良女子大学',
  // 地方国立
  '広島大学', '金沢大学', '岡山大学', '新潟大学', '熊本大学', '信州大学',
  // 早慶上理
  '早稲田大学', '慶應義塾大学', '上智大学', '東京理科大学',
  // MARCH
  '明治大学', '青山学院大学', '立教大学', '中央大学', '法政大学',
  // 関関同立
  '関西大学', '関西学院大学', '同志社大学', '立命館大学',
  // その他私立
  '学習院大学', '成蹊大学', '成城大学', '日本大学', '東洋大学', '駒澤大学', '専修大学',
  '近畿大学', '國學院大學', '芝浦工業大学', '東京女子大学', '日本女子大学', '津田塾大学',
  '国際基督教大学',
];

export default function OnboardingStepProfile({
  lastName,
  firstName,
  graduationYear,
  university,
  faculty,
  grade,
  onLastNameChange,
  onFirstNameChange,
  onGraduationYearChange,
  onUniversityChange,
  onFacultyChange,
  onGradeChange,
}: OnboardingStepProfileProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFacultySuggestions, setShowFacultySuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const facultyWrapperRef = useRef<HTMLDivElement>(null);

  const suggestions = university.trim()
    ? UNIVERSITY_LIST.filter((u) => u.includes(university.trim())).slice(0, 8)
    : [];

  const facultyList = UNIVERSITY_FACULTIES[university] ?? [];
  const facultySuggestions = faculty.trim()
    ? facultyList.filter((f) => f.includes(faculty.trim()))
    : facultyList;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (facultyWrapperRef.current && !facultyWrapperRef.current.contains(e.target as Node)) {
        setShowFacultySuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">基本情報を教えてください</h2>
        <p className="mt-1 text-sm text-gray-500">
          あなたに合った情報を表示するために使います
        </p>
      </div>

      {/* 姓名 */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="input-label" htmlFor="ob-last-name">姓</label>
          <input
            id="ob-last-name"
            type="text"
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            placeholder="山田"
            className="input-field mt-1.5"
            autoComplete="family-name"
          />
        </div>
        <div className="flex-1">
          <label className="input-label" htmlFor="ob-first-name">名</label>
          <input
            id="ob-first-name"
            type="text"
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            placeholder="太郎"
            className="input-field mt-1.5"
            autoComplete="given-name"
          />
        </div>
      </div>

      {/* 卒業年 */}
      <div>
        <label className="input-label">卒業年</label>
        <div className="mt-1.5 flex gap-3">
          {[27, 28].map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => onGraduationYearChange(2000 + y)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                graduationYear === 2000 + y
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
              }`}
            >
              {y}卒
            </button>
          ))}
        </div>
      </div>

      {/* 大学名（オートコンプリート） */}
      <div ref={wrapperRef} className="relative">
        <label className="input-label" htmlFor="ob-university">大学名</label>
        <input
          id="ob-university"
          type="text"
          value={university}
          onChange={(e) => {
            onUniversityChange(e.target.value);
            onFacultyChange('');
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="例：東京大学"
          className="input-field mt-1.5"
          autoComplete="off"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 transition-colors"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onUniversityChange(name);
                    onFacultyChange('');
                    setShowSuggestions(false);
                  }}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 学部名（オートコンプリート） */}
      <div ref={facultyWrapperRef} className="relative">
        <label className="input-label" htmlFor="ob-faculty">学部名</label>
        <input
          id="ob-faculty"
          type="text"
          value={faculty}
          onChange={(e) => {
            onFacultyChange(e.target.value);
            setShowFacultySuggestions(true);
          }}
          onFocus={() => setShowFacultySuggestions(true)}
          placeholder="例：工学部"
          className="input-field mt-1.5"
          autoComplete="off"
        />
        {showFacultySuggestions && facultySuggestions.length > 0 && (
          <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {facultySuggestions.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 transition-colors"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onFacultyChange(name);
                    setShowFacultySuggestions(false);
                  }}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 学年 */}
      <div>
        <label className="input-label" htmlFor="ob-grade">学年</label>
        <select
          id="ob-grade"
          value={grade}
          onChange={(e) => onGradeChange(e.target.value)}
          className="select-field mt-1.5"
        >
          {GRADE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
