import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, componentStack: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, componentStack: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Unhandled error:', error.message, errorInfo.componentStack);
    this.setState({ componentStack: errorInfo.componentStack ?? null });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.scrollTo(0, 0);
    this.props.onReset?.();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <div className="max-w-md w-full text-center">
            {/* Error icon */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-5">
              <AlertTriangle size={32} className="text-red-500" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-extrabold text-text-primary font-display mb-2">
              Something went wrong
            </h2>

            {/* Message */}
            <p className="text-sm text-text-secondary font-body mb-2 max-w-sm mx-auto">
              An unexpected error occurred. This has been logged and we recommend reloading the page.
            </p>

            {/* Error detail (collapsible) */}
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-xs text-text-tertiary font-body cursor-pointer hover:text-text-secondary transition-colors">
                  Error details
                </summary>
                <pre className="mt-2 p-3 rounded-xl bg-bg-section-alt border border-border-default text-xs text-text-secondary font-mono overflow-auto max-h-48 whitespace-pre-wrap">
{`message: ${this.state.error.message}\n\nstack:\n${this.state.error.stack ?? ''}\n\ncomponentStack:${this.state.componentStack ?? ''}`}
                </pre>
              </details>
            )}

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border border-border-default bg-white text-text-primary hover:bg-gray-50 transition-all font-display"
              >
                <RefreshCw size={16} />
                Try again
              </button>
              <button
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl bg-brand-primary text-white hover:bg-brand-primary-dark transition-all font-display"
              >
                <Home size={16} />
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
