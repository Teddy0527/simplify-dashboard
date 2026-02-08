import { useState, useMemo } from 'react';
import { Company, CompanyDeadline } from '@simplify/shared';
import { getDeadlineUrgency } from '../utils/deadlineHelpers';
import { useGoogleCalendar, useGoogleCalendarEventMap } from '../hooks/useGoogleCalendar';
import type { CalendarEventDisplay } from '../types/googleCalendar';

interface DeadlineCalendarViewProps {
  companies: Company[];
  onCardClick: (company: Company) => void;
}

interface DeadlineWithCompany extends CompanyDeadline {
  company: Company;
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

const URGENCY_COLORS: Record<string, string> = {
  overdue: 'bg-red-100 text-red-700 border-red-200',
  urgent: 'bg-red-50 text-red-600 border-red-200',
  soon: 'bg-amber-50 text-amber-700 border-amber-200',
  normal: 'bg-gray-50 text-gray-700 border-gray-200',
};

const MAX_ITEMS_PER_CELL = 4;

export default function DeadlineCalendarView({ companies, onCardClick }: DeadlineCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { events: gcalEvents, loading: gcalLoading, enabled: gcalEnabled, setEnabled: setGcalEnabled, tokenAvailable, reconnect } = useGoogleCalendar(year, month);
  const gcalEventMap = useGoogleCalendarEventMap(gcalEvents);

  // Build deadline map: dateStr -> DeadlineWithCompany[]
  const deadlineMap = useMemo(() => {
    const map = new Map<string, DeadlineWithCompany[]>();
    for (const company of companies) {
      for (const d of company.deadlines ?? []) {
        const list = map.get(d.date) || [];
        list.push({ ...d, company });
        map.set(d.date, list);
      }
    }
    return map;
  }, [companies]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    while (days.length % 7 !== 0) {
      days.push(null);
    }
    return days;
  }, [year, month]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function goToday() {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  function formatDateStr(day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return (
    <div className="flex-1 overflow-auto custom-scrollbar px-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-900 min-w-[120px] text-center">
            {year}年{month + 1}月
          </h2>
          <button
            onClick={nextMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={goToday}
            className="ml-2 text-xs text-primary-600 hover:text-primary-800 px-2 py-1 border border-primary-200 rounded-lg transition-colors"
          >
            今日
          </button>
        </div>

        {/* Google Calendar toggle */}
        <div className="flex items-center gap-2">
          {gcalEnabled && gcalLoading && (
            <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          )}
          <button
            onClick={() => setGcalEnabled(!gcalEnabled)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
              gcalEnabled
                ? 'bg-[#4285f4] text-white border-[#4285f4] hover:bg-[#3367d6]'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
            </svg>
            Googleカレンダー
          </button>
        </div>
      </div>

      {/* Reconnect banner */}
      {gcalEnabled && !tokenAvailable && !gcalLoading && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-blue-700">Googleカレンダーの予定を表示するにはアカウントを接続してください</span>
          <button
            onClick={reconnect}
            className="ml-auto text-xs font-medium text-white bg-[#4285f4] hover:bg-[#3367d6] px-3 py-1 rounded transition-colors"
          >
            接続する
          </button>
        </div>
      )}

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={`text-center text-xs font-medium py-1.5 ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border-t border-l border-gray-100">
        {calendarDays.map((day, idx) => {
          const dayOfWeek = idx % 7;
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          if (day === null) {
            return (
              <div key={`empty-${idx}`} className={`border-r border-b border-gray-100 min-h-[120px] ${isWeekend ? 'bg-gray-50/30' : 'bg-gray-50/50'}`} />
            );
          }

          const dateStr = formatDateStr(day);
          const isToday = dateStr === todayStr;
          const deadlineEntries = deadlineMap.get(dateStr) || [];
          const gcalEntries = gcalEnabled ? (gcalEventMap.get(dateStr) || []) : [];

          const totalItems = deadlineEntries.length + gcalEntries.length;
          const overflow = totalItems > MAX_ITEMS_PER_CELL ? totalItems - MAX_ITEMS_PER_CELL : 0;
          const visibleDeadlines = overflow > 0
            ? deadlineEntries.slice(0, Math.max(1, MAX_ITEMS_PER_CELL - gcalEntries.length))
            : deadlineEntries;
          const remainingSlots = MAX_ITEMS_PER_CELL - visibleDeadlines.length;
          const visibleGcal = gcalEntries.slice(0, Math.max(0, remainingSlots));

          return (
            <div
              key={dateStr}
              className={`border-r border-b border-gray-100 min-h-[120px] p-1.5 ${
                isToday ? 'bg-blue-50/30' : isWeekend ? 'bg-gray-50/30' : ''
              }`}
            >
              <div className={`text-xs font-medium mb-1 ${
                isToday
                  ? 'bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center'
                  : dayOfWeek === 0 ? 'text-red-400' : dayOfWeek === 6 ? 'text-blue-400' : 'text-gray-500'
              }`}>
                {day}
              </div>
              <div className="space-y-0.5">
                {visibleDeadlines.map(entry => {
                  const urgency = getDeadlineUrgency(entry.date);
                  return (
                    <button
                      key={`dl-${entry.company.id}-${entry.id}`}
                      onClick={() => onCardClick(entry.company)}
                      className={`w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded border truncate cursor-pointer hover:opacity-80 transition-opacity ${URGENCY_COLORS[urgency]}`}
                      title={`${entry.company.name} - ${entry.label}${entry.memo ? `\n${entry.memo}` : ''}`}
                    >
                      <span className="font-medium">{entry.company.name.slice(0, 6)}</span>
                      {entry.company.name.length > 6 ? '…' : ''} {entry.label}
                    </button>
                  );
                })}
                {visibleGcal.map(ev => (
                  <GcalChip key={`gcal-${ev.id}`} event={ev} />
                ))}
                {overflow > 0 && (
                  <div className="text-[9px] text-gray-400 pl-1">+{overflow}件</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GcalChip({ event }: { event: CalendarEventDisplay }) {
  return (
    <a
      href={event.htmlLink}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded bg-blue-50 text-blue-700 border-l-[3px] border-l-[#4285f4] truncate hover:bg-blue-100 transition-colors cursor-pointer"
      title={event.title}
    >
      {event.startTime && <span className="text-blue-500 mr-0.5">{event.startTime}</span>}
      {event.title}
    </a>
  );
}
