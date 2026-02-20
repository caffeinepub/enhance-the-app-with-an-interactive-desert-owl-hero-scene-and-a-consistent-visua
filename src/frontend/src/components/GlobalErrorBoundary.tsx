import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Global Error Boundary - Catches all unhandled errors at the root level
 * Prevents white screen by showing a friendly Arabic error message
 */
class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[GlobalErrorBoundary] Caught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    // Clear all caches and reload
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch (e) {
      console.error('[GlobalErrorBoundary] Cache clear error:', e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div 
          style={{
            minHeight: '100vh',
            background: 'linear-gradient(to bottom right, #fef2f2, #fed7aa)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            direction: 'rtl',
          }}
        >
          <div 
            style={{
              maxWidth: '600px',
              width: '100%',
              background: 'white',
              borderRadius: '1rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              padding: '2rem',
            }}
          >
            <div 
              style={{
                background: 'linear-gradient(to right, #fee2e2, #fed7aa)',
                border: '2px solid #f87171',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <AlertCircle 
                style={{
                  width: '1.5rem',
                  height: '1.5rem',
                  color: '#dc2626',
                  flexShrink: 0,
                }}
              />
              <div style={{ color: '#7f1d1d', fontWeight: 'bold', fontSize: '1.25rem' }}>
                ⚠️ حدث خطأ أثناء تحميل التطبيق
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: '#374151', fontSize: '1.125rem', marginBottom: '1rem', lineHeight: '1.75' }}>
                عذراً، حدث خطأ غير متوقع منع التطبيق من العمل بشكل صحيح. يرجى إعادة تحميل الصفحة.
              </p>

              {this.state.error && (
                <details 
                  style={{
                    background: '#f3f4f6',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    marginTop: '1rem',
                  }}
                >
                  <summary 
                    style={{
                      cursor: 'pointer',
                      color: '#4b5563',
                      fontWeight: '500',
                      marginBottom: '0.5rem',
                    }}
                  >
                    تفاصيل الخطأ التقنية
                  </summary>
                  <pre 
                    style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      overflow: 'auto',
                      maxHeight: '200px',
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      background: 'white',
                      borderRadius: '0.25rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {this.state.error.toString()}
                    {this.state.errorInfo && '\n\n' + this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <button
              onClick={this.handleReload}
              style={{
                width: '100%',
                background: 'linear-gradient(to right, #2563eb, #1d4ed8)',
                color: 'white',
                padding: '0.875rem 1.5rem',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1.125rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #1d4ed8, #1e40af)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #2563eb, #1d4ed8)';
              }}
            >
              <RefreshCw style={{ width: '1.25rem', height: '1.25rem' }} />
              إعادة تحميل التطبيق
            </button>

            <div 
              style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: '#dbeafe',
                borderRadius: '0.5rem',
                border: '1px solid #93c5fd',
              }}
            >
              <p style={{ fontSize: '0.875rem', color: '#1e40af' }}>
                💡 <strong>نصيحة:</strong> إذا استمرت المشكلة بعد إعادة التحميل، حاول:
              </p>
              <ul style={{ fontSize: '0.875rem', color: '#1e40af', marginTop: '0.5rem', marginRight: '1.5rem' }}>
                <li>مسح ذاكرة التخزين المؤقت للمتصفح</li>
                <li>استخدام متصفح آخر</li>
                <li>التحقق من اتصال الإنترنت</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
