import { useState, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Menu, X, Home, Database, Image, Map, BarChart2, Bird, Shield } from 'lucide-react';

const navItems = [
  { label: 'الرئيسية', path: '/', icon: Home },
  { label: 'بيانات الطيور', path: '/data', icon: Database },
  { label: 'معرض الصور', path: '/gallery', icon: Image },
  { label: 'خريطة المواقع', path: '/map', icon: Map },
  { label: 'الإحصائيات', path: '/statistics', icon: BarChart2 },
  { label: 'البومة العقاب', path: '/eagle-owl', icon: Bird },
  { label: 'الصلاحيات', path: '/permissions', icon: Shield },
];

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md hover:bg-accent transition-colors text-foreground"
        aria-label="القائمة"
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-right hover:bg-accent hover:text-accent-foreground transition-colors text-foreground border-b border-border/50 last:border-0"
              >
                <Icon className="h-4 w-4 flex-shrink-0 text-primary" />
                <span className="flex-1 text-right">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
