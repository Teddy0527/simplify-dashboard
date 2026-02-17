import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { getSupabase, trackEventAsync } from '@jobsimplify/shared';
import { useAuth } from '../shared/hooks/useAuth';

// ── Types ───────────────────────────────────────────────────────────────

type OnboardingStatus = 'pending' | 'started' | 'completed' | 'skipped';
type OnboardingVariant = 'control' | 'onboarding_v1';
type TriggerSurface = 'first_login' | 'reshow_after_skip';

const CHECKLIST_ITEMS = [
  { id: 'add_company',       label: '応募を追加する' },
  { id: 'drag_card',         label: 'カードを移動する' },
  { id: 'check_deadlines',   label: '締切を確認する' },
  { id: 'install_extension', label: 'Chrome拡張機能を追加する' },
] as const;

export type ChecklistItemId = typeof CHECKLIST_ITEMS[number]['id'];

export interface ChecklistItem {
  id: ChecklistItemId;
  label: string;
  completed: boolean;
}

interface OnboardingContextValue {
  showOnboarding: boolean;
  loading: boolean;
  variant: OnboardingVariant;
  triggerSurface: TriggerSurface;
  checklistItems: ChecklistItem[];
  completeChecklistItem: (id: ChecklistItemId) => void;
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
}

const STORAGE_KEY = 'onboarding_checklist_v3';

// ── Context ─────────────────────────────────────────────────────────────

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboardingContext(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    // Return a no-op fallback for components outside the provider
    return {
      showOnboarding: false,
      loading: true,
      variant: 'control',
      triggerSurface: 'first_login',
      checklistItems: [],
      completeChecklistItem: () => {},
      completeOnboarding: async () => {},
      skipOnboarding: async () => {},
    };
  }
  return ctx;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function loadCompletedFromStorage(): Set<ChecklistItemId> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as ChecklistItemId[]);
  } catch { /* ignore */ }
  return new Set();
}

function saveCompletedToStorage(completed: Set<ChecklistItemId>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
}

function pickVariant(weights: Record<string, number>): OnboardingVariant {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let rand = Math.random() * total;
  for (const [variant, weight] of entries) {
    rand -= weight;
    if (rand <= 0) return variant as OnboardingVariant;
  }
  return 'control';
}

