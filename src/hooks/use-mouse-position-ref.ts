import { useRef, useEffect, RefObject } from 'react';

/**
 * Hook to track mouse position relative to the center of a target element.
 * Stores the position in a ref to avoid re-renders on mouse move.
 *
 * @param targetRef RefObject pointing to the container element.
 * @returns RefObject containing the current relative mouse position { x: number, y: number }.
 */
export function useMousePositionRef(targetRef: RefObject<HTMLElement>) {
  const positionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!targetRef.current) {
        return;
      }

      const rect = targetRef.current.getBoundingClientRect();
      // Calculate mouse position relative to the element's top-left corner
      const xRelativeToElement = event.clientX - rect.left;
      const yRelativeToElement = event.clientY - rect.top;

      // Calculate mouse position relative to the element's center
      const xRelativeToCenter = xRelativeToElement - rect.width / 2;
      const yRelativeToCenter = yRelativeToElement - rect.height / 2;

      positionRef.current = { x: xRelativeToCenter, y: yRelativeToCenter };
    };

    const currentElement = targetRef.current; // Capture ref value for cleanup

    // Add listener to the target element itself or window/document
    // Listening on the element might be slightly more performant if the element is large
    // and mouse movements outside it don't need tracking for this effect.
    currentElement?.addEventListener('mousemove', handleMouseMove);

    // Optional: Add listeners for mouse leaving the element to reset position
    const handleMouseLeave = () => {
        // Smoothly return to center or just snap back
        // Snapping back for simplicity here:
        positionRef.current = { x: 0, y: 0 };
    };
    currentElement?.addEventListener('mouseleave', handleMouseLeave);


    return () => {
      // Cleanup listeners
      currentElement?.removeEventListener('mousemove', handleMouseMove);
      currentElement?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [targetRef]); // Re-run effect if the targetRef changes

  return positionRef;
}