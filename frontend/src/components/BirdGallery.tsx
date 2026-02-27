import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActor';
import {
  useGetAllBirdDetails,
  useDeleteBirdData,
  useUpdateBirdDetails,
  useAddBirdWithDetails,
  useAddAudioFile,
} from '../hooks/useQueries';
import { BirdData } from '../backend';
import { useFileUpload, useFileUrl } from '../blob-storage/FileStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, Save, Trash2, Pencil, Music, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

// ---- Sub-components ----

interface BirdCardImageProps {
  path: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

function BirdCardImage({ path, alt, className, onClick }: BirdCardImageProps) {
  const { data: url } = useFileUrl(path);
  if (!url) {
    return (
      <div className={`bg-amber-100 flex items-center justify-center ${className ?? ''}`}>
        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      className={className}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    />
  );
}

interface ImageModalProps {
  images: string[];
  initialIndex: number;
  birdName: string;
  onClose: () => void;
}

function ImageModal({ images, initialIndex, birdName, onClose }: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentPath = images[currentIndex];
  const { data: url } = useFileUrl(currentPath);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 left-2 z-10 bg-black/50 text-white rounded-full p-1 hover:bg-black/80"
        >
          <X className="w-5 h-5" />
        </button>
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((i) => (i - 1 + images.length) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-black/80"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentIndex((i) => (i + 1) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-black/80"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </>
        )}
        {url ? (
          <img src={url} alt={birdName} className="w-full max-h-[80vh] object-contain rounded-lg" />
        ) : (
          <div className="flex items-center justify-center h-64 bg-amber-900/20 rounded-lg">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          </div>
        )}
        <div className="text-center text-white mt-2 text-sm">
          {birdName} — {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}

interface BirdCardProps {
  birdKey: string;
  bird: BirdData;
  isAdmin: boolean;
  onDelete: (name: string) => void;
  onSave: (key: string, bird: BirdData) => Promise<void>;
  onImageClick: (images: string[], index: number, birdName: string) => void;
}

function BirdCard({ birdKey, bird, isAdmin, onDelete, onSave, onImageClick }: BirdCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<BirdData>(bird);
  const [isSaving, setIsSaving] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useFileUpload();
  const addAudioMutation = useAddAudioFile();

  const mainImage = bird.subImages[0];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(birdKey, editData);
      setIsEditing(false);
    } catch {
      // error handled in parent
    } finally {
      setIsSaving(false);
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const ext = file.name.split('.').pop() ?? 'mp3';
      const path = `audio/${bird.arabicName}-${Date.now()}.${ext}`;
      await uploadFile(path, file);
      await addAudioMutation.mutateAsync({ birdName: bird.arabicName, audioFilePath: path });
      toast.success('تم رفع الصوت بنجاح');
    } catch {
      toast.error('فشل رفع الصوت');
    }
    if (audioInputRef.current) audioInputRef.current.value = '';
  };

