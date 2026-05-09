import { cn } from '@/lib/utils';

interface ProgressDotsProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressDots({ currentStep, totalSteps }: ProgressDotsProps) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Step ${currentStep} of ${totalSteps}`}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const completed = step < currentStep;
        const active = step === currentStep;
        return (
          <span
            key={step}
            aria-hidden="true"
            className={cn(
              'inline-block h-1.5 rounded-full transition-all',
              active ? 'w-6 bg-primary' : 'w-1.5',
              completed && 'bg-text-muted',
              !active && !completed && 'bg-border',
            )}
          />
        );
      })}
    </div>
  );
}
