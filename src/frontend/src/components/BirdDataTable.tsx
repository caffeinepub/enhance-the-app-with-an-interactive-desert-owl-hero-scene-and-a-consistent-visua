import React, { useState } from 'react';
import { useGetAllBirdDetails, useDeleteBird, useSaveBirdDataArray, useAddBirdWithDetails, useCanModifyData } from '../hooks/useQueries';
import { BirdData } from '../backend';
import { exportBirdsToExcel } from '../lib/excelExport';
import { exportBirdsToPDF } from '../lib/pdfExport';
import { useFileUpload } from '../blob-storage/FileStorage';
import { toast } from 'sonner';
import { Trash2, FileSpreadsheet, FileText, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

export default function BirdDataTable() {
  const { data: birdDataEntries, isLoading } = useGetAllBirdDetails();
  const { mutate: deleteBird } = useDeleteBird();
  const { mutate: saveBirdDataArray, isPending: isSaving } = useSaveBirdDataArray();
  const { mutate: addBirdWithDetails, isPending: isAdding } = useAddBirdWithDetails();
  const { data: canModify } = useCanModifyData();
  const { uploadFile, isUploading } = useFileUpload();
  const { identity } = useInternetIdentity();

  const [editingData, setEditingData] = useState<BirdData[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<bigint | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newBirdForm, setNewBirdForm] = useState({
    arabicName: '',
    scientificName: '',
    englishName: '',
    description: '',
    notes: '',
    latitude: '',
    longitude: '',
  });
  const [uploadingImages, setUploadingImages] = useState<File[]>([]);
  const [uploadingAudio, setUploadingAudio] = useState<File | null>(null);

  const isAuthenticated = !!identity;

  React.useEffect(() => {
    if (birdDataEntries) {
      const birdDataArray = birdDataEntries.map(([_, data]) => data);
      setEditingData(birdDataArray);
    }
  }, [birdDataEntries]);

  const handleFieldChange = (id: bigint, field: keyof BirdData, value: string) => {
    setEditingData((prev) =>
      prev.map((bird) => (bird.id === id ? { ...bird, [field]: value } : bird))
    );
  };

  const handleLocationChange = (id: bigint, index: number, field: 'latitude' | 'longitude', value: string) => {
    setEditingData((prev) =>
      prev.map((bird) => {
        if (bird.id === id) {
          const newLocations = [...bird.locations];
          newLocations[index] = {
            ...newLocations[index],
            [field]: parseFloat(value) || 0,
          };
          return { ...bird, locations: newLocations };
        }
        return bird;
      })
    );
  };

  const handleSaveAll = () => {
    if (!canModify) {
      toast.error('ليس لديك صلاحية لحفظ البيانات');
      return;
    }
    saveBirdDataArray(editingData);
  };

  const handleDelete = (birdId: bigint) => {
    if (!canModify) {
      toast.error('ليس لديك صلاحية لحذف البيانات');
      return;
    }
    setDeleteConfirmId(birdId);
  };

  const confirmDelete = () => {
    if (deleteConfirmId !== null) {
      deleteBird(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleExportExcel = () => {
    if (!birdDataEntries) return;
    const birdDataArray = birdDataEntries.map(([_, data]) => data);
    exportBirdsToExcel(birdDataArray);
  };

  const handleExportPDF = () => {
    if (!birdDataEntries) return;
    const birdDataArray = birdDataEntries.map(([_, data]) => data);
    exportBirdsToPDF(birdDataArray);
  };

  const handleAddBird = async () => {
    if (!canModify) {
      toast.error('ليس لديك صلاحية لإضافة البيانات');
      return;
    }

    if (!newBirdForm.arabicName || !newBirdForm.latitude || !newBirdForm.longitude) {
      toast.error('يرجى ملء الحقول المطلوبة: الاسم العربي وخط العرض وخط الطول');
      return;
    }

    try {
      const latitude = parseFloat(newBirdForm.latitude);
      const longitude = parseFloat(newBirdForm.longitude);

      if (isNaN(latitude) || isNaN(longitude)) {
        toast.error('يرجى إدخال قيم صحيحة لخط العرض وخط الطول');
        return;
      }

      let audioFilePath: string | null = null;
      const subImages: string[] = [];

      if (uploadingAudio) {
        const audioPath = `audio/${Date.now()}_${uploadingAudio.name}`;
        const result = await uploadFile(audioPath, uploadingAudio);
        audioFilePath = result.path;
      }

      if (uploadingImages.length > 0) {
        for (const image of uploadingImages) {
          const imagePath = `images/${Date.now()}_${image.name}`;
          const result = await uploadFile(imagePath, image);
          subImages.push(result.path);
        }
      }

      addBirdWithDetails({
        arabicName: newBirdForm.arabicName,
        scientificName: newBirdForm.scientificName,
        englishName: newBirdForm.englishName,
        description: newBirdForm.description,
        notes: newBirdForm.notes,
        latitude,
        longitude,
        audioFilePath,
        subImages,
      });

      setIsAddDialogOpen(false);
      setNewBirdForm({
        arabicName: '',
        scientificName: '',
        englishName: '',
        description: '',
        notes: '',
        latitude: '',
        longitude: '',
      });
      setUploadingImages([]);
      setUploadingAudio(null);
    } catch (error) {
      toast.error(`فشل إضافة البيانات: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8 text-right" dir="rtl">
        <div className="text-center text-xl text-muted-foreground">جاري تحميل البيانات...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8 text-right" dir="rtl">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-foreground">جدول بيانات الطيور</h1>
          <div className="flex gap-3">
            {isAuthenticated && canModify && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-5 w-5" />
                    إضافة بيانات
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>إضافة بيانات طائر جديد</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="arabicName">الاسم العربي *</Label>
                      <Input
                        id="arabicName"
                        value={newBirdForm.arabicName}
                        onChange={(e) => setNewBirdForm({ ...newBirdForm, arabicName: e.target.value })}
                        placeholder="أدخل الاسم العربي"
                      />
                    </div>
                    <div>
                      <Label htmlFor="scientificName">الاسم العلمي</Label>
                      <Input
                        id="scientificName"
                        value={newBirdForm.scientificName}
                        onChange={(e) => setNewBirdForm({ ...newBirdForm, scientificName: e.target.value })}
                        placeholder="أدخل الاسم العلمي"
                      />
                    </div>
                    <div>
                      <Label htmlFor="englishName">الاسم الإنجليزي</Label>
                      <Input
                        id="englishName"
                        value={newBirdForm.englishName}
                        onChange={(e) => setNewBirdForm({ ...newBirdForm, englishName: e.target.value })}
                        placeholder="أدخل الاسم الإنجليزي"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="latitude">خط العرض *</Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="any"
                          value={newBirdForm.latitude}
                          onChange={(e) => setNewBirdForm({ ...newBirdForm, latitude: e.target.value })}
                          placeholder="24.123456"
                        />
                      </div>
                      <div>
                        <Label htmlFor="longitude">خط الطول *</Label>
                        <Input
                          id="longitude"
                          type="number"
                          step="any"
                          value={newBirdForm.longitude}
                          onChange={(e) => setNewBirdForm({ ...newBirdForm, longitude: e.target.value })}
                          placeholder="55.123456"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">الوصف</Label>
                      <Textarea
                        id="description"
                        value={newBirdForm.description}
                        onChange={(e) => setNewBirdForm({ ...newBirdForm, description: e.target.value })}
                        placeholder="أدخل وصف الطائر"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">ملاحظات</Label>
                      <Textarea
                        id="notes"
                        value={newBirdForm.notes}
                        onChange={(e) => setNewBirdForm({ ...newBirdForm, notes: e.target.value })}
                        placeholder="أدخل ملاحظات إضافية"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="images">الصور</Label>
                      <Input
                        id="images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => setUploadingImages(Array.from(e.target.files || []))}
                      />
                      {uploadingImages.length > 0 && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          تم اختيار {uploadingImages.length} صورة
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="audio">الملف الصوتي</Label>
                      <Input
                        id="audio"
                        type="file"
                        accept="audio/*"
                        onChange={(e) => setUploadingAudio(e.target.files?.[0] || null)}
                      />
                      {uploadingAudio && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          تم اختيار: {uploadingAudio.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        setNewBirdForm({
                          arabicName: '',
                          scientificName: '',
                          englishName: '',
                          description: '',
                          notes: '',
                          latitude: '',
                          longitude: '',
                        });
                        setUploadingImages([]);
                        setUploadingAudio(null);
                      }}
                    >
                      إلغاء
                    </Button>
                    <Button onClick={handleAddBird} disabled={isAdding || isUploading}>
                      {isAdding || isUploading ? 'جاري الإضافة...' : 'إضافة'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {canModify && (
              <Button onClick={handleSaveAll} disabled={isSaving} variant="default">
                {isSaving ? 'جاري الحفظ...' : 'حفظ الكل'}
              </Button>
            )}
            <Button onClick={handleExportExcel} variant="outline" className="gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              تصدير Excel
            </Button>
            <Button onClick={handleExportPDF} variant="outline" className="gap-2">
              <FileText className="h-5 w-5" />
              تصدير PDF
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-lg">
          <table className="w-full border-collapse text-right">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-4 text-sm font-semibold text-foreground">المعرف</th>
                <th className="p-4 text-sm font-semibold text-foreground">الاسم العربي</th>
                <th className="p-4 text-sm font-semibold text-foreground">الاسم العلمي</th>
                <th className="p-4 text-sm font-semibold text-foreground">الاسم الإنجليزي</th>
                <th className="p-4 text-sm font-semibold text-foreground">الوصف</th>
                <th className="p-4 text-sm font-semibold text-foreground">المواقع</th>
                <th className="p-4 text-sm font-semibold text-foreground">الصور</th>
                <th className="p-4 text-sm font-semibold text-foreground">الصوت</th>
                <th className="p-4 text-sm font-semibold text-foreground">ملاحظات</th>
                {canModify && <th className="p-4 text-sm font-semibold text-foreground">إجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {editingData.map((bird) => (
                <tr key={bird.id.toString()} className="border-b border-border hover:bg-muted/30">
                  <td className="p-4 text-sm text-muted-foreground">{bird.id.toString()}</td>
                  <td className="p-4">
                    <input
                      type="text"
                      value={bird.arabicName}
                      onChange={(e) => handleFieldChange(bird.id, 'arabicName', e.target.value)}
                      className="w-full rounded border border-input bg-background px-2 py-1 text-sm text-foreground"
                      disabled={!canModify}
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="text"
                      value={bird.scientificName}
                      onChange={(e) => handleFieldChange(bird.id, 'scientificName', e.target.value)}
                      className="w-full rounded border border-input bg-background px-2 py-1 text-sm text-foreground"
                      disabled={!canModify}
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="text"
                      value={bird.englishName}
                      onChange={(e) => handleFieldChange(bird.id, 'englishName', e.target.value)}
                      className="w-full rounded border border-input bg-background px-2 py-1 text-sm text-foreground"
                      disabled={!canModify}
                    />
                  </td>
                  <td className="p-4">
                    <textarea
                      value={bird.description}
                      onChange={(e) => handleFieldChange(bird.id, 'description', e.target.value)}
                      className="w-full rounded border border-input bg-background px-2 py-1 text-sm text-foreground"
                      rows={2}
                      disabled={!canModify}
                    />
                  </td>
                  <td className="p-4">
                    <div className="space-y-2">
                      {bird.locations.map((loc, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="number"
                            step="any"
                            value={loc.latitude}
                            onChange={(e) => handleLocationChange(bird.id, idx, 'latitude', e.target.value)}
                            className="w-24 rounded border border-input bg-background px-2 py-1 text-xs text-foreground"
                            placeholder="خط العرض"
                            disabled={!canModify}
                          />
                          <input
                            type="number"
                            step="any"
                            value={loc.longitude}
                            onChange={(e) => handleLocationChange(bird.id, idx, 'longitude', e.target.value)}
                            className="w-24 rounded border border-input bg-background px-2 py-1 text-xs text-foreground"
                            placeholder="خط الطول"
                            disabled={!canModify}
                          />
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{bird.subImages.length}</td>
                  <td className="p-4 text-sm text-muted-foreground">{bird.audioFile ? 'نعم' : 'لا'}</td>
                  <td className="p-4">
                    <textarea
                      value={bird.notes}
                      onChange={(e) => handleFieldChange(bird.id, 'notes', e.target.value)}
                      className="w-full rounded border border-input bg-background px-2 py-1 text-sm text-foreground"
                      rows={2}
                      disabled={!canModify}
                    />
                  </td>
                  {canModify && (
                    <td className="p-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(bird.id)}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        حذف
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {deleteConfirmId !== null && (
          <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>تأكيد الحذف</DialogTitle>
              </DialogHeader>
              <p className="text-muted-foreground">هل أنت متأكد من حذف هذا الطائر؟ لا يمكن التراجع عن هذا الإجراء.</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                  إلغاء
                </Button>
                <Button variant="destructive" onClick={confirmDelete}>
                  حذف
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