  return (
    <div
      dir="rtl"
      className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="relative h-44 bg-amber-50">
        {mainImage ? (
          <BirdCardImage
            path={mainImage}
            alt={bird.arabicName}
            className="w-full h-full object-cover"
            onClick={() => onImageClick(bird.subImages, 0, bird.arabicName)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-amber-300">
            <span className="text-4xl">🦅</span>
          </div>
        )}
        {bird.subImages.length > 1 && (
          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
            {bird.subImages.length} صور
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex-1 flex flex-col gap-1">
        {isEditing ? (
          <>
            <Input
              value={editData.arabicName}
              onChange={(e) => setEditData((p) => ({ ...p, arabicName: e.target.value }))}
              className="text-right border-amber-300 font-bold text-amber-900 mb-1"
              placeholder="الاسم العربي"
            />
            <Input
              value={editData.scientificName}
              onChange={(e) => setEditData((p) => ({ ...p, scientificName: e.target.value }))}
              className="border-amber-300 text-gray-600 italic text-sm mb-1"
              placeholder="Scientific name"
            />
            <Input
              value={editData.englishName}
              onChange={(e) => setEditData((p) => ({ ...p, englishName: e.target.value }))}
              className="border-amber-300 text-gray-600 text-sm mb-1"
              placeholder="English name"
            />
            <Input
              value={editData.description}
              onChange={(e) => setEditData((p) => ({ ...p, description: e.target.value }))}
              className="text-right border-amber-300 text-sm"
              placeholder="الوصف"
            />
          </>
        ) : (
          <>
            <h3 className="font-bold text-amber-900 text-base leading-tight">{bird.arabicName}</h3>
            {bird.scientificName && (
              <p className="text-gray-500 italic text-xs">{bird.scientificName}</p>
            )}
            {bird.englishName && (
              <p className="text-gray-600 text-xs">{bird.englishName}</p>
            )}
            {bird.description && (
              <p className="text-gray-700 text-xs line-clamp-2 mt-1">{bird.description}</p>
            )}
          </>
        )}

        <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
          <span>📍 {bird.locations.length} موقع</span>
          {bird.audioFile && <span>🔊 صوت</span>}
        </div>
      </div>

      {/* Admin Actions */}
      {isAdmin && (
        <div className="px-3 pb-3 flex flex-wrap gap-1">
          {isEditing ? (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 text-white h-7 px-2 text-xs flex-1"
            >
              {isSaving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <><Save className="w-3 h-3 ml-1" />حفظ</>
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setIsEditing(true); setEditData(bird); }}
              className="border-amber-400 text-amber-700 hover:bg-amber-50 h-7 px-2 text-xs flex-1"
            >
              <Pencil className="w-3 h-3 ml-1" />
              تحرير
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(bird.arabicName)}
            className="border-red-400 text-red-600 hover:bg-red-50 h-7 px-2 text-xs"
          >
            <Trash2 className="w-3 h-3" />
            حذف
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => audioInputRef.current?.click()}
            disabled={isUploading || addAudioMutation.isPending}
            className="border-blue-400 text-blue-600 hover:bg-blue-50 h-7 px-2 text-xs"
          >
            {isUploading || addAudioMutation.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <><Music className="w-3 h-3 ml-1" />إضافة الصوت</>
            )}
          </Button>
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleAudioUpload}
          />
        </div>
      )}
    </div>
  );
}

// ---- Add Bird Dialog ----

interface AddBirdDialogProps {
  open: boolean;
  onClose: () => void;
}

