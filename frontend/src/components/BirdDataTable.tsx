import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetAllBirdDetails, useDeleteBirdData, useAddBirdWithDetails, useUpdateBirdDetails } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActor';
import { BirdData, LocationEntry } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { exportBirdDataToCSV } from '../lib/csvExport';
import { exportBirdsToExcel } from '../lib/excelExport';
import { exportBirdsToPDF } from '../lib/pdfExport';
import { Plus, Edit, Trash2, Download, FileSpreadsheet, FileText, Search, RefreshCw, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface BirdFormData {
  arabicName: string;
  scientificName: string;
  englishName: string;
  description: string;
  notes: string;
  latitude: string;
  longitude: string;
  mountainName: string;
  valleyName: string;
  governorate: string;
  locationDesc: string;
}

const emptyForm: BirdFormData = {
  arabicName: '',
  scientificName: '',
  englishName: '',
  description: '',
  notes: '',
  latitude: '',
  longitude: '',
  mountainName: '',
  valleyName: '',
  governorate: '',
  locationDesc: '',
};

export default function BirdDataTable() {
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  const { actor } = useActor();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingBird, setEditingBird] = useState<{ key: string; bird: BirdData } | null>(null);
  const [deletingBird, setDeletingBird] = useState<{ key: string; bird: BirdData } | null>(null);
  const [formData, setFormData] = useState<BirdFormData>(emptyForm);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: allBirds, isLoading, error, refetch } = useGetAllBirdDetails();
  const deleteMutation = useDeleteBirdData();
  const addMutation = useAddBirdWithDetails();
  const updateMutation = useUpdateBirdDetails();

  // Check admin status
  React.useEffect(() => {
    if (!actor || !identity) {
      setIsAdmin(false);
      return;
    }
    actor.isCallerAdmin().then(setIsAdmin).catch(() => setIsAdmin(false));
  }, [actor, identity]);

  const filteredBirds = useMemo(() => {
    if (!allBirds) return [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return allBirds;
    return allBirds.filter(([, bird]) =>
      bird.arabicName.toLowerCase().includes(term) ||
      bird.englishName.toLowerCase().includes(term) ||
      bird.scientificName.toLowerCase().includes(term) ||
      bird.localName?.toLowerCase().includes(term)
    );
  }, [allBirds, searchTerm]);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
    await queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
    await queryClient.invalidateQueries({ queryKey: ['birdNames'] });
    await queryClient.invalidateQueries({ queryKey: ['allLocationsWithNames'] });
    await queryClient.invalidateQueries({ queryKey: ['totalBirdCount'] });
    await queryClient.invalidateQueries({ queryKey: ['totalLocationCount'] });
    refetch();
    toast.success('تم تحديث البيانات');
  };

  const handleAddOpen = () => {
    setFormData(emptyForm);
    setShowAddDialog(true);
  };

  const handleEditOpen = (key: string, bird: BirdData) => {
    setEditingBird({ key, bird });
    const firstLoc = bird.locations?.[0];
    setFormData({
      arabicName: bird.arabicName || '',
      scientificName: bird.scientificName || '',
      englishName: bird.englishName || '',
      description: bird.description || '',
      notes: bird.notes || '',
      latitude: firstLoc ? String(firstLoc.coordinate.latitude) : '',
      longitude: firstLoc ? String(firstLoc.coordinate.longitude) : '',
      mountainName: firstLoc?.mountainName || '',
      valleyName: firstLoc?.valleyName || '',
      governorate: firstLoc?.governorate || '',
      locationDesc: firstLoc?.location || '',
    });
  };

  const handleFormChange = (field: keyof BirdFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSubmit = async () => {
    if (!formData.arabicName.trim()) {
      toast.error('الاسم العربي مطلوب');
      return;
    }
    setIsSubmitting(true);
    try {
      await addMutation.mutateAsync({
        arabicName: formData.arabicName,
        scientificName: formData.scientificName,
        englishName: formData.englishName,
        description: formData.description,
        notes: formData.notes,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
        mountainName: formData.mountainName,
        valleyName: formData.valleyName,
        governorate: formData.governorate,
        locationDesc: formData.locationDesc,
        audioFilePath: null,
        subImages: [],
        mainImageFile: null,
      });
      toast.success('تم إضافة الطائر بنجاح');
      setShowAddDialog(false);
      setFormData(emptyForm);
      handleRefresh();
    } catch (err: any) {
      toast.error('فشل في إضافة الطائر: ' + (err?.message || ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingBird) return;
    setIsSubmitting(true);
    try {
      await updateMutation.mutateAsync({
        birdName: editingBird.key,
        arabicName: formData.arabicName,
        scientificName: formData.scientificName,
        englishName: formData.englishName,
        description: formData.description,
        notes: formData.notes,
      });
      toast.success('تم تحديث بيانات الطائر');
      setEditingBird(null);
      handleRefresh();
    } catch (err: any) {
      toast.error('فشل في تحديث البيانات: ' + (err?.message || ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBird) return;
    try {
      await deleteMutation.mutateAsync(deletingBird.key);
      toast.success('تم حذف الطائر بنجاح');
      setDeletingBird(null);
      handleRefresh();
    } catch (err: any) {
      toast.error('فشل في الحذف: ' + (err?.message || ''));
    }
  };

  const handleExportCSV = () => {
    if (!filteredBirds.length) { toast.error('لا توجد بيانات للتصدير'); return; }
    exportBirdDataToCSV(filteredBirds.map(([, b]) => b));
    toast.success('تم تصدير CSV');
  };

  const handleExportExcel = () => {
    if (!filteredBirds.length) { toast.error('لا توجد بيانات للتصدير'); return; }
    exportBirdsToExcel(filteredBirds.map(([, b]) => b));
    toast.success('تم تصدير Excel');
  };

  const handleExportPDF = () => {
    if (!filteredBirds.length) { toast.error('لا توجد بيانات للتصدير'); return; }
    exportBirdsToPDF(filteredBirds.map(([, b]) => b));
    toast.success('تم تصدير PDF');
  };

  const formatLocations = (locations: LocationEntry[]) => {
    if (!locations || locations.length === 0) return '—';
    return locations.map(loc => loc.location || loc.governorate || '').filter(Boolean).join('، ') || '—';
  };

  return (
    <div className="w-full" dir="rtl">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 w-4 h-4" />
          <Input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="بحث عن طائر..."
            className="pr-9 bg-white border-amber-300 text-right"
          />
        </div>

        {/* Refresh */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="border-amber-400 text-amber-700 hover:bg-amber-100 gap-1"
        >
          <RefreshCw className="w-4 h-4" />
          تحديث
        </Button>

        {/* Export buttons */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="border-green-400 text-green-700 hover:bg-green-50 gap-1"
        >
          <Download className="w-4 h-4" />
          CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportExcel}
          className="border-blue-400 text-blue-700 hover:bg-blue-50 gap-1"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPDF}
          className="border-red-400 text-red-700 hover:bg-red-50 gap-1"
        >
          <FileText className="w-4 h-4" />
          PDF
        </Button>

        {/* Add button - admin only */}
        {isAdmin && (
          <Button
            size="sm"
            onClick={handleAddOpen}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-1"
          >
            <Plus className="w-4 h-4" />
            إضافة طائر
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-3 text-sm text-amber-700">
        <span>إجمالي الطيور: <strong>{allBirds?.length ?? 0}</strong></span>
        <span>النتائج المعروضة: <strong>{filteredBirds.length}</strong></span>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12 gap-2 text-amber-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>جاري تحميل البيانات...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-8 text-red-600 bg-red-50 rounded-lg border border-red-200">
          <p className="font-semibold">حدث خطأ في تحميل البيانات</p>
          <p className="text-sm mt-1">{String(error)}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
            إعادة المحاولة
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && filteredBirds.length === 0 && (
        <div className="text-center py-12 text-amber-600 bg-amber-50 rounded-lg border border-amber-200">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-semibold text-lg">
            {searchTerm ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد بيانات طيور بعد'}
          </p>
          {isAdmin && !searchTerm && (
            <Button size="sm" onClick={handleAddOpen} className="mt-4 bg-amber-600 hover:bg-amber-700 text-white gap-1">
              <Plus className="w-4 h-4" />
              إضافة أول طائر
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      {!isLoading && filteredBirds.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-amber-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-amber-100 hover:bg-amber-100">
                <TableHead className="text-right text-amber-800 font-bold">#</TableHead>
                <TableHead className="text-right text-amber-800 font-bold">الاسم العربي</TableHead>
                <TableHead className="text-right text-amber-800 font-bold">الاسم المحلي</TableHead>
                <TableHead className="text-right text-amber-800 font-bold">الاسم العلمي</TableHead>
                <TableHead className="text-right text-amber-800 font-bold">الاسم الإنجليزي</TableHead>
                <TableHead className="text-right text-amber-800 font-bold">المواقع</TableHead>
                <TableHead className="text-right text-amber-800 font-bold">عدد المواقع</TableHead>
                <TableHead className="text-right text-amber-800 font-bold">الوصف</TableHead>
                {isAdmin && <TableHead className="text-right text-amber-800 font-bold">إجراءات</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBirds.map(([key, bird], index) => (
                <TableRow key={key} className="hover:bg-amber-50 border-b border-amber-100">
                  <TableCell className="text-amber-700 font-medium">{index + 1}</TableCell>
                  <TableCell className="font-bold text-amber-900">{bird.arabicName || '—'}</TableCell>
                  <TableCell className="text-amber-700">{bird.localName || '—'}</TableCell>
                  <TableCell className="text-amber-600 italic text-sm">{bird.scientificName || '—'}</TableCell>
                  <TableCell className="text-amber-700">{bird.englishName || '—'}</TableCell>
                  <TableCell className="text-amber-700 max-w-[200px] truncate">{formatLocations(bird.locations)}</TableCell>
                  <TableCell className="text-center">
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                      {bird.locations?.length ?? 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-amber-700 max-w-[200px] truncate text-sm">{bird.description || '—'}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditOpen(key, bird)}
                          className="border-blue-300 text-blue-600 hover:bg-blue-50 h-7 px-2"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingBird({ key, bird })}
                          className="border-red-300 text-red-600 hover:bg-red-50 h-7 px-2"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          style={{ background: '#fffbf5', border: '2px solid #d97706', direction: 'rtl' }}
        >
          <DialogHeader>
            <DialogTitle className="text-amber-900 text-xl font-bold text-right">إضافة طائر جديد</DialogTitle>
          </DialogHeader>
          <BirdForm formData={formData} onChange={handleFormChange} />
          <DialogFooter className="flex gap-2 justify-start mt-4">
            <Button
              onClick={handleAddSubmit}
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700 text-white gap-1"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              إضافة
            </Button>
            <DialogClose asChild>
              <Button variant="outline" className="border-amber-300 text-amber-700">إلغاء</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingBird} onOpenChange={open => { if (!open) setEditingBird(null); }}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          style={{ background: '#fffbf5', border: '2px solid #d97706', direction: 'rtl' }}
        >
          <DialogHeader>
            <DialogTitle className="text-amber-900 text-xl font-bold text-right">
              تعديل بيانات: {editingBird?.bird.arabicName}
            </DialogTitle>
          </DialogHeader>
          <BirdForm formData={formData} onChange={handleFormChange} isEdit />
          <DialogFooter className="flex gap-2 justify-start mt-4">
            <Button
              onClick={handleEditSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit className="w-4 h-4" />}
              حفظ التعديلات
            </Button>
            <Button variant="outline" onClick={() => setEditingBird(null)} className="border-amber-300 text-amber-700">
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingBird} onOpenChange={open => { if (!open) setDeletingBird(null); }}>
        <AlertDialogContent style={{ direction: 'rtl' }}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right text-red-700">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من حذف الطائر "{deletingBird?.bird.arabicName}"؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 justify-start">
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              حذف
            </AlertDialogAction>
            <AlertDialogCancel className="border-amber-300 text-amber-700">إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---- Bird Form Sub-component ----
interface BirdFormProps {
  formData: BirdFormData;
  onChange: (field: keyof BirdFormData, value: string) => void;
  isEdit?: boolean;
}

function BirdForm({ formData, onChange, isEdit }: BirdFormProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
      <div className="space-y-1">
        <Label className="text-amber-800 font-semibold">الاسم العربي *</Label>
        <Input
          value={formData.arabicName}
          onChange={e => onChange('arabicName', e.target.value)}
          placeholder="الاسم العربي للطائر"
          className="border-amber-300 bg-white text-right"
          disabled={isEdit}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-amber-800 font-semibold">الاسم الإنجليزي</Label>
        <Input
          value={formData.englishName}
          onChange={e => onChange('englishName', e.target.value)}
          placeholder="English Name"
          className="border-amber-300 bg-white"
        />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label className="text-amber-800 font-semibold">الاسم العلمي</Label>
        <Input
          value={formData.scientificName}
          onChange={e => onChange('scientificName', e.target.value)}
          placeholder="Scientific Name"
          className="border-amber-300 bg-white italic"
        />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label className="text-amber-800 font-semibold">الوصف</Label>
        <Textarea
          value={formData.description}
          onChange={e => onChange('description', e.target.value)}
          placeholder="وصف الطائر"
          className="border-amber-300 bg-white text-right"
          rows={3}
        />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label className="text-amber-800 font-semibold">ملاحظات</Label>
        <Textarea
          value={formData.notes}
          onChange={e => onChange('notes', e.target.value)}
          placeholder="ملاحظات إضافية"
          className="border-amber-300 bg-white text-right"
          rows={2}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-amber-800 font-semibold">خط العرض</Label>
        <Input
          type="number"
          value={formData.latitude}
          onChange={e => onChange('latitude', e.target.value)}
          placeholder="23.0000"
          className="border-amber-300 bg-white"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-amber-800 font-semibold">خط الطول</Label>
        <Input
          type="number"
          value={formData.longitude}
          onChange={e => onChange('longitude', e.target.value)}
          placeholder="56.0000"
          className="border-amber-300 bg-white"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-amber-800 font-semibold">المحافظة</Label>
        <Input
          value={formData.governorate}
          onChange={e => onChange('governorate', e.target.value)}
          placeholder="المحافظة"
          className="border-amber-300 bg-white text-right"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-amber-800 font-semibold">الجبل</Label>
        <Input
          value={formData.mountainName}
          onChange={e => onChange('mountainName', e.target.value)}
          placeholder="اسم الجبل"
          className="border-amber-300 bg-white text-right"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-amber-800 font-semibold">الوادي</Label>
        <Input
          value={formData.valleyName}
          onChange={e => onChange('valleyName', e.target.value)}
          placeholder="اسم الوادي"
          className="border-amber-300 bg-white text-right"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-amber-800 font-semibold">وصف الموقع</Label>
        <Input
          value={formData.locationDesc}
          onChange={e => onChange('locationDesc', e.target.value)}
          placeholder="وصف الموقع"
          className="border-amber-300 bg-white text-right"
        />
      </div>
    </div>
  );
}
