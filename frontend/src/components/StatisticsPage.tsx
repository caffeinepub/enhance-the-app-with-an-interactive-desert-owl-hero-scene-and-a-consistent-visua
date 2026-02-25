import { Link } from '@tanstack/react-router';
import { useGetTotalBirdCount, useGetTotalLocationCount, useGetLocationCountByBird, useGetAllBirdData } from '../hooks/useQueries';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StatisticsPage() {
  const { data: totalBirds } = useGetTotalBirdCount();
  const { data: totalLocations } = useGetTotalLocationCount();
  const { data: locationCounts } = useGetLocationCountByBird();
  const { data: allBirdData, isLoading } = useGetAllBirdData();

  const chartData = (locationCounts || [])
    .map(([name, count]) => ({ name, count: Number(count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return (
    <main dir="rtl" className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">الإحصائيات</h1>
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
          >
            <span>←</span>
            <span>الرئيسية</span>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-primary mb-2">
              {totalBirds !== undefined ? Number(totalBirds) : '...'}
            </div>
            <p className="text-muted-foreground font-medium">إجمالي أنواع الطيور</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-secondary-foreground mb-2">
              {totalLocations !== undefined ? Number(totalLocations) : '...'}
            </div>
            <p className="text-muted-foreground font-medium">إجمالي مواقع الرصد</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-amber-600 mb-2">
              {allBirdData ? allBirdData.filter(([, b]) => b.audioFile).length : '...'}
            </div>
            <p className="text-muted-foreground font-medium">طيور بملفات صوتية</p>
          </div>
        </div>

        {/* Bar Chart */}
        {chartData.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">مواقع الرصد لكل طائر</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <Tooltip
                  formatter={(value: number) => [value, 'عدد المواقع']}
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    direction: 'rtl',
                  }}
                />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-xl font-bold text-foreground">تفاصيل البيانات</h2>
          </div>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {['#', 'الاسم العربي', 'الاسم العلمي', 'عدد المواقع', 'الصور', 'الصوت'].map((h) => (
                      <th key={h} className="px-4 py-3 text-right font-semibold text-foreground border-b border-border">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(allBirdData || []).map(([key, bird], index) => (
                    <tr key={key} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{bird.arabicName}</td>
                      <td className="px-4 py-3 text-muted-foreground italic">{bird.scientificName || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 bg-primary/10 text-primary rounded-full text-xs font-bold">
                          {bird.locations?.length || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{bird.subImages?.length || 0}</td>
                      <td className="px-4 py-3 text-center">
                        {bird.audioFile ? '🔊' : '🔇'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bottom Return */}
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
