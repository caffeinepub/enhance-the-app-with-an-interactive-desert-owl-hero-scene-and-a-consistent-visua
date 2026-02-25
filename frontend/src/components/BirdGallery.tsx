import { useState, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Search, Home, Plus, Pencil, Save, Trash2, X, Loader2,
  Image as ImageIcon, Upload, Camera
} from 'lucide-react';
import {
  useGetAllBirdData,
  useAddBirdWithDetails,
  useUpdateBirdDetails,
  useDeleteBirdData,
  useAddSubImage,
} from '../hooks/useQueries';
import { useFileUrl, useFileUpload } from '../blob-storage/FileStorage';
import { useActor } from '../hooks/useActor';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { BirdData } from '../backend';
import { toast } from 'sonner';

// ─── BirdImage helper ────────────────────────────────────────────────────────

interface BirdImageProps {
  path: string;
  alt: string;
  className?: string;
}

function BirdImage({ path, alt, className }: BirdImageProps) {
  const { data: url } = useFileUrl(path);
  if (!url) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <ImageIcon className="w-8 h-8 text-muted-foreground" />
      </div>
    );
  }
  return <img src={url} alt={alt} className={className} />;
}

// ─── ImageUploadPreview helper ───────────────────────────────────────────────

interface ImageUploadPreviewProps {
  file: File;
  onRemove: () => void;
}

