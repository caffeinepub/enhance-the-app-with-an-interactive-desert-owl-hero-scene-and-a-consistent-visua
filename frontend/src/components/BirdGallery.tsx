import React, { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit, Trash2, X, Play, Pause, Image as ImageIcon, Music, Upload, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetAllBirdDetails } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { useFileUpload, useFileUrl } from '../blob-storage/FileStorage';
import { BirdData } from '../backend';
import { toast } from 'sonner';

// ---- Bird Card Image Component ----
function BirdCardImage({ path, alt }: { path: string; alt: string }) {
  const { data: url } = useFileUrl(path);
  if (!url) return (
    <div className="w-full h-48 bg-amber-50 flex items-center justify-center">
      <ImageIcon className="w-12 h-12 text-amber-200" />
    </div>
  );
  return <img src={url} alt={alt} className="w-full h-48 object-cover" />;
}

// ---- Audio Player Component ----
function AudioPlayer({ path }: { path: string }) {
  const { data: url } = useFileUrl(path);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  if (!url) return null;

  return (
    <div className="flex items-center gap-2">
      <audio ref={audioRef} src={url} onEnded={() => setPlaying(false)} />
      <button
        onClick={toggle}
        className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-full transition-colors"
      >
        {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        <span>{playing ? 'إيقاف' : 'تشغيل الصوت'}</span>
      </button>
    </div>
  );
}

// ---- File Upload Preview ----
function FilePreview({ file, type }: { file: File; type: 'image' | 'audio' }) {
  const [previewUrl] = useState(() => URL.createObjectURL(file));
  if (type === 'image') {
    return <img src={previewUrl} alt="معاينة" className="w-full h-32 object-cover rounded border border-amber-200 mt-1" />;
  }
  return <audio controls src={previewUrl} className="w-full mt-1" />;
}

// ---- Main BirdGallery Component ----
export default function BirdGallery() {
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { uploadFile, isUploading } = useFileUpload();

  const { data: allBirds = [], isLoading, error, refetch } = useGetAllBirdDetails();

  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBird, setSelectedBird] = useState<BirdData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Add dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({
    arabicName: '', scientificName: '', englishName: '',
    description: '', notes: '',
    latitude: '', longitude: '',
    mountainName: '', valleyName: '', governorate: '', locationDesc: '',
  });
  const [addImageFile, setAddImageFile] = useState<File | null>(null);
  const [addAudioFile, setAddAudioFile] = useState<File | null>(null);
  const [isAddSubmitting, setIsAddSubmitting] = useState(false);

  // Edit dialog state
  const [editingBird, setEditingBird] = useState<BirdData | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    arabicName: '', scientificName: '', englishName: '',
    description: '', notes: '',
  });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editAudioFile, setEditAudioFile] = useState<File | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Delete dialog state
  const [deletingBird, setDeletingBird] = useState<BirdData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  // Check admin status
  useEffect(() => {
    if (!actor || !identity) {
      setIsAdmin(false);
      return;
    }
    actor.isCallerAdmin().then(setIsAdmin).catch(() => setIsAdmin(false));
  }, [actor, identity]);

  const filteredBirds = allBirds.filter(([, bird]) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      bird.arabicName?.toLowerCase().includes(term) ||
      bird.englishName?.toLowerCase().includes(term) ||
      bird.scientificName?.toLowerCase().includes(term)
    );
  });

  // ---- Handlers ----
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
    refetch();
  };

  const handleViewBird = (bird: BirdData) => {
    setSelectedBird(bird);
    setShowDetailModal(true);
  };

  // Add bird
  const handleAddOpen = () => {
    setAddForm({
      arabicName: '', scientificName: '', englishName: '',
      description: '', notes: '',
      latitude: '', longitude: '',
      mountainName: '', valleyName: '', governorate: '', locationDesc: '',
    });
    setAddImageFile(null);
    setAddAudioFile(null);
    setShowAddDialog(true);
  };

  const handleAddSubmit = async () => {
    if (!actor || !addForm.arabicName.trim()) {
      toast.error('يرجى إدخال اسم الطائر');
      return;
    }
    setIsAddSubmitting(true);
    try {
      let mainImagePath: string | null = null;
      let audioFilePath: string | null = null;

      if (addImageFile) {
        const safeName = addForm.arabicName.replace(/\s+/g, '_');
        const ext = addImageFile.name.split('.').pop() || 'jpg';
        const { path } = await uploadFile(`birds/${safeName}/main.${ext}`, addImageFile);
        mainImagePath = path;
      }

      if (addAudioFile) {
        const safeName = addForm.arabicName.replace(/\s+/g, '_');
        const ext = addAudioFile.name.split('.').pop() || 'mp3';
        const { path } = await uploadFile(`birds/${safeName}/audio.${ext}`, addAudioFile);
        audioFilePath = path;
      }

      await actor.addBirdWithDetails(
        addForm.arabicName,
        addForm.scientificName,
        addForm.englishName,
        addForm.description,
        addForm.notes,
        parseFloat(addForm.latitude) || 0,
        parseFloat(addForm.longitude) || 0,
        addForm.mountainName,
        addForm.valleyName,
        addForm.governorate,
        addForm.locationDesc,
        audioFilePath,
        [],
        mainImagePath,
      );

      toast.success('تم إضافة الطائر بنجاح');
      setShowAddDialog(false);
      // Invalidate and refetch gallery immediately
      await queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
      refetch();
    } catch (err: any) {
      toast.error('حدث خطأ أثناء إضافة الطائر: ' + (err?.message || ''));
    } finally {
      setIsAddSubmitting(false);
    }
  };

  // Edit bird
  const handleEditOpen = (bird: BirdData) => {
    setEditingBird(bird);
    setEditForm({
      arabicName: bird.arabicName || '',
      scientificName: bird.scientificName || '',
      englishName: bird.englishName || '',
      description: bird.description || '',
      notes: bird.notes || '',
    });
    setEditImageFile(null);
    setEditAudioFile(null);
    setShowEditDialog(true);
  };

  const handleEditClose = () => {
    setShowEditDialog(false);
    setEditingBird(null);
    setEditImageFile(null);
    setEditAudioFile(null);
  };

  const handleEditSubmit = async () => {
    if (!actor || !editingBird) return;
    setIsEditSubmitting(true);
    try {
      let mainImagePath: string | undefined = editingBird.mainImage;
      let audioFilePath: string | undefined = editingBird.audioFile;

      if (editImageFile) {
        const safeName = editForm.arabicName.replace(/\s+/g, '_');
        const ext = editImageFile.name.split('.').pop() || 'jpg';
        const { path } = await uploadFile(`birds/${safeName}/main_${Date.now()}.${ext}`, editImageFile);
        mainImagePath = path;
      }

      if (editAudioFile) {
        const safeName = editForm.arabicName.replace(/\s+/g, '_');
        const ext = editAudioFile.name.split('.').pop() || 'mp3';
        const { path } = await uploadFile(`birds/${safeName}/audio_${Date.now()}.${ext}`, editAudioFile);
        audioFilePath = path;
      }

      const updatedBird: BirdData = {
        ...editingBird,
        arabicName: editForm.arabicName,
        scientificName: editForm.scientificName,
        englishName: editForm.englishName,
        description: editForm.description,
        notes: editForm.notes,
        mainImage: mainImagePath,
        audioFile: audioFilePath,
      };

      await actor.saveBirdData(updatedBird);

      toast.success('تم حفظ التعديلات بنجاح');
      handleEditClose();
      // Invalidate and refetch gallery immediately
      await queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
      refetch();
    } catch (err: any) {
      toast.error('حدث خطأ أثناء حفظ التعديلات: ' + (err?.message || ''));
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Delete bird
  const handleDeleteOpen = (bird: BirdData) => {
    setDeletingBird(bird);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!actor || !deletingBird) return;
    setIsDeleteSubmitting(true);
    try {
      await actor.deleteBirdData(deletingBird.arabicName);
      toast.success('تم حذف الطائر بنجاح');
      setShowDeleteDialog(false);
      setDeletingBird(null);
      await queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
      refetch();
    } catch (err: any) {
      toast.error('حدث خطأ أثناء الحذف: ' + (err?.message || ''));
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  // ---- Render ----
  return (
    <div className="min-h-screen bg-amber-50 font-arabic" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-amber-900 to-amber-700 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">معرض الطيور</h1>
          <p className="text-amber-200 text-sm">استعرض وأدر بيانات الطيور في محافظة البريمي</p>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="ابحث عن طائر..."
              className="pr-10 border-amber-200 focus:border-amber-400 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              تحديث
            </Button>
            {isAdmin && (
              <Button
                size="sm"
                onClick={handleAddOpen}
                className="bg-amber-700 hover:bg-amber-800 text-white gap-1"
              >
                <Plus className="w-4 h-4" />
                إضافة طائر
              </Button>
            )}
          </div>
        </div>

        {/* Loading / Error / Empty */}
        {isLoading && (
          <div className="text-center py-16 text-amber-700">
            <div className="animate-spin w-8 h-8 border-4 border-amber-300 border-t-amber-700 rounded-full mx-auto mb-3" />
            جاري التحميل...
          </div>
        )}
        {error && (
          <div className="text-center py-16 text-red-600">
            حدث خطأ أثناء تحميل البيانات
            <Button variant="outline" size="sm" onClick={handleRefresh} className="mr-3">إعادة المحاولة</Button>
          </div>
        )}
        {!isLoading && !error && filteredBirds.length === 0 && (
          <div className="text-center py-16 text-amber-600">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-amber-300" />
            <p className="text-lg">لا توجد طيور مسجلة</p>
            {searchTerm && <p className="text-sm mt-1">لا توجد نتائج للبحث عن "{searchTerm}"</p>}
          </div>
        )}

        {/* Bird Grid */}
        {!isLoading && !error && filteredBirds.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredBirds.map(([key, bird]) => (
              <div
                key={key}
                className="bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden hover:shadow-md transition-shadow group"
              >
                {/* Image */}
                <div className="relative">
                  {bird.mainImage ? (
                    <BirdCardImage path={bird.mainImage} alt={bird.arabicName} />
                  ) : bird.subImages && bird.subImages.length > 0 ? (
                    <BirdCardImage path={bird.subImages[0]} alt={bird.arabicName} />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
                      <ImageIcon className="w-14 h-14 text-amber-200" />
                    </div>
                  )}
                  {/* Admin action buttons overlay */}
                  {isAdmin && (
                    <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditOpen(bird); }}
                        className="bg-white/90 hover:bg-amber-50 text-amber-700 rounded-full p-1.5 shadow-sm border border-amber-200 transition-colors"
                        title="تعديل"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteOpen(bird); }}
                        className="bg-white/90 hover:bg-red-50 text-red-600 rounded-full p-1.5 shadow-sm border border-red-200 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-3">
                  <h3 className="font-bold text-amber-900 text-base mb-0.5 truncate">{bird.arabicName}</h3>
                  {bird.englishName && (
                    <p className="text-xs text-amber-600 truncate mb-0.5">{bird.englishName}</p>
                  )}
                  {bird.scientificName && (
                    <p className="text-xs text-gray-400 italic truncate mb-1">{bird.scientificName}</p>
                  )}
                  {bird.description && (
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">{bird.description}</p>
                  )}

                  {/* Audio */}
                  {bird.audioFile && (
                    <div className="mb-2">
                      <AudioPlayer path={bird.audioFile} />
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-50">
                    <span className="text-xs text-amber-500">
                      {bird.locations?.length || 0} موقع
                    </span>
                    <button
                      onClick={() => handleViewBird(bird)}
                      className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      عرض
                    </button>
                  </div>

                  {/* Admin edit/delete buttons — always visible for admin */}
                  {isAdmin && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-amber-50">
                      <button
                        onClick={() => handleEditOpen(bird)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 py-1 rounded transition-colors"
                      >
                        <Edit className="w-3 h-3" />
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDeleteOpen(bird)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 py-1 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        حذف
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---- Detail Modal ---- */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-amber-900 text-xl">{selectedBird?.arabicName}</DialogTitle>
            {selectedBird?.scientificName && (
              <DialogDescription className="italic text-gray-500">{selectedBird.scientificName}</DialogDescription>
            )}
          </DialogHeader>
          {selectedBird && (
            <div className="space-y-4">
              {(selectedBird.mainImage || (selectedBird.subImages && selectedBird.subImages.length > 0)) && (
                <BirdCardImage
                  path={selectedBird.mainImage || selectedBird.subImages[0]}
                  alt={selectedBird.arabicName}
                />
              )}
              {selectedBird.englishName && (
                <div>
                  <span className="text-xs font-semibold text-amber-700">الاسم الإنجليزي: </span>
                  <span className="text-sm">{selectedBird.englishName}</span>
                </div>
              )}
              {selectedBird.description && (
                <div>
                  <p className="text-xs font-semibold text-amber-700 mb-1">الوصف:</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedBird.description}</p>
                </div>
              )}
              {selectedBird.notes && (
                <div>
                  <p className="text-xs font-semibold text-amber-700 mb-1">ملاحظات:</p>
                  <p className="text-sm text-gray-600">{selectedBird.notes}</p>
                </div>
              )}
              {selectedBird.audioFile && (
                <div>
                  <p className="text-xs font-semibold text-amber-700 mb-1">الصوت:</p>
                  <AudioPlayer path={selectedBird.audioFile} />
                </div>
              )}
              {selectedBird.locations && selectedBird.locations.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-700 mb-2">المواقع ({selectedBird.locations.length}):</p>
                  <div className="space-y-2">
                    {selectedBird.locations.map((loc, i) => (
                      <div key={i} className="bg-amber-50 rounded p-2 text-xs">
                        <div className="flex gap-4">
                          <span>خط العرض: {loc.coordinate.latitude.toFixed(4)}</span>
                          <span>خط الطول: {loc.coordinate.longitude.toFixed(4)}</span>
                        </div>
                        {loc.governorate && <div>المحافظة: {loc.governorate}</div>}
                        {loc.mountainName && <div>الجبل: {loc.mountainName}</div>}
                        {loc.valleyName && <div>الوادي: {loc.valleyName}</div>}
                        {loc.location && <div>الموقع: {loc.location}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ---- Add Bird Dialog ---- */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-amber-900">إضافة طائر جديد</DialogTitle>
            <DialogDescription>أدخل بيانات الطائر الجديد</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-1">
              <Label>الاسم العربي *</Label>
              <Input value={addForm.arabicName} onChange={e => setAddForm(f => ({ ...f, arabicName: e.target.value }))} placeholder="الاسم العربي" className="border-amber-200" />
            </div>
            <div className="space-y-1">
              <Label>الاسم الإنجليزي</Label>
              <Input value={addForm.englishName} onChange={e => setAddForm(f => ({ ...f, englishName: e.target.value }))} placeholder="English Name" className="border-amber-200" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>الاسم العلمي</Label>
              <Input value={addForm.scientificName} onChange={e => setAddForm(f => ({ ...f, scientificName: e.target.value }))} placeholder="Scientific Name" className="border-amber-200" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>الوصف</Label>
              <Textarea value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف الطائر" className="border-amber-200" rows={3} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>ملاحظات</Label>
              <Textarea value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} placeholder="ملاحظات إضافية" className="border-amber-200" rows={2} />
            </div>
            <div className="space-y-1">
              <Label>خط العرض</Label>
              <Input type="number" value={addForm.latitude} onChange={e => setAddForm(f => ({ ...f, latitude: e.target.value }))} placeholder="23.0000" className="border-amber-200" />
            </div>
            <div className="space-y-1">
              <Label>خط الطول</Label>
              <Input type="number" value={addForm.longitude} onChange={e => setAddForm(f => ({ ...f, longitude: e.target.value }))} placeholder="56.0000" className="border-amber-200" />
            </div>
            <div className="space-y-1">
              <Label>المحافظة</Label>
              <Input value={addForm.governorate} onChange={e => setAddForm(f => ({ ...f, governorate: e.target.value }))} placeholder="المحافظة" className="border-amber-200" />
            </div>
            <div className="space-y-1">
              <Label>الجبل</Label>
              <Input value={addForm.mountainName} onChange={e => setAddForm(f => ({ ...f, mountainName: e.target.value }))} placeholder="اسم الجبل" className="border-amber-200" />
            </div>
            <div className="space-y-1">
              <Label>الوادي</Label>
              <Input value={addForm.valleyName} onChange={e => setAddForm(f => ({ ...f, valleyName: e.target.value }))} placeholder="اسم الوادي" className="border-amber-200" />
            </div>
            <div className="space-y-1">
              <Label>وصف الموقع</Label>
              <Input value={addForm.locationDesc} onChange={e => setAddForm(f => ({ ...f, locationDesc: e.target.value }))} placeholder="وصف الموقع" className="border-amber-200" />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={isAddSubmitting} className="border-amber-300">إلغاء</Button>
            <Button onClick={handleAddSubmit} disabled={isAddSubmitting || isUploading} className="bg-amber-700 hover:bg-amber-800 text-white">
              {isAddSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  جاري الحفظ...
                </span>
              ) : 'حفظ الطائر'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Edit Bird Dialog ---- */}
      <Dialog open={showEditDialog} onOpenChange={(open) => { if (!open) handleEditClose(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-amber-900">تعديل بيانات الطائر</DialogTitle>
            <DialogDescription>تعديل معلومات الطائر: {editingBird?.arabicName}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-1">
              <Label>الاسم العربي *</Label>
              <Input value={editForm.arabicName} onChange={e => setEditForm(f => ({ ...f, arabicName: e.target.value }))} placeholder="الاسم العربي" className="border-amber-200" />
            </div>
            <div className="space-y-1">
              <Label>الاسم الإنجليزي</Label>
              <Input value={editForm.englishName} onChange={e => setEditForm(f => ({ ...f, englishName: e.target.value }))} placeholder="English Name" className="border-amber-200" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>الاسم العلمي</Label>
              <Input value={editForm.scientificName} onChange={e => setEditForm(f => ({ ...f, scientificName: e.target.value }))} placeholder="Scientific Name" className="border-amber-200" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>الوصف</Label>
              <Textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف الطائر" className="border-amber-200" rows={3} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>ملاحظات</Label>
              <Textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} placeholder="ملاحظات إضافية" className="border-amber-200" rows={2} />
            </div>

            {/* Image Upload */}
            <div className="space-y-2 sm:col-span-2">
              <Label className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                تغيير الصورة الرئيسية
              </Label>
              <div className="border-2 border-dashed border-amber-200 rounded-lg p-3 bg-amber-50/50">
                {editingBird?.mainImage && !editImageFile && (
                  <div className="mb-2">
                    <p className="text-xs text-amber-600 mb-1">الصورة الحالية:</p>
                    <BirdCardImage path={editingBird.mainImage} alt="الصورة الحالية" />
                  </div>
                )}
                {editImageFile && (
                  <div className="mb-2">
                    <p className="text-xs text-green-600 mb-1">الصورة الجديدة (معاينة):</p>
                    <FilePreview file={editImageFile} type="image" />
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer text-sm text-amber-700 hover:text-amber-900">
                  <Upload className="w-4 h-4" />
                  <span>{editImageFile ? 'تغيير الصورة' : 'رفع صورة جديدة'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={e => setEditImageFile(e.target.files?.[0] || null)}
                  />
                </label>
                {editImageFile && (
                  <button
                    onClick={() => setEditImageFile(null)}
                    className="mt-1 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> إلغاء تغيير الصورة
                  </button>
                )}
                <p className="text-xs text-gray-400 mt-1">يدعم: JPG, PNG, WebP</p>
              </div>
            </div>

            {/* Audio Upload */}
            <div className="space-y-2 sm:col-span-2">
              <Label className="flex items-center gap-2">
                <Music className="w-4 h-4 text-amber-600" />
                تغيير الملف الصوتي
              </Label>
              <div className="border-2 border-dashed border-amber-200 rounded-lg p-3 bg-amber-50/50">
                {editingBird?.audioFile && !editAudioFile && (
                  <div className="mb-2">
                    <p className="text-xs text-amber-600 mb-1">الصوت الحالي:</p>
                    <AudioPlayer path={editingBird.audioFile} />
                  </div>
                )}
                {editAudioFile && (
                  <div className="mb-2">
                    <p className="text-xs text-green-600 mb-1">الصوت الجديد (معاينة):</p>
                    <FilePreview file={editAudioFile} type="audio" />
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer text-sm text-amber-700 hover:text-amber-900">
                  <Upload className="w-4 h-4" />
                  <span>{editAudioFile ? 'تغيير الملف الصوتي' : 'رفع ملف صوتي جديد'}</span>
                  <input
                    type="file"
                    accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/*"
                    className="hidden"
                    onChange={e => setEditAudioFile(e.target.files?.[0] || null)}
                  />
                </label>
                {editAudioFile && (
                  <button
                    onClick={() => setEditAudioFile(null)}
                    className="mt-1 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> إلغاء تغيير الصوت
                  </button>
                )}
                <p className="text-xs text-gray-400 mt-1">يدعم: MP3, WAV, OGG</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button variant="outline" onClick={handleEditClose} disabled={isEditSubmitting} className="border-amber-300">إلغاء</Button>
            <Button onClick={handleEditSubmit} disabled={isEditSubmitting || isUploading} className="bg-amber-700 hover:bg-amber-800 text-white">
              {isEditSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  جاري الحفظ...
                </span>
              ) : 'حفظ التعديلات'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Delete Confirm Dialog ---- */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-red-700">تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف الطائر "{deletingBird?.arabicName}"؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleteSubmitting} className="border-amber-300">إلغاء</Button>
            <Button onClick={handleDeleteConfirm} disabled={isDeleteSubmitting} variant="destructive">
              {isDeleteSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  جاري الحذف...
                </span>
              ) : 'حذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
