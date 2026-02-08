import { useState, useEffect } from 'react';

interface TemplateCreateModalProps {
  onConfirm: (title: string) => void;
  onClose: () => void;
}

export default function TemplateCreateModal({ onConfirm, onClose }: TemplateCreateModalProps) {
  const [title, setTitle] = useState('テンプレート');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 200);
  }

  function handleConfirm() {
    if (!title.trim()) return;
    onConfirm(title.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-200 ${visible ? 'opacity-30' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md bg-white rounded-xl shadow-xl transition-all duration-200 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">テンプレート作成</h2>
              <p className="text-sm text-gray-500">テンプレート名を入力してください</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <div>
            <label className="input-label">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="テンプレート名"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleConfirm(); } }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={handleClose} className="btn-secondary">
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            disabled={!title.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            作成
          </button>
        </div>
      </div>
    </div>
  );
}
