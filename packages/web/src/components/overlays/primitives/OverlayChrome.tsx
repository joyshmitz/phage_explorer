/**
 * Overlay Chrome Primitives
 *
 * Composable components for consistent overlay content structure.
 * Use these inside Overlay children for standardized sections, grids, and rows.
 */

import React, { type CSSProperties, type ReactNode } from 'react';

/* ============================================================================
 * OverlaySection - Bordered content section with optional header
 * ========================================================================== */

interface OverlaySectionProps {
  children: ReactNode;
  /** Optional header content (use OverlaySectionHeader for standard header) */
  header?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}

const sectionStyle: CSSProperties = {
  border: '1px solid var(--color-border-light)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
};

export function OverlaySection({
  children,
  header,
  className = '',
  style,
}: OverlaySectionProps): React.ReactElement {
  return (
    <div className={`overlay-section ${className}`} style={{ ...sectionStyle, ...style }}>
      {header}
      {children}
    </div>
  );
}

/* ============================================================================
 * OverlaySectionHeader - Standard section header with badge, title, description
 * ========================================================================== */

interface OverlaySectionHeaderProps {
  /** Optional badge content (e.g., "L0", icon) */
  badge?: ReactNode;
  /** Section title */
  title: string;
  /** Optional description shown to the right */
  description?: string;
  /** Additional CSS classes */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}

const sectionHeaderStyle: CSSProperties = {
  backgroundColor: 'var(--color-background-alt)',
  padding: 'var(--chrome-padding-y) var(--chrome-padding-x)',
  borderBottom: '1px solid var(--color-border-light)',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--chrome-gap)',
};

const badgeStyle: CSSProperties = {
  color: 'var(--color-accent)',
  fontWeight: 'bold',
  fontSize: 'var(--badge-font-size)',
  padding: 'var(--badge-padding-y) var(--badge-padding-x)',
  backgroundColor: 'var(--color-background)',
  borderRadius: 'var(--badge-radius)',
  fontFamily: 'var(--font-mono, monospace)',
};

const sectionTitleStyle: CSSProperties = {
  color: 'var(--color-primary)',
  fontWeight: 'bold',
  fontSize: '0.9rem',
};

const sectionDescStyle: CSSProperties = {
  color: 'var(--color-text-dim)',
  fontSize: '0.85rem',
  marginLeft: 'auto',
};

export function OverlaySectionHeader({
  badge,
  title,
  description,
  className = '',
  style,
}: OverlaySectionHeaderProps): React.ReactElement {
  return (
    <div
      className={`overlay-section-header ${className}`}
      style={{ ...sectionHeaderStyle, ...style }}
    >
      {badge && <span style={badgeStyle}>{badge}</span>}
      <span style={sectionTitleStyle}>{title}</span>
      {description && <span style={sectionDescStyle}>{description}</span>}
    </div>
  );
}

/* ============================================================================
 * OverlayToolbar - Top toolbar for filters, toggles, mode switches
 * ========================================================================== */

interface OverlayToolbarProps {
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}

const toolbarStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 'var(--chrome-padding-y) var(--chrome-padding-x)',
  backgroundColor: 'var(--color-background-alt)',
  borderRadius: 'var(--radius-sm)',
};

export function OverlayToolbar({
  children,
  className = '',
  style,
}: OverlayToolbarProps): React.ReactElement {
  return (
    <div className={`overlay-toolbar ${className}`} style={{ ...toolbarStyle, ...style }}>
      {children}
    </div>
  );
}

/* ============================================================================
 * OverlayGrid - Responsive grid for content items
 * ========================================================================== */

interface OverlayGridProps {
  children: ReactNode;
  /** Minimum column width (default: '280px') */
  minColumnWidth?: string;
  /** Gap between items (default: uses token) */
  gap?: string;
  /** Additional CSS classes */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}

