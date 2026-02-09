import { useState, useEffect } from 'react';
import { EntrySheet } from '@entrify/shared';

interface TemplateInsertModalProps {
  templates: EntrySheet[];
  onSelect: (template: EntrySheet) => void;
  onClose: () => void;
}

export default function TemplateInsertModal({
  templates,
  onSelect,
  onClose,
}: TemplateInsertModalProps) {
  const [visible, setVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EntrySheet | null>(null);

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
    if (selectedTemplate) {
      onSelect(selectedTemplate);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-200 ${
          visible ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 transition-all duration-200 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            テンプレートから挿入
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            選択したテンプレートの設問と回答がコピーされます。既存の設問は置換されます。
          </p>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[400px] overflow-y-auto custom-scrollbar">
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="w-12 h-12 text-gray-300 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm text-gray-500">テンプレートがありません</p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(template)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {template.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {template.questions.length}個の設問
                      </p>
                      {template.questions.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {template.questions.slice(0, 3).map((q, index) => (
                            <p
                              key={q.id}
                              className="text-xs text-gray-400 truncate"
                            >
                              {index + 1}. {q.questionText || '設問なし'}
                            </p>
                          ))}
                          {template.questions.length > 3 && (
                            <p className="text-xs text-gray-400">
                              ...他{template.questions.length - 3}件
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    {selectedTemplate?.id === template.id && (
                      <svg
                        className="w-5 h-5 text-primary-600 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedTemplate}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            挿入
          </button>
        </div>
      </div>
    </div>
  );
}
