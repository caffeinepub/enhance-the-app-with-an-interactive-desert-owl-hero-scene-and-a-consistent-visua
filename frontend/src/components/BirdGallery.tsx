import React, { useState, useEffect, useRef } from 'react';
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
            className="w-full px-3 py-2 border border-amber-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          />
          <textarea
            placeholder="الملاحظات" value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-amber-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          />
          <div>
            <label className="block text-sm text-amber-700 mb-1">الصورة الرئيسية</label>
            <input
              type="file" accept="image/*"
              onChange={e => setMainImageFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-amber-700"
            />
          </div>
          <div>
            <label className="block text-sm text-amber-700 mb-1">صور إضافية</label>
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
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal for editing sub-images of an existing bird
function EditSubImagesModal({ bird, onClose, onSaved }: { bird: BirdData; onClose: () => void; onSaved: () => void }) {
  const { actor } = useActor();
  const { uploadFile, isUploading } = useFileUpload();
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  const handleAddImages = async () => {
    if (!actor || newImageFiles.length === 0) return;
    setSaving(true);
    setError('');
    try {
      for (const file of newImageFiles) {
        const path = `birds/sub/${Date.now()}_${file.name}`;
        const result = await uploadFile(path, file);
        await actor.addSubImage(bird.arabicName, result.path);
      }
      setNewImageFiles([]);
      onSaved();
    } catch (e: any) {
      setError(e?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImage = async (imagePath: string) => {
    if (!actor) return;
    if (!window.confirm('هل أنت متأكد من حذف هذه الصورة؟')) return;
    setDeletingPath(imagePath);
    try {
      await actor.deleteImageFromBirdAndRegistry(bird.arabicName, imagePath);
      onSaved();
    } catch (e: any) {
      setError(e?.message || 'حدث خطأ أثناء الحذف');
    } finally {
      setDeletingPath(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" dir="rtl">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-amber-800 font-bold text-lg mb-4">تحرير صور: {bird.arabicName}</h2>
        {error && <div className="mb-3 p-2 bg-red-50 text-red-700 rounded text-sm">{error}</div>}

        {/* Existing sub-images */}
        {bird.subImages && bird.subImages.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-amber-700 mb-2">الصور الحالية:</h3>
            <div className="grid grid-cols-3 gap-2">
              {bird.subImages.map((imgPath, idx) => (
                <div key={idx} className="relative group">
                  <BirdImage
                    path={imgPath}
                    alt={`صورة ${idx + 1}`}
                    className="w-full h-20 object-cover rounded border border-amber-200"
                  />
                  <button
                    onClick={() => handleDeleteImage(imgPath)}
                    disabled={deletingPath === imgPath}
                    className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add new images */}
        <div className="mb-4">
          <label className="block text-sm text-amber-700 mb-1">إضافة صور جديدة:</label>
          <input
            type="file" accept="image/*" multiple
            onChange={e => setNewImageFiles(Array.from(e.target.files || []))}
            className="w-full text-sm text-amber-700"
          />
        </div>

        <div className="flex gap-2">
          {newImageFiles.length > 0 && (
            <button
              onClick={handleAddImages}
              disabled={saving || isUploading}
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-md text-sm hover:bg-amber-700 disabled:opacity-50 transition-colors font-bold"
            >
              {saving || isUploading ? 'جاري الحفظ...' : `حفظ (${newImageFiles.length} صور)`}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

// Bird card component
function BirdCard({
  birdName,
  bird,
  isAdmin,
  onDelete,
  onEdit,
  onImageClick,
}: {
  birdName: string;
  bird: BirdData;
  isAdmin: boolean;
  onDelete: (bird: BirdData) => void;
  onEdit: (bird: BirdData) => void;
  onImageClick: (url: string, alt: string) => void;
}) {
  const mainImagePath = bird.subImages?.[0] || null;
  const { data: mainImageUrl } = useFileUrl(mainImagePath || '');

  return (
    <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Image area */}
      <div
        className="h-40 bg-amber-50 flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={() => mainImageUrl && onImageClick(mainImageUrl, bird.arabicName)}
      >
        {mainImagePath ? (
          <BirdImage
            path={mainImagePath}
            alt={bird.arabicName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-amber-300 text-4xl">🦅</div>
        )}
      </div>

      {/* Card content */}
      <div className="p-3">
        <h3 className="font-bold text-amber-900 text-sm mb-1 truncate">{bird.arabicName}</h3>
        {bird.scientificName && (
          <p className="text-xs text-amber-600 italic mb-1 truncate">{bird.scientificName}</p>
        )}
        {bird.englishName && (
          <p className="text-xs text-amber-500 mb-1 truncate">{bird.englishName}</p>
        )}
        {bird.description && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-2">{bird.description}</p>
        )}
        <div className="text-xs text-amber-500">
          {bird.subImages?.length > 0 && <span>{bird.subImages.length} صورة</span>}
          {bird.locations?.length > 0 && <span className="mr-2">{bird.locations.length} موقع</span>}
        </div>

        {/* Admin actions */}
        {isAdmin && (
          <div className="flex gap-1 mt-2 pt-2 border-t border-amber-100">
            <button
              onClick={() => onEdit(bird)}
              className="flex-1 px-2 py-1 bg-amber-500 text-white rounded text-xs hover:bg-amber-600 transition-colors"
            >
              تحرير
            </button>
            <button
              onClick={() => onDelete(bird)}
              className="flex-1 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
            >
              حذف
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Main BirdGallery component
export default function BirdGallery() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const { data: birdDataRaw, isLoading, refetch } = useGetAllBirdData();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBird, setEditingBird] = useState<BirdData | null>(null);
  const [modalImage, setModalImage] = useState<{ src: string; alt: string } | null>(null);

  // Use useState + useEffect for isAdmin to ensure re-render after actor resolves
  const [isAdmin, setIsAdmin] = useState(false);
  const lastIdentityRef = useRef<string | null>(null);

  useEffect(() => {
    const currentIdentity = identity?.getPrincipal().toString() ?? null;

    // If user logged out (identity changed to null), reset admin
    if (currentIdentity === null && lastIdentityRef.current !== null) {
      lastIdentityRef.current = null;
      setIsAdmin(false);
      return;
    }

    // Only check admin when actor is ready
    if (!actor || actorFetching) return;

    let cancelled = false;
    actor.isCallerAdmin().then(result => {
      if (!cancelled) {
        setIsAdmin(result);
        lastIdentityRef.current = currentIdentity;
      }
    }).catch(() => {
      if (!cancelled) setIsAdmin(false);
    });
    return () => { cancelled = true; };
  }, [actor, actorFetching, identity]);

  const birdData: [string, BirdData][] = birdDataRaw || [];

  const filteredData = birdData.filter(([, bird]) => {
    const term = searchTerm.toLowerCase();
    return (
      bird.arabicName?.toLowerCase().includes(term) ||
      bird.scientificName?.toLowerCase().includes(term) ||
      bird.englishName?.toLowerCase().includes(term)
    );
  });

  const handleDelete = async (bird: BirdData) => {
    if (!actor) return;
    if (!window.confirm(`هل أنت متأكد من حذف "${bird.arabicName}"؟`)) return;
    try {
      await actor.deleteBirdById(bird.id);
      queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
    } catch (e: any) {
      alert(e?.message || 'حدث خطأ أثناء الحذف');
    }
  };

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['allBirdData'] });
    refetch();
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
      {/* Modals */}
      {showAddModal && isAdmin && (
        <AddBirdModal
          onClose={() => setShowAddModal(false)}
          onSaved={handleSaved}
        />
      )}
      {editingBird && isAdmin && (
        <EditSubImagesModal
          bird={editingBird}
          onClose={() => setEditingBird(null)}
          onSaved={() => { handleSaved(); setEditingBird(null); }}
        />
      )}
      {modalImage && (
        <ImageModal
          src={modalImage.src}
          alt={modalImage.alt}
          onClose={() => setModalImage(null)}
        />
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <input
          type="text"
          placeholder="بحث في المعرض..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[180px] px-3 py-2 border border-amber-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <span className="text-sm text-amber-600">{filteredData.length} طائر</span>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors font-bold"
          >
            + إضافة
          </button>
        )}
      </div>

      {/* Gallery grid */}
      {filteredData.length === 0 ? (
        <div className="text-center py-12 text-amber-600">
          {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد بيانات في المعرض'}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredData.map(([birdName, bird]) => (
            <BirdCard
              key={bird.id.toString()}
              birdName={birdName}
              bird={bird}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              onEdit={setEditingBird}
              onImageClick={(src, alt) => setModalImage({ src, alt })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
