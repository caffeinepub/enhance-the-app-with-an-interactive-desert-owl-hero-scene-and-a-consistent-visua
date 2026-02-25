import { useNavigate } from '@tanstack/react-router';
import BirdDataTable from '../components/BirdDataTable';

export default function BirdDataPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background" dir="rtl">
      {/* Page Header */}
      <section className="bg-gradient-to-b from-primary/10 via-background to-background py-10 px-4 border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐦</span>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground font-arabic">
              بيانات الطيور
            </h1>
          </div>
          <button
            onClick={() => navigate({ to: '/' })}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-arabic text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <span>🏠</span>
            <span>العودة للرئيسية</span>
          </button>
        </div>
      </section>

      {/* Bird Data Table */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <BirdDataTable />
        </div>
      </section>

      {/* Bottom Return Button */}
      <div className="py-8 px-4 flex justify-center">
        <button
          onClick={() => navigate({ to: '/' })}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-arabic text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
        >
          <span>🏠</span>
          <span>العودة للرئيسية</span>
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-6 px-4 mt-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-foreground/60 text-sm font-arabic mb-2">
            © {new Date().getFullYear()} مواقع انتشار البوم بمحافظة البريمي
          </p>
          <p className="text-foreground/50 text-xs">
            Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'unknown-app')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