function AddBirdDialog({ open, onClose }: AddBirdDialogProps) {
  const [arabicName, setArabicName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [englishName, setEnglishName] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const mainImageRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useFileUpload();
  const addMutation = useAddBirdWithDetails();

  const handleSubmit = async () => {
    if (!arabicName.trim()) {
      toast.error('الاسم العربي مطلوب');
      return;
    }
    try {
      let subImages: string[] = [];
      if (mainImageFile) {
        const ext = mainImageFile.name.split('.').pop() ?? 'jpg';
        const path = `birds/${arabicName}-main-${Date.now()}.${ext}`;
        await uploadFile(path, mainImageFile);
        subImages = [path];
      }
      await addMutation.mutateAsync({
        arabicName,
        scientificName,
        englishName,
        description,
        notes,
        latitude: 0,
        longitude: 0,
        mountainName: '',
        valleyName: '',
        governorate: '',
        locationDesc: '',
        audioFilePath: null,
        subImages,
      });
      toast.success('تم إضافة الطائر بنجاح');
      setArabicName('');
      setScientificName('');
      setEnglishName('');
      setDescription('');
      setNotes('');
      setMainImageFile(null);
      onClose();
    } catch {
      toast.error('فشل إضافة الطائر');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ background: '#fffbf5', border: '2px solid #b45309', direction: 'rtl' }}
      >
        <DialogHeader>
          <DialogTitle className="text-amber-900 text-xl font-bold text-right">
            إضافة طائر جديد
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="block text-amber-900 font-semibold text-sm mb-1">الاسم العربي *</label>
            <Input
              value={arabicName}
              onChange={(e) => setArabicName(e.target.value)}
              className="text-right border-amber-300 bg-white text-gray-900"
              placeholder="أدخل الاسم العربي"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-amber-900 font-semibold text-sm mb-1">الاسم العلمي</label>
              <Input
                value={scientificName}
                onChange={(e) => setScientificName(e.target.value)}
                className="border-amber-300 bg-white text-gray-900"
                placeholder="Scientific name"
              />
            </div>
            <div>
              <label className="block text-amber-900 font-semibold text-sm mb-1">الاسم الإنجليزي</label>
              <Input
                value={englishName}
                onChange={(e) => setEnglishName(e.target.value)}
                className="border-amber-300 bg-white text-gray-900"
                placeholder="English name"
              />
            </div>
          </div>
          <div>
            <label className="block text-amber-900 font-semibold text-sm mb-1">الوصف</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-right border-amber-300 bg-white text-gray-900"
              placeholder="وصف الطائر"
            />
          </div>
          <div>
            <label className="block text-amber-900 font-semibold text-sm mb-1">الملاحظات</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-right border-amber-300 bg-white text-gray-900"
              placeholder="ملاحظات"
            />
          </div>
          <div>
            <label className="block text-amber-900 font-semibold text-sm mb-1">الصورة الرئيسية</label>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => mainImageRef.current?.click()}
              className="border-amber-400 text-amber-700"
            >
              <Plus className="w-4 h-4 ml-1" />
              {mainImageFile ? mainImageFile.name : 'اختر صورة'}
            </Button>
            <input
              ref={mainImageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setMainImageFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
        <div className="flex gap-2 justify-start mt-4">
          <Button
            onClick={handleSubmit}
            disabled={addMutation.isPending || isUploading || !arabicName.trim()}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {(addMutation.isPending || isUploading) ? (
              <Loader2 className="w-4 h-4 animate-spin ml-1" />
            ) : (
              <Plus className="w-4 h-4 ml-1" />
            )}
            إضافة
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-amber-400 text-amber-800"
          >
            إلغاء
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- Main Component ----

export default function BirdGallery() {
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();

  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [imageModal, setImageModal] = useState<{
    images: string[];
    index: number;
    birdName: string;
  } | null>(null);

  const { data: allBirds, isLoading } = useGetAllBirdDetails();
  const deleteMutation = useDeleteBirdData();
  const updateMutation = useUpdateBirdDetails();

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
      bird.englishName.toLowerCase().includes(q)
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

  const handleSave = async (key: string, bird: BirdData): Promise<void> => {
    try {
      await updateMutation.mutateAsync({
        birdName: key,
        arabicName: bird.arabicName,
        scientificName: bird.scientificName,
        englishName: bird.englishName,
        description: bird.description,
        notes: bird.notes,
      });
      toast.success('تم حفظ التعديلات بنجاح');
    } catch {
      toast.error('فشل حفظ التعديلات');
      throw new Error('Save failed');
    }
  };

  return (
    <div dir="rtl" className="w-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
          <Input
            placeholder="بحث في المعرض..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9 text-right border-amber-300 bg-white"
          />
        </div>
        {isAdmin && (
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Plus className="w-4 h-4 ml-1" />
            إضافة
          </Button>
        )}
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-amber-700">
          <Loader2 className="w-8 h-8 animate-spin ml-2" />
          <span className="text-lg">جاري تحميل المعرض...</span>
        </div>
      ) : filteredBirds.length === 0 ? (
        <div className="text-center py-16 text-amber-600">
          {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد صور في المعرض'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBirds.map(([key, bird]) => (
            <BirdCard
              key={key}
              birdKey={key}
              bird={bird}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              onSave={handleSave}
              onImageClick={(images, index, birdName) =>
                setImageModal({ images, index, birdName })
              }
            />
          ))}
        </div>
      )}

      {/* Summary */}
      {!isLoading && (
        <div className="mt-4 text-sm text-amber-700 text-right">
          إجمالي الطيور: <span className="font-bold">{filteredBirds.length}</span>
          {searchQuery && allBirds && (
            <span className="mr-2 text-amber-500">(من أصل {allBirds.length})</span>
          )}
        </div>
      )}

      {/* Image Modal */}
      {imageModal && (
        <ImageModal
          images={imageModal.images}
          initialIndex={imageModal.index}
          birdName={imageModal.birdName}
          onClose={() => setImageModal(null)}
        />
      )}

      {/* Add Bird Dialog */}
      <AddBirdDialog open={showAddDialog} onClose={() => setShowAddDialog(false)} />
    </div>
  );
}