export function OverlayGrid({
  children,
  minColumnWidth = '280px',
  gap,
  className = '',
  style,
}: OverlayGridProps): React.ReactElement {
  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(${minColumnWidth}, 1fr))`,
    gap: gap ?? 'var(--chrome-gap-compact)',
    padding: 'var(--chrome-padding-y)',
    ...style,
  };

  return (
    <div className={`overlay-grid ${className}`} style={gridStyle}>
      {children}
    </div>
  );
}

/* ============================================================================
 * OverlayRow - Single row with consistent alignment and hover styling
 * ========================================================================== */

interface OverlayRowProps {
  children: ReactNode;
  /** Whether to show alternating background */
  alternate?: boolean;
  /** Whether row is currently selected/active */
  selected?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}

export function OverlayRow({
  children,
  alternate = false,
  selected = false,
  onClick,
  className = '',
  style,
}: OverlayRowProps): React.ReactElement {
  const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: 'var(--chrome-padding-compact-y) var(--chrome-padding-compact-x)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: selected
      ? 'var(--color-background-active)'
      : alternate
        ? 'var(--color-background-alt)'
        : 'transparent',
    gap: 'var(--chrome-gap)',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'background var(--duration-fast) var(--ease-out)',
    ...style,
  };

  const handleMouseEnter = onClick
    ? (e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.backgroundColor = 'var(--color-background-hover)';
      }
    : undefined;

  const handleMouseLeave = onClick
    ? (e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.backgroundColor = selected
          ? 'var(--color-background-active)'
          : alternate
            ? 'var(--color-background-alt)'
            : 'transparent';
      }
    : undefined;

  return (
    <div
      className={`overlay-row ${className}`}
      style={rowStyle}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

/* ============================================================================
 * OverlayKeyValue - Key-value display for data rows
 * ========================================================================== */

interface OverlayKeyValueProps {
  /** Key/label displayed on left */
  label: string;
  /** Value displayed on right */
  value: ReactNode;
  /** Minimum width for key column */
  keyWidth?: string;
  /** Additional CSS classes */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}

export function OverlayKeyValue({
  label,
  value,
  keyWidth = '70px',
  className = '',
  style,
}: OverlayKeyValueProps): React.ReactElement {
  return (
    <div
      className={`overlay-key-value ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--chrome-gap)',
        ...style,
      }}
    >
      <span
        style={{
          color: 'var(--color-accent)',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '0.9rem',
          minWidth: keyWidth,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span style={{ color: 'var(--color-text)', flex: 1 }}>{value}</span>
    </div>
  );
}

/* ============================================================================
 * OverlayBadge - Small contextual badge/tag
 * ========================================================================== */

interface OverlayBadgeProps {
  children: ReactNode;
  /** Variant affects styling */
  variant?: 'default' | 'muted' | 'accent';
  /** Additional CSS classes */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}

