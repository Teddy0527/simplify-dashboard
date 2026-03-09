import { useState, useMemo, useCallback } from 'react';
import { Company, SelectionStatus } from '@jobsimplify/shared';
import ActionCards from './ActionCards';
import MobileStatusTabs from './MobileStatusTabs';
import MobileCompanyList from './MobileCompanyList';
import StatusChangeSheet from './StatusChangeSheet';
import { COLUMNS } from '../../constants/kanbanColumns';
import { daysUntilDeadline } from '../../utils/deadlineUtils';

interface MobileTrackerViewProps {
  companies: Company[];
  onCardClick: (company: Company) => void;
  onStatusChange: (company: Company, newStatus: SelectionStatus) => void;
}

export default function MobileTrackerView({ companies, onCardClick, onStatusChange }: MobileTrackerViewProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [sheetCompany, setSheetCompany] = useState<Company | null>(null);

  const filteredCompanies = useMemo(() => {
    if (activeTab === 'all') return companies;
    const col = COLUMNS.find((c) => c.id === activeTab);
    if (!col) return companies;
    return companies.filter((c) => col.statuses.includes(c.status));
  }, [companies, activeTab]);

  // Count upcoming deadlines this week
  const weekDeadlineCount = useMemo(() => {
    let count = 0;
    for (const company of companies) {
      if (company.status === 'rejected' || company.status === 'declined') continue;
      for (const stage of company.stages) {
        if (!stage.date) continue;
        const days = daysUntilDeadline(stage.date);
        if (days >= 0 && days <= 7) count++;
      }
    }
    return count;
  }, [companies]);

  const handleStatusChange = useCallback((company: Company, newStatus: SelectionStatus) => {
    onStatusChange(company, newStatus);
  }, [onStatusChange]);

  return (
    <div className="flex flex-col h-full">
      {/* Summary header */}
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{companies.length}</span>
          <span>社</span>
        </div>
        {weekDeadlineCount > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="w-2 h-2 rounded-full bg-warning-500" />
            <span className="text-gray-600">今週の予定</span>
            <span className="font-semibold text-warning-700">{weekDeadlineCount}件</span>
          </div>
        )}
      </div>

      {/* Action cards */}
      <ActionCards companies={companies} onCardClick={onCardClick} />

      {/* Status tabs */}
      <MobileStatusTabs
        companies={companies}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Company list */}
      <div className="flex-1 overflow-y-auto">
        <MobileCompanyList
          companies={filteredCompanies}
          onCardClick={onCardClick}
          onStatusMenuOpen={setSheetCompany}
        />
      </div>

      {/* Status change bottom sheet */}
      <StatusChangeSheet
        open={!!sheetCompany}
        onClose={() => setSheetCompany(null)}
        company={sheetCompany}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
