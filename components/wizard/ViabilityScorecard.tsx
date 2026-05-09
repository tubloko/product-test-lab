import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ViabilitySummaryOutput } from '@/lib/claude/schemas';

interface ViabilityScorecardProps {
  summary: ViabilitySummaryOutput;
}

const OVERALL_CONFIG = {
  viable: {
    icon: CheckCircle,
    label: 'Viable',
    iconClass: 'text-success-text',
    boxClass: 'border-success-border bg-success-bg/10',
  },
  risky: {
    icon: AlertTriangle,
    label: 'Mixed',
    iconClass: 'text-warning-text',
    boxClass: 'border-warning-border bg-warning-bg/10',
  },
  pass: {
    icon: XCircle,
    label: 'Risky — reconsider',
    iconClass: 'text-danger-text',
    boxClass: 'border-danger-border bg-danger-bg/10',
  },
} as const;

const SEVERITY_CLASS = {
  low: 'text-text-muted',
  medium: 'text-warning-text',
  high: 'text-danger-text',
} as const;

export function ViabilityScorecard({ summary }: ViabilityScorecardProps) {
  const cfg = OVERALL_CONFIG[summary.overall];
  const Icon = cfg.icon;
  return (
    <div className="space-y-4">
      <div className={cn('flex items-center gap-3 rounded-md border p-4', cfg.boxClass)}>
        <Icon className={cn('size-5', cfg.iconClass)} />
        <p className="text-subheading font-medium text-text">
          Overall: {cfg.label}
        </p>
      </div>

      {summary.flags.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-caption font-medium uppercase tracking-wide text-text-muted">
            Risk flags
          </h3>
          <ul className="space-y-2">
            {summary.flags.map((f, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-md border border-border-subtle p-3"
              >
                <span
                  className={cn(
                    'shrink-0 text-caption font-medium uppercase',
                    SEVERITY_CLASS[f.severity],
                  )}
                >
                  {f.severity}
                </span>
                <div className="space-y-0.5">
                  <p className="text-body text-text">{f.category}</p>
                  <p className="text-caption text-text-muted">{f.message}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-1">
        <h3 className="text-caption font-medium uppercase tracking-wide text-text-muted">
          Recommendation
        </h3>
        <p className="text-body text-text">{summary.recommendation}</p>
      </div>
    </div>
  );
}
