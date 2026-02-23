import { useState, useEffect, useRef, useCallback } from 'react';
import { useFeedbackTrigger } from '../../hooks/useFeedbackTrigger';
import { trackEventAsync } from '@jobsimplify/shared';

interface FeedbackModalProps {
  externalOpen?: boolean;
  onExternalClose?: () => void;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill={filled ? '#f59e0b' : 'none'}
      stroke={filled ? '#f59e0b' : '#9fb3c8'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export default function FeedbackModal({ externalOpen, onExternalClose }: FeedbackModalProps) {
  const { shouldShow, onSubmit, onSnooze, onOptOut } = useFeedbackTrigger();

  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [satisfaction, setSatisfaction] = useState('');
  const [complaints, setComplaints] = useState('');
  const [featureRequests, setFeatureRequests] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  function resetForm() {
    setStep(1);
    setRating(0);
    setHoveredStar(0);
    setSatisfaction('');
    setComplaints('');
    setFeatureRequests('');
  }

  function openModal() {
    resetForm();
    setVisible(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimateIn(true));
    });
  }

  // Show modal with animation (auto trigger)
  useEffect(() => {
    if (shouldShow && !visible) {
      setIsManual(false);
      openModal();
    }
  }, [shouldShow, visible]);

  // Show modal from external open (manual trigger)
  useEffect(() => {
    if (externalOpen && !visible) {
      setIsManual(true);
      trackEventAsync('feedback.manual_open');
      openModal();
    }
  }, [externalOpen, visible]);

  // Escape key handler
  useEffect(() => {
    if (!visible) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  // Focus trap
  useEffect(() => {
    if (!visible || !modalRef.current) return;
    const modal = modalRef.current;
    const focusableSelector =
      'button:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])';

    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const focusable = modal.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleTab);
    // Focus first element
    const firstEl = modal.querySelector<HTMLElement>(focusableSelector);
    firstEl?.focus();
    return () => document.removeEventListener('keydown', handleTab);
  }, [visible, step]);

  const animateOut = useCallback((callback: () => void) => {
    setAnimateIn(false);
    setTimeout(callback, 200);
  }, []);

  function handleClose() {
    animateOut(() => {
      setVisible(false);
      if (isManual) {
        onExternalClose?.();
      } else {
        onSnooze();
      }
    });
  }

  function handleOptOut() {
    animateOut(() => {
      setVisible(false);
      onOptOut();
    });
  }

  async function handleSubmit(skipText: boolean) {
    setSubmitting(true);
    try {
      await onSubmit({
        rating,
        satisfaction: skipText ? undefined : satisfaction || undefined,
        complaints: skipText ? undefined : complaints || undefined,
        featureRequests: skipText ? undefined : featureRequests || undefined,
      });
      setStep(3);
      setTimeout(() => {
        animateOut(() => {
          setVisible(false);
          if (isManual) onExternalClose?.();
        });
      }, 1500);
    } catch {
      // Error already logged in repository
    } finally {
      setSubmitting(false);
    }
  }

  // Star keyboard navigation
  function handleStarKeyDown(e: React.KeyboardEvent, star: number) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      setRating(Math.min(star + 1, 5));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      setRating(Math.max(star - 1, 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setRating(star);
    }
  }

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9998] flex items-center justify-center transition-colors duration-200 ${
        animateIn ? 'bg-black/40' : 'bg-black/0'
      }`}
      onClick={step !== 3 ? handleClose : undefined}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        className={`relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl transition-all duration-300 ease-out ${
          animateIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        {step !== 3 && <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="閉じる"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>}

        <div className="px-8 py-8">
          {step === 3 ? (
            <div className="py-4 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 id="feedback-title" className="text-lg font-bold text-gray-900 mb-1">
                ありがとうございます！
              </h2>
              <p className="text-sm text-gray-500">
                いただいたフィードバックを改善に活かします
              </p>
            </div>
          ) : step === 1 ? (
            <>
              <h2 id="feedback-title" className="text-lg font-bold text-gray-900 text-center mb-1">
                アプリの使い心地はいかがですか？
              </h2>
              <p className="text-sm text-gray-500 text-center mb-6">
                あなたのフィードバックが改善に繋がります
              </p>

              {/* Star rating */}
              <div
                role="radiogroup"
                aria-label="評価"
                className="flex items-center justify-center gap-1 mb-2"
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    ref={star === 1 ? firstFocusableRef : undefined}
                    role="radio"
                    aria-checked={rating === star}
                    aria-label={`${star}点`}
                    tabIndex={rating === star || (rating === 0 && star === 1) ? 0 : -1}
                    className="p-1 rounded-lg transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onKeyDown={(e) => handleStarKeyDown(e, star)}
                  >
                    <StarIcon filled={star <= (hoveredStar || rating)} />
                  </button>
                ))}
              </div>

              <div className="flex justify-between text-xs text-gray-400 mb-8 px-1">
                <span>不満</span>
                <span>満足</span>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={rating === 0}
                className="btn-primary w-full py-2.5 text-sm font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                次へ
              </button>

              {!isManual && (
                <button
                  onClick={handleOptOut}
                  className="block mx-auto mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  もう表示しない
                </button>
              )}
            </>
          ) : (
            <>
              <h2 id="feedback-title" className="text-lg font-bold text-gray-900 text-center mb-6">
                もう少し教えてください
              </h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label htmlFor="fb-satisfaction" className="block text-sm font-medium text-gray-700 mb-1">
                    現在の機能への満足度
                  </label>
                  <textarea
                    id="fb-satisfaction"
                    rows={2}
                    className="input-field w-full resize-none"
                    placeholder="使いやすい点、気に入っている機能など"
                    value={satisfaction}
                    onChange={(e) => setSatisfaction(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="fb-complaints" className="block text-sm font-medium text-gray-700 mb-1">
                    不便に感じる点
                  </label>
                  <textarea
                    id="fb-complaints"
                    rows={2}
                    className="input-field w-full resize-none"
                    placeholder="改善してほしい点、使いにくい部分など"
                    value={complaints}
                    onChange={(e) => setComplaints(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="fb-features" className="block text-sm font-medium text-gray-700 mb-1">
                    欲しい機能
                  </label>
                  <textarea
                    id="fb-features"
                    rows={2}
                    className="input-field w-full resize-none"
                    placeholder="あったら嬉しい機能やアイデア"
                    value={featureRequests}
                    onChange={(e) => setFeatureRequests(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={submitting}
                  className="btn-secondary flex-1 py-2.5 text-sm font-semibold rounded-lg"
                >
                  スキップ
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                  className="btn-primary flex-1 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2"
                >
                  {submitting && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  送信する
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
