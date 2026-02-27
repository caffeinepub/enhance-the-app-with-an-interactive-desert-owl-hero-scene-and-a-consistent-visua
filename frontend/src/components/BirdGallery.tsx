import React, { useState, useEffect, useRef } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActor';
import {
  useGetAllBirdData,
  useAddBirdWithDetails,
  useDeleteBirdData,
  useSaveChanges,
} from '../hooks/useQueries';
import { useFileUpload, useFileUrl, useFileDelete } from '../blob-storage/FileStorage';
import { BirdData } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Loader2, Plus, Pencil, Save, Trash2, Music, Image as ImageIcon, Search, X } from 'lucide-react';

// ---- Sub-components ----

function BirdImage({ path, alt, className }: { path: string; alt: string; className?: string }) {
  const { data: url } = useFileUrl(path);
  if (!url) return <div className={`bg-muted animate-pulse ${className ?? ''}`} />;
  return <img src={url} alt={alt} className={className} />;
}

function AudioPlayer({ birdName }: { birdName: string }) {
  const { actor } = useActor();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!actor || !birdName) return;
    actor.getAudioFile(birdName).then(path => {
      if (path) setAudioUrl(path);
    }).catch(() => {});
  }, [actor, birdName]);

  if (!audioUrl) return null;
  return (
    <div className="mt-2">
      <audio controls src={audioUrl} className="w-full h-8" />
    </div>
  );
}

// ---- Main Component ----

