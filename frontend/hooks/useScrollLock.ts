import { useEffect } from 'react';

/**
 * Hook to lock body scroll when a modal is active.
 * @param lock - Boolean indicating if the scroll should be locked.
 */
export function useScrollLock(lock: boolean) {
    useEffect(() => {
        if (lock) {
            // Store original overflow style
            const originalStyle = window.getComputedStyle(document.body).overflow;
            // Prevent scrolling
            document.body.style.overflow = 'hidden';
            // Cleanup: restore original overflow style
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [lock]);
}
