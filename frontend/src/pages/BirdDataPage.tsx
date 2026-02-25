import { Link } from '@tanstack/react-router';
import BirdDataTable from '../components/BirdDataTable';

export default function BirdDataPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">بيانات الطيور</h1>
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
          >
            <span>←</span>
            <span>العودة للرئيسية</span>
          </Link>
        </div>

        {/* Data Table */}
        <BirdDataTable />

        {/* Bottom Return Button */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors font-medium"
          >
            <span>←</span>
            <span>العودة للرئيسية</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
