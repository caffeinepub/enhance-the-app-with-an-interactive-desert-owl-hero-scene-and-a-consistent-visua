import { useNavigate } from '@tanstack/react-router';
import { Home } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useGetTotalBirdCount, useGetTotalLocationCount, useGetLocationCountByBird } from '../hooks/useQueries';

export default function StatisticsPage() {
  const navigate = useNavigate();
  const { data: totalBirds } = useGetTotalBirdCount();
  const { data: totalLocations } = useGetTotalLocationCount();
  const { data: locationCounts } = useGetLocationCountByBird();

  const chartData = locationCounts?.map(([name, count]) => ({
    name: name.length > 10 ? name.substring(0, 10) + '...' : name,
    fullName: name,
    count: Number(count),
  })).sort((a, b) => b.count - a.count).slice(0, 15) ?? [];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate({ to: '/' })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors font-arabic text-sm"
          >
            <Home className="w-4 h-4" />
            <span>الرئيسية</span>
          </button>
          <h1 className="text-xl font-bold text-foreground font-arabic">الإحصائيات</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <div className="text-5xl font-bold text-primary mb-2">
              {totalBirds !== undefined ? Number(totalBirds) : '—'}
            </div>
            <p className="text-foreground/60 font-arabic text-lg">إجمالي الطيور الموثقة</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <div className="text-5xl font-bold text-primary mb-2">
              {totalLocations !== undefined ? Number(totalLocations) : '—'}
            </div>
            <p className="text-foreground/60 font-arabic text-lg">إجمالي مواقع الرصد</p>
          </div>
        </div>

        {/* Bar Chart */}
        {chartData.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-foreground font-arabic mb-6">مواقع الرصد لكل نوع</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    tick={{ fontSize: 11, fontFamily: 'inherit' }}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => [value, 'عدد المواقع']}
                    contentStyle={{ fontFamily: 'inherit', direction: 'rtl' }}
                  />
                  <Bar dataKey="count" fill="oklch(0.55 0.15 75)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Data Table */}
        {locationCounts && locationCounts.length > 0 && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground font-arabic">تفاصيل المواقع</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-right font-arabic text-foreground/70">#</th>
                    <th className="px-4 py-3 text-right font-arabic text-foreground/70">اسم الطائر</th>
                    <th className="px-4 py-3 text-right font-arabic text-foreground/70">عدد المواقع</th>
                    <th className="px-4 py-3 text-right font-arabic text-foreground/70">التفاصيل</th>
                  </tr>
                </thead>
                <tbody>
                  {[...locationCounts]
                    .sort((a, b) => Number(b[1]) - Number(a[1]))
                    .map(([name, count], idx) => (
                      <tr key={name} className="border-t border-border hover:bg-muted/50">
                        <td className="px-4 py-3 text-foreground/60">{idx + 1}</td>
                        <td className="px-4 py-3 font-arabic text-foreground">{name}</td>
                        <td className="px-4 py-3 text-primary font-semibold">{Number(count)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigate({ to: '/bird/$name', params: { name } })}
                            className="text-xs px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-arabic transition-colors"
                          >
                            عرض
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Return to Home */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate({ to: '/' })}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-arabic font-semibold hover:bg-primary/90 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>العودة إلى الرئيسية</span>
          </button>
        </div>
      </div>
    </div>
  );
}
