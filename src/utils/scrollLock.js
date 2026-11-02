import { useEffect } from 'react';

// Reference-counted global scroll lock manager for all modals/popups
let activeModalsCount = 0;
let originalBodyOverflow = '';
let originalHtmlOverflow = '';
let originalBodyPaddingRight = '';

export function lockBodyScroll() {
  if (typeof document === 'undefined') return;

  activeModalsCount++;
  if (activeModalsCount === 1) {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    originalBodyOverflow = document.body.style.overflow;
    originalHtmlOverflow = document.documentElement.style.overflow;
    originalBodyPaddingRight = document.body.style.paddingRight;

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');
  }
}

export function unlockBodyScroll() {
  if (typeof document === 'undefined') return;

  activeModalsCount = Math.max(0, activeModalsCount - 1);
  if (activeModalsCount === 0) {
    document.body.style.overflow = originalBodyOverflow || '';
    document.documentElement.style.overflow = originalHtmlOverflow || '';
    document.body.style.paddingRight = originalBodyPaddingRight || '';
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
  }
}

/**
 * React hook to lock body & document scroll while a modal is mounted/open.
 * Restores scroll automatically on unmount or when isLocked becomes false.
 */
export function useBodyScrollLock(isLocked = true) {
  useEffect(() => {
    if (!isLocked) return;
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [isLocked]);
}
