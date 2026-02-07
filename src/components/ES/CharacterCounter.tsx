interface CharacterCounterProps {
  current: number;
  limit?: number;
}

export default function CharacterCounter({ current, limit }: CharacterCounterProps) {
  if (!limit) {
    return (
      <span className="text-xs text-gray-400">
        {current}字
      </span>
    );
  }

  const percentage = (current / limit) * 100;
  const isOver = current > limit;
  const isWarning = percentage >= 90 && !isOver;
  const isNormal = percentage >= 70 && percentage < 90;

  let colorClass = 'text-gray-500';
  if (isOver) {
    colorClass = 'text-red-600 font-medium';
  } else if (isWarning) {
    colorClass = 'text-amber-600';
  } else if (isNormal) {
    colorClass = 'text-green-600';
  }

  return (
    <span className={`text-xs flex items-center gap-1 ${colorClass}`}>
      {isOver && (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )}
      {current} / {limit}字
    </span>
  );
}
