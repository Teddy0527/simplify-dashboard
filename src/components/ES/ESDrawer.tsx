import { useState, useEffect, useMemo } from 'react';
import {
  EntrySheet,
  ESQuestion,
  createESQuestion,
} from '@simplify/shared';
import { useCompanies } from '../../hooks/useCompanies';
import ESQuestionEditor from './ESQuestionEditor';
import ConfirmDialog from '../Common/ConfirmDialog';
import TemplateInsertModal from './TemplateInsertModal';

interface ESDrawerProps {
  entrySheet: EntrySheet;
  isNew: boolean;
  viewMode: 'generic' | 'company';
  templates?: EntrySheet[];
  onSave: (entrySheet: EntrySheet) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onAddQuestion: (question: ESQuestion) => Promise<void>;
  onUpdateQuestion: (question: ESQuestion) => Promise<void>;
  onRemoveQuestion: (questionId: string, entrySheetId: string) => Promise<void>;
  onSaveAsTemplate?: (entrySheet: EntrySheet) => void;
}

export default function ESDrawer({
  entrySheet,
  isNew,
  viewMode,
  templates,
  onSave,
  onDelete,
  onClose,
  onAddQuestion,
  onUpdateQuestion,
  onRemoveQuestion,
  onSaveAsTemplate,
}: ESDrawerProps) {
  const { companies } = useCompanies();

  const [title, setTitle] = useState(entrySheet.title);
  const [companyId, setCompanyId] = useState(entrySheet.companyId ?? '');
  const [questions, setQuestions] = useState<ESQuestion[]>(entrySheet.questions);

  const [visible, setVisible] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTemplateSaveConfirm, setShowTemplateSaveConfirm] = useState(false);

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

  useEffect(() => {
    setQuestions(entrySheet.questions);
  }, [entrySheet.questions]);

  // Progress
  const { answeredCount, totalCount, progress } = useMemo(() => {
    const total = questions.length;
    const answered = questions.filter(q => q.answer && q.answer.trim()).length;
    const percent = total > 0 ? Math.round((answered / total) * 100) : 0;
    return { answeredCount: answered, totalCount: total, progress: percent };
  }, [questions]);

  const progressColorClass = useMemo(() => {
    if (progress === 0) return 'bg-gray-300';
    if (progress === 100) return 'bg-green-500';
    return 'bg-amber-500';
  }, [progress]);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 250);
  }

  async function handleSave() {
    if (!title.trim()) return;

    const selectedCompany = companies.find(c => c.id === companyId);

    onSave({
      ...entrySheet,
      title: title.trim(),
      companyId: companyId || undefined,
      companyName: selectedCompany?.name,
      questions,
      updatedAt: new Date().toISOString(),
    });
  }

  function handleDelete() {
    setShowConfirm(true);
  }

  function confirmDelete() {
    setShowConfirm(false);
    onDelete(entrySheet.id);
  }

  async function handleAddQuestion() {
    const maxOrder = questions.length > 0
      ? Math.max(...questions.map(q => q.questionOrder))
      : -1;

    const newQuestion = createESQuestion(entrySheet.id, '', maxOrder + 1);
    setQuestions(prev => [...prev, newQuestion]);

    if (!isNew) {
      await onAddQuestion(newQuestion);
    }
  }

  async function handleUpdateQuestion(question: ESQuestion) {
    setQuestions(prev => prev.map(q => q.id === question.id ? question : q));

    if (!isNew) {
      await onUpdateQuestion(question);
    }
  }

  async function handleDeleteQuestion(questionId: string) {
    setQuestions(prev => prev.filter(q => q.id !== questionId));

    if (!isNew) {
      await onRemoveQuestion(questionId, entrySheet.id);
    }
  }

  const sortedCompanies = useMemo(() => {
    return [...companies].sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  }, [companies]);

  async function handleTemplateInsert(template: EntrySheet) {
    const newQuestions = template.questions.map((q, index) => ({
      ...createESQuestion(entrySheet.id, q.questionText, index),
      answer: q.answer,
      charLimit: q.charLimit,
    }));
    setQuestions(newQuestions);
    setShowTemplateModal(false);
  }

  function handleSaveAsTemplate() {
    if (!onSaveAsTemplate) return;
    const selectedCompany = companies.find(c => c.id === companyId);
    onSaveAsTemplate({
      ...entrySheet,
      title: title.trim(),
      companyId: companyId || undefined,
      companyName: selectedCompany?.name,
      questions,
      updatedAt: new Date().toISOString(),
    });
    setShowTemplateSaveConfirm(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-white">
      <div
        className={`pointer-events-none fixed inset-0 bg-white transition-opacity duration-250 ${visible ? 'opacity-100' : 'opacity-0'}`}
      />

      <div
        className={`relative flex min-h-0 flex-1 flex-col transition-all duration-250 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        {/* Header */}
        <div className="px-6 py-3 border-b border-gray-200 bg-white flex items-center gap-4">
          {/* Left: Back button + company selector */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleClose}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">戻る</span>
            </button>

            {viewMode === 'company' && (
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="select-field text-sm py-1.5 max-w-[200px]"
              >
                <option value="">企業を選択</option>
                {sortedCompanies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Center: Editable title */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-center text-lg font-semibold text-gray-900 bg-transparent border-none outline-none focus:ring-0 placeholder-gray-400"
              placeholder="タイトルを入力..."
            />
          </div>

          {/* Right: Template save + Save button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {onSaveAsTemplate && !isNew && (
              <button
                type="button"
                onClick={() => setShowTemplateSaveConfirm(true)}
                className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                テンプレ保存
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="btn-primary text-sm py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isNew ? '作成' : '保存'}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">

            {/* Progress bar */}
            {totalCount > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">
                    進捗: {answeredCount}/{totalCount}設問
                  </span>
                  <span className={`font-medium ${progress === 100 ? 'text-green-600' : 'text-gray-700'}`}>
                    {progress}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${progressColorClass} transition-all duration-300 rounded-full`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {progress === 100 && (
                  <div className="mt-2 flex items-center gap-2 text-green-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-medium">全ての設問に回答しました!</span>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 mb-4">
              {viewMode === 'company' && templates && templates.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(true)}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  テンプレートから挿入
                </button>
              )}
              <button
                type="button"
                onClick={handleAddQuestion}
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                設問を追加
              </button>
            </div>

            {/* Question list */}
            {questions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">設問がありません</p>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  + 設問を追加
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {questions
                  .sort((a, b) => a.questionOrder - b.questionOrder)
                  .map((question, index) => (
                    <ESQuestionEditor
                      key={question.id}
                      question={question}
                      questionNumber={index + 1}
                      onUpdate={handleUpdateQuestion}
                      onDelete={() => handleDeleteQuestion(question.id)}
                    />
                  ))}
              </div>
            )}

            {/* Add question button (bottom) */}
            {questions.length > 0 && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  設問を追加
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between">
          {!isNew ? (
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-error-600 hover:text-error-700 hover:bg-error-50 rounded-lg transition-colors"
            >
              削除
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <button onClick={handleClose} className="btn-secondary">キャンセル</button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isNew ? '作成' : '保存'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="ESを削除"
        message={`「${entrySheet.title}」を削除しますか？この操作は取り消せません。`}
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
      />

      <ConfirmDialog
        open={showTemplateSaveConfirm}
        title="テンプレートとして保存"
        message={`「${title}」をテンプレートとして保存しますか？企業情報は含まれません。`}
        onConfirm={handleSaveAsTemplate}
        onCancel={() => setShowTemplateSaveConfirm(false)}
      />

      {showTemplateModal && templates && (
        <TemplateInsertModal
          templates={templates}
          onSelect={handleTemplateInsert}
          onClose={() => setShowTemplateModal(false)}
        />
      )}
    </div>
  );
}
