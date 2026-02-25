import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Automatic retry after 3 seconds (only once)
    if (this.state.retryCount === 0) {
      this.retryTimeout = setTimeout(() => {
        this.handleRetry();
      }, 3000);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  handleRetry = () => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4" dir="rtl">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
            <Alert className="border-2 border-red-400 bg-red-50 mb-6">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <AlertDescription className="text-red-900 font-bold text-xl">
                حدث خطأ أثناء تحميل الواجهة، يرجى إعادة المحاولة
              </AlertDescription>
            </Alert>

            <div className="space-y-4 mb-6">
              <p className="text-gray-700 text-lg font-medium">
                عذراً، حدث خطأ غير متوقع أثناء عرض هذه الصفحة. نحن نعمل على إصلاح المشكلة.
              </p>
              
              {this.state.retryCount === 0 && (
                <p className="text-blue-600 text-base">
                  ⏳ سيتم إعادة المحاولة تلقائياً خلال 3 ثوانٍ...
                </p>
              )}

              {this.state.error && (
                <details className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <summary className="cursor-pointer text-gray-700 font-medium mb-2">
                    تفاصيل الخطأ التقنية
                  </summary>
                  <pre className="text-xs text-gray-600 overflow-auto max-h-40 mt-2 p-2 bg-white rounded">
                    {this.state.error.toString()}
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={this.handleRetry}
                size="lg"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                <RefreshCw className="h-5 w-5 ml-2" />
                إعادة المحاولة الآن
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                size="lg"
                className="flex-1 border-2 border-gray-300 hover:bg-gray-100 font-bold"
              >
                <Home className="h-5 w-5 ml-2" />
                العودة للصفحة الرئيسية
              </Button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                💡 <strong>نصيحة:</strong> إذا استمرت المشكلة، حاول تحديث الصفحة أو مسح ذاكرة التخزين المؤقت للمتصفح.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
