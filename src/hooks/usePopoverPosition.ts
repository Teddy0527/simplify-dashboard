import { useState, useEffect, useCallback } from 'react';

interface PopoverPosition {
  top: number;
  left: number;
}

export function usePopoverPosition(
  anchorRef: React.RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
  popoverHeight = 320,
  popoverWidth = 272,
): PopoverPosition {
  const [pos, setPos] = useState<PopoverPosition>({ top: 0, left: 0 });

  const calculate = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = rect.bottom + 6;
    let left = rect.left;

    // Flip up if not enough room below
    if (top + popoverHeight > vh - 8) {
      top = rect.top - popoverHeight - 6;
    }
    // Clamp top
    if (top < 8) top = 8;

    // Clamp horizontal
    if (left + popoverWidth > vw - 8) {
      left = vw - popoverWidth - 8;
    }
    if (left < 8) left = 8;

    setPos({ top, left });
  }, [anchorRef, popoverHeight, popoverWidth]);

  useEffect(() => {
    if (!open) return;
    calculate();

    // Close on scroll within drawer (any scrollable ancestor)
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && anchorRef.current && target.contains(anchorRef.current)) {
        onClose();
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', calculate);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', calculate);
    };
  }, [open, calculate, onClose, anchorRef]);

  return pos;
}
