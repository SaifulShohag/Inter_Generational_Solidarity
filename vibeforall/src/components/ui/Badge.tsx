import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

const variants = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  error: 'bg-error-light text-error',
  info: 'bg-accent-light text-accent',
  outline: 'border border-gray-200 text-gray-600',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full font-medium', variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
}

export function UrgencyBadge({ urgency }: { urgency: string }) {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    low: { variant: 'success', label: 'Urgence faible' },
    medium: { variant: 'warning', label: 'Urgence moyenne' },
    high: { variant: 'error', label: 'Urgence haute' },
    critical: { variant: 'error', label: '🚨 Critique' },
  };
  const config = map[urgency] || map.medium;
  return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
}
