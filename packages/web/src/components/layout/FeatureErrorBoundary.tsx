/**
 * FeatureErrorBoundary: Lightweight error boundary for feature islands.
 *
 * Unlike the full-page ErrorBoundary, this displays an in-place compact error
 * that doesn't disrupt the rest of the app. Designed for use around:
 * - 3D viewer panel
 * - Sequence view canvas
 * - Analysis sidebars
 * - Complex visualizations
 *
 * Features:
 * - Compact inline error display
 * - "Try again" button
 * - Optional expandable details (DEV only by default)
 * - No telemetry
 *
 * @example
 * ```tsx
 * <FeatureErrorBoundary name="3D Viewer">
 *   <Model3DView />
 * </FeatureErrorBoundary>
 * ```
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { IconAlertTriangle, IconChevronDown } from '../ui';

interface Props {
  children: ReactNode;
  /** Feature name shown in error message (e.g., "3D Viewer") */
  name: string;
  /** Custom fallback content */
  fallback?: ReactNode | ((args: { error: Error | null; reset: () => void }) => ReactNode);
  /** Whether to show details in production (default: false) */
  showDetailsInProd?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  detailsExpanded: boolean;
}

export class FeatureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      detailsExpanded: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error(`[FeatureErrorBoundary:${this.props.name}] Uncaught error:`, error, errorInfo);
    }
    this.setState({ errorInfo });
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      detailsExpanded: false,
    });
  };

  toggleDetails = (): void => {
    this.setState(prev => ({ detailsExpanded: !prev.detailsExpanded }));
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, detailsExpanded } = this.state;
    const { children, name, fallback, showDetailsInProd } = this.props;

    if (!hasError) {
      return children;
    }

    if (fallback) {
      if (typeof fallback === 'function') {
        return fallback({ error, reset: this.handleRetry });
      }
      return fallback;
    }

    const showDetails = import.meta.env.DEV || showDetailsInProd;
    const errorMessage = error?.message ?? 'An unexpected error occurred';

    return (
      <div className="feature-error" role="alert">
        <div className="feature-error__content">
          <IconAlertTriangle className="feature-error__icon" size={20} aria-hidden="true" />
          <div className="feature-error__text">
            <span className="feature-error__title">{name} unavailable</span>
            <span className="feature-error__message">{errorMessage}</span>
          </div>
        </div>

        <div className="feature-error__actions">
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={this.handleRetry}
          >
            Try again
          </button>

          {showDetails && (
            <button
              type="button"
              className="btn btn-sm btn-ghost feature-error__toggle"
              onClick={this.toggleDetails}
              aria-expanded={detailsExpanded}
            >
              Details
              <IconChevronDown
                size={14}
                style={{
                  transform: detailsExpanded ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease',
                }}
              />
            </button>
          )}
        </div>

        {showDetails && detailsExpanded && (
          <pre className="feature-error__details">
            {formatFeatureErrorDetails(error, errorInfo)}
          </pre>
        )}
      </div>
    );
  }
}

function formatFeatureErrorDetails(error: Error | null, errorInfo: ErrorInfo | null): string {
  const parts: string[] = [];

  if (error) {
    parts.push(error.stack ?? error.toString());
  }

  const componentStack = errorInfo?.componentStack?.trim();
  if (componentStack) {
    parts.push(`Component stack:\n${componentStack}`);
  }

  return parts.length > 0 ? parts.join('\n\n') : 'No details available';
}

export default FeatureErrorBoundary;
