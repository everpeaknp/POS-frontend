import { useEffect, useRef, useState } from "react";

/**
 * Suppresses a loading flag's true value for `delay` ms before letting a
 * skeleton/spinner render. Prevents the loading -> instantly-gone flash on
 * fast (cache-hit, sub-200ms) requests. The flag still clears immediately
 * once loading actually finishes.
 */
export function useDelayedLoading(loading: boolean, delay = 220): boolean {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // `loading && visible` below already goes false the instant `loading`
    // does, regardless of `visible`; this just resets `visible` for the
    // next time `loading` turns true, deferred so it isn't a synchronous
    // setState call inside the effect body.
    timeoutRef.current = setTimeout(() => setVisible(loading), loading ? delay : 0);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [loading, delay]);

  return loading && visible;
}
