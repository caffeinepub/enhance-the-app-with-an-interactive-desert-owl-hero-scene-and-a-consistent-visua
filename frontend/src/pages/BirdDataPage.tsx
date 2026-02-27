import { useNavigate } from '@tanstack/react-router';
import BirdDataTable from '../components/BirdDataTable';
import { ArrowRight } from 'lucide-react';

export default function BirdDataPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate({ to: '/' })}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
            العودة للرئيسية
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">بيانات الطيور</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              قاعدة بيانات الطيور المرصودة في محافظة البريمي
            </p>
          </div>
        </div>

        {/* Table */}
        <BirdDataTable />

        {/* Bottom Return Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate({ to: '/' })}
            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors mx-auto"
          >
            <ArrowRight className="h-4 w-4" />
            العودة للرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}
