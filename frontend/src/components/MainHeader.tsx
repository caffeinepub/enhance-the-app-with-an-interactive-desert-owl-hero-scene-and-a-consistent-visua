import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { RefreshCw, LogIn, LogOut, Shield } from 'lucide-react';
import HamburgerMenu from './HamburgerMenu';

const ADMIN_PRINCIPAL = '5uylz-j7fcd-isj73-gp57f-xwwyy-po2ib-7iboa-fdkdv-nrsam-3bd3r-qqe';

export default function MainHeader() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';
  const currentPrincipal = identity?.getPrincipal().toString();
  const isAdmin = currentPrincipal === ADMIN_PRINCIPAL;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        const err = error as Error;
        if (err?.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const desktopNavLinks = [
    { label: 'الرئيسية', path: '/', icon: '🏠' },
    { label: 'معرض الصور', path: '/gallery', icon: '🖼️' },
    { label: 'خريطة المواقع', path: '/map', icon: '🗺️' },
    { label: 'بوم العقاب', path: '/eagle-owl', icon: '🦉' },
    { label: 'الإحصائيات', path: '/statistics', icon: '📊' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo & Title */}
        <button
          onClick={() => navigate({ to: '/' })}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-shrink-0"
        >
          <img
            src="/assets/generated/realistic-owl-perfect-transparent-clean.dim_400x400.png"
            alt="شعار"
            className="w-10 h-10 object-contain owl-transparent"
          />
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold text-foreground font-arabic leading-tight">مواقع انتشار البوم</p>
            <p className="text-xs text-primary font-arabic">بمحافظة البريمي</p>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {desktopNavLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate({ to: link.path as '/' })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-arabic text-foreground/80 hover:text-foreground hover:bg-accent transition-colors"
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </button>
          ))}
          {isAdmin && (
            <button
              onClick={() => navigate({ to: '/permissions' })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-arabic text-primary hover:bg-primary/10 transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>الصلاحيات</span>
            </button>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg hover:bg-accent transition-colors text-foreground/70 hover:text-foreground"
            title="تحديث البيانات"
            aria-label="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Auth Button */}
          <button
            onClick={handleAuth}
            disabled={isLoggingIn}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-arabic font-medium transition-colors ${
              isAuthenticated
                ? 'bg-muted hover:bg-muted/80 text-foreground'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            } disabled:opacity-50`}
          >
            {isLoggingIn ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isAuthenticated ? (
              <LogOut className="w-4 h-4" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isLoggingIn ? 'جاري الدخول...' : isAuthenticated ? 'خروج' : 'دخول'}
            </span>
          </button>

          {/* Hamburger Menu - always visible, contains main nav links */}
          <HamburgerMenu />
        </div>
      </div>
    </header>
  );
}
