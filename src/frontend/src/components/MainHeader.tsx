import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Menu, Map, Database, BarChart3, Users, Settings, Home, Camera, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useManualDataRefresh } from '../hooks/useQueries';
import { REQUIRED_ASSETS } from '../lib/requiredAssets';

export default function MainHeader() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Manual data refresh mutation
  const manualRefreshMutation = useManualDataRefresh();

  const menuItems = [
    { label: 'الصفحة الرئيسية', icon: Home, path: '/' },
    { label: 'مواقع انتشار البوم', icon: Map, path: '/eagle-owl' },
    { label: 'معرض الصور', icon: Camera, path: '/gallery' },
    { label: 'البيانات', icon: Database, path: '/data-table' },
    { label: 'الإحصائيات', icon: BarChart3, path: '/statistics' },
    { label: 'فريق العمل', icon: Users, path: '/team-data' },
  ];

  if (isAuthenticated) {
    menuItems.push({ label: 'مدير الموقع', icon: Settings, path: '/permission-management' });
  }

  const handleNavigate = (path: string) => {
    navigate({ to: path });
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleManualRefresh = () => {
    manualRefreshMutation.mutate();
  };

  return (
    <>
      <header className="bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-700 text-white shadow-lg sticky top-0 z-50" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-5 cursor-pointer" onClick={() => handleNavigate('/')}>
              <img 
                src={REQUIRED_ASSETS.OWL_LOGO}
                alt="البومة" 
                className="h-16 w-16 object-contain"
              />
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
                طيور البوم في محافظة البريمي
              </h1>
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center gap-3">
              {/* Manual Refresh Button */}
              <Button
                onClick={handleManualRefresh}
                disabled={manualRefreshMutation.isPending}
                variant="ghost"
                size="lg"
                className="text-white hover:bg-white/20 font-bold px-4 py-3 flex items-center gap-2"
                title="تحديث البيانات يدوياً"
                aria-label="تحديث البيانات"
              >
                <RefreshCw className={`h-6 w-6 ${manualRefreshMutation.isPending ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">تحديث</span>
              </Button>

              {/* Hamburger Menu Button */}
              <Button
                onClick={toggleMenu}
                variant="ghost"
                size="lg"
                className="text-white hover:bg-white/20 font-bold text-2xl px-6 py-4"
                aria-label={isMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? (
                  <X className="h-8 w-8 ml-3" />
                ) : (
                  <Menu className="h-8 w-8 ml-3" />
                )}
                <span className="hidden sm:inline">القائمة</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Slide-in Menu Overlay */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
            onClick={closeMenu}
            aria-hidden="true"
          />
          
          {/* Menu Panel */}
          <div 
            className="fixed top-0 right-0 h-full w-80 bg-gradient-to-b from-amber-700 to-amber-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out"
            dir="rtl"
          >
            {/* Menu Header */}
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">القائمة</h2>
                <Button
                  onClick={closeMenu}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                  aria-label="إغلاق القائمة"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </div>

            {/* Menu Items */}
            <nav className="p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className="w-full flex items-center gap-4 px-6 py-4 text-white hover:bg-white/20 rounded-lg transition-colors duration-200 text-right font-medium text-lg"
                  >
                    <Icon className="h-6 w-6" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
