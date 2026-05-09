'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { PRODUCT_STATUSES, type ProductStatus } from '@/types/product';

interface StatusMenuProps {
  status: ProductStatus;
  onChange: (next: ProductStatus) => void;
  size?: 'sm' | 'default';
  disabled?: boolean;
}

const LABELS: Record<ProductStatus, string> = {
  idea: 'Idea',
  researching: 'Researching',
  brief_ready: 'Brief ready',
  testing: 'Testing',
  tested: 'Tested',
  killed: 'Killed',
  scaling: 'Scaling',
};

const DOT_CLASS: Record<ProductStatus, string> = {
  idea: 'bg-text-subtle',
  researching: 'bg-info-bg',
  brief_ready: 'bg-primary',
  testing: 'bg-primary',
  tested: 'bg-text-muted',
  killed: 'bg-danger-bg',
  scaling: 'bg-success-bg',
};

function StatusDot({ status }: { status: ProductStatus }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block size-2 shrink-0 rounded-full', DOT_CLASS[status])}
    />
  );
}

export function StatusMenu({ status, onChange, size = 'sm', disabled }: StatusMenuProps) {
  return (
    <Select
      value={status}
      onValueChange={(v) => onChange(v as ProductStatus)}
      disabled={disabled}
    >
      <SelectTrigger size={size} aria-label="Change status">
        <SelectValue>
          <StatusDot status={status} />
          <span>{LABELS[status]}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {PRODUCT_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            <StatusDot status={s} />
            <span>{LABELS[s]}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { LABELS as PRODUCT_STATUS_LABELS };
