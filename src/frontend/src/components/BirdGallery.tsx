import React, { useState, useMemo } from 'react';
import { Search, FileSpreadsheet, FileText, Trash2, Edit, Save, X, Camera, Music, MapPin, Loader2 } from 'lucide-react';
import { useBirdAudio, useAddAudioFile, useAllBirdData, useAddSubImage, useHasAudioFile, useCanModifyData, useDeleteSubImage, useInvalidateBirdData, useBirdExists, useDeleteBird, useSaveBirdData, useUpdateBirdDetails } from '../hooks/useQueries';
import { useFileUrl, useFileUpload } from '../blob-storage/FileStorage';
import { exportBirdsToExcel } from '../lib/excelExport';
import { exportBirdsToPDF } from '../lib/pdfExport';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { BirdData } from '../backend';

export default function BirdGallery() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'images' | 'audio' | 'locations'>('all');
  const [editingBird, setEditingBird] = useState<string | null>(null);
  const [deleteConfirmBird, setDeleteConfirmBird] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState<string | null>(null);

  const { data: allBirdData, isLoading } = useAllBirdData();
  const { data: canModify } = useCanModifyData();
  const deleteBirdMutation = useDeleteBird();
  const saveBirdDataMutation = useSaveBirdData();
  const updateBirdDetailsMutation = useUpdateBirdDetails();
  const addSubImageMutation = useAddSubImage();
  const addAudioFileMutation = useAddAudioFile();
  const { uploadFile } = useFileUpload();
  const invalidateBirdData = useInvalidateBirdData();

  const [editedData, setEditedData] = useState<Record<string, BirdData>>({});

  const birdDataArray = useMemo(() => {
    if (!allBirdData) return [];
    return allBirdData.map(([_, data]) => data);
  }, [allBirdData]);

  const filteredBirds = useMemo(() => {
    let filtered = birdDataArray;

    if (searchTerm) {
      filtered = filtered.filter(bird =>
        bird.arabicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bird.scientificName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bird.englishName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType === 'images') {
      filtered = filtered.filter(bird => bird.subImages.length > 0);
    } else if (filterType === 'audio') {
      filtered = filtered.filter(bird => bird.audioFile !== undefined && bird.audioFile !== null);
    } else if (filterType === 'locations') {
      filtered = filtered.filter(bird => bird.locations.length > 0);
    }

    return filtered;
  }, [birdDataArray, searchTerm, filterType]);

  const handleEdit = (birdName: string, birdData: BirdData) => {
    setEditingBird(birdName);
    setEditedData({ ...editedData, [birdName]: { ...birdData } });
  };

  const handleSave = async (birdName: string) => {
    const data = editedData[birdName];
    if (!data) return;

    try {
      await saveBirdDataMutation.mutateAsync(data);
      setEditingBird(null);
      const newEditedData = { ...editedData };
      delete newEditedData[birdName];
      setEditedData(newEditedData);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleCancel = (birdName: string) => {
    setEditingBird(null);
    const newEditedData = { ...editedData };
    delete newEditedData[birdName];
    setEditedData(newEditedData);
  };

  const handleDelete = async (birdId: bigint) => {
    try {
      await deleteBirdMutation.mutateAsync(birdId);
      setDeleteConfirmBird(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleImageUpload = async (birdName: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('❌ يرجى اختيار ملف صورة صحيح', {
        duration: 3000,
        position: 'bottom-center',
      });
      return;
    }

    setUploadingImage(birdName);

    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}-${birdName}.${file.name.split('.').pop()}`;
      const filePath = `bird-gallery/${fileName}`;
      
      await uploadFile(filePath, file);
      
      await addSubImageMutation.mutateAsync({
        birdName: birdName,
        imagePath: filePath
      });

      toast.success('✅ تم حفظ الملف بنجاح!', {
        description: 'تم إضافة الصورة إلى معرض الطائر',
        duration: 3000,
        position: 'bottom-center',
      });
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error('❌ فشل رفع الصورة', {
        description: error?.message || 'حدث خطأ أثناء رفع الصورة',
        duration: 3000,
        position: 'bottom-center',
      });
    } finally {
      setUploadingImage(null);
    }
  };

  const handleAudioUpload = async (birdName: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('❌ يرجى اختيار ملف صوتي صحيح (MP3, WAV)', {
        duration: 3000,
        position: 'bottom-center',
      });
      return;
    }

    setUploadingAudio(birdName);

    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}-${birdName}.${file.name.split('.').pop()}`;
      const audioFilePath = `bird-audio/${fileName}`;
      
      await uploadFile(audioFilePath, file);
      
      await addAudioFileMutation.mutateAsync({
        birdName: birdName,
        audioFilePath: audioFilePath
      });

      toast.success('✅ تم حفظ الملف بنجاح!', {
        description: 'تم إضافة الملف الصوتي إلى سجل الطائر',
        duration: 3000,
        position: 'bottom-center',
      });
    } catch (error: any) {
      console.error('Audio upload error:', error);
      toast.error('❌ فشل رفع الملف الصوتي', {
        description: error?.message || 'حدث خطأ أثناء رفع الملف الصوتي',
        duration: 3000,
        position: 'bottom-center',
      });
    } finally {
      setUploadingAudio(null);
    }
  };

  const handleExportExcel = () => {
    exportBirdsToExcel(birdDataArray);
  };

  const handleExportPDF = () => {
    exportBirdsToPDF(birdDataArray);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8 text-right" dir="rtl">
        <div className="text-center text-xl text-muted-foreground">جاري تحميل البيانات...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8 text-right" dir="rtl">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-6">معرض الطيور</h1>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="ابحث عن طائر..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="تصفية حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="images">مع صور</SelectItem>
                <SelectItem value="audio">مع صوت</SelectItem>
                <SelectItem value="locations">مع مواقع</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button onClick={handleExportExcel} variant="outline" className="gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Excel
              </Button>
              <Button onClick={handleExportPDF} variant="outline" className="gap-2">
                <FileText className="h-5 w-5" />
                PDF
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBirds.map((bird) => (
            <BirdCard
              key={bird.id.toString()}
              bird={bird}
              isEditing={editingBird === bird.arabicName}
              editedData={editedData[bird.arabicName]}
              onEdit={() => handleEdit(bird.arabicName, bird)}
              onSave={() => handleSave(bird.arabicName)}
              onCancel={() => handleCancel(bird.arabicName)}
              onDelete={() => setDeleteConfirmBird(bird.arabicName)}
              onImageUpload={(e) => handleImageUpload(bird.arabicName, e)}
              onAudioUpload={(e) => handleAudioUpload(bird.arabicName, e)}
              uploadingImage={uploadingImage === bird.arabicName}
              uploadingAudio={uploadingAudio === bird.arabicName}
              canModify={canModify || false}
              onFieldChange={(field, value) => {
                setEditedData({
                  ...editedData,
                  [bird.arabicName]: {
                    ...editedData[bird.arabicName],
                    [field]: value
                  }
                });
              }}
            />
          ))}
        </div>

        {filteredBirds.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">لا توجد نتائج</p>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirmBird} onOpenChange={() => setDeleteConfirmBird(null)}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>تأكيد الحذف</DialogTitle>
            </DialogHeader>
            <p className="text-right">هل أنت متأكد من حذف هذا الطائر؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmBird(null)}>
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  const bird = birdDataArray.find(b => b.arabicName === deleteConfirmBird);
                  if (bird) handleDelete(bird.id);
                }}
              >
                حذف
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

interface BirdCardProps {
  bird: BirdData;
  isEditing: boolean;
  editedData?: BirdData;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAudioUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingImage: boolean;
  uploadingAudio: boolean;
  canModify: boolean;
  onFieldChange: (field: keyof BirdData, value: any) => void;
}

function BirdCard({
  bird,
  isEditing,
  editedData,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onImageUpload,
  onAudioUpload,
  uploadingImage,
  uploadingAudio,
  canModify,
  onFieldChange
}: BirdCardProps) {
  const displayData = isEditing && editedData ? editedData : bird;
  const firstImage = displayData.subImages[0];

  return (
    <div className="bg-card rounded-lg shadow-lg overflow-hidden border border-border">
      {firstImage ? (
        <BirdImage imagePath={firstImage} alt={displayData.arabicName} />
      ) : (
        <div className="h-48 bg-muted flex items-center justify-center">
          <p className="text-muted-foreground">لا توجد صورة</p>
        </div>
      )}

      <div className="p-4 space-y-3">
        {isEditing ? (
          <Input
            value={editedData?.arabicName || ''}
            onChange={(e) => onFieldChange('arabicName', e.target.value)}
            className="text-right font-bold"
          />
        ) : (
          <h3 className="text-xl font-bold text-foreground">{displayData.arabicName}</h3>
        )}

        {isEditing ? (
          <Input
            value={editedData?.scientificName || ''}
            onChange={(e) => onFieldChange('scientificName', e.target.value)}
            className="text-right italic"
            placeholder="الاسم العلمي"
          />
        ) : (
          displayData.scientificName && (
            <p className="text-sm text-muted-foreground italic" dir="ltr">
              {displayData.scientificName}
            </p>
          )
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Camera className="h-4 w-4" />
            <span>{displayData.subImages.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <Music className="h-4 w-4" />
            <span>{displayData.audioFile ? 'نعم' : 'لا'}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{displayData.locations.length}</span>
          </div>
        </div>

        {canModify && (
          <div className="flex gap-2 pt-2">
            {isEditing ? (
              <>
                <Button onClick={onSave} size="sm" className="flex-1">
                  <Save className="h-4 w-4 ml-1" />
                  حفظ
                </Button>
                <Button onClick={onCancel} variant="outline" size="sm" className="flex-1">
                  <X className="h-4 w-4 ml-1" />
                  إلغاء
                </Button>
              </>
            ) : (
              <>
                <Button onClick={onEdit} variant="outline" size="sm" className="flex-1">
                  <Edit className="h-4 w-4 ml-1" />
                  تعديل
                </Button>
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                  <Button variant="outline" size="sm" className="w-full" disabled={uploadingImage} asChild>
                    <span>
                      {uploadingImage ? (
                        <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4 ml-1" />
                      )}
                      صورة
                    </span>
                  </Button>
                </label>
                <label className="flex-1">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={onAudioUpload}
                    className="hidden"
                    disabled={uploadingAudio}
                  />
                  <Button variant="outline" size="sm" className="w-full" disabled={uploadingAudio} asChild>
                    <span>
                      {uploadingAudio ? (
                        <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                      ) : (
                        <Music className="h-4 w-4 ml-1" />
                      )}
                      صوت
                    </span>
                  </Button>
                </label>
                <Button onClick={onDelete} variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BirdImage({ imagePath, alt }: { imagePath: string; alt: string }) {
  const { data: imageUrl, isLoading } = useFileUrl(imagePath);

  if (isLoading) {
    return (
      <div className="h-48 bg-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="h-48 bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">فشل تحميل الصورة</p>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className="w-full h-48 object-cover"
    />
  );
}
