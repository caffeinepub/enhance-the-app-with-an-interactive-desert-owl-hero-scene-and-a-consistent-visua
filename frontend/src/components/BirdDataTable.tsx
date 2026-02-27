import React, { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActor';
import {
  useGetAllBirdData,
  useAddBirdWithDetails,
  useDeleteBirdData,
  useSaveChanges,
} from '../hooks/useQueries';
import { BirdData, LocationEntry } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Loader2, Plus, Pencil, Save, Trash2, FileText, Download } from 'lucide-react';
import { exportBirdDataToCSV } from '../lib/csvExport';
import { exportBirdsToExcel } from '../lib/excelExport';
import { exportBirdsToPDF } from '../lib/pdfExport';

interface EditingRow {
  birdName: string;
  data: BirdData;
}

export default function BirdDataTable() {
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);

  const principalStr = identity?.getPrincipal().toString() ?? null;

  useEffect(() => {
    let cancelled = false;

    const checkAdmin = async () => {
      if (!actor || actorFetching || !principalStr) {
        setIsAdmin(false);
        return;
      }
      setIsCheckingAdmin(true);
      try {
        const result = await actor.isCallerAdmin();
        if (!cancelled) {
          setIsAdmin(result);
        }
      } catch {
        if (!cancelled) setIsAdmin(false);
      } finally {
        if (!cancelled) setIsCheckingAdmin(false);
      }
    };

    checkAdmin();
    return () => { cancelled = true; };
  }, [actor, actorFetching, principalStr]);

  const { data: allBirdData, isLoading } = useGetAllBirdData();
  const addBirdWithDetails = useAddBirdWithDetails();
  const deleteBirdData = useDeleteBirdData();
  const saveChanges = useSaveChanges();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [editingRow, setEditingRow] = useState<EditingRow | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [newBird, setNewBird] = useState({
    arabicName: '',
    scientificName: '',
    englishName: '',
    localName: '',
    description: '',
    notes: '',
    latitude: '',
    longitude: '',
    mountainName: '',
    valleyName: '',
    governorate: '',
    location: '',
  });

  const birdList: [string, BirdData][] = allBirdData ?? [];

  const filtered = birdList.filter(([, bird]) => {
    const term = searchTerm.toLowerCase();
    return (
      bird.arabicName.toLowerCase().includes(term) ||
      bird.scientificName.toLowerCase().includes(term) ||
      bird.englishName.toLowerCase().includes(term) ||
      bird.localName.toLowerCase().includes(term) ||
      bird.locations.some(
        (loc) =>
          loc.governorate.toLowerCase().includes(term) ||
          loc.mountainName.toLowerCase().includes(term) ||
          loc.valleyName.toLowerCase().includes(term) ||
          loc.location.toLowerCase().includes(term)
      )
    );
  });

  const sorted = [...filtered].sort(([, birdA], [, birdB]) => {
    if (!sortField) return 0;
    let valA = '';
    let valB = '';
    if (sortField === 'arabicName') { valA = birdA.arabicName; valB = birdB.arabicName; }
    else if (sortField === 'scientificName') { valA = birdA.scientificName; valB = birdB.scientificName; }
    else if (sortField === 'englishName') { valA = birdA.englishName; valB = birdB.englishName; }
    else if (sortField === 'localName') { valA = birdA.localName; valB = birdB.localName; }
    else if (sortField === 'governorate') {
      valA = birdA.locations[0]?.governorate ?? '';
      valB = birdB.locations[0]?.governorate ?? '';
    }
    else if (sortField === 'hemisphere') {
      valA = (birdA.locations[0]?.coordinate?.latitude ?? 0) >= 0 ? 'Northern' : 'Southern';
      valB = (birdB.locations[0]?.coordinate?.latitude ?? 0) >= 0 ? 'Northern' : 'Southern';
    }
    const cmp = valA.localeCompare(valB, 'ar');
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleAddBird = async () => {
    if (!newBird.arabicName.trim()) {
      toast.error('الاسم العربي مطلوب');
      return;
    }
    setIsSaving(true);
    try {
      await addBirdWithDetails.mutateAsync({
        arabicName: newBird.arabicName,
        scientificName: newBird.scientificName,
        englishName: newBird.englishName,
        description: newBird.description,
        notes: newBird.notes,
        latitude: parseFloat(newBird.latitude) || 0,
        longitude: parseFloat(newBird.longitude) || 0,
        mountainName: newBird.mountainName,
        valleyName: newBird.valleyName,
        governorate: newBird.governorate,
        locationDesc: newBird.location,
        audioFilePath: null,
        subImages: [],
      });
      toast.success('تم إضافة الطائر بنجاح');
      setShowAddDialog(false);
      setNewBird({
        arabicName: '', scientificName: '', englishName: '', localName: '',
        description: '', notes: '', latitude: '', longitude: '',
        mountainName: '', valleyName: '', governorate: '', location: '',
      });
    } catch (e: any) {
      toast.error('فشل في إضافة الطائر: ' + (e?.message ?? ''));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSave = async () => {
    if (!editingRow) return;
    setIsSaving(true);
    try {
      await saveChanges.mutateAsync({
        birdName: editingRow.birdName,
        updatedData: editingRow.data,
      });
      toast.success('تم حفظ التعديلات بنجاح');
      setShowEditDialog(false);
      setEditingRow(null);
    } catch (e: any) {
      toast.error('فشل في حفظ التعديلات: ' + (e?.message ?? ''));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (birdName: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف "${birdName}"؟`)) return;
    setIsDeleting(birdName);
    try {
      await deleteBirdData.mutateAsync(birdName);
      toast.success('تم حذف الطائر بنجاح');
    } catch (e: any) {
      toast.error('فشل في الحذف: ' + (e?.message ?? ''));
    } finally {
      setIsDeleting(null);
    }
  };

  const openEdit = (birdName: string, bird: BirdData) => {
    setEditingRow({ birdName, data: { ...bird } });
    setShowEditDialog(true);
  };

  const SortIcon = ({ field }: { field: string }) => (
    <span className="mr-1 text-xs opacity-60">
      {sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
        <span className="mr-2 text-muted-foreground">جاري تحميل البيانات...</span>
      </div>
    );
  }

  return (
    <div dir="rtl" className="w-full space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <Input
          placeholder="بحث..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs text-sm"
        />
        <div className="flex flex-wrap gap-2">
          {isAdmin && !isCheckingAdmin && (
            <Button
              size="sm"
              onClick={() => setShowAddDialog(true)}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              إضافة
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportBirdDataToCSV(birdList.map(([, b]) => b))}
            className="gap-1"
          >
            <Download className="w-4 h-4" />
            CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportBirdsToExcel(birdList.map(([, b]) => b))}
            className="gap-1"
          >
            <FileText className="w-4 h-4" />
            Excel
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportBirdsToPDF(birdList.map(([, b]) => b))}
            className="gap-1"
          >
            <FileText className="w-4 h-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table className="min-w-[900px] text-sm">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right cursor-pointer whitespace-nowrap" onClick={() => handleSort('arabicName')}>
                <SortIcon field="arabicName" />الاسم العربي
              </TableHead>
              <TableHead className="text-right cursor-pointer whitespace-nowrap" onClick={() => handleSort('localName')}>
                <SortIcon field="localName" />الاسم المحلي
              </TableHead>
              <TableHead className="text-right cursor-pointer whitespace-nowrap" onClick={() => handleSort('scientificName')}>
                <SortIcon field="scientificName" />الاسم العلمي
              </TableHead>
              <TableHead className="text-right cursor-pointer whitespace-nowrap" onClick={() => handleSort('englishName')}>
                <SortIcon field="englishName" />الاسم الإنجليزي
              </TableHead>
              <TableHead className="text-right cursor-pointer whitespace-nowrap" onClick={() => handleSort('governorate')}>
                <SortIcon field="governorate" />الولاية
              </TableHead>
              <TableHead className="text-right cursor-pointer whitespace-nowrap" onClick={() => handleSort('hemisphere')}>
                <SortIcon field="hemisphere" />Northern Hemisphere
              </TableHead>
              <TableHead className="text-right whitespace-nowrap">الإحداثيات</TableHead>
              <TableHead className="text-right whitespace-nowrap">المواقع</TableHead>
              {isAdmin && !isCheckingAdmin && (
                <TableHead className="text-right whitespace-nowrap">الإجراءات</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin && !isCheckingAdmin ? 9 : 8} className="text-center text-muted-foreground py-10">
                  لا توجد بيانات
                </TableCell>
              </TableRow>
            ) : (
              sorted.map(([birdName, bird]) => {
                const firstLoc: LocationEntry | undefined = bird.locations[0];
                const lat = firstLoc?.coordinate?.latitude ?? 0;
                const isNorthern = lat >= 0;
                return (
                  <TableRow key={birdName} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium whitespace-nowrap">{bird.arabicName}</TableCell>
                    <TableCell className="whitespace-nowrap">{bird.localName || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap italic">{bird.scientificName || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap">{bird.englishName || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap">{firstLoc?.governorate || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isNorthern ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'}`}>
                        {isNorthern ? 'Northern' : 'Southern'}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {firstLoc ? `${firstLoc.coordinate.latitude.toFixed(4)}, ${firstLoc.coordinate.longitude.toFixed(4)}` : '—'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
                        {bird.locations.length}
                      </span>
                    </TableCell>
                    {isAdmin && !isCheckingAdmin && (
                      <TableCell className="whitespace-nowrap">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(birdName, bird)}
                            className="h-7 px-2 text-xs gap-1"
                          >
                            <Pencil className="w-3 h-3" />
                            تعديل
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(birdName, bird)}
                            className="h-7 px-2 text-xs gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            تحرير
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(birdName)}
                            disabled={isDeleting === birdName}
                            className="h-7 px-2 text-xs gap-1"
                          >
                            {isDeleting === birdName ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            حذف
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Bird Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة طائر جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">الاسم العربي *</label>
                <Input value={newBird.arabicName} onChange={e => setNewBird(p => ({ ...p, arabicName: e.target.value }))} placeholder="الاسم العربي" />
              </div>
              <div>
                <label className="text-sm font-medium">الاسم المحلي</label>
                <Input value={newBird.localName} onChange={e => setNewBird(p => ({ ...p, localName: e.target.value }))} placeholder="الاسم المحلي" />
              </div>
              <div>
                <label className="text-sm font-medium">الاسم العلمي</label>
                <Input value={newBird.scientificName} onChange={e => setNewBird(p => ({ ...p, scientificName: e.target.value }))} placeholder="الاسم العلمي" />
              </div>
              <div>
                <label className="text-sm font-medium">الاسم الإنجليزي</label>
                <Input value={newBird.englishName} onChange={e => setNewBird(p => ({ ...p, englishName: e.target.value }))} placeholder="الاسم الإنجليزي" />
              </div>
              <div>
                <label className="text-sm font-medium">خط العرض</label>
                <Input type="number" value={newBird.latitude} onChange={e => setNewBird(p => ({ ...p, latitude: e.target.value }))} placeholder="23.5" />
              </div>
              <div>
                <label className="text-sm font-medium">خط الطول</label>
                <Input type="number" value={newBird.longitude} onChange={e => setNewBird(p => ({ ...p, longitude: e.target.value }))} placeholder="56.2" />
              </div>
              <div>
                <label className="text-sm font-medium">الولاية</label>
                <Input value={newBird.governorate} onChange={e => setNewBird(p => ({ ...p, governorate: e.target.value }))} placeholder="الولاية" />
              </div>
              <div>
                <label className="text-sm font-medium">الموقع</label>
                <Input value={newBird.location} onChange={e => setNewBird(p => ({ ...p, location: e.target.value }))} placeholder="الموقع" />
              </div>
              <div>
                <label className="text-sm font-medium">اسم الجبل</label>
                <Input value={newBird.mountainName} onChange={e => setNewBird(p => ({ ...p, mountainName: e.target.value }))} placeholder="اسم الجبل" />
              </div>
              <div>
                <label className="text-sm font-medium">اسم الوادي</label>
                <Input value={newBird.valleyName} onChange={e => setNewBird(p => ({ ...p, valleyName: e.target.value }))} placeholder="اسم الوادي" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">الوصف</label>
              <Input value={newBird.description} onChange={e => setNewBird(p => ({ ...p, description: e.target.value }))} placeholder="الوصف" />
            </div>
            <div>
              <label className="text-sm font-medium">ملاحظات</label>
              <Input value={newBird.notes} onChange={e => setNewBird(p => ({ ...p, notes: e.target.value }))} placeholder="ملاحظات" />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-4">
            <DialogClose asChild>
              <Button variant="outline">إلغاء</Button>
            </DialogClose>
            <Button onClick={handleAddBird} disabled={isSaving} className="gap-1">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bird Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل بيانات الطائر</DialogTitle>
          </DialogHeader>
          {editingRow && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">الاسم العربي</label>
                  <Input
                    value={editingRow.data.arabicName}
                    onChange={e => setEditingRow(r => r ? { ...r, data: { ...r.data, arabicName: e.target.value } } : null)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">الاسم المحلي</label>
                  <Input
                    value={editingRow.data.localName}
                    onChange={e => setEditingRow(r => r ? { ...r, data: { ...r.data, localName: e.target.value } } : null)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">الاسم العلمي</label>
                  <Input
                    value={editingRow.data.scientificName}
                    onChange={e => setEditingRow(r => r ? { ...r, data: { ...r.data, scientificName: e.target.value } } : null)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">الاسم الإنجليزي</label>
                  <Input
                    value={editingRow.data.englishName}
                    onChange={e => setEditingRow(r => r ? { ...r, data: { ...r.data, englishName: e.target.value } } : null)}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">الوصف</label>
                <Input
                  value={editingRow.data.description}
                  onChange={e => setEditingRow(r => r ? { ...r, data: { ...r.data, description: e.target.value } } : null)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">ملاحظات</label>
                <Input
                  value={editingRow.data.notes}
                  onChange={e => setEditingRow(r => r ? { ...r, data: { ...r.data, notes: e.target.value } } : null)}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 mt-4">
            <DialogClose asChild>
              <Button variant="outline">إلغاء</Button>
            </DialogClose>
            <Button onClick={handleEditSave} disabled={isSaving} className="gap-1">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
