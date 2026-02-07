import { createContext, useContext, type ReactNode } from 'react';
import { useEntrySheets } from '../shared/hooks/useEntrySheets';

type EntrySheetContextType = ReturnType<typeof useEntrySheets>;

const EntrySheetContext = createContext<EntrySheetContextType | null>(null);

export function EntrySheetProvider({ children }: { children: ReactNode }) {
  const entrySheetState = useEntrySheets();
  return (
    <EntrySheetContext.Provider value={entrySheetState}>
      {children}
    </EntrySheetContext.Provider>
  );
}

export function useEntrySheetContext() {
  const ctx = useContext(EntrySheetContext);
  if (!ctx) throw new Error('useEntrySheetContext must be used within EntrySheetProvider');
  return ctx;
}
