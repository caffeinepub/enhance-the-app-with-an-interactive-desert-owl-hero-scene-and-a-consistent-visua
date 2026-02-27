import React, { useState, useEffect, useMemo } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActor';
import {
  useGetAllBirdDetails,
  useDeleteBirdData,
  useUpdateBirdDetails,
  useAddBirdWithDetails,
} from '../hooks/useQueries';
import { BirdData, LocationEntry } from '../backend';
import { exportBirdDataToCSV } from '../lib/csvExport';
import { exportBirdsToExcel } from '../lib/excelExport';
import { exportBirdsToPDF } from '../lib/pdfExport';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Pencil, Save, Trash2, FileText, FileSpreadsheet, Download } from 'lucide-react';
import { toast } from 'sonner';

interface EditableBirdRow {
  key: string;
  bird: BirdData;
}

const emptyBird = (): BirdData => ({
  id: BigInt(0),
  arabicName: '',
  scientificName: '',
  englishName: '',
  description: '',
  locations: [],
  audioFile: undefined,
  subImages: [],
  notes: '',
  localName: '',
});

const emptyLocation = (): LocationEntry => ({
  coordinate: { latitude: 0, longitude: 0 },
  mountainName: '',
  valleyName: '',
  governorate: '',
  notes: '',
  location: '',
});

