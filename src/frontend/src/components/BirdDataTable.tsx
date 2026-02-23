import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Eye, Trash2, FileSpreadsheet, FileText, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useGetAllBirdDetails, useDeleteBird, useCanModifyData, useAddBirdWithDetails } from '../hooks/useQueries';
import { exportBirdsToExcel } from '../lib/excelExport';
import { exportBirdsToPDF } from '../lib/pdfExport';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import type { BirdData } from '../backend';

export default function BirdDataTable() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmBird, setDeleteConfirmBird] = useState<BirdData | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: allBirdData, isLoading, error: dataError } = useGetAllBirdDetails();
  const { data: canModify } = useCanModifyData();
  const deleteBirdMutation = useDeleteBird();
  const addBirdMutation = useAddBirdWithDetails();

  // Log data loading errors
  useEffect(() => {
    if (dataError) {
      console.error('❌ Bird table data loading error:', {
        error: dataError,
        message: (dataError as any)?.message,
        timestamp: new Date().toISOString()
      });
    }
  }, [dataError]);

  // Log successful data load
  useEffect(() => {
    if (allBirdData && !isLoading) {
      console.log('✅ Bird table data loaded successfully:', {
        totalBirds: allBirdData.length,
        timestamp: new Date().toISOString()
      });
    }
  }, [allBirdData, isLoading]);

  const [newBird, setNewBird] = useState({
    arabicName: '',
    scientificName: '',
    englishName: '',
    description: '',
    notes: '',
    latitude: '',
    longitude: ''
  });

  const birdDataArray = useMemo(() => {
    if (!allBirdData) return [];
    return allBirdData.map(([_, data]) => data);
  }, [allBirdData]);

  const filteredBirds = useMemo(() => {
    if (!searchTerm) return birdDataArray;
    
    return birdDataArray.filter(bird =>
      bird.arabicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bird.scientificName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bird.englishName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [birdDataArray, searchTerm]);

  const handleDelete = async (birdId: bigint) => {
    try {
      await deleteBirdMutation.mutateAsync(birdId);
      setDeleteConfirmBird(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleAddBird = async () => {
    if (!newBird.arabicName || !newBird.latitude || !newBird.longitude) {
      toast.error('❌ يرجى ملء الحقول المطلوبة', {
        description: 'الاسم العربي وخط العرض وخط الطول مطلوبة',
        duration: 3000,
        position: 'bottom-center',
      });
      return;
    }

    try {
      await addBirdMutation.mutateAsync({
        arabicName: newBird.arabicName,
        scientificName: newBird.scientificName,
        englishName: newBird.englishName,
        description: newBird.description,
        notes: newBird.notes,
        latitude: parseFloat(newBird.latitude),
        longitude: parseFloat(newBird.longitude),
        audioFilePath: null,
        subImages: []
      });

      setShowAddDialog(false);
      setNewBird({
        arabicName: '',
        scientificName: '',
        englishName: '',
        description: '',
        notes: '',
        latitude: '',
        longitude: ''
      });
    } catch (error) {
      console.error('Add bird error:', error);
    }
  };

  const handleExportExcel = () => {
    exportBirdsToExcel(birdDataArray);
  };

  const handleExportPDF = () => {
    exportBirdsToPDF(birdDataArray);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8 text-right" dir="rtl">
        <div className="text-center text-xl text-muted-foreground">جاري تحميل البيانات...</div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="min-h-screen bg-background p-8 text-right" dir="rtl">
        <div className="mx-auto max-w-2xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-right">
              <div className="space-y-2">
                <p className="font-semibold">فشل تحميل بيانات الجدول</p>
                <p className="text-sm">تعذر الاتصال بالخادم أو قاعدة البيانات. يرجى المحاولة مرة أخرى.</p>
                <Button onClick={handleRetry} variant="outline" size="sm" className="mt-2">
                  إعادة المحاولة
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!allBirdData || allBirdData.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8 text-right" dir="rtl">
        <div className="mx-auto max-w-2xl">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-right">
              <p>لا توجد بيانات طيور في قاعدة البيانات حالياً.</p>
              {canModify && (
                <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                  <Plus className="ml-2 h-5 w-5" />
                  إضافة طائر جديد
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8 text-right" dir="rtl">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-6">جدول بيانات الطيور</h1>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="ابحث عن طائر..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              {canModify && (
                <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                  <Plus className="h-5 w-5" />
                  إضافة طائر جديد
                </Button>
              )}
              <Button onClick={handleExportExcel} variant="outline" className="gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Excel
              </Button>
              <Button onClick={handleExportPDF} variant="outline" className="gap-2">
                <FileText className="h-5 w-5" />
                PDF
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-lg overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">الاسم العربي</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">الاسم العلمي</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">الاسم الإنجليزي</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">عدد المواقع</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">عدد الصور</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">صوت</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBirds.map((bird) => (
                  <tr key={bird.id.toString()} className="hover:bg-muted/50">
                    <td className="px-6 py-4 text-sm text-foreground">{bird.arabicName}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground italic" dir="ltr">{bird.scientificName || '-'}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground" dir="ltr">{bird.englishName || '-'}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{bird.locations.length}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{bird.subImages.length}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{bird.audioFile ? 'نعم' : 'لا'}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => navigate({ to: '/bird/$birdName', params: { birdName: bird.arabicName } })}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 ml-1" />
                          عرض
                        </Button>
                        {canModify && (
                          <Button
                            onClick={() => setDeleteConfirmBird(bird)}
                            variant="destructive"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredBirds.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">لا توجد نتائج</p>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirmBird} onOpenChange={() => setDeleteConfirmBird(null)}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>تأكيد الحذف</DialogTitle>
            </DialogHeader>
            <p className="text-right">هل أنت متأكد من حذف هذا الطائر؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmBird(null)}>
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteConfirmBird) handleDelete(deleteConfirmBird.id);
                }}
              >
                حذف
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Bird Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent dir="rtl" className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إضافة طائر جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="arabicName">الاسم العربي *</Label>
                <Input
                  id="arabicName"
                  value={newBird.arabicName}
                  onChange={(e) => setNewBird({ ...newBird, arabicName: e.target.value })}
                  className="text-right"
                />
              </div>
              <div>
                <Label htmlFor="scientificName">الاسم العلمي</Label>
                <Input
                  id="scientificName"
                  value={newBird.scientificName}
                  onChange={(e) => setNewBird({ ...newBird, scientificName: e.target.value })}
                  className="text-right"
                />
              </div>
              <div>
                <Label htmlFor="englishName">الاسم الإنجليزي</Label>
                <Input
                  id="englishName"
                  value={newBird.englishName}
                  onChange={(e) => setNewBird({ ...newBird, englishName: e.target.value })}
                  className="text-right"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">خط العرض *</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={newBird.latitude}
                    onChange={(e) => setNewBird({ ...newBird, latitude: e.target.value })}
                    className="text-right"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">خط الطول *</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={newBird.longitude}
                    onChange={(e) => setNewBird({ ...newBird, longitude: e.target.value })}
                    className="text-right"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={newBird.description}
                  onChange={(e) => setNewBird({ ...newBird, description: e.target.value })}
                  className="text-right"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={newBird.notes}
                  onChange={(e) => setNewBird({ ...newBird, notes: e.target.value })}
                  className="text-right"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAddBird} disabled={addBirdMutation.isPending}>
                {addBirdMutation.isPending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