export function OverlayBadge({
  children,
  variant = 'default',
  className = '',
  style,
}: OverlayBadgeProps): React.ReactElement {
  const variantStyles: Record<string, CSSProperties> = {
    default: {
      color: 'var(--color-badge-text)',
      backgroundColor: 'var(--color-badge-bg)',
      border: '1px solid var(--color-badge-border)',
    },
    muted: {
      color: 'var(--color-text-muted)',
      backgroundColor: 'var(--color-background)',
      border: '1px solid var(--color-border-light)',
    },
    accent: {
      color: 'var(--color-background)',
      backgroundColor: 'var(--color-accent)',
      border: 'none',
    },
  };

  return (
    <span
      className={`overlay-badge ${className}`}
      style={{
        fontSize: 'var(--badge-font-size)',
        padding: 'var(--badge-padding-y) var(--badge-padding-x)',
        borderRadius: 'var(--badge-radius)',
        flexShrink: 0,
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* ============================================================================
 * OverlayStack - Vertical stack with consistent spacing
 * ========================================================================== */

interface OverlayStackProps {
  children: ReactNode;
  /** Gap size (default: section gap) */
  gap?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}

const gapMap = {
  sm: 'var(--chrome-gap)',
  md: 'var(--overlay-section-gap)',
  lg: 'var(--space-6)',
};

export function OverlayStack({
  children,
  gap = 'md',
  className = '',
  style,
}: OverlayStackProps): React.ReactElement {
  return (
    <div
      className={`overlay-stack ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: gapMap[gap],
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ============================================================================
 * OverlayDescription - Info/description box with consistent styling
 * ========================================================================== */

interface OverlayDescriptionProps {
  children: ReactNode;
  /** Title shown in accent color */
  title?: string;
  /** Additional action element (e.g., InfoButton) */
  action?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}

const descriptionStyle: CSSProperties = {
  padding: 'var(--chrome-padding-x)',
  backgroundColor: 'var(--color-background-alt)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-text-dim)',
  fontSize: '0.9rem',
};

export function OverlayDescription({
  children,
  title,
  action,
  className = '',
  style,
}: OverlayDescriptionProps): React.ReactElement {
  return (
    <div className={`overlay-description ${className}`} style={{ ...descriptionStyle, ...style }}>
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--chrome-gap)', flexWrap: 'wrap', marginBottom: 'var(--chrome-gap-compact)' }}>
          {title && <strong style={{ color: 'var(--color-primary)' }}>{title}</strong>}
          {action}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

/* ============================================================================
 * OverlayStatCard - Single stat display card
 * ========================================================================== */

interface OverlayStatCardProps {
  /** Label shown above the value */
  label: string;
  /** The stat value */
  value: ReactNode;
  /** Label color override (for semantic colors like error/success) */
  labelColor?: string;
  /** Additional CSS classes */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}

const statCardStyle: CSSProperties = {
  textAlign: 'center',
  padding: 'var(--chrome-padding-compact-y) var(--chrome-padding-compact-x)',
  backgroundColor: 'var(--color-background-alt)',
  borderRadius: 'var(--radius-sm)',
};

export function OverlayStatCard({
  label,
  value,
  labelColor,
  className = '',
  style,
}: OverlayStatCardProps): React.ReactElement {
  return (
    <div className={`overlay-stat-card ${className}`} style={{ ...statCardStyle, ...style }}>
      <div style={{ color: labelColor ?? 'var(--color-text-muted)', fontSize: '0.75rem' }}>{label}</div>
      <div style={{ color: 'var(--color-text)', fontFamily: 'var(--font-mono, monospace)' }}>{value}</div>
    </div>
  );
}

/* ============================================================================
 * OverlayStatGrid - Grid of stat cards
 * ========================================================================== */

interface OverlayStatGridProps {
  children: ReactNode;
  /** Number of columns (default: auto based on children count) */
  columns?: number;
  /** Additional CSS classes */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}

export function OverlayStatGrid({
  children,
  columns,
  className = '',
  style,
}: OverlayStatGridProps): React.ReactElement {
  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: columns ? `repeat(${columns}, 1fr)` : 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 'var(--overlay-section-gap)',
    ...style,
  };

  return (
    <div className={`overlay-stat-grid ${className}`} style={gridStyle}>
      {children}
    </div>
  );
}

/* ============================================================================
 * OverlayLoadingState - Consistent loading state wrapper
 * ========================================================================== */

interface OverlayLoadingStateProps {
  /** Loading message for accessibility */
  message?: string;
  /** The skeleton component to render */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}

export function OverlayLoadingState({
  message = 'Loading...',
  children,
  className = '',
  style,
}: OverlayLoadingStateProps): React.ReactElement {
  return (
    <div
      className={`overlay-loading-state ${className}`}
      style={style}
      role="status"
      aria-label={message}
      aria-busy="true"
    >
      {children}
    </div>
  );
}

/* ============================================================================
 * OverlayEmptyState - Consistent empty state messaging
 * ========================================================================== */

interface OverlayEmptyStateProps {
  /** Icon to display (optional) */
  icon?: ReactNode;
  /** Primary message */
  message: string;
  /** Secondary/helper text */
  hint?: string;
  /** Action button/link */
  action?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}

const emptyStateStyle: CSSProperties = {
  textAlign: 'center',
  padding: 'var(--space-8) var(--space-4)',
  color: 'var(--color-text-muted)',
};

export function OverlayEmptyState({
  icon,
  message,
  hint,
  action,
  className = '',
  style,
}: OverlayEmptyStateProps): React.ReactElement {
  return (
    <div className={`overlay-empty-state ${className}`} style={{ ...emptyStateStyle, ...style }}>
      {icon && <div style={{ marginBottom: 'var(--chrome-gap)', fontSize: '2rem', opacity: 0.5 }}>{icon}</div>}
      <div style={{ color: 'var(--color-text-dim)', marginBottom: hint ? 'var(--chrome-gap-compact)' : 0 }}>
        {message}
      </div>
      {hint && <div style={{ fontSize: '0.85rem' }}>{hint}</div>}
      {action && <div style={{ marginTop: 'var(--chrome-gap)' }}>{action}</div>}
    </div>
  );
}

/* ============================================================================
 * OverlayErrorState - Consistent error state messaging
 * ========================================================================== */

interface OverlayErrorStateProps {
  /** Error message */
  message: string;
  /** Error details (optional) */
  details?: string;
  /** Retry action */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}

const errorStateStyle: CSSProperties = {
  textAlign: 'center',
  padding: 'var(--space-6) var(--space-4)',
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-error)',
};

export function OverlayErrorState({
  message,
  details,
  onRetry,
  className = '',
  style,
}: OverlayErrorStateProps): React.ReactElement {
  return (
    <div className={`overlay-error-state ${className}`} style={{ ...errorStateStyle, ...style }}>
      <div style={{ color: 'var(--color-error)', fontWeight: 600, marginBottom: details ? 'var(--chrome-gap-compact)' : 0 }}>
        {message}
      </div>
      {details && <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{details}</div>}
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: 'var(--chrome-gap)',
            padding: 'var(--chrome-padding-compact-y) var(--chrome-padding-x)',
            backgroundColor: 'var(--color-error)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

/* ============================================================================
 * OverlayLegend - Consistent legend row for charts
 * ========================================================================== */

interface OverlayLegendProps {
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}

const legendStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: 'var(--space-8)',
  color: 'var(--color-text-muted)',
  fontSize: '0.85rem',
  flexWrap: 'wrap',
};

export function OverlayLegend({
  children,
  className = '',
  style,
}: OverlayLegendProps): React.ReactElement {
  return (
    <div className={`overlay-legend ${className}`} style={{ ...legendStyle, ...style }}>
      {children}
    </div>
  );
}

/* ============================================================================
 * OverlayLegendItem - Single legend entry
 * ========================================================================== */

interface OverlayLegendItemProps {
  /** Color indicator (e.g., "━" for line, "●" for dot) */
  indicator: ReactNode;
  /** Color for the indicator */
  color: string;
  /** Label text */
  label: string;
  /** Additional action element (e.g., InfoButton) */
  action?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function OverlayLegendItem({
  indicator,
  color,
  label,
  action,
  className = '',
}: OverlayLegendItemProps): React.ReactElement {
  return (
    <span className={`overlay-legend-item ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--chrome-gap-compact)' }}>
      <span style={{ color }}>{indicator}</span>
      <span>{label}</span>
      {action}
    </span>
  );
}
