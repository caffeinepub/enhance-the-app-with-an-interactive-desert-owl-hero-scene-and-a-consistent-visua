import React from 'react';
import { Link } from '@tanstack/react-router';

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
    // Auto-retry once after 3 seconds
    if (this.state.retryCount === 0) {
      this.retryTimer = setTimeout(() => {
        this.setState((prev) => ({
          hasError: false,
          error: null,
          retryCount: prev.retryCount + 1,
        }));
      }, 3000);
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center"
          dir="rtl"
        >
          <div className="text-5xl mb-4">🦉</div>
          <h2 className="text-xl font-bold text-destructive mb-2">
            حدث خطأ أثناء تحميل الواجهة
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            يرجى إعادة المحاولة. إذا استمر الخطأ، يرجى تحديث الصفحة.
          </p>
          {this.state.error && (
            <details className="mb-4 text-xs text-muted-foreground">
              <summary className="cursor-pointer">تفاصيل الخطأ</summary>
              <pre className="mt-2 p-2 bg-muted rounded text-left overflow-auto max-w-sm">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors font-medium"
            >
              إعادة المحاولة
            </button>
            <Link
              to="/"
              className="px-6 py-2 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors font-medium"
            >
              الرئيسية
            </Link>
          </div>
          {this.state.retryCount === 0 && (
            <p className="mt-4 text-xs text-muted-foreground">
              سيتم إعادة المحاولة تلقائياً خلال 3 ثوانٍ...
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
