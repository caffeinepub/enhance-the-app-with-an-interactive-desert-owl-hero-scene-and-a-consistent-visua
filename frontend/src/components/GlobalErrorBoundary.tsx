import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class GlobalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('GlobalErrorBoundary caught:', error, info);
  }

  handleReload = () => {
    try {
      sessionStorage.clear();
      localStorage.removeItem('splashSeen');
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#fef3c7',
            fontFamily: 'Arial, sans-serif',
            direction: 'rtl',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🦉</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#92400e', marginBottom: '0.5rem' }}>
            حدث خطأ غير متوقع
          </h1>
          <p style={{ color: '#78350f', marginBottom: '1.5rem', maxWidth: '400px' }}>
            نعتذر عن هذا الخطأ. يرجى إعادة تحميل الصفحة للمتابعة.
          </p>
          {this.state.error && (
            <details style={{ marginBottom: '1.5rem', color: '#92400e', fontSize: '0.8rem' }}>
              <summary style={{ cursor: 'pointer' }}>تفاصيل الخطأ</summary>
              <pre style={{ textAlign: 'left', marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#fde68a', borderRadius: '4px', overflow: 'auto', maxWidth: '500px' }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleReload}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#d97706',
              color: 'white',
              border: 'none',
              borderRadius: '9999px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            إعادة التحميل
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
