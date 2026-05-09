'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ProgressDots } from './ProgressDots';
import type { WizardSession } from '@/types/wizardSession';

interface WizardLayoutProps {
  session: WizardSession;
  sessionId: string;
  children: React.ReactNode;
}

export function WizardLayout({ session, children }: WizardLayoutProps) {
  const router = useRouter();
  const handleSaveAndExit = () => router.replace('/');

  return (
    <div className="flex min-h-[calc(100svh-8rem)] flex-col gap-6">
      <div className="flex items-center justify-between">
        <ProgressDots currentStep={session.currentStep} totalSteps={9} />
        <Button variant="ghost" size="sm" onClick={handleSaveAndExit}>
          Save &amp; exit
        </Button>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={session.currentStep}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
          className="flex-1"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
