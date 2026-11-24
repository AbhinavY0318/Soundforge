import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple' | 'cyan' | 'violet';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  pulse = false,
  className = '',
}) => {
  const variantStyles: Record<BadgeVariant, { badge: string; dot: string }> = {
    success: {
      badge: 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/25',
      dot: 'bg-accent-emerald',
    },
    warning: {
      badge: 'bg-accent-amber/10 text-accent-amber border-accent-amber/25',
      dot: 'bg-accent-amber',
    },
    error: {
      badge: 'bg-accent-rose/10 text-accent-rose border-accent-rose/25',
      dot: 'bg-accent-rose',
    },
    info: {
      badge: 'bg-accent-indigo/10 text-accent-indigo border-accent-indigo/25',
      dot: 'bg-accent-indigo',
    },
    purple: {
      badge: 'bg-accent-violet/10 text-accent-violet border-accent-violet/25',
      dot: 'bg-accent-violet',
    },
    violet: {
      badge: 'bg-accent-violet/15 text-accent-violet border-accent-violet/30',
      dot: 'bg-accent-violet',
    },
    cyan: {
      badge: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/25',
      dot: 'bg-accent-cyan',
    },
    neutral: {
      badge: 'bg-white/5 text-text-secondary border-white/10',
      dot: 'bg-text-muted',
    },
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5 gap-1.5',
    md: 'text-sm px-3 py-1 gap-2',
  };

  const activeVariant = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full backdrop-blur-sm transition-colors ${activeVariant.badge} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeVariant.dot}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${activeVariant.dot}`} />
        </span>
      )}
      {children}
    </span>
  );
};
