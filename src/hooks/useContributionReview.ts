import { useState, useEffect, useCallback } from 'react';
import {
  getPendingContributionsSummary,
  verifyContribution,
  rejectContributions,
  recalculateContributorCounts,
  PendingContributionSummary,
} from '@entrify/shared';

export function useContributionReview() {
  const [summaries, setSummaries] = useState<PendingContributionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPendingContributionsSummary();
      setSummaries(data);
    } catch {
      setSummaries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const approve = useCallback(async (
    summary: PendingContributionSummary,
    date?: string,
    time?: string,
    memo?: string,
  ) => {
    setSummaries((prev) => prev.filter((s) =>
      !(s.companyMasterId === summary.companyMasterId &&
        s.recruitmentYear === summary.recruitmentYear &&
        s.deadlineType === summary.deadlineType &&
        s.labelKey === summary.labelKey)
    ));

    try {
      await verifyContribution({
        companyMasterId: summary.companyMasterId,
        recruitmentYear: summary.recruitmentYear,
        deadlineType: summary.deadlineType,
        labelKey: summary.labelKey,
        date: date || summary.mostCommonDate,
        time,
        label: summary.label,
        memo,
      });
    } catch {
      refresh();
    }
  }, [refresh]);

  const reject = useCallback(async (
    summary: PendingContributionSummary,
    reason?: string,
  ) => {
    setSummaries((prev) => prev.filter((s) =>
      !(s.companyMasterId === summary.companyMasterId &&
        s.recruitmentYear === summary.recruitmentYear &&
        s.deadlineType === summary.deadlineType &&
        s.labelKey === summary.labelKey)
    ));

    try {
      await rejectContributions(
        summary.companyMasterId,
        summary.recruitmentYear,
        summary.deadlineType,
        summary.labelKey,
        reason,
      );
    } catch {
      refresh();
    }
  }, [refresh]);

  const recalculate = useCallback(async () => {
    await recalculateContributorCounts();
  }, []);

  return { summaries, loading, refresh, approve, reject, recalculate };
}
