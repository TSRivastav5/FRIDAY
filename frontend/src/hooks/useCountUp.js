import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number counting up to `target` with an ease-out cubic curve.
 * Used for the Luminous Finance "telemetry" figures (balances, portfolio
 * totals) so they feel like they're settling into place, not just appearing.
 */
export function useCountUp(target, { duration = 1100, decimals = 0, active = true } = {}) {
  const [value, setValue] = useState(active ? 0 : target);
  const raf = useRef(null);
  const numericTarget = Number(target) || 0;

  useEffect(() => {
    if (!active) {
      setValue(numericTarget);
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(numericTarget * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericTarget, duration, active]);

  return Number(value.toFixed(decimals));
}

export default useCountUp;
