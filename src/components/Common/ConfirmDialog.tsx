import { useEffect, useState } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-200 ${visible ? 'opacity-40' : 'opacity-0'}`}
        onClick={onCancel}
      />
      <div
        className={`relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6 transition-all duration-200 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <h3 className="text-base font-semibold text-[var(--color-navy-900)]" style={{ fontFamily: 'var(--font-serif)' }}>
          {title}
        </h3>
        <p className="mt-2 text-sm text-[var(--color-navy-600)]">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="btn-secondary text-sm">
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-vermillion-500)] hover:bg-[var(--color-vermillion-600)] transition-colors rounded"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}
