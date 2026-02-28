import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { RefreshCw, LogIn, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import HamburgerMenu from './HamburgerMenu';

export default function MainHeader() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { login, clear, loginStatus, identity, isLoggingIn } = useInternetIdentity();

  const isAuthenticated = !!identity;

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
      toast.success('تم تسجيل الخروج');
    } else {
      try {
        await login();
      } catch (error: any) {
        if (error?.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        } else {
          toast.error('فشل تسجيل الدخول');
        }
      }
    }
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
    await queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
    await queryClient.invalidateQueries({ queryKey: ['birdNames'] });
    await queryClient.invalidateQueries({ queryKey: ['allLocationsWithNames'] });
    await queryClient.invalidateQueries({ queryKey: ['totalBirdCount'] });
    await queryClient.invalidateQueries({ queryKey: ['totalLocationCount'] });
    await queryClient.invalidateQueries({ queryKey: ['locationCountByBird'] });
    await queryClient.invalidateQueries({ queryKey: ['activeMapReference'] });
    toast.success('تم تحديث جميع البيانات');
  };

  return (
    <header className="sticky top-0 z-40 bg-amber-900 text-white shadow-lg" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Logo & Title */}
        <button
          onClick={() => navigate({ to: '/' })}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <img
            src="/assets/generated/owl-title-image-clean-background.png"
            alt="شعار"
            className="w-10 h-10 object-contain"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="text-right">
            <h1 className="text-base font-bold leading-tight text-amber-100">
              رصد طيور البومة العقاب
            </h1>
            <p className="text-xs text-amber-300 leading-tight">محافظة البريمي - سلطنة عُمان</p>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {[
            { label: 'الرئيسية', to: '/' },
            { label: 'بيانات الطيور', to: '/data' },
            { label: 'معرض الصور', to: '/gallery' },
            { label: 'خريطة المواقع', to: '/map' },
            { label: 'الإحصائيات', to: '/statistics' },
            { label: 'البومة العقاب', to: '/eagle-owl' },
          ].map(link => (
            <button
              key={link.to}
              onClick={() => navigate({ to: link.to })}
              className="px-3 py-1.5 text-sm text-amber-200 hover:text-white hover:bg-amber-700 rounded-md transition-colors"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="border-amber-400 text-amber-200 hover:bg-amber-700 hover:text-white gap-1"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">تحديث</span>
          </Button>

          {/* Auth */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAuth}
            disabled={isLoggingIn}
            className="border-amber-400 text-amber-200 hover:bg-amber-700 hover:text-white gap-1"
          >
            {isLoggingIn ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isAuthenticated ? (
              <LogOut className="w-4 h-4" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span className="hidden sm:inline text-xs">
              {isLoggingIn ? 'جاري...' : isAuthenticated ? 'خروج' : 'دخول'}
            </span>
          </Button>

          {/* Hamburger */}
          <HamburgerMenu />
        </div>
      </div>
    </header>
  );
}
