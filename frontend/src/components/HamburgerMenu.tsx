import { useState, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Menu, X, Home, BarChart2, Map, Image, Database, Bird, Lock } from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'الرئيسية', path: '/', icon: <Home className="w-5 h-5" /> },
  { label: 'بيانات الطيور', path: '/data', icon: <Database className="w-5 h-5" /> },
  { label: 'معرض الصور', path: '/gallery', icon: <Image className="w-5 h-5" /> },
  { label: 'خريطة المواقع', path: '/map', icon: <Map className="w-5 h-5" /> },
  { label: 'الإحصائيات', path: '/statistics', icon: <BarChart2 className="w-5 h-5" /> },
  { label: 'البومة العقاب', path: '/eagle-owl', icon: <Bird className="w-5 h-5" /> },
  { label: 'الصلاحيات', path: '/permissions', icon: <Lock className="w-5 h-5" /> },
];

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleNavigation = (path: string) => {
    navigate({ to: path });
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
        aria-label="القائمة"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute left-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
          dir="rtl"
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted hover:text-primary transition-colors text-right"
            >
              <span className="text-muted-foreground">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