// ── Provider ────────────────────────────────────────────────────────────

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [variant, setVariant] = useState<OnboardingVariant>('control');
  const [triggerSurface, setTriggerSurface] = useState<TriggerSurface>('first_login');
  const [completedIds, setCompletedIds] = useState<Set<ChecklistItemId>>(loadCompletedFromStorage);
  const startedRef = useRef(false);
  const shownEventFired = useRef(false);

  // ── Init: load onboarding state from DB ──
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelled = false;

    (async () => {
      const supabase = getSupabase();

      // 1. Fetch config
      const { data: configRow } = await supabase
        .from('onboarding_config')
        .select('enabled, variant_weights, reshow_after_days')
        .eq('version', 1)
        .single();

      if (cancelled) return;

      const config = configRow ?? {
        enabled: true,
        variant_weights: { control: 50, onboarding_v1: 50 },
        reshow_after_days: 7,
      };

      if (!config.enabled) {
        setLoading(false);
        return;
      }

      // 2. Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_status, onboarding_variant, onboarding_skipped_at, onboarding_version')
        .eq('id', user.id)
        .single();

      if (cancelled || !profile) {
        setLoading(false);
        return;
      }

      let currentVariant = profile.onboarding_variant as OnboardingVariant;
      const status = profile.onboarding_status as OnboardingStatus;

      // 3. Assign variant if pending + control
      if (status === 'pending' && currentVariant === 'control') {
        currentVariant = pickVariant(config.variant_weights);
        await supabase
          .from('profiles')
          .update({ onboarding_variant: currentVariant })
          .eq('id', user.id);
      }

      setVariant(currentVariant);

      // 4. Control group never sees onboarding
      if (currentVariant === 'control') {
        setLoading(false);
        return;
      }

      // 5. Determine showOnboarding
      let shouldShow = false;
      let surface: TriggerSurface = 'first_login';

      if (status === 'pending' || status === 'started') {
        shouldShow = true;
        surface = 'first_login';
      } else if (status === 'skipped' && profile.onboarding_skipped_at) {
        const skippedAt = new Date(profile.onboarding_skipped_at).getTime();
        const reshowAfterMs = config.reshow_after_days * 24 * 60 * 60 * 1000;
        const isEligible = Date.now() > skippedAt + reshowAfterMs;

        if (isEligible) {
          const { count } = await supabase
            .from('user_events')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('event_type', 'onboarding.reshown');

          if (cancelled) return;

          if ((count ?? 0) < 1) {
            shouldShow = true;
            surface = 'reshow_after_skip';
          }
        }
      }

      if (cancelled) return;

      setTriggerSurface(surface);
      setShowOnboarding(shouldShow);

      // 6. Mark as started
      if (shouldShow && status === 'pending' && !startedRef.current) {
        startedRef.current = true;
        await supabase
          .from('profiles')
          .update({ onboarding_status: 'started' })
          .eq('id', user.id);

        trackEventAsync('onboarding.started', {
          experiment_id: 'onboarding_v1',
          variant: currentVariant,
          onboarding_version: 1,
          trigger_surface: surface,
        });
      }

      // Fire reshown event
      if (shouldShow && surface === 'reshow_after_skip') {
        trackEventAsync('onboarding.reshown', {
          experiment_id: 'onboarding_v1',
          variant: currentVariant,
          onboarding_version: 1,
          trigger_surface: surface,
        });
        await supabase
          .from('profiles')
          .update({ onboarding_status: 'started' })
          .eq('id', user.id);
      }

      // 7. Restore checklist from DB if localStorage is empty
      const stored = loadCompletedFromStorage();
      if (shouldShow && stored.size === 0) {
        const { data: events } = await supabase
          .from('user_events')
          .select('metadata')
          .eq('user_id', user.id)
          .eq('event_type', 'onboarding.cta_click')
          .eq('metadata->>cta_type', 'checklist_complete');

        if (!cancelled && events && events.length > 0) {
          const restored = new Set<ChecklistItemId>();
          for (const evt of events) {
            const stepId = (evt.metadata as Record<string, unknown>)?.step_id as ChecklistItemId | undefined;
            if (stepId && CHECKLIST_ITEMS.some(item => item.id === stepId)) {
              restored.add(stepId);
            }
          }
          if (restored.size > 0) {
            setCompletedIds(restored);
            saveCompletedToStorage(restored);
          }
        }
      }

      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user]);

  // ── Complete a checklist item ──
  const completeChecklistItem = useCallback((id: ChecklistItemId) => {
    setCompletedIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      saveCompletedToStorage(next);

      trackEventAsync('onboarding.cta_click', {
        experiment_id: 'onboarding_v1',
        variant,
        onboarding_version: 1,
        cta_type: 'checklist_complete',
        step_id: id,
      });

      // Check if all completed
      if (next.size === CHECKLIST_ITEMS.length) {
        // Trigger completeOnboarding async
        setTimeout(() => completeOnboardingInternal(), 500);
      }

      return next;
    });
  }, [variant]);

  // ── Complete onboarding (internal) ──
  const completeOnboardingInternal = useCallback(async () => {
    if (!user) return;
    const supabase = getSupabase();
    await supabase
      .from('profiles')
      .update({
        onboarding_status: 'completed',
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    trackEventAsync('onboarding.completed', {
      experiment_id: 'onboarding_v1',
      variant,
      onboarding_version: 1,
    });

    setShowOnboarding(false);
  }, [user, variant]);

  // ── Complete onboarding (public) ──
  const completeOnboarding = useCallback(async () => {
    await completeOnboardingInternal();
  }, [completeOnboardingInternal]);

  // ── Skip onboarding ──
  const skipOnboarding = useCallback(async () => {
    if (!user) return;
    const supabase = getSupabase();
    await supabase
      .from('profiles')
      .update({
        onboarding_status: 'skipped',
        onboarding_skipped_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    trackEventAsync('onboarding.skipped', {
      experiment_id: 'onboarding_v1',
      variant,
      onboarding_version: 1,
    });

    setShowOnboarding(false);
  }, [user, variant]);

  // ── Build checklist items ──
  const checklistItems = useMemo<ChecklistItem[]>(() =>
    CHECKLIST_ITEMS.map(item => ({
      ...item,
      completed: completedIds.has(item.id),
    })),
    [completedIds],
  );

  // ── Fire checklist_shown event once ──
  useEffect(() => {
    if (showOnboarding && !loading && !shownEventFired.current) {
      shownEventFired.current = true;
      trackEventAsync('onboarding.cta_click', {
        experiment_id: 'onboarding_v1',
        variant,
        onboarding_version: 1,
        cta_type: 'checklist_shown',
      });
    }
  }, [showOnboarding, loading, variant]);

  const value = useMemo<OnboardingContextValue>(() => ({
    showOnboarding,
    loading,
    variant,
    triggerSurface,
    checklistItems,
    completeChecklistItem,
    completeOnboarding,
    skipOnboarding,
  }), [showOnboarding, loading, variant, triggerSurface, checklistItems, completeChecklistItem, completeOnboarding, skipOnboarding]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}
