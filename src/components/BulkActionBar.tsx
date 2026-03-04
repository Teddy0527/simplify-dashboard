import { useEffect, useState } from 'react';

interface BulkActionBarProps {
  count: number;
  onDelete: () => void;
  onClear: () => void;
}

export default function BulkActionBar({ count, onDelete, onClear }: BulkActionBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (count > 0) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [count]);

  if (count === 0) return null;

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl transition-all duration-200 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <span className="text-sm font-medium">{count}件 選択中</span>
      <button
        onClick={onDelete}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-error-600 hover:bg-error-700 rounded-lg transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
        削除
      </button>
      <button
        onClick={onClear}
        className="px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white rounded-lg transition-colors"
      >
        選択解除
      </button>
    </div>
  );
}
