'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface PerformativeLoadingProps {
  messages: string[];
  intervalMs?: number;
}

export function PerformativeLoading({
  messages,
  intervalMs = 1500,
}: PerformativeLoadingProps) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIdx((i) => Math.min(i + 1, messages.length - 1)),
      intervalMs,
    );
    return () => clearInterval(id);
  }, [messages.length, intervalMs]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="size-10 animate-spin rounded-full border-2 border-border border-t-primary" />
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="text-body text-text-muted"
        >
          {messages[idx]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
