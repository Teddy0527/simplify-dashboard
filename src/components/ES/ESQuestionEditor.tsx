import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ESQuestion } from '@jobsimplify/shared';

interface ESQuestionEditorProps {
  question: ESQuestion;
  questionNumber: number;
  onUpdate: (question: ESQuestion) => void;
  onDelete: () => void;
}

export default function ESQuestionEditor({
  question,
  questionNumber,
  onUpdate,
  onDelete,
}: ESQuestionEditorProps) {
  const [questionText, setQuestionText] = useState(question.questionText);
  const [answer, setAnswer] = useState(question.answer ?? '');
  const [isExpanded, setIsExpanded] = useState(true);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedUpdate = useCallback((updates: Partial<ESQuestion>) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onUpdate({
        ...question,
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    }, 500);
  }, [question, onUpdate]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleQuestionTextChange = (value: string) => {
    setQuestionText(value);
    debouncedUpdate({ questionText: value });
  };

  const handleAnswerChange = (value: string) => {
    setAnswer(value);
    debouncedUpdate({ answer: value || undefined });
  };

  const currentLength = answer.length;

  // 回答済みかどうかを判定
  const isAnswered = useMemo(() => {
    return answer && answer.trim().length > 0;
  }, [answer]);

  // ヘッダーの背景色（回答済みは緑色）
  const headerBgClass = isAnswered
    ? 'bg-green-50 border-green-200 hover:bg-green-100'
    : 'bg-gray-50 border-gray-200 hover:bg-gray-100';

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      {/* Header */}
      <div
        className={`px-4 py-3 border-b ${headerBgClass} flex items-center justify-between cursor-pointer transition-colors`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* 回答済みはチェックマーク、未回答は番号 */}
          {isAnswered ? (
            <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-medium flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          ) : (
            <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-medium flex items-center justify-center flex-shrink-0">
              {questionNumber}
            </span>
          )}
          <span className={`text-sm font-medium truncate ${isAnswered ? 'text-green-700' : 'text-gray-700'}`}>
            {questionText || '設問を入力...'}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-400">{currentLength}字</span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Body */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Question text */}
          <div>
            <label className="input-label">設問</label>
            <input
              type="text"
              value={questionText}
              onChange={(e) => handleQuestionTextChange(e.target.value)}
              className="input-field"
              placeholder="例: 学生時代に力を入れたことを教えてください"
            />
          </div>

          {/* Answer textarea */}
          <div>
            <label className="input-label">回答</label>
            <textarea
              value={answer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className="input-field resize-y min-h-[200px] overflow-y-auto"
              rows={8}
              placeholder="回答を入力..."
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-400">{currentLength}字</span>
            </div>
          </div>

          {/* Delete button */}
          <div className="pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onDelete}
              className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              この設問を削除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