export default function BirdDataTable() {
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();

  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRow, setEditingRow] = useState<EditableBirdRow | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newBird, setNewBird] = useState<BirdData>(emptyBird());
  const [newLocation, setNewLocation] = useState<LocationEntry>(emptyLocation());

  const { data: allBirds, isLoading: birdsLoading } = useGetAllBirdDetails();
  const deleteMutation = useDeleteBirdData();
  const updateMutation = useUpdateBirdDetails();
  const addMutation = useAddBirdWithDetails();

  // Proper isAdmin check using useState + useEffect
  useEffect(() => {
    if (!actor || actorFetching) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    actor.isCallerAdmin().then((result) => {
      if (!cancelled) setIsAdmin(result);
    }).catch(() => {
      if (!cancelled) setIsAdmin(false);
    });
    return () => { cancelled = true; };
  }, [actor, actorFetching, identity]);

  const filteredBirds = useMemo(() => {
    if (!allBirds) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allBirds;
    return allBirds.filter(([, bird]) =>
      bird.arabicName.toLowerCase().includes(q) ||
      bird.scientificName.toLowerCase().includes(q) ||
      bird.englishName.toLowerCase().includes(q) ||
      bird.notes.toLowerCase().includes(q)
    );
  }, [allBirds, searchQuery]);

  const handleDelete = async (birdName: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${birdName}"؟`)) return;
    try {
      await deleteMutation.mutateAsync(birdName);
      toast.success('تم حذف الطائر بنجاح');
    } catch {
      toast.error('فشل حذف الطائر');
    }
  };

  const handleEdit = (key: string, bird: BirdData) => {
    setEditingRow({ key, bird: { ...bird } });
  };

  const handleSave = async () => {
    if (!editingRow) return;
    try {
      await updateMutation.mutateAsync({
        birdName: editingRow.key,
        arabicName: editingRow.bird.arabicName,
        scientificName: editingRow.bird.scientificName,
        englishName: editingRow.bird.englishName,
        description: editingRow.bird.description,
        notes: editingRow.bird.notes,
      });
      toast.success('تم حفظ التعديلات بنجاح');
      setEditingRow(null);
    } catch {
      toast.error('فشل حفظ التعديلات');
    }
  };

  const handleAddBird = async () => {
    if (!newBird.arabicName.trim()) {
      toast.error('الاسم العربي مطلوب');
      return;
    }
    try {
      await addMutation.mutateAsync({
        arabicName: newBird.arabicName,
        scientificName: newBird.scientificName,
        englishName: newBird.englishName,
        description: newBird.description,
        notes: newBird.notes,
        latitude: newLocation.coordinate.latitude,
        longitude: newLocation.coordinate.longitude,
        mountainName: newLocation.mountainName,
        valleyName: newLocation.valleyName,
        governorate: newLocation.governorate,
        locationDesc: newLocation.location,
        audioFilePath: null,
        subImages: [],
      });
      toast.success('تم إضافة الطائر بنجاح');
      setShowAddDialog(false);
      setNewBird(emptyBird());
      setNewLocation(emptyLocation());
    } catch {
      toast.error('فشل إضافة الطائر');
    }
  };

  const handleExportCSV = () => {
    if (!allBirds) return;
    exportBirdDataToCSV(allBirds.map(([, b]) => b));
  };

  const handleExportExcel = () => {
    if (!allBirds) return;
    exportBirdsToExcel(allBirds.map(([, b]) => b));
  };

  const handleExportPDF = () => {
    if (!allBirds) return;
    exportBirdsToPDF(allBirds.map(([, b]) => b));
  };

  return (
    <div dir="rtl" className="w-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <Input
          placeholder="بحث عن طائر..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs text-right border-amber-300 bg-white"
        />
        <div className="flex-1" />
        {/* Export buttons */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="border-amber-400 text-amber-800 hover:bg-amber-100"
        >
          <Download className="w-4 h-4 ml-1" />
          CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportExcel}
          className="border-amber-400 text-amber-800 hover:bg-amber-100"
        >
          <FileSpreadsheet className="w-4 h-4 ml-1" />
          Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPDF}
          className="border-amber-400 text-amber-800 hover:bg-amber-100"
        >
          <FileText className="w-4 h-4 ml-1" />
          PDF
        </Button>
        {/* Admin-only Add button */}
        {isAdmin && (
          <Button
            size="sm"
            onClick={() => setShowAddDialog(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Plus className="w-4 h-4 ml-1" />
            إضافة
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-amber-200 shadow-sm">
        {birdsLoading ? (
          <div className="flex items-center justify-center py-12 text-amber-700">
            <Loader2 className="w-6 h-6 animate-spin ml-2" />
            <span>جاري تحميل البيانات...</span>
          </div>
        ) : filteredBirds.length === 0 ? (
          <div className="text-center py-12 text-amber-600">
            {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد بيانات'}
          </div>
        ) : (
          <table className="w-full text-sm text-right">
            <thead className="bg-amber-700 text-white">
              <tr>
                <th className="px-3 py-3 font-semibold whitespace-nowrap">#</th>
                <th className="px-3 py-3 font-semibold whitespace-nowrap">الاسم العربي</th>
                <th className="px-3 py-3 font-semibold whitespace-nowrap">الاسم العلمي</th>
                <th className="px-3 py-3 font-semibold whitespace-nowrap">الاسم الإنجليزي</th>
                <th className="px-3 py-3 font-semibold whitespace-nowrap">الوصف</th>
                <th className="px-3 py-3 font-semibold whitespace-nowrap">المواقع</th>
                <th className="px-3 py-3 font-semibold whitespace-nowrap">الملاحظات</th>
                {isAdmin && (
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">الإجراءات</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredBirds.map(([key, bird], index) => {
                const isEditing = editingRow?.key === key;
                return (
                  <tr
                    key={key}
                    className={`border-b border-amber-100 ${index % 2 === 0 ? 'bg-white' : 'bg-amber-50'} hover:bg-amber-100 transition-colors`}
                  >
                    <td className="px-3 py-2 text-amber-700 font-medium whitespace-nowrap">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap font-semibold text-amber-900">
                      {isEditing ? (
                        <Input
                          value={editingRow.bird.arabicName}
                          onChange={(e) =>
                            setEditingRow((prev) =>
                              prev ? { ...prev, bird: { ...prev.bird, arabicName: e.target.value } } : prev
                            )
                          }
                          className="w-32 text-right border-amber-300"
                        />
                      ) : (
                        bird.arabicName
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-700 italic">
                      {isEditing ? (
                        <Input
                          value={editingRow.bird.scientificName}
                          onChange={(e) =>
                            setEditingRow((prev) =>
                              prev ? { ...prev, bird: { ...prev.bird, scientificName: e.target.value } } : prev
                            )
                          }
                          className="w-36 border-amber-300"
                        />
                      ) : (
                        bird.scientificName || '—'
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                      {isEditing ? (
                        <Input
                          value={editingRow.bird.englishName}
                          onChange={(e) =>
                            setEditingRow((prev) =>
                              prev ? { ...prev, bird: { ...prev.bird, englishName: e.target.value } } : prev
                            )
                          }
                          className="w-36 border-amber-300"
                        />
                      ) : (
                        bird.englishName || '—'
                      )}
                    </td>
                    <td className="px-3 py-2 max-w-xs">
                      {isEditing ? (
                        <Input
                          value={editingRow.bird.description}
                          onChange={(e) =>
                            setEditingRow((prev) =>
                              prev ? { ...prev, bird: { ...prev.bird, description: e.target.value } } : prev
                            )
                          }
                          className="w-48 text-right border-amber-300"
                        />
                      ) : (
                        <span className="line-clamp-2 text-gray-700">{bird.description || '—'}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                        {bird.locations.length}
                      </span>
                    </td>
                    <td className="px-3 py-2 max-w-xs">
                      {isEditing ? (
                        <Input
                          value={editingRow.bird.notes}
                          onChange={(e) =>
                            setEditingRow((prev) =>
                              prev ? { ...prev, bird: { ...prev.bird, notes: e.target.value } } : prev
                            )
                          }
                          className="w-48 text-right border-amber-300"
                        />
                      ) : (
                        <span className="line-clamp-2 text-gray-600">{bird.notes || '—'}</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <Button
                              size="sm"
                              onClick={handleSave}
                              disabled={updateMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white h-7 px-2 text-xs"
                            >
                              {updateMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <Save className="w-3 h-3 ml-1" />
                                  حفظ
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(key, bird)}
                              className="border-amber-400 text-amber-700 hover:bg-amber-100 h-7 px-2 text-xs"
                            >
                              <Pencil className="w-3 h-3 ml-1" />
                              تعديل
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(key, bird)}
                            className="border-blue-400 text-blue-700 hover:bg-blue-50 h-7 px-2 text-xs"
                          >
                            <Pencil className="w-3 h-3 ml-1" />
                            تحرير
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(bird.arabicName)}
                            disabled={deleteMutation.isPending}
                            className="border-red-400 text-red-600 hover:bg-red-50 h-7 px-2 text-xs"
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="w-3 h-3 ml-1" />
                                حذف
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      {!birdsLoading && (
        <div className="mt-3 text-sm text-amber-700 text-right">
          إجمالي السجلات: <span className="font-bold">{filteredBirds.length}</span>
          {searchQuery && allBirds && (
            <span className="mr-2 text-amber-500">
              (من أصل {allBirds.length})
            </span>
          )}
        </div>
      )}

      {/* Add Bird Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          style={{ background: '#fffbf5', border: '2px solid #b45309', direction: 'rtl' }}
        >
          <DialogHeader>
            <DialogTitle className="text-amber-900 text-xl font-bold text-right">
              إضافة طائر جديد
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1">
              <Label className="text-amber-900 font-semibold">الاسم العربي *</Label>
              <Input
                value={newBird.arabicName}
                onChange={(e) => setNewBird((p) => ({ ...p, arabicName: e.target.value }))}
                className="text-right border-amber-300 bg-white text-gray-900"
                placeholder="أدخل الاسم العربي"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-amber-900 font-semibold">الاسم العلمي</Label>
              <Input
                value={newBird.scientificName}
                onChange={(e) => setNewBird((p) => ({ ...p, scientificName: e.target.value }))}
                className="border-amber-300 bg-white text-gray-900"
                placeholder="Scientific name"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-amber-900 font-semibold">الاسم الإنجليزي</Label>
              <Input
                value={newBird.englishName}
                onChange={(e) => setNewBird((p) => ({ ...p, englishName: e.target.value }))}
                className="border-amber-300 bg-white text-gray-900"
                placeholder="English name"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-amber-900 font-semibold">المحافظة</Label>
              <Input
                value={newLocation.governorate}
                onChange={(e) => setNewLocation((p) => ({ ...p, governorate: e.target.value }))}
                className="text-right border-amber-300 bg-white text-gray-900"
                placeholder="المحافظة"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-amber-900 font-semibold">اسم الجبل</Label>
              <Input
                value={newLocation.mountainName}
                onChange={(e) => setNewLocation((p) => ({ ...p, mountainName: e.target.value }))}
                className="text-right border-amber-300 bg-white text-gray-900"
                placeholder="اسم الجبل"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-amber-900 font-semibold">اسم الوادي</Label>
              <Input
                value={newLocation.valleyName}
                onChange={(e) => setNewLocation((p) => ({ ...p, valleyName: e.target.value }))}
                className="text-right border-amber-300 bg-white text-gray-900"
                placeholder="اسم الوادي"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-amber-900 font-semibold">خط العرض</Label>
              <Input
                type="number"
                value={newLocation.coordinate.latitude}
                onChange={(e) =>
                  setNewLocation((p) => ({
                    ...p,
                    coordinate: { ...p.coordinate, latitude: parseFloat(e.target.value) || 0 },
                  }))
                }
                className="border-amber-300 bg-white text-gray-900"
                placeholder="23.0"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-amber-900 font-semibold">خط الطول</Label>
              <Input
                type="number"
                value={newLocation.coordinate.longitude}
                onChange={(e) =>
                  setNewLocation((p) => ({
                    ...p,
                    coordinate: { ...p.coordinate, longitude: parseFloat(e.target.value) || 0 },
                  }))
                }
                className="border-amber-300 bg-white text-gray-900"
                placeholder="55.0"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-amber-900 font-semibold">وصف الموقع</Label>
              <Input
                value={newLocation.location}
                onChange={(e) => setNewLocation((p) => ({ ...p, location: e.target.value }))}
                className="text-right border-amber-300 bg-white text-gray-900"
                placeholder="وصف الموقع"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-amber-900 font-semibold">الوصف</Label>
              <Input
                value={newBird.description}
                onChange={(e) => setNewBird((p) => ({ ...p, description: e.target.value }))}
                className="text-right border-amber-300 bg-white text-gray-900"
                placeholder="وصف الطائر"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-amber-900 font-semibold">الملاحظات</Label>
              <Input
                value={newBird.notes}
                onChange={(e) => setNewBird((p) => ({ ...p, notes: e.target.value }))}
                className="text-right border-amber-300 bg-white text-gray-900"
                placeholder="ملاحظات إضافية"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 justify-start mt-4">
            <Button
              onClick={handleAddBird}
              disabled={addMutation.isPending || !newBird.arabicName.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {addMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin ml-1" />
              ) : (
                <Plus className="w-4 h-4 ml-1" />
              )}
              إضافة
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              className="border-amber-400 text-amber-800"
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
