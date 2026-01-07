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
    gap: gap ?? 'var(--chrome-gap-compact, 0.25rem)',
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
