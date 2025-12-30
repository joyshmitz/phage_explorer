import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { DEFAULT_THEME } from '../../theme/themes';
import { IconAlertTriangle } from '../ui';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
    // Here we could log to telemetry service
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private openExternal(url: string): void {
    // Prevent reverse tabnabbing (window.opener) when opening external sites.
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (opened) opened.opener = null;
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const colors = DEFAULT_THEME.colors;

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: colors.background,
            color: colors.text,
            fontFamily: 'monospace',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              border: `2px solid ${colors.error}`,
              borderRadius: '8px',
              padding: '2rem',
              maxWidth: '600px',
              backgroundColor: colors.backgroundAlt,
              boxShadow: `0 0 20px ${colors.shadow}`,
            }}
          >
            <div style={{ marginBottom: '1rem', color: colors.error }} aria-hidden="true">
              <IconAlertTriangle size={48} />
            </div>
            <h1 style={{ color: colors.error, marginBottom: '1rem' }}>System Failure</h1>
            <p style={{ marginBottom: '1.5rem', color: colors.textDim }}>
              The application encountered an unexpected error.
            </p>
            
            {this.state.error && (
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.3)',
                padding: '1rem',
                borderRadius: '4px',
                marginBottom: '1.5rem',
                textAlign: 'left',
                overflowX: 'auto',
                borderLeft: `3px solid ${colors.error}`,
              }}>
                <code style={{ color: colors.text }}>
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: colors.primary,
                  color: '#000',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Reload Application
              </button>
              <button
                type="button"
                onClick={() => this.openExternal('https://github.com/Dicklesworthstone/phage_explorer/issues')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: colors.accent,
                  border: `1px solid ${colors.accent}`,
                  borderRadius: '4px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
              >
                Report Bug
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
