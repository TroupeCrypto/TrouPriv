import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TrippyOverlayProps {
  variant?: 'waves' | 'kaleidoscope' | 'plasma' | 'mesh' | 'aurora';
  intensity?: 'subtle' | 'medium' | 'intense';
}

/**
 * Trippy animated background overlays for psychedelic visual effects
 */
export const TrippyOverlay: React.FC<TrippyOverlayProps> = ({
  variant = 'waves',
  intensity = 'medium',
}) => {
  const [colorShift, setColorShift] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setColorShift((prev) => (prev + 1) % 360);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const opacityMap = {
    subtle: 0.15,
    medium: 0.25,
    intense: 0.4,
  };

  const baseOpacity = opacityMap[intensity];

  if (variant === 'waves') {
    return (
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0"
            style={{
              background: `linear-gradient(${45 + i * 60}deg, 
                hsl(${(colorShift + i * 120) % 360}, 100%, 50%), 
                transparent 40%, 
                hsl(${(colorShift + i * 120 + 180) % 360}, 100%, 50%))`,
              opacity: baseOpacity,
            }}
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
            }}
            transition={{
              duration: 15 + i * 5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'kaleidoscope') {
    return (
      <div className="pointer-events-none fixed inset-0 overflow-hidden flex items-center justify-center">
        <motion.div
          className="absolute w-full h-full"
          style={{
            background: `conic-gradient(from ${colorShift}deg,
              hsl(${colorShift}, 100%, 50%),
              hsl(${(colorShift + 60) % 360}, 100%, 50%),
              hsl(${(colorShift + 120) % 360}, 100%, 50%),
              hsl(${(colorShift + 180) % 360}, 100%, 50%),
              hsl(${(colorShift + 240) % 360}, 100%, 50%),
              hsl(${(colorShift + 300) % 360}, 100%, 50%),
              hsl(${colorShift}, 100%, 50%))`,
            opacity: baseOpacity,
            transformOrigin: 'center',
          }}
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            rotate: { duration: 30, repeat: Infinity, ease: 'linear' },
            scale: { duration: 10, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
      </div>
    );
  }

  if (variant === 'plasma') {
    return (
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <svg className="w-full h-full" style={{ opacity: baseOpacity }}>
          <defs>
            <filter id="plasma-filter">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.01"
                numOctaves="3"
                result="turbulence"
              >
                <animate
                  attributeName="baseFrequency"
                  values="0.01;0.02;0.01"
                  dur="20s"
                  repeatCount="indefinite"
                />
              </feTurbulence>
              <feColorMatrix
                in="turbulence"
                type="hueRotate"
                values="0"
                result="color"
              >
                <animate
                  attributeName="values"
                  from="0"
                  to="360"
                  dur="10s"
                  repeatCount="indefinite"
                />
              </feColorMatrix>
              <feBlend in="SourceGraphic" in2="color" mode="screen" />
            </filter>
          </defs>
          <rect width="100%" height="100%" filter="url(#plasma-filter)" />
        </svg>
      </div>
    );
  }

  if (variant === 'mesh') {
    return (
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, hsl(${colorShift}, 100%, 50%) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, hsl(${(colorShift + 120) % 360}, 100%, 50%) 0%, transparent 50%),
              radial-gradient(circle at 20% 80%, hsl(${(colorShift + 240) % 360}, 100%, 50%) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, hsl(${(colorShift + 60) % 360}, 100%, 50%) 0%, transparent 50%)
            `,
            opacity: baseOpacity,
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
    );
  }

  if (variant === 'aurora') {
    return (
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute w-full h-full"
            style={{
              background: `linear-gradient(${i * 45}deg,
                transparent,
                hsl(${(colorShift + i * 90) % 360}, 100%, 50%) 50%,
                transparent)`,
              opacity: baseOpacity * 0.7,
            }}
            animate={{
              x: i % 2 === 0 ? ['-100%', '100%'] : ['100%', '-100%'],
              y: i < 2 ? ['-50%', '50%'] : ['50%', '-50%'],
            }}
            transition={{
              duration: 20 + i * 5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>
    );
  }

  return null;
};

export default TrippyOverlay;
