import React, { useState, useEffect } from 'react';
import { useActor } from '../hooks/useActor';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetAllBirdData } from '../hooks/useQueries';
import { useFileUpload, useFileUrl } from '../blob-storage/FileStorage';
import { BirdData } from '../backend';
import { useQueryClient } from '@tanstack/react-query';

// Sub-component: display a single image from blob storage
function BirdImage({ path, alt, className }: { path: string; alt: string; className?: string }) {
  const { data: url } = useFileUrl(path);
  if (!url) return <div className={`bg-amber-100 animate-pulse ${className}`} />;
  return <img src={url} alt={alt} className={className} />;
}

// Modal for viewing full image
function ImageModal({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] p-2" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-2 left-2 z-10 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80 text-lg"
        >
          ×
        </button>
        <img src={src} alt={alt} className="max-w-full max-h-[85vh] object-contain rounded-lg" />
      </div>
    </div>
  );
}

// Modal for adding a new bird
function AddBirdModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { actor } = useActor();
  const { uploadFile, isUploading } = useFileUpload();
  const [arabicName, setArabicName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [englishName, setEnglishName] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [subImageFiles, setSubImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!arabicName.trim()) { setError('الاسم العربي مطلوب'); return; }
    if (!actor) return;
    setSaving(true);
    setError('');
    try {
      let mainImagePath: string | null = null;
      if (mainImageFile) {
        const path = `birds/main/${Date.now()}_${mainImageFile.name}`;
        const result = await uploadFile(path, mainImageFile);
        mainImagePath = result.path;
      }
      const subImagePaths: string[] = [];
      for (const file of subImageFiles) {
        const path = `birds/sub/${Date.now()}_${file.name}`;
        const result = await uploadFile(path, file);
        subImagePaths.push(result.path);
      }
      await actor.addBirdWithDetails(
        arabicName.trim(),
        scientificName.trim(),
        englishName.trim(),
        description.trim(),
        notes.trim(),
        0, 0,
        mainImagePath,
        subImagePaths
      );
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" dir="rtl">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-amber-800 font-bold text-lg mb-4">إضافة طائر جديد</h2>
        {error && <div className="mb-3 p-2 bg-red-50 text-red-700 rounded text-sm">{error}</div>}
        <div className="space-y-3">
          <input
            type="text" placeholder="الاسم العربي *" value={arabicName}
            onChange={e => setArabicName(e.target.value)}
            className="w-full px-3 py-2 border border-amber-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <input
            type="text" placeholder="الاسم العلمي" value={scientificName}
            onChange={e => setScientificName(e.target.value)}
            className="w-full px-3 py-2 border border-amber-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <input
            type="text" placeholder="الاسم الإنجليزي" value={englishName}
            onChange={e => setEnglishName(e.target.value)}
            className="w-full px-3 py-2 border border-amber-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <textarea
            placeholder="الوصف" value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-amber-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <textarea
            placeholder="الملاحظات" value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-amber-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <div>
            <label className="block text-xs text-amber-700 mb-1">الصورة الرئيسية</label>
            <input
              type="file" accept="image/*"
              onChange={e => setMainImageFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-amber-700"
            />
          </div>
          <div>
            <label className="block text-xs text-amber-700 mb-1">صور إضافية</label>
            <input
              type="file" accept="image/*" multiple
              onChange={e => setSubImageFiles(Array.from(e.target.files || []))}
              className="w-full text-sm text-amber-700"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            disabled={saving || isUploading}
            className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-md text-sm hover:bg-amber-700 disabled:opacity-50 transition-colors font-bold"
          >
            {saving || isUploading ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal for editing a bird card
function EditBirdModal({
  bird,
  onClose,
  onSaved,
}: {
  bird: BirdData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { actor } = useActor();
  const { uploadFile, isUploading } = useFileUpload();
  const [arabicName, setArabicName] = useState(bird.arabicName);
  const [scientificName, setScientificName] = useState(bird.scientificName);
  const [englishName, setEnglishName] = useState(bird.englishName);
  const [description, setDescription] = useState(bird.description);
  const [notes, setNotes] = useState(bird.notes);
  const [newSubImageFiles, setNewSubImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!arabicName.trim()) { setError('الاسم العربي مطلوب'); return; }
    if (!actor) return;
    setSaving(true);
    setError('');
    try {
      const newSubImagePaths: string[] = [];
      for (const file of newSubImageFiles) {
        const path = `birds/sub/${Date.now()}_${file.name}`;
        const result = await uploadFile(path, file);
        newSubImagePaths.push(result.path);
      }
      const updatedBird: BirdData = {
        ...bird,
        arabicName: arabicName.trim(),
        scientificName: scientificName.trim(),
        englishName: englishName.trim(),
        description: description.trim(),
        notes: notes.trim(),
        subImages: [...bird.subImages, ...newSubImagePaths],
      };
      await actor.saveBirdData(updatedBird);
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" dir="rtl">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-amber-800 font-bold text-lg mb-4">تحرير بيانات الطائر</h2>
        {error && <div className="mb-3 p-2 bg-red-50 text-red-700 rounded text-sm">{error}</div>}
        <div className="space-y-3">
          <input
            type="text" placeholder="الاسم العربي *" value={arabicName}
            onChange={e => setArabicName(e.target.value)}
            className="w-full px-3 py-2 border border-amber-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <input
            type="text" placeholder="الاسم العلمي" value={scientificName}
            onChange={e => setScientificName(e.target.value)}
            className="w-full px-3 py-2 border border-amber-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <input
            type="text" placeholder="الاسم الإنجليزي" value={englishName}
            onChange={e => setEnglishName(e.target.value)}
            className="w-full px-3 py-2 border border-amber-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <textarea
            placeholder="الوصف" value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-amber-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <textarea
            placeholder="الملاحظات" value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-amber-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <div>
            <label className="block text-xs text-amber-700 mb-1">إضافة صور جديدة</label>
            <input
              type="file" accept="image/*" multiple
              onChange={e => setNewSubImageFiles(Array.from(e.target.files || []))}
              className="w-full text-sm text-amber-700"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            disabled={saving || isUploading}
            className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-md text-sm hover:bg-amber-700 disabled:opacity-50 transition-colors font-bold"
          >
            {saving || isUploading ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// Bird card component
function BirdCard({
  bird,
  isAdmin,
  onDeleted,
  onEdited,
}: {
  bird: BirdData;
  isAdmin: boolean;
  onDeleted: () => void;
  onEdited: () => void;
}) {
  const { actor } = useActor();
  const [modalImageSrc, setModalImageSrc] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const mainImagePath = bird.subImages?.[0] || null;

  const handleDelete = async () => {
    if (!actor) return;
    if (!window.confirm(`هل أنت متأكد من حذف "${bird.arabicName}"؟`)) return;
    setDeleting(true);
    try {
      await actor.deleteBirdById(bird.id);
      onDeleted();
    } catch (e: any) {
      alert(e?.message || 'حدث خطأ أثناء الحذف');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden flex flex-col">
      {/* Image area */}
      <div
        className="relative h-48 bg-amber-50 cursor-pointer overflow-hidden"
        onClick={() => {
          if (mainImagePath) setModalImageSrc(mainImagePath);
        }}
      >
        {mainImagePath ? (
          <BirdImageWithUrl
            path={mainImagePath}
            alt={bird.arabicName}
            onUrlReady={() => {}}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-amber-300 text-4xl">🦅</div>
        )}
        {bird.subImages?.length > 1 && (
          <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
            +{bird.subImages.length - 1}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col gap-1" dir="rtl">
        <h3 className="font-bold text-amber-900 text-base truncate">{bird.arabicName || '—'}</h3>
        {bird.scientificName && (
          <p className="text-xs text-amber-600 italic truncate">{bird.scientificName}</p>
        )}
        {bird.englishName && (
          <p className="text-xs text-amber-700 truncate">{bird.englishName}</p>
        )}
        {bird.description && (
          <p className="text-xs text-gray-600 line-clamp-2 mt-1">{bird.description}</p>
        )}
        {bird.notes && (
          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{bird.notes}</p>
        )}
      </div>

      {/* Admin actions */}
      {isAdmin && (
        <div className="px-3 pb-3 flex gap-2" dir="rtl">
          <button
            onClick={() => setShowEditModal(true)}
            className="flex-1 px-3 py-1.5 bg-amber-500 text-white rounded-md text-xs hover:bg-amber-600 transition-colors font-bold"
          >
            تحرير
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 px-3 py-1.5 bg-red-500 text-white rounded-md text-xs hover:bg-red-600 disabled:opacity-50 transition-colors font-bold"
          >
            {deleting ? '...' : 'حذف'}
          </button>
        </div>
      )}

      {/* Image modal */}
      {modalImageSrc && (
        <BirdImageModalWrapper
          path={modalImageSrc}
          alt={bird.arabicName}
          onClose={() => setModalImageSrc(null)}
        />
      )}

      {/* Edit modal */}
      {showEditModal && (
        <EditBirdModal
          bird={bird}
          onClose={() => setShowEditModal(false)}
          onSaved={() => {
            setShowEditModal(false);
            onEdited();
          }}
        />
      )}
    </div>
  );
}

// Helper: BirdImage that also exposes the resolved URL
function BirdImageWithUrl({
  path,
  alt,
  onUrlReady,
}: {
  path: string;
  alt: string;
  onUrlReady?: (url: string) => void;
}) {
  const { data: url } = useFileUrl(path);
  useEffect(() => {
    if (url && onUrlReady) onUrlReady(url);
  }, [url, onUrlReady]);
  if (!url) return <div className="w-full h-full bg-amber-100 animate-pulse" />;
  return <img src={url} alt={alt} className="w-full h-full object-cover" />;
}

// Helper: modal that resolves blob URL from path
function BirdImageModalWrapper({
  path,
  alt,
  onClose,
}: {
  path: string;
  alt: string;
  onClose: () => void;
}) {
  const { data: url } = useFileUrl(path);
  if (!url) return null;
  return <ImageModal src={url} alt={alt} onClose={onClose} />;
}

export default function BirdGallery() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: birdDataRaw, isLoading } = useGetAllBirdData();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Async admin check — depends only on actor (identity is already embedded in actor)
  useEffect(() => {
    let cancelled = false;
    setIsAdminLoading(true);

    if (actor && !actorFetching) {
      actor.isCallerAdmin()
        .then(result => {
          if (!cancelled) {
            setIsAdmin(result);
            setIsAdminLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setIsAdmin(false);
            setIsAdminLoading(false);
          }
        });
    } else if (!actorFetching) {
      setIsAdmin(false);
      setIsAdminLoading(false);
    }

    return () => { cancelled = true; };
  }, [actor, actorFetching, identity]);

  const birdData: [string, BirdData][] = birdDataRaw || [];

  const filteredBirds = birdData.filter(([, bird]) => {
    const term = searchTerm.toLowerCase();
    return (
      bird.arabicName?.toLowerCase().includes(term) ||
      bird.scientificName?.toLowerCase().includes(term) ||
      bird.englishName?.toLowerCase().includes(term) ||
      bird.notes?.toLowerCase().includes(term)
    );
  });

  const handleDataChanged = () => {
    queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
    queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
    queryClient.invalidateQueries({ queryKey: ['birdNames'] });
    queryClient.invalidateQueries({ queryKey: ['totalBirdCount'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12" dir="rtl">
        <div className="text-amber-700 text-lg">جاري تحميل المعرض...</div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="w-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <input
          type="text"
          placeholder="بحث في المعرض..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[180px] px-3 py-2 border border-amber-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <span className="text-xs text-amber-600">
          {filteredBirds.length} طائر
          {searchTerm && ` (من أصل ${birdData.length})`}
        </span>
        {!isAdminLoading && isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors font-bold"
          >
            + إضافة طائر
          </button>
        )}
      </div>

      {/* Gallery grid */}
      {filteredBirds.length === 0 ? (
        <div className="text-center py-12 text-amber-600">
          {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد بيانات في المعرض'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBirds.map(([, bird]) => (
            <BirdCard
              key={bird.id.toString()}
              bird={bird}
              isAdmin={!isAdminLoading && isAdmin}
              onDeleted={handleDataChanged}
              onEdited={handleDataChanged}
            />
          ))}
        </div>
      )}

      {/* Add bird modal */}
      {showAddModal && (
        <AddBirdModal
          onClose={() => setShowAddModal(false)}
          onSaved={handleDataChanged}
        />
      )}
    </div>
  );
}
