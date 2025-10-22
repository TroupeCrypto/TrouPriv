import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedTitleProps {
  children: string;
  variant?: 'split' | 'reveal' | 'bounce' | 'morph' | 'pulse';
  className?: string;
  delay?: number;
}

/**
 * Animated title component with various entrance and ongoing effects
 */
export const AnimatedTitle: React.FC<AnimatedTitleProps> = ({
  children,
  variant = 'split',
  className = '',
  delay = 0,
}) => {
  if (variant === 'split') {
    return (
      <div className={`overflow-hidden ${className}`}>
        <div className="flex flex-wrap">
          {children.split(' ').map((word, wordIndex) => (
            <div key={wordIndex} className="overflow-hidden mr-2">
              {word.split('').map((char, charIndex) => (
                <motion.span
                  key={charIndex}
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: delay + wordIndex * 0.1 + charIndex * 0.05,
                    duration: 0.5,
                    ease: 'easeOut',
                  }}
                  className="inline-block"
                >
                  {char}
                </motion.span>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'reveal') {
    return (
      <div className={`relative ${className}`}>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{
            delay,
            duration: 0.8,
            ease: 'easeInOut',
          }}
          className="origin-left"
        >
          {children}
        </motion.div>
      </div>
    );
  }

  if (variant === 'bounce') {
    return (
      <div className={`flex ${className}`}>
        {children.split('').map((char, index) => (
          <motion.span
            key={index}
            animate={{
              y: [0, -15, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: delay + index * 0.1,
              ease: 'easeInOut',
            }}
            className="inline-block"
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </div>
    );
  }

  if (variant === 'morph') {
    return (
      <motion.div
        className={className}
        animate={{
          scaleX: [1, 1.05, 1],
          scaleY: [1, 0.95, 1],
          rotateZ: [0, 1, -1, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          delay,
          ease: 'easeInOut',
        }}
      >
        {children}
      </motion.div>
    );
  }

  if (variant === 'pulse') {
    return (
      <motion.div
        className={className}
        animate={{
          scale: [1, 1.03, 1],
          opacity: [1, 0.9, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          delay,
          ease: 'easeInOut',
        }}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={className}>{children}</div>;
};

export default AnimatedTitle;
