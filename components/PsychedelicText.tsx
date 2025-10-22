import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface PsychedelicTextProps {
  children: string;
  className?: string;
  variant?: 'glitch' | 'wave' | 'neon' | 'morphing' | 'rainbow';
}

/**
 * Psychedelic text component with various trippy effects
 */
export const PsychedelicText: React.FC<PsychedelicTextProps> = ({
  children,
  className = '',
  variant = 'glitch',
}) => {
  const [colors, setColors] = useState(['#ff00ff', '#00ffff', '#ffff00']);

  useEffect(() => {
    // Cycle through psychedelic colors
    const interval = setInterval(() => {
      setColors([
        `hsl(${Math.random() * 360}, 100%, 60%)`,
        `hsl(${Math.random() * 360}, 100%, 60%)`,
        `hsl(${Math.random() * 360}, 100%, 60%)`,
      ]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (variant === 'glitch') {
    return (
      <motion.div
        className={`relative inline-block ${className}`}
        animate={{
          x: [0, -2, 2, -1, 1, 0],
          textShadow: [
            '0 0 10px #ff00ff, 0 0 20px #00ffff',
            '2px 0 10px #ff00ff, -2px 0 20px #00ffff',
            '-2px 0 10px #ff00ff, 2px 0 20px #00ffff',
            '0 0 10px #ff00ff, 0 0 20px #00ffff',
          ],
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          repeatDelay: 5,
        }}
      >
        <span className="relative z-10">{children}</span>
        <span
          className="absolute top-0 left-0 opacity-50"
          style={{
            color: colors[0],
            transform: 'translate(-2px, 0)',
            mixBlendMode: 'screen',
          }}
        >
          {children}
        </span>
        <span
          className="absolute top-0 left-0 opacity-50"
          style={{
            color: colors[1],
            transform: 'translate(2px, 0)',
            mixBlendMode: 'screen',
          }}
        >
          {children}
        </span>
      </motion.div>
    );
  }

  if (variant === 'wave') {
    return (
      <div className={`inline-flex ${className}`}>
        {children.split('').map((char, index) => (
          <motion.span
            key={index}
            animate={{
              y: [0, -10, 0],
              color: colors,
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: index * 0.1,
            }}
            style={{
              display: 'inline-block',
              textShadow: `0 0 20px ${colors[0]}`,
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </div>
    );
  }

  if (variant === 'neon') {
    return (
      <motion.div
        className={`inline-block ${className}`}
        animate={{
          textShadow: [
            `0 0 10px ${colors[0]}, 0 0 20px ${colors[1]}, 0 0 30px ${colors[2]}`,
            `0 0 20px ${colors[1]}, 0 0 30px ${colors[2]}, 0 0 40px ${colors[0]}`,
            `0 0 10px ${colors[2]}, 0 0 20px ${colors[0]}, 0 0 30px ${colors[1]}`,
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
        }}
      >
        {children}
      </motion.div>
    );
  }

  if (variant === 'morphing') {
    return (
      <motion.div
        className={`inline-block ${className}`}
        animate={{
          scale: [1, 1.05, 1],
          rotateZ: [-1, 1, -1],
          color: colors,
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
        }}
      >
        {children}
      </motion.div>
    );
  }

  if (variant === 'rainbow') {
    return (
      <div className={`inline-flex ${className}`}>
        {children.split('').map((char, index) => (
          <motion.span
            key={index}
            animate={{
              color: [
                `hsl(${(index * 30) % 360}, 100%, 60%)`,
                `hsl(${(index * 30 + 60) % 360}, 100%, 60%)`,
                `hsl(${(index * 30 + 120) % 360}, 100%, 60%)`,
                `hsl(${(index * 30 + 180) % 360}, 100%, 60%)`,
                `hsl(${(index * 30) % 360}, 100%, 60%)`,
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              textShadow: `0 0 10px currentColor`,
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
};

export default PsychedelicText;
