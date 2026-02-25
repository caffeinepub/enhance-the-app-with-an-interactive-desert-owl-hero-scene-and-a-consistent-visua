import { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { X } from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'البيانات', path: '/data', icon: '🐦' },
  { label: 'معرض الصور', path: '/gallery', icon: '🖼️' },
  { label: 'المواقع', path: '/map', icon: '🗺️' },
  { label: 'الاحصائيات', path: '/statistics', icon: '📊' },
];

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleNavClick = (item: NavItem) => {
    setIsOpen(false);
    navigate({ to: item.path as '/' });
  };

  return (
    <div ref={menuRef} className="relative" dir="rtl">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-foreground" />
        ) : (
          <img
            src="/assets/generated/hamburger-menu-icon-transparent.dim_32x32.png"
            alt="القائمة"
            className="w-6 h-6 object-contain"
            onError={(e) => {
              // Fallback to lucide icon if image fails
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`;
              }
            }}
          />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop overlay for mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] lg:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <div
            role="menu"
            aria-label="قائمة التنقل"
            className="absolute top-full right-0 mt-2 w-52 z-50 rounded-xl border border-border bg-card shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
          >
            {/* Menu Header */}
            <div className="px-4 py-2.5 border-b border-border bg-primary/5">
              <p className="text-xs font-bold text-primary font-arabic tracking-wide">القائمة الرئيسية</p>
            </div>

            {/* Nav Items */}
            <nav className="py-1.5">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  role="menuitem"
                  onClick={() => handleNavClick(item)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-arabic text-foreground/80 hover:text-foreground hover:bg-accent transition-colors text-right"
                >
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
