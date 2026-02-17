import { useState, useEffect } from 'react';
import { useOnboardingContext } from '../../contexts/OnboardingContext';

const WELCOME_SHOWN_KEY = 'welcome_shown_v2';

export default function WelcomeModal() {
  const { showOnboarding, loading, triggerSurface } = useOnboardingContext();
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (loading || !showOnboarding || triggerSurface !== 'first_login') return;

    const alreadyShown = localStorage.getItem(WELCOME_SHOWN_KEY);
    if (alreadyShown) return;

    setVisible(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimateIn(true));
    });
  }, [loading, showOnboarding, triggerSurface]);

  function handleClose() {
    setAnimateIn(false);
    localStorage.setItem(WELCOME_SHOWN_KEY, '1');
    setTimeout(() => setVisible(false), 200);
  }

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-colors duration-200 ${
        animateIn ? 'bg-black/40' : 'bg-black/0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative w-full max-w-md mx-4 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ease-out ${
          animateIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        style={{
          background: 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-900))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-10"
          style={{ backgroundColor: 'var(--color-primary-400)' }}
        />
        <div
          className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full opacity-10"
          style={{ backgroundColor: 'var(--color-primary-400)' }}
        />

        <div className="relative px-8 py-10 text-center">
          {/* Icon */}
          <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
            <img src="/favicon.svg" alt="JobSimplify" className="w-10 h-10" />
          </div>

          {/* Copy */}
          <h2 className="text-2xl font-bold text-white mb-2">
            就活を、シンプルに。
          </h2>
          <p className="text-white/75 text-sm leading-relaxed mb-8">
            JobSimplifyへようこそ！<br />
            応募管理・締切管理・ES管理を<br />
            ひとつの場所でスマートに。
          </p>

          {/* CTA */}
          <button
            onClick={handleClose}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150 hover:shadow-lg active:scale-[0.98]"
            style={{
              backgroundColor: 'white',
              color: 'var(--color-primary-800)',
            }}
          >
            はじめる
          </button>
        </div>
      </div>
    </div>
  );
}
