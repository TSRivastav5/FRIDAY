import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * The Luminous Finance signature interaction: cards tilt 1-3° toward the
 * cursor with a soft radial "glass shine" following the pointer, then spring
 * back to flat on release. Reserve this for a handful of hero
 * surfaces (balance card, portfolio card) — using it everywhere would
 * cheapen it.
 */
export function TiltCard({ children, className = '', maxTilt = 6, glow = true, style = {}, ...rest }) {
  const ref = useRef(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springConfig = { stiffness: 220, damping: 22, mass: 0.6 };
  const rotateX = useSpring(useTransform(y, [0, 1], [maxTilt, -maxTilt]), springConfig);
  const rotateY = useSpring(useTransform(x, [0, 1], [-maxTilt, maxTilt]), springConfig);
  const glowX = useTransform(x, (v) => `${v * 100}%`);
  const glowY = useTransform(y, (v) => `${v * 100}%`);

  function handleMouseMove(e) {
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    x.set(0.5);
    y.set(0.5);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden ${className}`}
      style={{ rotateX, rotateY, transformPerspective: 900, ...style }}
      {...rest}
    >
      {glow && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background: useTransform(
              [glowX, glowY],
              ([gx, gy]) => `radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,0.45), transparent 55%)`
            ),
          }}
        />
      )}
      <div className="relative z-20 h-full">{children}</div>
    </motion.div>
  );
}

export default TiltCard;
