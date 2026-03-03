const REFERRAL_OPTIONS = [
  { value: 'friend', label: '友人・知人の紹介' },
  { value: 'sns', label: 'SNS（X, Instagram等）' },
  { value: 'search', label: '検索エンジン（Google等）' },
  { value: 'career_center', label: '大学のキャリアセンター' },
  { value: 'other', label: 'その他' },
] as const;

interface OnboardingStepReferralProps {
  referralSource: string;
  referralSourceDetail: string;
  onReferralSourceChange: (value: string) => void;
  onReferralSourceDetailChange: (value: string) => void;
}

export default function OnboardingStepReferral({
  referralSource,
  referralSourceDetail,
  onReferralSourceChange,
  onReferralSourceDetailChange,
}: OnboardingStepReferralProps) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-1">
        どこでこのサービスを知りましたか？
      </h2>
      <p className="text-sm text-gray-500 mb-5">
        サービス改善のためにご協力ください。
      </p>

      <div className="space-y-2">
        {REFERRAL_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              referralSource === option.value
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="referral_source"
              value={option.value}
              checked={referralSource === option.value}
              onChange={(e) => {
                onReferralSourceChange(e.target.value);
                if (e.target.value !== 'other') {
                  onReferralSourceDetailChange('');
                }
              }}
              className="accent-primary-600"
            />
            <span className="text-sm text-gray-700">{option.label}</span>
          </label>
        ))}
      </div>

      {referralSource === 'other' && (
        <div className="mt-3">
          <input
            type="text"
            value={referralSourceDetail}
            onChange={(e) => onReferralSourceDetailChange(e.target.value)}
            placeholder="具体的に教えてください"
            className="input-field w-full"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