function ImageUploadPreview({ file, onRemove }: ImageUploadPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="relative group">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={file.name}
          className="w-20 h-20 object-cover rounded-lg border border-border"
        />
      ) : (
        <div className="w-20 h-20 bg-muted rounded-lg border border-border flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>
      <p className="text-xs text-foreground/50 mt-1 truncate w-20 text-center">{file.name}</p>
    </div>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface EditFormData {
  arabicName: string;
  englishName: string;
  scientificName: string;
  description: string;
  notes: string;
}

interface AddFormData {
  arabicName: string;
  englishName: string;
  scientificName: string;
  description: string;
  notes: string;
  latitude: string;
  longitude: string;
}

const defaultAddForm: AddFormData = {
  arabicName: '',
  englishName: '',
  scientificName: '',
  description: '',
  notes: '',
  latitude: '23.5',
  longitude: '56.0',
};

// ─── AddBirdModal ─────────────────────────────────────────────────────────────

interface AddBirdModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddBirdModal({ onClose, onSuccess }: AddBirdModalProps) {
  const [formData, setFormData] = useState<AddFormData>(defaultAddForm);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [subImageFiles, setSubImageFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mainImageRef = useRef<HTMLInputElement>(null);
  const subImagesRef = useRef<HTMLInputElement>(null);

  const addBirdMutation = useAddBirdWithDetails();
  const { uploadFile } = useFileUpload();

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setMainImageFile(file);
  };

  const handleSubImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      setSubImageFiles(prev => [...prev, ...files]);
    }
    if (subImagesRef.current) subImagesRef.current.value = '';
  };

  const removeSubImage = (index: number) => {
    setSubImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.arabicName.trim()) {
      toast.error('يرجى إدخال الاسم العربي للطائر');
      return;
    }
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (isNaN(lat) || isNaN(lng)) {
      toast.error('يرجى إدخال إحداثيات صحيحة');
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedPaths: string[] = [];

      // Upload main image first (it becomes subImages[0])
      if (mainImageFile) {
        const mainPath = `birds/${Date.now()}_main_${mainImageFile.name}`;
        const result = await uploadFile(mainPath, mainImageFile);
        uploadedPaths.push(result.path);
      }

      // Upload sub-images
      for (let i = 0; i < subImageFiles.length; i++) {
        const file = subImageFiles[i];
        const subPath = `birds/${Date.now()}_sub${i}_${file.name}`;
        const result = await uploadFile(subPath, file);
        uploadedPaths.push(result.path);
      }

      await addBirdMutation.mutateAsync({
        arabicName: formData.arabicName,
        scientificName: formData.scientificName,
        englishName: formData.englishName,
        description: formData.description,
        notes: formData.notes,
        latitude: lat,
        longitude: lng,
        audioFilePath: null,
        subImages: uploadedPaths,
      });

      toast.success('تم إضافة الطائر بنجاح');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(`فشل إضافة الطائر: ${err?.message ?? 'خطأ غير معروف'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isSubmitting ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-foreground font-arabic flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-600" />
            إضافة طائر جديد
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-foreground/60 hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Basic Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground/70 font-arabic border-b border-border pb-1">
              المعلومات الأساسية
            </h3>
            <div>
              <label className="block text-xs font-medium text-foreground/60 font-arabic mb-1">
                الاسم العربي <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.arabicName}
                onChange={e => setFormData(f => ({ ...f, arabicName: e.target.value }))}
                placeholder="مثال: البومة الصحراوية"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/60 mb-1">
                الاسم الإنجليزي
              </label>
              <input
                type="text"
                value={formData.englishName}
                onChange={e => setFormData(f => ({ ...f, englishName: e.target.value }))}
                placeholder="e.g. Desert Owl"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/60 mb-1">
                الاسم العلمي
              </label>
              <input
                type="text"
                value={formData.scientificName}
                onChange={e => setFormData(f => ({ ...f, scientificName: e.target.value }))}
                placeholder="e.g. Bubo bubo"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm italic focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/60 font-arabic mb-1">الوصف</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="وصف الطائر..."
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/60 font-arabic mb-1">ملاحظات</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="ملاحظات إضافية..."
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Coordinates */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground/70 font-arabic border-b border-border pb-1">
              الإحداثيات
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground/60 font-arabic mb-1">خط العرض</label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.latitude}
                  onChange={e => setFormData(f => ({ ...f, latitude: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground/60 font-arabic mb-1">خط الطول</label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.longitude}
                  onChange={e => setFormData(f => ({ ...f, longitude: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Main Image */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground/70 font-arabic border-b border-border pb-1">
              الصورة الرئيسية
            </h3>
            <input
              ref={mainImageRef}
              type="file"
              accept="image/*"
              onChange={handleMainImageChange}
              className="hidden"
            />
            {mainImageFile ? (
              <div className="flex items-start gap-3">
                <ImageUploadPreview
                  file={mainImageFile}
                  onRemove={() => setMainImageFile(null)}
                />
                <button
                  type="button"
                  onClick={() => mainImageRef.current?.click()}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-3 py-2 bg-muted hover:bg-muted/80 text-foreground/70 rounded-lg text-xs font-arabic transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  تغيير
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => mainImageRef.current?.click()}
                disabled={isSubmitting}
                className="w-full flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-amber-500/40 hover:border-amber-500/70 bg-amber-500/5 hover:bg-amber-500/10 rounded-xl transition-colors cursor-pointer"
              >
                <Upload className="w-8 h-8 text-amber-600/60" />
                <span className="text-sm text-amber-700 font-arabic font-medium">اختر الصورة الرئيسية</span>
                <span className="text-xs text-foreground/40 font-arabic">PNG, JPG, WEBP</span>
              </button>
            )}
          </div>

          {/* Sub Images */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground/70 font-arabic border-b border-border pb-1">
              الصور الفرعية (غير محدودة)
            </h3>
            <input
              ref={subImagesRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleSubImagesChange}
              className="hidden"
            />

            {subImageFiles.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {subImageFiles.map((file, index) => (
                  <ImageUploadPreview
                    key={`${file.name}-${index}`}
                    file={file}
                    onRemove={() => removeSubImage(index)}
                  />
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => subImagesRef.current?.click()}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border hover:border-amber-500/50 bg-muted/30 hover:bg-amber-500/5 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-foreground/60 font-arabic">إضافة صور فرعية</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex gap-3 rounded-b-2xl">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white rounded-xl text-sm font-arabic font-medium transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                حفظ الطائر
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-muted hover:bg-muted/80 text-foreground/70 rounded-xl text-sm font-arabic transition-colors"
          >
            <X className="w-4 h-4" />
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EditSubImagesModal ───────────────────────────────────────────────────────

interface EditSubImagesModalProps {
  birdName: string;
  existingImages: string[];
  onClose: () => void;
}

function EditSubImagesModal({ birdName, existingImages, onClose }: EditSubImagesModalProps) {
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useFileUpload();
  const addSubImageMutation = useAddSubImage();

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) setNewFiles(prev => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (newFiles.length === 0) {
      toast.info('لم تختر أي صور جديدة');
      return;
    }
    setIsUploading(true);
    try {
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        const path = `birds/${Date.now()}_sub${i}_${file.name}`;
        const result = await uploadFile(path, file);
        await addSubImageMutation.mutateAsync({ birdName, imagePath: result.path });
      }
      toast.success(`تم رفع ${newFiles.length} صورة بنجاح`);
      onClose();
    } catch (err: any) {
      toast.error(`فشل رفع الصور: ${err?.message ?? 'خطأ غير معروف'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isUploading ? onClose : undefined}
      />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-base font-bold text-foreground font-arabic">تحرير صور الطائر</h2>
          <button onClick={onClose} disabled={isUploading} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Existing images */}
          {existingImages.length > 0 && (
            <div>
              <p className="text-xs font-medium text-foreground/60 font-arabic mb-2">الصور الحالية ({existingImages.length})</p>
              <div className="flex flex-wrap gap-2">
                {existingImages.map((path, i) => (
                  <BirdImage
                    key={i}
                    path={path}
                    alt={`صورة ${i + 1}`}
                    className="w-16 h-16 object-cover rounded-lg border border-border"
                  />
                ))}
              </div>
            </div>
          )}

          {/* New files to upload */}
          <div>
            <p className="text-xs font-medium text-foreground/60 font-arabic mb-2">إضافة صور جديدة</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesChange}
              className="hidden"
            />
            {newFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {newFiles.map((file, i) => (
                  <ImageUploadPreview
                    key={`${file.name}-${i}`}
                    file={file}
                    onRemove={() => setNewFiles(prev => prev.filter((_, idx) => idx !== i))}
                  />
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border hover:border-amber-500/50 bg-muted/30 hover:bg-amber-500/5 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-foreground/60 font-arabic">اختر صور للإضافة</span>
            </button>
          </div>
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border px-5 py-4 flex gap-3 rounded-b-2xl">
          <button
            onClick={handleUpload}
            disabled={isUploading || newFiles.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white rounded-xl text-sm font-arabic font-medium transition-colors"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isUploading ? 'جاري الرفع...' : `رفع ${newFiles.length > 0 ? `(${newFiles.length})` : ''}`}
          </button>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-muted hover:bg-muted/80 text-foreground/70 rounded-xl text-sm font-arabic transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BirdCard ─────────────────────────────────────────────────────────────────

interface BirdCardProps {
  name: string;
  bird: BirdData;
  isAdmin: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function BirdCard({ name, bird, isAdmin, isExpanded, onToggleExpand }: BirdCardProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditImages, setShowEditImages] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    arabicName: bird.arabicName,
    englishName: bird.englishName,
    scientificName: bird.scientificName,
    description: bird.description,
    notes: bird.notes,
  });

  const updateBirdMutation = useUpdateBirdDetails();
  const deleteBirdMutation = useDeleteBirdData();

  const hasImages = bird.subImages && bird.subImages.length > 0;
  const isSaving = updateBirdMutation.isPending;
  const isDeletingPending = deleteBirdMutation.isPending;

  const handleStartEdit = () => {
    setEditFormData({
      arabicName: bird.arabicName,
      englishName: bird.englishName,
      scientificName: bird.scientificName,
      description: bird.description,
      notes: bird.notes,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateBirdMutation.mutateAsync({
        birdName: name,
        arabicName: editFormData.arabicName,
        scientificName: editFormData.scientificName,
        englishName: editFormData.englishName,
        description: editFormData.description,
        notes: editFormData.notes,
      });
      toast.success('تم حفظ التعديلات بنجاح');
      setIsEditing(false);
    } catch {
      // error handled in mutation
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteBirdMutation.mutateAsync(name);
      toast.success('تم حذف الطائر بنجاح');
      setIsDeleting(false);
    } catch {
      // error handled in mutation
    }
  };

  return (
    <>
      {showEditImages && (
        <EditSubImagesModal
          birdName={name}
          existingImages={bird.subImages}
          onClose={() => setShowEditImages(false)}
        />
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
        {/* Main Image */}
        <div
          className="aspect-video bg-muted relative overflow-hidden cursor-pointer"
          onClick={() => navigate({ to: '/bird/$name', params: { name } })}
        >
          {hasImages ? (
            <BirdImage
              path={bird.subImages[0]}
              alt={bird.arabicName}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">🦉</span>
            </div>
          )}
          {hasImages && bird.subImages.length > 1 && (
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full font-arabic">
              +{bird.subImages.length - 1} صور
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 flex-1 flex flex-col">
          {isEditing ? (
            /* ── Edit Mode ── */
            <div className="space-y-2 flex-1">
              <div>
                <label className="text-xs text-foreground/50 font-arabic mb-0.5 block">الاسم العربي</label>
                <input
                  type="text"
                  value={editFormData.arabicName}
                  onChange={e => setEditFormData(f => ({ ...f, arabicName: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-foreground/50 mb-0.5 block">الاسم الإنجليزي</label>
                <input
                  type="text"
                  value={editFormData.englishName}
                  onChange={e => setEditFormData(f => ({ ...f, englishName: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-foreground/50 mb-0.5 block">الاسم العلمي</label>
                <input
                  type="text"
                  value={editFormData.scientificName}
                  onChange={e => setEditFormData(f => ({ ...f, scientificName: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-sm italic focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-foreground/50 font-arabic mb-0.5 block">الوصف</label>
                <textarea
                  value={editFormData.description}
                  onChange={e => setEditFormData(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-foreground/50 font-arabic mb-0.5 block">ملاحظات</label>
                <textarea
                  value={editFormData.notes}
                  onChange={e => setEditFormData(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
              </div>

              {/* Save / Cancel */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white rounded-lg text-sm font-arabic transition-colors"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  حفظ
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-muted hover:bg-muted/80 text-foreground/70 rounded-lg text-sm font-arabic transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  إلغاء
                </button>
              </div>
            </div>
          ) : isDeleting ? (
            /* ── Delete Confirmation ── */
            <div className="space-y-3 flex-1">
              <h3 className="text-base font-bold text-foreground font-arabic">{bird.arabicName || name}</h3>
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                <p className="text-sm text-destructive font-arabic text-center">هل أنت متأكد من حذف هذا الطائر؟</p>
                <p className="text-xs text-destructive/70 font-arabic text-center mt-1">لا يمكن التراجع عن هذا الإجراء</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeletingPending}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-destructive hover:bg-destructive/90 disabled:opacity-60 text-white rounded-lg text-sm font-arabic transition-colors"
                >
                  {isDeletingPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  تأكيد الحذف
                </button>
                <button
                  onClick={() => setIsDeleting(false)}
                  disabled={isDeletingPending}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-muted hover:bg-muted/80 text-foreground/70 rounded-lg text-sm font-arabic transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            /* ── Normal View Mode ── */
            <div className="flex-1 flex flex-col">
              <h3
                className="text-base font-bold text-foreground font-arabic mb-1 cursor-pointer hover:text-amber-700 transition-colors"
                onClick={() => navigate({ to: '/bird/$name', params: { name } })}
              >
                {bird.arabicName || name}
              </h3>
              {bird.englishName && (
                <p className="text-sm text-foreground/60 mb-0.5">{bird.englishName}</p>
              )}
              {bird.scientificName && (
                <p className="text-xs text-foreground/40 italic mb-2">{bird.scientificName}</p>
              )}
              {bird.description && (
                <p className="text-sm text-foreground/70 font-arabic line-clamp-2 mb-3 flex-1">
                  {bird.description}
                </p>
              )}

              {/* Sub-images preview */}
              {isExpanded && hasImages && bird.subImages.length > 1 && (
                <div className="flex gap-1.5 mb-3 flex-wrap">
                  {bird.subImages.slice(1).map((imgPath, i) => (
                    <BirdImage
                      key={i}
                      path={imgPath}
                      alt={`صورة ${i + 2}`}
                      className="w-14 h-14 object-cover rounded-lg border border-border"
                    />
                  ))}
                </div>
              )}

              {/* Expand toggle */}
              {hasImages && bird.subImages.length > 1 && (
                <button
                  onClick={onToggleExpand}
                  className="text-xs text-amber-600 hover:text-amber-700 font-arabic mb-3 text-right transition-colors"
                >
                  {isExpanded ? '▲ إخفاء الصور' : `▼ عرض ${bird.subImages.length - 1} صور إضافية`}
                </button>
              )}

              {/* Admin Action Buttons */}
              {isAdmin && (
                <div className="flex gap-2 mt-auto pt-2 border-t border-border/50">
                  {/* تعديل - Edit text info */}
                  <button
                    onClick={handleStartEdit}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-arabic font-medium transition-colors"
                    title="تعديل البيانات"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    تعديل
                  </button>

                  {/* تحرير - Edit images */}
                  <button
                    onClick={() => setShowEditImages(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-arabic font-medium transition-colors"
                    title="تحرير الصور"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    تحرير
                  </button>

                  {/* حذف */}
                  <button
                    onClick={() => setIsDeleting(true)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2 bg-destructive hover:bg-destructive/90 text-white rounded-lg text-xs font-arabic font-medium transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── BirdGallery (main) ───────────────────────────────────────────────────────

export default function BirdGallery() {
  const navigate = useNavigate();
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const { data: birdData, isLoading, error } = useGetAllBirdData();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBirds, setExpandedBirds] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);

  // Admin state — resolved asynchronously after actor is ready
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  useEffect(() => {
    if (!actor || actorFetching) {
      setIsAdmin(false);
      setAdminChecked(false);
      return;
    }
    let cancelled = false;
    actor.isCallerAdmin().then((result) => {
      if (!cancelled) {
        setIsAdmin(result);
        setAdminChecked(true);
      }
    }).catch(() => {
      if (!cancelled) {
        setIsAdmin(false);
        setAdminChecked(true);
      }
    });
    return () => { cancelled = true; };
  }, [actor, actorFetching, identity]);

  const toggleExpand = (birdName: string) => {
    setExpandedBirds(prev => {
      const next = new Set(prev);
      if (next.has(birdName)) next.delete(birdName);
      else next.add(birdName);
      return next;
    });
  };

  const filteredBirds = birdData?.filter(([name, bird]) => {
    const q = searchQuery.toLowerCase();
    return (
      name.toLowerCase().includes(q) ||
      bird.arabicName.toLowerCase().includes(q) ||
      bird.englishName.toLowerCase().includes(q) ||
      bird.scientificName.toLowerCase().includes(q)
    );
  }) ?? [];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Add Modal */}
      {showAddModal && (
        <AddBirdModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => setShowAddModal(false)}
        />
      )}

      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate({ to: '/' })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors font-arabic text-sm"
            >
              <Home className="w-4 h-4" />
              <span>الرئيسية</span>
            </button>
            <h1 className="text-2xl font-bold text-foreground font-arabic">معرض الطيور</h1>
          </div>

          {/* Search + Add Button Row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث عن طائر..."
                className="w-full pr-10 pl-4 py-2.5 bg-background border border-border rounded-lg text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Add button — shown only after admin check resolves and user is admin */}
            {adminChecked && isAdmin && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-arabic font-medium transition-colors whitespace-nowrap shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة طائر</span>
              </button>
            )}
          </div>

          {/* Admin status indicator */}
          {adminChecked && isAdmin && (
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-700 rounded-full text-xs font-arabic">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                وضع المشرف — يمكنك إضافة وتعديل وحذف الطيور
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🦉</div>
            <p className="text-foreground/60 font-arabic">جاري تحميل البيانات...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-destructive font-arabic">حدث خطأ في تحميل البيانات</p>
          </div>
        )}

        {!isLoading && !error && filteredBirds.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-foreground/60 font-arabic">
              {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد بيانات طيور'}
            </p>
            {adminChecked && isAdmin && !searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-arabic font-medium transition-colors mx-auto"
              >
                <Plus className="w-4 h-4" />
                إضافة أول طائر
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBirds.map(([name, bird]) => (
            <BirdCard
              key={name}
              name={name}
              bird={bird}
              isAdmin={isAdmin}
              isExpanded={expandedBirds.has(name)}
              onToggleExpand={() => toggleExpand(name)}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-xs text-foreground/40 font-arabic">
            © {new Date().getFullYear()} معرض طيور البريمي — صُنع بـ ❤️ باستخدام{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
