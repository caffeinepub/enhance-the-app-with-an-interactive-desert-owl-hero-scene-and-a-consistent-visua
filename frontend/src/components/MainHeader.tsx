import { useState, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import HamburgerMenu from './HamburgerMenu';

export default function MainHeader() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const isAuthenticated = !!identity;

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
      navigate({ to: '/' });
    } else {
      setIsLoggingIn(true);
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      } finally {
        setIsLoggingIn(false);
      }
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-md" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Logo & Title */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img
            src="/assets/generated/owl-title-image-clean-background.png"
            alt="شعار البومة"
            className="h-10 w-10 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-primary leading-tight">أطلس طيور البريمي</h1>
            <p className="text-xs text-muted-foreground">مشروع المسح الميداني</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          <Link
            to="/"
            className="px-3 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-foreground"
          >
            الرئيسية
          </Link>
          <Link
            to="/data"
            className="px-3 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-foreground"
          >
            البيانات
          </Link>
          <Link
            to="/gallery"
            className="px-3 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-foreground"
          >
            المعرض
          </Link>
          <Link
            to="/map"
            className="px-3 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-foreground"
          >
            الخريطة
          </Link>
          <Link
            to="/statistics"
            className="px-3 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-foreground"
          >
            الإحصائيات
          </Link>
          <Link
            to="/eagle-owl"
            className="px-3 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-foreground"
          >
            البومة العقاب
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            title="تحديث البيانات"
          >
            <img
              src="/assets/generated/refresh-icon-transparent.dim_32x32.png"
              alt="تحديث"
              className="h-5 w-5 object-contain"
              onError={(e) => {
                const btn = e.currentTarget.parentElement;
                if (btn) btn.innerHTML = '🔄';
              }}
            />
          </button>

          {/* Auth Button */}
          <button
            onClick={handleAuth}
            disabled={loginStatus === 'logging-in' || isLoggingIn}
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors disabled:opacity-50 ${
              isAuthenticated
                ? 'bg-muted hover:bg-muted/80 text-muted-foreground'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
          >
            {loginStatus === 'logging-in' || isLoggingIn
              ? 'جاري الدخول...'
              : isAuthenticated
              ? 'تسجيل الخروج'
              : 'تسجيل الدخول'}
          </button>

          {/* Hamburger Menu */}
          <HamburgerMenu />
        </div>
      </div>
    </header>
  );
}
