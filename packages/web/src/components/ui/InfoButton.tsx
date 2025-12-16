import React from 'react';
import { Tooltip } from './Tooltip';

export type InfoButtonSize = 'sm' | 'md';

export interface InfoButtonProps {
  tooltip?: React.ReactNode;
  label?: string;
  onClick?: () => void;
  size?: InfoButtonSize;
  disabled?: boolean;
  className?: string;
}

export function InfoButton({
  tooltip,
  label = 'More info',
  onClick,
  size = 'md',
  disabled,
  className = '',
}: InfoButtonProps): React.ReactElement {
  const button = (
    <button
      type="button"
      className={`info-button ${size === 'sm' ? 'info-button--sm' : ''} ${className}`.trim()}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      <span aria-hidden>i</span>
    </button>
  );

  if (tooltip) {
    return (
      <Tooltip content={tooltip} position="top" className="info-button__tooltip">
        {button}
      </Tooltip>
    );
  }

  return button;
}

export default InfoButton;
