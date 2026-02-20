import { useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, MapPin, Bird, Download, Home } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useGetLocationCountByBird, useTotalStatistics, useForcedDataSync } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

// Custom X-axis tick component with improved Arabic text rendering
const CustomXAxisTick = ({ x, y, payload }: any) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="middle"
        fill="#374151"
        fontSize="14"
        fontWeight="600"
        style={{ 
          letterSpacing: '0.5px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        {payload.value}
      </text>
    </g>
  );
};

export default function StatisticsPage() {
  const navigate = useNavigate();
  
  // Force data synchronization on mount to ensure fresh data
  useForcedDataSync();
  
  const { data: locationCountData, isLoading: isLoadingLocationCount } = useGetLocationCountByBird();
  const { totalBirds, totalLocations, isLoading: isLoadingTotals } = useTotalStatistics();

  const isLoading = isLoadingLocationCount || isLoadingTotals;

  const chartData = locationCountData?.map(([name, count]) => ({
    name,
    count: Number(count),
  })) || [];

  const handleDownloadChart = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 800;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('توزيع الأنواع حسب عدد المواقع', canvas.width / 2, 40);

    const barWidth = 80;
    const barSpacing = 20;
    const startX = 100;
    const startY = 650;
    const maxHeight = 500;
    const maxCount = Math.max(...chartData.map(d => d.count), 1);

    chartData.forEach((item, index) => {
      const barHeight = (item.count / maxCount) * maxHeight;
      const x = startX + index * (barWidth + barSpacing);
      const y = startY - barHeight;

      ctx.fillStyle = COLORS[index % COLORS.length];
      ctx.fillRect(x, y, barWidth, barHeight);

      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.count.toString(), x + barWidth / 2, y - 10);

      ctx.save();
      ctx.translate(x + barWidth / 2, startY + 20);
      ctx.rotate(-Math.PI / 4);
      ctx.font = '14px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(item.name, 0, 0);
      ctx.restore();
    });

    const link = document.createElement('a');
    link.download = `bird-species-distribution-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleBackToHome = () => {
    navigate({ to: '/' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">جاري تحميل الإحصائيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4 sm:p-6 lg:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">الإحصائيات والتحليلات</h1>
            <p className="text-gray-600 text-lg">تحليل شامل لبيانات توزيع الطيور في محافظة البريمي</p>
          </div>
          <button
            onClick={handleBackToHome}
            className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            title="عودة إلى الصفحة الرئيسية"
            aria-label="عودة إلى الصفحة الرئيسية"
          >
            <Home className="h-6 w-6" />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl hover:shadow-2xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-xl">
                <Bird className="h-6 w-6 ml-2" />
                إجمالي الأنواع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold">{Number(totalBirds)}</p>
              <p className="text-blue-100 mt-2">نوع من الطيور</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl hover:shadow-2xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-xl">
                <MapPin className="h-6 w-6 ml-2" />
                إجمالي المواقع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold">{Number(totalLocations)}</p>
              <p className="text-green-100 mt-2">موقع مسجل</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl hover:shadow-2xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-xl">
                <TrendingUp className="h-6 w-6 ml-2" />
                متوسط المواقع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold">
                {Number(totalBirds) > 0 ? (Number(totalLocations) / Number(totalBirds)).toFixed(1) : '0'}
              </p>
              <p className="text-purple-100 mt-2">موقع لكل نوع</p>
            </CardContent>
          </Card>
        </div>

        {/* Bar Chart */}
        <Card className="mb-8 shadow-xl">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-green-50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-gray-900">
                توزيع الأنواع حسب عدد المواقع
              </CardTitle>
              <Button
                onClick={handleDownloadChart}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 hover:bg-blue-50"
              >
                <Download className="h-4 w-4" />
                تحميل الرسم البياني
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={500}>
              <BarChart 
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  interval={0}
                  tick={<CustomXAxisTick />}
                />
                <YAxis 
                  label={{ 
                    value: 'عدد المواقع', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { 
                      fontSize: '16px', 
                      fontWeight: 'bold',
                      fill: '#374151',
                      letterSpacing: '0.5px'
                    }
                  }}
                  tick={{ 
                    fontSize: 14, 
                    fontWeight: 600,
                    fill: '#374151'
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff',
                    border: '2px solid #3b82f6',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    padding: '12px'
                  }}
                  labelStyle={{ 
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: '#1f2937',
                    letterSpacing: '0.5px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ 
                    fontSize: '16px', 
                    fontWeight: 'bold',
                    paddingTop: '20px',
                    letterSpacing: '0.5px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  name="عدد المواقع" 
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="shadow-xl">
          <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="text-2xl font-bold text-gray-900">
              النسبة المئوية لتوزيع المواقع
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={600}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={200}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff',
                    border: '2px solid #8b5cf6',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    padding: '12px'
                  }}
                  labelStyle={{ 
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: '#1f2937',
                    letterSpacing: '0.5px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ 
                    fontSize: '16px', 
                    fontWeight: 'bold',
                    paddingTop: '20px',
                    letterSpacing: '0.5px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
