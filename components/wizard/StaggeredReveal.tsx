'use client';

import { Children } from 'react';
import { motion } from 'framer-motion';

interface StaggeredRevealProps {
  children: React.ReactNode;
  delayStep?: number;
}

export function StaggeredReveal({ children, delayStep = 200 }: StaggeredRevealProps) {
  const items = Children.toArray(children);
  return (
    <>
      {items.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (i * delayStep) / 1000, duration: 0.25 }}
        >
          {child}
        </motion.div>
      ))}
    </>
  );
}
