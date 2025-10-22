import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface FloatingElementsProps {
  count?: number;
  variant?: 'orbs' | 'particles' | 'shapes' | 'words';
  intensity?: 'low' | 'medium' | 'high';
}

/**
 * Floating psychedelic visual elements that drift across the screen
 */
export const FloatingElements: React.FC<FloatingElementsProps> = ({
  count = 20,
  variant = 'orbs',
  intensity = 'medium',
}) => {
  const elements = useMemo(() => {
    const items = [];
    const actualCount = intensity === 'low' ? count / 2 : intensity === 'high' ? count * 1.5 : count;

    for (let i = 0; i < actualCount; i++) {
      const size = Math.random() * 100 + 20;
      const duration = Math.random() * 20 + 15;
      const delay = Math.random() * 10;
      const x = Math.random() * 100;
      const y = Math.random() * 100;

      items.push({
        id: i,
        size,
        duration,
        delay,
        x,
        y,
        color: `hsl(${Math.random() * 360}, 80%, 60%)`,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }
    return items;
  }, [count, intensity]);

  const psychedelicWords = [
    'VIBES', 'COSMIC', 'NEON', 'DREAMS', 'FLUX', 'ASTRAL',
    'TRIPPY', 'ELECTRIC', 'PRISM', 'AURA', 'WAVE', 'GLOW',
  ];

  if (variant === 'orbs') {
    return (
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {elements.map((el) => (
          <motion.div
            key={el.id}
            className="absolute rounded-full blur-xl"
            style={{
              width: el.size,
              height: el.size,
              left: `${el.x}%`,
              top: `${el.y}%`,
              background: `radial-gradient(circle, ${el.color}, transparent)`,
              opacity: el.opacity,
            }}
            animate={{
              x: [0, Math.random() * 200 - 100, 0],
              y: [0, Math.random() * 200 - 100, 0],
              scale: [1, 1.2, 1],
              opacity: [el.opacity, el.opacity * 1.5, el.opacity],
            }}
            transition={{
              duration: el.duration,
              repeat: Infinity,
              delay: el.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'particles') {
    return (
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {elements.map((el) => (
          <motion.div
            key={el.id}
            className="absolute"
            style={{
              width: el.size / 5,
              height: el.size / 5,
              left: `${el.x}%`,
              top: `${el.y}%`,
              background: el.color,
              borderRadius: '50%',
              boxShadow: `0 0 ${el.size / 2}px ${el.color}`,
            }}
            animate={{
              y: [0, -300, -600],
              x: [0, Math.sin(el.id) * 100, 0],
              opacity: [0, el.opacity, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: el.duration,
              repeat: Infinity,
              delay: el.delay,
              ease: 'linear',
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'shapes') {
    return (
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {elements.map((el) => {
          const shapes = ['circle', 'square', 'triangle'];
          const shape = shapes[el.id % shapes.length];
          
          return (
            <motion.div
              key={el.id}
              className="absolute"
              style={{
                width: el.size,
                height: el.size,
                left: `${el.x}%`,
                top: `${el.y}%`,
                background: `linear-gradient(135deg, ${el.color}, transparent)`,
                opacity: el.opacity,
                borderRadius: shape === 'circle' ? '50%' : shape === 'triangle' ? '0' : '0',
                clipPath: shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : undefined,
                border: `2px solid ${el.color}`,
              }}
              animate={{
                x: [0, Math.random() * 300 - 150, 0],
                y: [0, Math.random() * 300 - 150, 0],
                rotate: [0, 360],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: el.duration,
                repeat: Infinity,
                delay: el.delay,
                ease: 'easeInOut',
              }}
            />
          );
        })}
      </div>
    );
  }

  if (variant === 'words') {
    return (
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {elements.slice(0, 12).map((el) => (
          <motion.div
            key={el.id}
            className="absolute text-4xl font-black opacity-10"
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              color: el.color,
              textShadow: `0 0 20px ${el.color}`,
              transform: `rotate(${Math.random() * 30 - 15}deg)`,
            }}
            animate={{
              x: [0, Math.random() * 400 - 200],
              y: [0, Math.random() * 400 - 200],
              opacity: [0, 0.15, 0],
              scale: [0.8, 1.2, 0.8],
              rotate: [
                Math.random() * 30 - 15,
                Math.random() * 60 - 30,
                Math.random() * 30 - 15,
              ],
            }}
            transition={{
              duration: el.duration,
              repeat: Infinity,
              delay: el.delay,
            }}
          >
            {psychedelicWords[el.id % psychedelicWords.length]}
          </motion.div>
        ))}
      </div>
    );
  }

  return null;
};

export default FloatingElements;
