import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { trackEventAsync } from '@jobsimplify/shared';
import { useOnboardingContext, type ChecklistItemId } from '../../contexts/OnboardingContext';
import { useToast } from '../../hooks/useToast';

// ── Helpers ─────────────────────────────────────────────────────────────

const CHROME_EXTENSION_URL = 'https://chromewebstore.google.com/detail/jobsimplify/epepfiggcneldemnkhbbjbaepoaklmcl?authuser=0&hl=ja';

function getActionForItem(id: ChecklistItemId): { hasAction: boolean; label?: string } {
  switch (id) {
    case 'add_company':       return { hasAction: true, label: '追加する' };
    case 'drag_card':         return { hasAction: true, label: 'やってみる' };
    case 'check_deadlines':   return { hasAction: true, label: '確認する' };
    case 'install_extension': return { hasAction: true, label: '追加する' };
    default:                  return { hasAction: false };
  }
}

// ── Main Component ──────────────────────────────────────────────────────

export default function OnboardingChecklist() {
  const { showOnboarding, loading, checklistItems, skipOnboarding, completeChecklistItem, variant } = useOnboardingContext();
  const [expanded, setExpanded] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const openedEventFired = useRef(false);

  const completedCount = checklistItems.filter(i => i.completed).length;
  const totalCount = checklistItems.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Don't render if not applicable
  if (!showOnboarding || loading || completedCount === totalCount) {
    return null;
  }

  function handleToggle() {
    const willExpand = !expanded;
    setExpanded(willExpand);

    if (willExpand && !openedEventFired.current) {
      openedEventFired.current = true;
      trackEventAsync('onboarding.cta_click', {
        experiment_id: 'onboarding_v1',
        variant,
        onboarding_version: 1,
        cta_type: 'checklist_opened',
      });
    }
  }

  function handleItemAction(id: ChecklistItemId) {
    if (id === 'add_company') {
      navigate('/?action=add');
    } else if (id === 'drag_card') {
      if (location.pathname === '/') {
        showToast('カードをドラッグして、ステータスを変更してみましょう');
      } else {
        navigate('/');
        showToast('カードをドラッグして、ステータスを変更してみましょう');
      }
    } else if (id === 'check_deadlines') {
      navigate('/deadlines');
    } else if (id === 'install_extension') {
      window.open(CHROME_EXTENSION_URL, '_blank');
      completeChecklistItem('install_extension');
    }
  }

  async function handleSkip() {
    await skipOnboarding();
  }

  return (
    <div className="onboarding-checklist">
      {expanded ? (
        /* ── Expanded panel ── */
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-in">
          {/* Header */}
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">はじめてのJobSimplify</h3>
            <button
              onClick={handleToggle}
              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="px-5 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: 'var(--color-primary-600)',
                  }}
                />
              </div>
              <span className="text-xs text-gray-500 tabular-nums">{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Items */}
          <div className="px-5 pb-2">
            {checklistItems.map(item => {
              const action = getActionForItem(item.id);
              const isClickable = action.hasAction && !item.completed;
              return (
                <div
                  key={item.id}
                  role={isClickable ? 'button' : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  onClick={isClickable ? () => handleItemAction(item.id) : undefined}
                  onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleItemAction(item.id); } } : undefined}
                  className={`flex items-center gap-3 py-3 rounded-lg transition-colors ${
                    item.completed ? 'opacity-60' : ''
                  } ${isClickable ? 'cursor-pointer hover:bg-gray-50 -mx-2 px-2' : ''}`}
                >
                  {/* Check circle */}
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.completed
                      ? 'bg-primary-600 onboarding-check-done'
                      : 'border-2 border-gray-300'
                  }`}>
                    {item.completed && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>

                  {/* Label */}
                  <span className={`text-sm flex-1 leading-relaxed ${
                    item.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                  }`}>
                    {item.label}
                  </span>

                  {/* Action pill */}
                  {isClickable && (
                    <span className="text-sm font-medium px-3 py-1 rounded-full bg-primary-50 text-primary-700 flex-shrink-0">
                      {action.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Skip */}
          <div className="px-5 pb-5 pt-1">
            <button
              onClick={handleSkip}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              スキップ
            </button>
          </div>
        </div>
      ) : (
        /* ── Collapsed FAB ── */
        <button
          onClick={handleToggle}
          className="onboarding-checklist-fab w-full bg-white rounded-xl shadow-lg border border-gray-200 px-5 py-3.5 flex items-center gap-3 hover:shadow-xl transition-shadow"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-primary-100)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-600)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <span className="text-sm font-medium text-gray-700">{completedCount}/{totalCount} 完了</span>
            <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progress}%`,
                  backgroundColor: 'var(--color-primary-600)',
                }}
              />
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-gray-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      )}
    </div>
  );
}