export default function BirdGallery() {
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
  const { uploadFile, isUploading } = useFileUpload();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBird, setSelectedBird] = useState<{ key: string; bird: BirdData } | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingBird, setEditingBird] = useState<{ key: string; bird: BirdData } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState<string | null>(null);
  const [uploadingSubImage, setUploadingSubImage] = useState<string | null>(null);

  const mainImageRef = useRef<HTMLInputElement>(null);
  const subImageRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const editAudioRef = useRef<HTMLInputElement>(null);
  const editSubImageRef = useRef<HTMLInputElement>(null);

  const [newBird, setNewBird] = useState({
    arabicName: '',
    scientificName: '',
    englishName: '',
    description: '',
    notes: '',
    latitude: '',
    longitude: '',
    mountainName: '',
    valleyName: '',
    governorate: '',
    location: '',
    mainImageFile: null as File | null,
    subImageFile: null as File | null,
    audioFile: null as File | null,
  });

  const birdList: [string, BirdData][] = allBirdData ?? [];

  const filtered = birdList.filter(([, bird]) => {
    const term = searchTerm.toLowerCase();
    return (
      bird.arabicName.toLowerCase().includes(term) ||
      bird.scientificName.toLowerCase().includes(term) ||
      bird.englishName.toLowerCase().includes(term) ||
      bird.localName.toLowerCase().includes(term)
    );
  });

  const handleAddBird = async () => {
    if (!newBird.arabicName.trim()) {
      toast.error('الاسم العربي مطلوب');
      return;
    }
    setIsSaving(true);
    try {
      let mainImagePath: string | null = null;
      let subImagePaths: string[] = [];
      let audioPath: string | null = null;

      if (newBird.mainImageFile) {
        const { path } = await uploadFile(
          `birds/${newBird.arabicName}/main-${Date.now()}.jpg`,
          newBird.mainImageFile
        );
        mainImagePath = path;
      }
      if (newBird.subImageFile) {
        const { path } = await uploadFile(
          `birds/${newBird.arabicName}/sub-${Date.now()}.jpg`,
          newBird.subImageFile
        );
        subImagePaths = [path];
      }
      if (newBird.audioFile) {
        const { path } = await uploadFile(
          `birds/${newBird.arabicName}/audio-${Date.now()}.mp3`,
          newBird.audioFile
        );
        audioPath = path;
      }

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
        audioFilePath: audioPath,
        subImages: mainImagePath ? [mainImagePath, ...subImagePaths] : subImagePaths,
      });

      toast.success('تم إضافة الطائر بنجاح');
      setShowAddDialog(false);
      setNewBird({
        arabicName: '', scientificName: '', englishName: '', description: '',
        notes: '', latitude: '', longitude: '', mountainName: '', valleyName: '',
        governorate: '', location: '', mainImageFile: null, subImageFile: null, audioFile: null,
      });
    } catch (e: any) {
      toast.error('فشل في إضافة الطائر: ' + (e?.message ?? ''));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSave = async () => {
    if (!editingBird) return;
    setIsSaving(true);
    try {
      await saveChanges.mutateAsync({
        birdName: editingBird.key,
        updatedData: editingBird.bird,
      });
      toast.success('تم حفظ التعديلات بنجاح');
      setShowEditDialog(false);
      setEditingBird(null);
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
      if (selectedBird?.key === birdName) setSelectedBird(null);
    } catch (e: any) {
      toast.error('فشل في الحذف: ' + (e?.message ?? ''));
    } finally {
      setIsDeleting(null);
    }
  };

  const handleUploadAudio = async (birdName: string, file: File) => {
    if (!actor) return;
    setUploadingAudio(birdName);
    try {
      const { path } = await uploadFile(
        `birds/${birdName}/audio-${Date.now()}.mp3`,
        file
      );
      await actor.addAudioFile(birdName, path);
      toast.success('تم رفع الصوت بنجاح');
    } catch (e: any) {
      toast.error('فشل في رفع الصوت: ' + (e?.message ?? ''));
    } finally {
      setUploadingAudio(null);
    }
  };

  const handleUploadSubImage = async (birdName: string, file: File) => {
    if (!actor) return;
    setUploadingSubImage(birdName);
    try {
      const { path } = await uploadFile(
        `birds/${birdName}/sub-${Date.now()}.jpg`,
        file
      );
      await actor.addSubImage(birdName, path);
      toast.success('تم رفع الصورة بنجاح');
    } catch (e: any) {
      toast.error('فشل في رفع الصورة: ' + (e?.message ?? ''));
    } finally {
      setUploadingSubImage(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
        <span className="mr-2 text-muted-foreground">جاري تحميل المعرض...</span>
      </div>
    );
  }

  return (
    <div dir="rtl" className="w-full space-y-4">
      {/* Search + Add */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث في المعرض..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pr-9 text-sm"
          />
        </div>
        {isAdmin && !isCheckingAdmin && (
          <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-1">
            <Plus className="w-4 h-4" />
            إضافة
          </Button>
        )}
      </div>

      {/* Gallery Grid */}
      {filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-16">لا توجد طيور في المعرض</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(([birdName, bird]) => {
            const mainImage = bird.subImages[0];
            return (
              <div
                key={birdName}
                className="group relative rounded-xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedBird({ key: birdName, bird })}
              >
                {/* Image */}
                <div className="aspect-square bg-muted overflow-hidden">
                  {mainImage ? (
                    <BirdImage
                      path={mainImage}
                      alt={bird.arabicName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="w-8 h-8 opacity-40" />
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="p-2 text-center">
                  <p className="text-sm font-semibold truncate">{bird.arabicName}</p>
                  {bird.englishName && (
                    <p className="text-xs text-muted-foreground truncate">{bird.englishName}</p>
                  )}
                </div>

                {/* Admin actions overlay */}
                {isAdmin && !isCheckingAdmin && (
                  <div
                    className="absolute top-1 left-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={e => e.stopPropagation()}
                  >
                    <Button
                      size="icon"
                      variant="secondary"
                      className="w-7 h-7"
                      title="تعديل"
                      onClick={() => { setEditingBird({ key: birdName, bird: { ...bird } }); setShowEditDialog(true); }}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="w-7 h-7"
                      title="حذف"
                      disabled={isDeleting === birdName}
                      onClick={() => handleDelete(birdName)}
                    >
                      {isDeleting === birdName ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    </Button>
                    <label className="cursor-pointer" title="إضافة الصوت">
                      <Button
                        size="icon"
                        variant="outline"
                        className="w-7 h-7 pointer-events-none"
                        disabled={uploadingAudio === birdName}
                        tabIndex={-1}
                      >
                        {uploadingAudio === birdName ? <Loader2 className="w-3 h-3 animate-spin" /> : <Music className="w-3 h-3" />}
                      </Button>
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadAudio(birdName, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <label className="cursor-pointer" title="إضافة صورة فرعية">
                      <Button
                        size="icon"
                        variant="outline"
                        className="w-7 h-7 pointer-events-none"
                        disabled={uploadingSubImage === birdName}
                        tabIndex={-1}
                      >
                        {uploadingSubImage === birdName ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadSubImage(birdName, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bird Detail Modal */}
      <Dialog open={!!selectedBird} onOpenChange={open => { if (!open) setSelectedBird(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
          {selectedBird && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedBird.bird.arabicName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Images */}
                {selectedBird.bird.subImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {selectedBird.bird.subImages.map((imgPath, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
                        <BirdImage path={imgPath} alt={`${selectedBird.bird.arabicName} ${idx + 1}`} className="w-full h-full object-cover" />
                        {isAdmin && !isCheckingAdmin && (
                          <button
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                            onClick={async () => {
                              if (!actor) return;
                              try {
                                await actor.deleteSubImage(selectedBird.key, imgPath);
                                toast.success('تم حذف الصورة');
                                setSelectedBird(prev => prev ? {
                                  ...prev,
                                  bird: {
                                    ...prev.bird,
                                    subImages: prev.bird.subImages.filter(p => p !== imgPath)
                                  }
                                } : null);
                              } catch {
                                toast.error('فشل في حذف الصورة');
                              }
                            }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {selectedBird.bird.scientificName && (
                    <div><span className="font-medium text-muted-foreground">الاسم العلمي: </span>{selectedBird.bird.scientificName}</div>
                  )}
                  {selectedBird.bird.englishName && (
                    <div><span className="font-medium text-muted-foreground">الاسم الإنجليزي: </span>{selectedBird.bird.englishName}</div>
                  )}
                  {selectedBird.bird.localName && (
                    <div><span className="font-medium text-muted-foreground">الاسم المحلي: </span>{selectedBird.bird.localName}</div>
                  )}
                  {selectedBird.bird.locations[0]?.governorate && (
                    <div><span className="font-medium text-muted-foreground">الولاية: </span>{selectedBird.bird.locations[0].governorate}</div>
                  )}
                </div>

                {selectedBird.bird.description && (
                  <div>
                    <p className="font-medium text-sm text-muted-foreground mb-1">الوصف:</p>
                    <p className="text-sm leading-relaxed">{selectedBird.bird.description}</p>
                  </div>
                )}

                {selectedBird.bird.notes && (
                  <div>
                    <p className="font-medium text-sm text-muted-foreground mb-1">ملاحظات:</p>
                    <p className="text-sm leading-relaxed">{selectedBird.bird.notes}</p>
                  </div>
                )}

                {/* Audio */}
                <AudioPlayer birdName={selectedBird.key} />

                {/* Admin actions in modal */}
                {isAdmin && !isCheckingAdmin && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => {
                        setEditingBird({ key: selectedBird.key, bird: { ...selectedBird.bird } });
                        setShowEditDialog(true);
                      }}
                    >
                      <Pencil className="w-3 h-3" />
                      تحرير
                    </Button>
                    <label className="cursor-pointer">
                      <Button size="sm" variant="outline" className="gap-1 pointer-events-none" disabled={uploadingAudio === selectedBird.key} tabIndex={-1}>
                        {uploadingAudio === selectedBird.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Music className="w-3 h-3" />}
                        إضافة الصوت
                      </Button>
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadAudio(selectedBird.key, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <label className="cursor-pointer">
                      <Button size="sm" variant="outline" className="gap-1 pointer-events-none" disabled={uploadingSubImage === selectedBird.key} tabIndex={-1}>
                        {uploadingSubImage === selectedBird.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                        إضافة صورة
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadSubImage(selectedBird.key, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1"
                      disabled={isDeleting === selectedBird.key}
                      onClick={() => handleDelete(selectedBird.key)}
                    >
                      {isDeleting === selectedBird.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      حذف
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
                <label className="text-sm font-medium">الاسم العلمي</label>
                <Input value={newBird.scientificName} onChange={e => setNewBird(p => ({ ...p, scientificName: e.target.value }))} placeholder="الاسم العلمي" />
              </div>
              <div>
                <label className="text-sm font-medium">الاسم الإنجليزي</label>
                <Input value={newBird.englishName} onChange={e => setNewBird(p => ({ ...p, englishName: e.target.value }))} placeholder="الاسم الإنجليزي" />
              </div>
              <div>
                <label className="text-sm font-medium">الولاية</label>
                <Input value={newBird.governorate} onChange={e => setNewBird(p => ({ ...p, governorate: e.target.value }))} placeholder="الولاية" />
              </div>
              <div>
                <label className="text-sm font-medium">خط العرض</label>
                <Input type="number" value={newBird.latitude} onChange={e => setNewBird(p => ({ ...p, latitude: e.target.value }))} placeholder="23.5" />
              </div>
              <div>
                <label className="text-sm font-medium">خط الطول</label>
                <Input type="number" value={newBird.longitude} onChange={e => setNewBird(p => ({ ...p, longitude: e.target.value }))} placeholder="56.2" />
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
            <div>
              <label className="text-sm font-medium block mb-1">الصورة الرئيسية</label>
              <input
                ref={mainImageRef}
                type="file"
                accept="image/*"
                className="block w-full text-sm text-muted-foreground"
                onChange={e => setNewBird(p => ({ ...p, mainImageFile: e.target.files?.[0] ?? null }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">صورة فرعية</label>
              <input
                ref={subImageRef}
                type="file"
                accept="image/*"
                className="block w-full text-sm text-muted-foreground"
                onChange={e => setNewBird(p => ({ ...p, subImageFile: e.target.files?.[0] ?? null }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">ملف الصوت</label>
              <input
                ref={audioRef}
                type="file"
                accept="audio/*"
                className="block w-full text-sm text-muted-foreground"
                onChange={e => setNewBird(p => ({ ...p, audioFile: e.target.files?.[0] ?? null }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-4">
            <DialogClose asChild>
              <Button variant="outline">إلغاء</Button>
            </DialogClose>
            <Button onClick={handleAddBird} disabled={isSaving || isUploading} className="gap-1">
              {(isSaving || isUploading) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
          {editingBird && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">الاسم العربي</label>
                  <Input
                    value={editingBird.bird.arabicName}
                    onChange={e => setEditingBird(prev => prev ? { ...prev, bird: { ...prev.bird, arabicName: e.target.value } } : null)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">الاسم المحلي</label>
                  <Input
                    value={editingBird.bird.localName}
                    onChange={e => setEditingBird(prev => prev ? { ...prev, bird: { ...prev.bird, localName: e.target.value } } : null)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">الاسم العلمي</label>
                  <Input
                    value={editingBird.bird.scientificName}
                    onChange={e => setEditingBird(prev => prev ? { ...prev, bird: { ...prev.bird, scientificName: e.target.value } } : null)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">الاسم الإنجليزي</label>
                  <Input
                    value={editingBird.bird.englishName}
                    onChange={e => setEditingBird(prev => prev ? { ...prev, bird: { ...prev.bird, englishName: e.target.value } } : null)}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">الوصف</label>
                <Input
                  value={editingBird.bird.description}
                  onChange={e => setEditingBird(prev => prev ? { ...prev, bird: { ...prev.bird, description: e.target.value } } : null)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">ملاحظات</label>
                <Input
                  value={editingBird.bird.notes}
                  onChange={e => setEditingBird(prev => prev ? { ...prev, bird: { ...prev.bird, notes: e.target.value } } : null)}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">رفع صوت جديد</label>
                <input
                  ref={editAudioRef}
                  type="file"
                  accept="audio/*"
                  className="block w-full text-sm text-muted-foreground"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (file && editingBird) {
                      await handleUploadAudio(editingBird.key, file);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">إضافة صورة فرعية</label>
                <input
                  ref={editSubImageRef}
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-muted-foreground"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (file && editingBird) {
                      await handleUploadSubImage(editingBird.key, file);
                      e.target.value = '';
                    }
                  }}
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
