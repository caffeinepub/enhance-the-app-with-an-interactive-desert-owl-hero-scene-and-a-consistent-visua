import { useState, useEffect } from 'react';
import { useActor } from '../hooks/useActor';
import { BirdData } from '../backend';
import { useGetAllBirdData, useDeleteBirdById, useSaveBirdData } from '../hooks/useQueries';
import { useFileUpload, useFileUrl } from '../blob-storage/FileStorage';
import { useQueryClient } from '@tanstack/react-query';

// ---- AddAudioModal ----
interface AddAudioModalProps {
  bird: BirdData;
  onClose: () => void;
  onSuccess: () => void;
}

function AddAudioModal({ bird, onClose, onSuccess }: AddAudioModalProps) {
  const { actor } = useActor();
  const { uploadFile, isUploading } = useFileUpload();
  const queryClient = useQueryClient();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!audioFile || !actor) return;
    setUploading(true);
    setError(null);
    try {
      const path = `audio/${bird.arabicName}/${audioFile.name}`;
      await uploadFile(path, audioFile);
      await actor.addAudioFile(bird.arabicName, path);
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
      onSuccess();
      onClose();
    } catch (err) {
      setError('فشل رفع الملف الصوتي');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-amber-800 font-bold text-lg mb-4">🎵 إضافة ملف صوتي — {bird.arabicName}</h3>
        <input
          type="file"
          accept="audio/*"
          onChange={e => setAudioFile(e.target.files?.[0] || null)}
          className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm mb-4"
        />
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleUpload}
            disabled={!audioFile || uploading || isUploading}
            className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {uploading || isUploading ? '⏳ جاري الرفع...' : '📤 رفع'}
          </button>
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- AddBirdModal ----
interface AddBirdModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddBirdModal({ onClose, onSuccess }: AddBirdModalProps) {
  const { actor } = useActor();
  const { uploadFile, isUploading } = useFileUpload();
  const saveMutation = useSaveBirdData();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    arabicName: '',
    scientificName: '',
    englishName: '',
    description: '',
    notes: '',
    location: '',
    governorate: '',
  });
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [subImageFiles, setSubImageFiles] = useState<File[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!form.arabicName.trim()) {
      setError('الاسم العربي مطلوب');
      return;
    }
    if (!actor) return;
    setUploading(true);
    setError(null);
    try {
      const subImages: string[] = [];
      let audioFilePath: string | undefined = undefined;

      if (mainImageFile) {
        const path = `birds/${form.arabicName}/main/${mainImageFile.name}`;
        await uploadFile(path, mainImageFile);
        subImages.push(path);
      }

      for (const file of subImageFiles) {
        const path = `birds/${form.arabicName}/sub/${file.name}`;
        await uploadFile(path, file);
        subImages.push(path);
      }

      if (audioFile) {
        const path = `audio/${form.arabicName}/${audioFile.name}`;
        await uploadFile(path, audioFile);
        audioFilePath = path;
      }

      const birdData: BirdData = {
        id: BigInt(0),
        arabicName: form.arabicName,
        scientificName: form.scientificName,
        englishName: form.englishName,
        description: form.description,
        notes: form.notes,
        location: form.location,
        governorate: form.governorate,
        localName: '',
        mountainName: '',
        valleyName: '',
        locations: [],
        subImages,
        audioFile: audioFilePath,
      };

      await saveMutation.mutateAsync(birdData);
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
      onSuccess();
      onClose();
    } catch (err) {
      setError('فشل إضافة الطائر');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 my-4">
        <h3 className="text-amber-800 font-bold text-lg mb-4">➕ إضافة طائر جديد</h3>
        <div className="space-y-3">
          {[
            { field: 'arabicName', label: 'الاسم العربي *' },
            { field: 'scientificName', label: 'الاسم العلمي' },
            { field: 'englishName', label: 'الاسم الإنجليزي' },
            { field: 'location', label: 'الموقع' },
            { field: 'governorate', label: 'الولاية' },
          ].map(({ field, label }) => (
            <div key={field}>
              <label className="block text-amber-700 text-xs font-medium mb-1">{label}</label>
              <input
                type="text"
                value={(form as any)[field]}
                onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                className="w-full border border-amber-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          ))}
          <div>
            <label className="block text-amber-700 text-xs font-medium mb-1">الوصف</label>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="w-full border border-amber-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-amber-700 text-xs font-medium mb-1">ملاحظات</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className="w-full border border-amber-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-amber-700 text-xs font-medium mb-1">الصورة الرئيسية</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setMainImageFile(e.target.files?.[0] || null)}
              className="w-full border border-amber-300 rounded-lg px-3 py-1.5 text-sm"
            />
            {mainImageFile && (
              <p className="text-green-600 text-xs mt-1">✅ {mainImageFile.name}</p>
            )}
          </div>
          <div>
            <label className="block text-amber-700 text-xs font-medium mb-1">صور إضافية</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={e => setSubImageFiles(Array.from(e.target.files || []))}
              className="w-full border border-amber-300 rounded-lg px-3 py-1.5 text-sm"
            />
            {subImageFiles.length > 0 && (
              <p className="text-green-600 text-xs mt-1">✅ {subImageFiles.length} صورة محددة</p>
            )}
          </div>
          <div>
            <label className="block text-amber-700 text-xs font-medium mb-1">ملف صوتي (اختياري)</label>
            <input
              type="file"
              accept="audio/*"
              onChange={e => setAudioFile(e.target.files?.[0] || null)}
              className="w-full border border-amber-300 rounded-lg px-3 py-1.5 text-sm"
            />
            {audioFile && (
              <p className="text-green-600 text-xs mt-1">✅ {audioFile.name}</p>
            )}
          </div>
        </div>
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSubmit}
            disabled={!form.arabicName.trim() || uploading || isUploading || saveMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {uploading || isUploading || saveMutation.isPending ? '⏳ جاري الحفظ...' : '💾 حفظ'}
          </button>
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- EditBirdModal ----
interface EditBirdModalProps {
  bird: BirdData;
  onClose: () => void;
  onSuccess: () => void;
}

function EditBirdModal({ bird, onClose, onSuccess }: EditBirdModalProps) {
  const { uploadFile, isUploading } = useFileUpload();
  const saveMutation = useSaveBirdData();
  const queryClient = useQueryClient();
  const [editData, setEditData] = useState<BirdData>({ ...bird });
  const [newMainImageFile, setNewMainImageFile] = useState<File | null>(null);
  const [newSubImageFiles, setNewSubImageFiles] = useState<File[]>([]);
  const [newAudioFile, setNewAudioFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setUploading(true);
    setError(null);
    try {
      let updatedSubImages = [...editData.subImages];
      let updatedAudioFile = editData.audioFile;

      if (newMainImageFile) {
        const path = `birds/${editData.arabicName}/main/${newMainImageFile.name}`;
        await uploadFile(path, newMainImageFile);
        // Replace first image (main) or prepend
        if (updatedSubImages.length > 0) {
          updatedSubImages[0] = path;
        } else {
          updatedSubImages = [path, ...updatedSubImages];
        }
      }

      for (const file of newSubImageFiles) {
        const path = `birds/${editData.arabicName}/sub/${file.name}`;
        await uploadFile(path, file);
        updatedSubImages.push(path);
      }

      if (newAudioFile) {
        const path = `audio/${editData.arabicName}/${newAudioFile.name}`;
        await uploadFile(path, newAudioFile);
        updatedAudioFile = path;
      }

      const updatedBird: BirdData = {
        ...editData,
        subImages: updatedSubImages,
        audioFile: updatedAudioFile,
      };

      await saveMutation.mutateAsync(updatedBird);
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
      queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
      onSuccess();
      onClose();
    } catch (err) {
      setError('فشل حفظ التعديلات');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 my-4">
        <h3 className="text-amber-800 font-bold text-lg mb-4">✏️ تحرير — {bird.arabicName}</h3>
        <div className="space-y-3">
          {[
            { field: 'arabicName', label: 'الاسم العربي' },
            { field: 'scientificName', label: 'الاسم العلمي' },
            { field: 'englishName', label: 'الاسم الإنجليزي' },
            { field: 'location', label: 'الموقع' },
            { field: 'governorate', label: 'الولاية' },
          ].map(({ field, label }) => (
            <div key={field}>
              <label className="block text-amber-700 text-xs font-medium mb-1">{label}</label>
              <input
                type="text"
                value={(editData as any)[field] || ''}
                onChange={e => setEditData(prev => ({ ...prev, [field]: e.target.value }))}
                className="w-full border border-amber-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          ))}
          <div>
            <label className="block text-amber-700 text-xs font-medium mb-1">الوصف</label>
            <textarea
              value={editData.description || ''}
              onChange={e => setEditData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="w-full border border-amber-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-amber-700 text-xs font-medium mb-1">ملاحظات</label>
            <textarea
              value={editData.notes || ''}
              onChange={e => setEditData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className="w-full border border-amber-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-amber-700 text-xs font-medium mb-1">
              استبدال الصورة الرئيسية
              {editData.subImages?.[0] && <span className="text-amber-500 mr-1">(موجودة)</span>}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setNewMainImageFile(e.target.files?.[0] || null)}
              className="w-full border border-amber-300 rounded-lg px-3 py-1.5 text-sm"
            />
            {newMainImageFile && (
              <p className="text-green-600 text-xs mt-1">✅ {newMainImageFile.name}</p>
            )}
          </div>
          <div>
            <label className="block text-amber-700 text-xs font-medium mb-1">
              إضافة صور فرعية
              {editData.subImages?.length > 1 && (
                <span className="text-amber-500 mr-1">({editData.subImages.length - 1} موجودة)</span>
              )}
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={e => setNewSubImageFiles(Array.from(e.target.files || []))}
              className="w-full border border-amber-300 rounded-lg px-3 py-1.5 text-sm"
            />
            {newSubImageFiles.length > 0 && (
              <p className="text-green-600 text-xs mt-1">✅ {newSubImageFiles.length} صورة محددة</p>
            )}
          </div>
          <div>
            <label className="block text-amber-700 text-xs font-medium mb-1">
              استبدال الملف الصوتي
              {editData.audioFile && <span className="text-amber-500 mr-1">(موجود)</span>}
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={e => setNewAudioFile(e.target.files?.[0] || null)}
              className="w-full border border-amber-300 rounded-lg px-3 py-1.5 text-sm"
            />
            {newAudioFile && (
              <p className="text-green-600 text-xs mt-1">✅ {newAudioFile.name}</p>
            )}
          </div>
        </div>
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            disabled={uploading || isUploading || saveMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {uploading || isUploading || saveMutation.isPending ? '⏳ جاري الحفظ...' : '💾 حفظ'}
          </button>
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- BirdCard ----
interface BirdCardProps {
  bird: BirdData;
  isAdmin: boolean;
  onImageClick: (images: string[], index: number, birdName: string) => void;
  onRefetch: () => void;
}

function BirdImageDisplay({ path }: { path: string }) {
  const { data: url } = useFileUrl(path);
  if (!url) return (
    <div className="w-full h-48 bg-amber-100 flex items-center justify-center rounded-t-xl">
      <span className="text-amber-400 text-4xl">🦅</span>
    </div>
  );
  return (
    <img
      src={url}
      alt="bird"
      className="w-full h-48 object-cover rounded-t-xl"
    />
  );
}

function BirdCard({ bird, isAdmin, onImageClick, onRefetch }: BirdCardProps) {
  const deleteMutation = useDeleteBirdById();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);

  const mainImage = bird.subImages?.[0];
  const hasAudio = !!bird.audioFile;

  const handleDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف "${bird.arabicName}"؟`)) return;
    try {
      await deleteMutation.mutateAsync(bird.id);
      onRefetch();
    } catch {
      alert('فشل الحذف');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-amber-200 hover:shadow-lg overflow-hidden transition-all">
      {/* Image */}
      <div
        className="cursor-pointer relative"
        onClick={() => {
          if (bird.subImages?.length > 0) {
            onImageClick(bird.subImages, 0, bird.arabicName);
          }
        }}
      >
        {mainImage ? (
          <BirdImageDisplay path={mainImage} />
        ) : (
          <div className="w-full h-48 bg-amber-100 flex items-center justify-center">
            <span className="text-amber-400 text-5xl">🦅</span>
          </div>
        )}
        {hasAudio && (
          <span className="absolute top-2 left-2 bg-amber-600 text-white text-xs px-2 py-0.5 rounded-full">
            🎵 صوت
          </span>
        )}
        {bird.subImages?.length > 1 && (
          <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
            📷 {bird.subImages.length}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4" dir="rtl">
        <h3 className="text-amber-900 font-bold text-base mb-1">{bird.arabicName}</h3>
        {bird.scientificName && (
          <p className="text-amber-600 text-xs italic mb-1">{bird.scientificName}</p>
        )}
        {bird.englishName && (
          <p className="text-amber-700 text-xs mb-2">{bird.englishName}</p>
        )}
        {bird.description && (
          <p className="text-amber-800 text-xs line-clamp-2 mb-2">{bird.description}</p>
        )}
        {bird.location && (
          <p className="text-amber-600 text-xs">📍 {bird.location}</p>
        )}

        {/* Admin Buttons */}
        {isAdmin && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-amber-100">
            <button
              onClick={() => setShowEditModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
            >
              ✏️ تحرير
            </button>
            <button
              onClick={() => setShowAudioModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
            >
              🎵 إضافة الصوت
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
            >
              🗑️ حذف
            </button>
          </div>
        )}
      </div>

      {showEditModal && (
        <EditBirdModal
          bird={bird}
          onClose={() => setShowEditModal(false)}
          onSuccess={onRefetch}
        />
      )}

      {showAudioModal && (
        <AddAudioModal
          bird={bird}
          onClose={() => setShowAudioModal(false)}
          onSuccess={onRefetch}
        />
      )}
    </div>
  );
}

// ---- Image Viewer Modal ----
interface ImageViewerProps {
  images: string[];
  currentIndex: number;
  birdName: string;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

function ImageViewer({ images, currentIndex, birdName, onClose, onNavigate }: ImageViewerProps) {
  const { data: url } = useFileUrl(images[currentIndex]);

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      dir="rtl"
    >
      <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 left-0 text-white text-2xl hover:text-amber-300 transition-colors"
        >
          ✕
        </button>
        <p className="text-amber-300 text-center mb-2 text-sm">{birdName} — {currentIndex + 1} / {images.length}</p>
        {url ? (
          <img src={url} alt={birdName} className="w-full max-h-[80vh] object-contain rounded-xl" />
        ) : (
          <div className="w-full h-64 bg-amber-900/30 flex items-center justify-center rounded-xl">
            <span className="text-amber-400 text-4xl animate-pulse">🦅</span>
          </div>
        )}
        {images.length > 1 && (
          <div className="flex justify-center gap-3 mt-4">
            <button
              onClick={() => onNavigate(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-30 text-white px-4 py-2 rounded-lg text-sm"
            >
              ◀ السابق
            </button>
            <button
              onClick={() => onNavigate(Math.min(images.length - 1, currentIndex + 1))}
              disabled={currentIndex === images.length - 1}
              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-30 text-white px-4 py-2 rounded-lg text-sm"
            >
              التالي ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Main BirdGallery ----
export default function BirdGallery() {
  const { actor, isFetching: actorFetching } = useActor();
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewerState, setViewerState] = useState<{
    images: string[];
    index: number;
    birdName: string;
  } | null>(null);
  const { data: allBirdData, isLoading, error, refetch } = useGetAllBirdData();

  useEffect(() => {
    if (!actor || actorFetching) return;
    actor.isCallerAdmin().then((result: boolean) => {
      setIsAdmin(result);
    }).catch(() => setIsAdmin(false));
  }, [actor, actorFetching]);

  const birds: BirdData[] = allBirdData
    ? allBirdData.map(([, bd]: [string, BirdData]) => bd)
    : [];

  const filtered = birds.filter((b: BirdData) => {
    const term = searchTerm.toLowerCase();
    return (
      b.arabicName?.toLowerCase().includes(term) ||
      b.scientificName?.toLowerCase().includes(term) ||
      b.englishName?.toLowerCase().includes(term) ||
      b.location?.toLowerCase().includes(term)
    );
  });

  const handleImageClick = (images: string[], index: number, birdName: string) => {
    setViewerState({ images, index, birdName });
  };

  if (isLoading) {
    return (
      <div dir="rtl" className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-spin inline-block">⏳</div>
          <p className="text-amber-700 font-medium text-lg">جاري تحميل معرض الطيور...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div dir="rtl" className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-md">
          <div className="text-4xl mb-3">❌</div>
          <p className="text-red-700 font-medium mb-4">فشل تحميل البيانات</p>
          <button
            onClick={() => refetch()}
            className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg text-sm"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-amber-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-amber-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-full flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-48">
            <span className="text-amber-600">🔍</span>
            <input
              type="text"
              placeholder="بحث في المعرض..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="border border-amber-300 rounded-lg px-3 py-1.5 text-sm bg-amber-50 text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400 w-full"
            />
          </div>
          <span className="text-amber-700 text-sm">
            🦅 {filtered.length} / {birds.length} طائر
          </span>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              ➕ إضافة
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-amber-600 text-lg">لا توجد طيور في المعرض</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((bird: BirdData) => (
              <BirdCard
                key={String(bird.id)}
                bird={bird}
                isAdmin={isAdmin}
                onImageClick={handleImageClick}
                onRefetch={refetch}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddBirdModal
          onClose={() => setShowAddModal(false)}
          onSuccess={refetch}
        />
      )}

      {/* Image Viewer */}
      {viewerState && (
        <ImageViewer
          images={viewerState.images}
          currentIndex={viewerState.index}
          birdName={viewerState.birdName}
          onClose={() => setViewerState(null)}
          onNavigate={index => setViewerState(prev => prev ? { ...prev, index } : null)}
        />
      )}
    </div>
  );
}
