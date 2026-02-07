import { useState, useEffect } from 'react';

interface TemplateQuestion {
  text: string;
  charLimit: number;
  checked: boolean;
}

const COMMON_QUESTIONS: { text: string; charLimit: number }[] = [
  { text: '学生時代に力を入れたこと（ガクチカ）', charLimit: 400 },
  { text: '志望動機', charLimit: 400 },
  { text: '自己PR', charLimit: 400 },
  { text: 'あなたの長所と短所', charLimit: 300 },
  { text: '入社後にやりたいこと', charLimit: 400 },
  { text: 'あなたを一言で表すと', charLimit: 200 },
  { text: '困難を乗り越えた経験', charLimit: 400 },
  { text: 'チームで成果を出した経験', charLimit: 400 },
  { text: '将来のビジョン・キャリアプラン', charLimit: 400 },
  { text: '趣味・特技', charLimit: 200 },
];

export interface TemplateQuestionResult {
  text: string;
  charLimit: number;
}

interface TemplateCreateModalProps {
  onConfirm: (title: string, questions: TemplateQuestionResult[]) => void;
  onClose: () => void;
}

export default function TemplateCreateModal({ onConfirm, onClose }: TemplateCreateModalProps) {
  const [title, setTitle] = useState('テンプレート');
  const [questions, setQuestions] = useState<TemplateQuestion[]>(
    COMMON_QUESTIONS.map(q => ({ ...q, checked: false }))
  );
  const [customText, setCustomText] = useState('');
  const [customCharLimit, setCustomCharLimit] = useState(400);
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

  function toggleQuestion(index: number) {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, checked: !q.checked } : q));
  }

  function handleAddCustom() {
    if (!customText.trim()) return;
    setQuestions(prev => [...prev, { text: customText.trim(), charLimit: customCharLimit, checked: true }]);
    setCustomText('');
    setCustomCharLimit(400);
  }

  function handleConfirm() {
    if (!title.trim()) return;
    const selected = questions.filter(q => q.checked).map(q => ({ text: q.text, charLimit: q.charLimit }));
    onConfirm(title.trim(), selected);
  }

  const selectedCount = questions.filter(q => q.checked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-200 ${visible ? 'opacity-30' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-lg bg-white rounded-xl shadow-xl transition-all duration-200 max-h-[90vh] flex flex-col ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">テンプレート作成</h2>
              <p className="text-sm text-gray-500">頻出質問を選択してテンプレートを作成</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Title */}
          <div>
            <label className="input-label">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="テンプレート名"
              autoFocus
            />
          </div>

          {/* Question checklist */}
          <div>
            <label className="input-label">設問を選択（{selectedCount}件選択中）</label>
            <div className="space-y-1 mt-1">
              {questions.map((q, i) => (
                <label
                  key={i}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    q.checked ? 'bg-primary-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={q.checked}
                    onChange={() => toggleQuestion(i)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className={`flex-1 text-sm ${q.checked ? 'text-primary-700 font-medium' : 'text-gray-700'}`}>
                    {q.text}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{q.charLimit}字</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom question */}
          <div>
            <label className="input-label">カスタム設問を追加</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="input-field flex-1"
                placeholder="設問を入力..."
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustom(); } }}
              />
              <input
                type="number"
                value={customCharLimit}
                onChange={(e) => setCustomCharLimit(Math.max(1, parseInt(e.target.value) || 0))}
                className="input-field w-20 text-center"
                min={1}
                placeholder="字数"
              />
              <button
                type="button"
                onClick={handleAddCustom}
                disabled={!customText.trim()}
                className="btn-secondary text-sm px-3 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                追加
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">字数制限を設定して設問を追加できます</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0">
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
