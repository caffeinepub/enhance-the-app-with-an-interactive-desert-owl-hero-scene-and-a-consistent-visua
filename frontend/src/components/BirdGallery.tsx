import { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { BirdData, LocationEntry } from '../backend';
import {
  useGetAllBirdDetails,
  useAddBirdWithDetails,
  useDeleteBirdById,
  useSaveBirdData,
} from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { useFileUrl, useFileUpload, useFileDelete } from '../blob-storage/FileStorage';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import LazyGalleryGrid from './LazyGalleryGrid';

// ─── Sub-components ───────────────────────────────────────────────────────────

function BirdImage({ imagePath, alt }: { imagePath: string; alt: string }) {
  const { data: url } = useFileUrl(imagePath);
  if (!url) {
    return (
      <div className="w-full h-48 bg-amber-100 flex items-center justify-center rounded-t-xl">
        <span className="text-5xl">🦉</span>
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      className="w-full h-48 object-cover rounded-t-xl"
      loading="lazy"
    />
  );
}

function AudioPlayerInline({ audioPath }: { audioPath: string }) {
  const { data: audioUrl } = useFileUrl(audioPath);
  if (!audioUrl) return null;
  return (
    <audio controls className="w-full mt-2 h-8">
      <source src={audioUrl} />
    </audio>
  );
}

// ─── Add Bird Modal ────────────────────────────────────────────────────────────

interface AddBirdForm {
  arabicName: string;
  scientificName: string;
  englishName: string;
  description: string;
  notes: string;
  location: string;
  governorate: string;
  mountainName: string;
  valleyName: string;
  latitude: string;
  longitude: string;
  localName: string;
}

const emptyAddForm: AddBirdForm = {
  arabicName: '',
  scientificName: '',
  englishName: '',
  description: '',
  notes: '',
  location: '',
  governorate: '',
  mountainName: '',
  valleyName: '',
  latitude: '',
  longitude: '',
  localName: '',
};

function AddBirdModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<AddBirdForm>(emptyAddForm);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { uploadFile } = useFileUpload();
  const addBirdMutation = useAddBirdWithDetails();

  const handleChange = (field: keyof AddBirdForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.arabicName.trim()) return;
    setIsSubmitting(true);
    try {
      let mainImagePath: string | null = null;
      let audioFilePath: string | null = null;

      if (mainImageFile) {
        const ext = mainImageFile.name.split('.').pop() || 'jpg';
        const path = `birds/${Date.now()}-main.${ext}`;
        const result = await uploadFile(path, mainImageFile);
        mainImagePath = result.path;
      }

      if (audioFile) {
        const ext = audioFile.name.split('.').pop() || 'mp3';
        const path = `birds/audio/${Date.now()}.${ext}`;
        const result = await uploadFile(path, audioFile);
        audioFilePath = result.path;
      }

      await addBirdMutation.mutateAsync({
        arabicName: form.arabicName,
        scientificName: form.scientificName,
        englishName: form.englishName,
        description: form.description,
        notes: form.notes,
        latitude: parseFloat(form.latitude) || 0,
        longitude: parseFloat(form.longitude) || 0,
        mountainName: form.mountainName,
        valleyName: form.valleyName,
        governorate: form.governorate,
        locationDesc: form.location,
        audioFilePath,
        subImages: mainImagePath ? [mainImagePath] : [],
      });

      setForm(emptyAddForm);
      setMainImageFile(null);
      setAudioFile(null);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to add bird:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة طائر جديد</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {[
            { field: 'arabicName', label: 'الاسم العربي *' },
            { field: 'scientificName', label: 'الاسم العلمي' },
            { field: 'englishName', label: 'الاسم الإنجليزي' },
            { field: 'localName', label: 'الاسم المحلي' },
            { field: 'location', label: 'الموقع' },
            { field: 'governorate', label: 'الولاية' },
            { field: 'mountainName', label: 'اسم الجبل' },
            { field: 'valleyName', label: 'اسم الوادي' },
            { field: 'latitude', label: 'خط العرض' },
            { field: 'longitude', label: 'خط الطول' },
          ].map(({ field, label }) => (
            <div key={field}>
              <Label className="text-xs">{label}</Label>
              <Input
                value={(form as any)[field]}
                onChange={e => handleChange(field as keyof AddBirdForm, e.target.value)}
                className="mt-1"
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <Label className="text-xs">الوصف</Label>
            <Textarea
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">ملاحظات</Label>
            <Textarea
              value={form.notes}
              onChange={e => handleChange('notes', e.target.value)}
              rows={2}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">الصورة الرئيسية</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={e => setMainImageFile(e.target.files?.[0] || null)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">ملف الصوت (اختياري)</Label>
            <Input
              type="file"
              accept="audio/*"
              onChange={e => setAudioFile(e.target.files?.[0] || null)}
              className="mt-1"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!form.arabicName.trim() || isSubmitting}
          >
            {isSubmitting ? '⏳ جاري الإضافة...' : '➕ إضافة'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Bird Modal ───────────────────────────────────────────────────────────

interface EditBirdForm {
  arabicName: string;
  scientificName: string;
  englishName: string;
  description: string;
  notes: string;
  localName: string;
}

function EditBirdModal({
  bird,
  open,
  onClose,
  onSuccess,
}: {
  bird: BirdData;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<EditBirdForm>({
    arabicName: bird.arabicName,
    scientificName: bird.scientificName,
    englishName: bird.englishName,
    description: bird.description,
    notes: bird.notes,
    localName: bird.localName,
  });
  const [newMainImageFile, setNewMainImageFile] = useState<File | null>(null);
  const [newSubImageFile, setNewSubImageFile] = useState<File | null>(null);
  const [newAudioFile, setNewAudioFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { uploadFile } = useFileUpload();
  const { deleteFile } = useFileDelete();
  const saveMutation = useSaveBirdData();
  const queryClient = useQueryClient();

  const handleChange = (field: keyof EditBirdForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let subImages = [...bird.subImages];
      let audioFile = bird.audioFile;

      // Replace main image (first sub-image)
      if (newMainImageFile) {
        if (subImages.length > 0) {
          await deleteFile(subImages[0]).catch(() => {});
          subImages = subImages.slice(1);
        }
        const ext = newMainImageFile.name.split('.').pop() || 'jpg';
        const path = `birds/${Date.now()}-main.${ext}`;
        const result = await uploadFile(path, newMainImageFile);
        subImages = [result.path, ...subImages];
      }

      // Add additional sub-image
      if (newSubImageFile) {
        const ext = newSubImageFile.name.split('.').pop() || 'jpg';
        const path = `birds/${Date.now()}-sub.${ext}`;
        const result = await uploadFile(path, newSubImageFile);
        subImages = [...subImages, result.path];
      }

      // Replace audio
      if (newAudioFile) {
        if (audioFile) {
          await deleteFile(audioFile).catch(() => {});
        }
        const ext = newAudioFile.name.split('.').pop() || 'mp3';
        const path = `birds/audio/${Date.now()}.${ext}`;
        const result = await uploadFile(path, newAudioFile);
        audioFile = result.path;
      }

      const updatedBird: BirdData = {
        ...bird,
        arabicName: form.arabicName,
        scientificName: form.scientificName,
        englishName: form.englishName,
        description: form.description,
        notes: form.notes,
        localName: form.localName,
        subImages,
        audioFile,
      };

      await saveMutation.mutateAsync(updatedBird);
      queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to edit bird:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل: {bird.arabicName}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {[
            { field: 'arabicName', label: 'الاسم العربي' },
            { field: 'scientificName', label: 'الاسم العلمي' },
            { field: 'englishName', label: 'الاسم الإنجليزي' },
            { field: 'localName', label: 'الاسم المحلي' },
          ].map(({ field, label }) => (
            <div key={field}>
              <Label className="text-xs">{label}</Label>
              <Input
                value={(form as any)[field]}
                onChange={e => handleChange(field as keyof EditBirdForm, e.target.value)}
                className="mt-1"
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <Label className="text-xs">الوصف</Label>
            <Textarea
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">ملاحظات</Label>
            <Textarea
              value={form.notes}
              onChange={e => handleChange('notes', e.target.value)}
              rows={2}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">استبدال الصورة الرئيسية</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={e => setNewMainImageFile(e.target.files?.[0] || null)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">إضافة صورة فرعية</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={e => setNewSubImageFile(e.target.files?.[0] || null)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">استبدال ملف الصوت</Label>
            <Input
              type="file"
              accept="audio/*"
              onChange={e => setNewAudioFile(e.target.files?.[0] || null)}
              className="mt-1"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '⏳ جاري الحفظ...' : '💾 حفظ التعديلات'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Audio Modal ───────────────────────────────────────────────────────────

function AddAudioModal({
  birdName,
  open,
  onClose,
  onSuccess,
}: {
  birdName: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { uploadFile } = useFileUpload();
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!audioFile || !actor) return;
    setIsSubmitting(true);
    try {
      const ext = audioFile.name.split('.').pop() || 'mp3';
      const path = `birds/audio/${Date.now()}.${ext}`;
      const result = await uploadFile(path, audioFile);
      await actor.addAudioFile(birdName, result.path);
      queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
      queryClient.invalidateQueries({ queryKey: ['birdDetails', birdName] });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to add audio:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة صوت: {birdName}</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <Label className="text-xs">ملف الصوت</Label>
          <Input
            type="file"
            accept="audio/*"
            onChange={e => setAudioFile(e.target.files?.[0] || null)}
            className="mt-1"
          />
        </div>
        <div className="flex gap-2 mt-4 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={!audioFile || isSubmitting}>
            {isSubmitting ? '⏳ جاري الرفع...' : '🎵 رفع الصوت'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Bird Card ─────────────────────────────────────────────────────────────────

function BirdCard({
  bird,
  isAdmin,
  onEdit,
  onDelete,
  onAddAudio,
  onViewDetails,
}: {
  bird: BirdData;
  isAdmin: boolean;
  onEdit: (bird: BirdData) => void;
  onDelete: (bird: BirdData) => void;
  onAddAudio: (bird: BirdData) => void;
  onViewDetails: (bird: BirdData) => void;
}) {
  const mainImage = bird.subImages?.[0];
  // Get first location for display
  const firstLocation: LocationEntry | undefined = bird.locations?.[0];

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      {/* Image */}
      <div className="cursor-pointer" onClick={() => onViewDetails(bird)}>
        {mainImage ? (
          <BirdImage imagePath={mainImage} alt={bird.arabicName} />
        ) : (
          <div className="w-full h-48 bg-amber-100 flex items-center justify-center">
            <span className="text-5xl">🦉</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        <h3
          className="font-bold text-foreground text-base mb-1 cursor-pointer hover:text-primary transition-colors"
          onClick={() => onViewDetails(bird)}
        >
          {bird.arabicName}
        </h3>
        {bird.scientificName && (
          <p className="text-muted-foreground text-xs italic mb-1">{bird.scientificName}</p>
        )}
        {bird.englishName && (
          <p className="text-muted-foreground text-xs mb-1">{bird.englishName}</p>
        )}
        {firstLocation?.location && (
          <p className="text-amber-600 text-xs">📍 {firstLocation.location}</p>
        )}
        {bird.locations && bird.locations.length > 1 && (
          <p className="text-amber-500 text-xs mt-0.5">
            🗺️ {bird.locations.length} مواقع
          </p>
        )}
        {bird.description && (
          <p className="text-muted-foreground text-xs mt-2 line-clamp-2">{bird.description}</p>
        )}

        {/* Audio */}
        {bird.audioFile && <AudioPlayerInline audioPath={bird.audioFile} />}

        {/* Admin Actions */}
        {isAdmin && (
          <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-border">
            <button
              onClick={() => onEdit(bird)}
              className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-1 rounded text-xs font-medium transition-colors"
            >
              ✏️ تعديل
            </button>
            <button
              onClick={() => onAddAudio(bird)}
              className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs font-medium transition-colors"
            >
              🎵 صوت
            </button>
            <button
              onClick={() => onDelete(bird)}
              className="bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded text-xs font-medium transition-colors"
            >
              🗑️ حذف
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Gallery Component ────────────────────────────────────────────────────

export default function BirdGallery() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBird, setEditingBird] = useState<BirdData | null>(null);
  const [audioModalBird, setAudioModalBird] = useState<BirdData | null>(null);
  const queryClient = useQueryClient();

  const { data: allBirdDetails, isLoading, error, refetch } = useGetAllBirdDetails();
  const deleteMutation = useDeleteBirdById();

  // Check admin status
  useState(() => {
    if (!actor || actorFetching) return;
    actor.isCallerAdmin().then((result: boolean) => {
      setIsAdmin(result);
    }).catch(() => setIsAdmin(false));
  });

  // Suppress unused variable warning — identity used for auth context
  void identity;

  const birds: BirdData[] = allBirdDetails
    ? allBirdDetails.map(([, bd]: [string, BirdData]) => bd)
    : [];

  const filtered = birds.filter((bird: BirdData) => {
    const term = searchTerm.toLowerCase();
    return (
      bird.arabicName?.toLowerCase().includes(term) ||
      bird.scientificName?.toLowerCase().includes(term) ||
      bird.englishName?.toLowerCase().includes(term) ||
      bird.locations?.some((loc: LocationEntry) =>
        loc.location?.toLowerCase().includes(term) ||
        loc.governorate?.toLowerCase().includes(term)
      )
    );
  });

  const handleDelete = useCallback(async (bird: BirdData) => {
    if (!confirm(`هل أنت متأكد من حذف "${bird.arabicName}"؟`)) return;
    try {
      await deleteMutation.mutateAsync(bird.id);
      queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
    } catch {
      alert('فشل حذف الطائر');
    }
  }, [deleteMutation, queryClient]);

  // Navigate to bird details — route is /bird/$name with param "name"
  const handleViewDetails = useCallback((bird: BirdData) => {
    navigate({ to: '/bird/$name', params: { name: encodeURIComponent(bird.arabicName) } });
  }, [navigate]);

  const handleSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['allBirdDetails'] });
    refetch();
  }, [queryClient, refetch]);

  if (isLoading) {
    return (
      <div dir="rtl" className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-spin inline-block">⏳</div>
          <p className="text-muted-foreground">جاري تحميل معرض الطيور...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div dir="rtl" className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-8 text-center max-w-md">
          <div className="text-4xl mb-3">❌</div>
          <p className="text-destructive font-medium mb-4">فشل تحميل المعرض</p>
          <button
            onClick={() => refetch()}
            className="bg-destructive/10 hover:bg-destructive/20 text-destructive px-4 py-2 rounded-lg text-sm"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-bold text-foreground">🦉 معرض الطيور</h1>
          <div className="flex items-center gap-2 flex-1 min-w-48">
            <span className="text-muted-foreground">🔍</span>
            <input
              type="text"
              placeholder="بحث في المعرض..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="border border-input rounded-lg px-3 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full"
            />
          </div>
          <span className="text-muted-foreground text-sm">{filtered.length} طائر</span>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              ➕ إضافة طائر
            </button>
          )}
          <button
            onClick={() => navigate({ to: '/' })}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            🏠 الرئيسية
          </button>
        </div>
      </header>

      {/* Gallery Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-muted-foreground text-lg">
              {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد طيور في المعرض'}
            </p>
          </div>
        ) : (
          <LazyGalleryGrid
            items={filtered}
            renderItem={(bird: BirdData) => (
              <BirdCard
                key={String(bird.id)}
                bird={bird}
                isAdmin={isAdmin}
                onEdit={setEditingBird}
                onDelete={handleDelete}
                onAddAudio={setAudioModalBird}
                onViewDetails={handleViewDetails}
              />
            )}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-muted-foreground text-sm">
        <p>
          © {new Date().getFullYear()} — مشروع المسح الميداني لطائر البوم بمحافظة البريمي
        </p>
        <p className="mt-1">
          Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      {/* Modals */}
      {showAddModal && (
        <AddBirdModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleSuccess}
        />
      )}
      {editingBird && (
        <EditBirdModal
          bird={editingBird}
          open={!!editingBird}
          onClose={() => setEditingBird(null)}
          onSuccess={handleSuccess}
        />
      )}
      {audioModalBird && (
        <AddAudioModal
          birdName={audioModalBird.arabicName}
          open={!!audioModalBird}
          onClose={() => setAudioModalBird(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
