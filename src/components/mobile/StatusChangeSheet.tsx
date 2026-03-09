import { Company, SelectionStatus, STATUS_LABELS, trackEventAsync } from '@jobsimplify/shared';
import { COLUMNS } from '../../constants/kanbanColumns';
import BottomSheet from './BottomSheet';

interface StatusChangeSheetProps {
  open: boolean;
  onClose: () => void;
  company: Company | null;
  onStatusChange: (company: Company, newStatus: SelectionStatus) => void;
}

export default function StatusChangeSheet({ open, onClose, company, onStatusChange }: StatusChangeSheetProps) {
  if (!company) return null;

  function handleSelect(status: SelectionStatus) {
    if (status === company!.status) {
      onClose();
      return;
    }
    trackEventAsync('interaction.mobile_status_change', {
      companyId: company!.id,
      fromStatus: company!.status,
      toStatus: status,
    });
    onStatusChange(company!, status);
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={`${company.name} のステータス変更`}>
      <div className="space-y-1">
        {COLUMNS.map((col) => (
          <div key={col.id}>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide px-2 pt-2 pb-1">
              {col.icon} {col.label}
            </div>
            {col.statuses.map((status) => {
              const isActive = company.status === status;
              return (
                <button
                  key={status}
                  onClick={() => handleSelect(status)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-800 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                  }`}
                  style={{ minHeight: 48 }}
                >
                  <span>{STATUS_LABELS[status]}</span>
                  {isActive && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-700">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}
