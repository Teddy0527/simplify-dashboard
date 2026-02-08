import { useRef, useCallback } from 'react';
import type { DrawerTab } from './types';

interface DrawerTabNavProps {
  activeTab: DrawerTab;
  onTabChange: (tab: DrawerTab) => void;
  esCount: number;
}

const TABS: { key: DrawerTab; label: string }[] = [
  { key: 'overview', label: '概要' },
  { key: 'documents', label: 'ES・書類' },
];

export default function DrawerTabNav({ activeTab, onTabChange, esCount }: DrawerTabNavProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIdx = TABS.findIndex((t) => t.key === activeTab);
      let nextIdx = currentIdx;

      if (e.key === 'ArrowRight') {
        nextIdx = (currentIdx + 1) % TABS.length;
      } else if (e.key === 'ArrowLeft') {
        nextIdx = (currentIdx - 1 + TABS.length) % TABS.length;
      } else {
        return;
      }

      e.preventDefault();
      onTabChange(TABS[nextIdx].key);
      tabRefs.current[nextIdx]?.focus();
    },
    [activeTab, onTabChange],
  );

  return (
    <div
      role="tablist"
      aria-label="ドロワータブ"
      className="flex border-b border-gray-200 px-6"
      onKeyDown={handleKeyDown}
    >
      {TABS.map((tab, i) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            ref={(el) => { tabRefs.current[i] = el; }}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.key}`}
            id={`tab-${tab.key}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.key)}
            className={`tab-item ${isActive ? 'tab-item-active' : ''}`}
          >
            {tab.label}
            {tab.key === 'documents' && esCount > 0 && (
              <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                {esCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
