import { useParams, useNavigate } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
import { ArrowRight, Camera, Music, MapPin, Edit, Save, X, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useGetBirdDetails, useUpdateDescriptionAndNotes, useAddSubImage, useAddAudioFile, useDeleteSubImage, useCanModifyData } from '../hooks/useQueries';
import { useFileUrl, useFileUpload } from '../blob-storage/FileStorage';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';

export default function BirdDetailsPage() {
  const { birdName } = useParams({ from: '/bird/$birdName' });
  const navigate = useNavigate();
  const { data: birdDetails, isLoading, error: detailsError } = useGetBirdDetails(birdName);
  const { data: canModify } = useCanModifyData();
  const updateMutation = useUpdateDescriptionAndNotes();
  const addSubImageMutation = useAddSubImage();
  const addAudioFileMutation = useAddAudioFile();
  const deleteSubImageMutation = useDeleteSubImage();
  const { uploadFile } = useFileUpload();

  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedNotes, setEditedNotes] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Log details loading errors
  useEffect(() => {
    if (detailsError) {
      console.error('❌ Bird details loading error:', {
        birdName,
        error: detailsError,
        message: (detailsError as any)?.message,
        timestamp: new Date().toISOString()
      });
    }
  }, [detailsError, birdName]);

  // Log successful details load
  useEffect(() => {
    if (birdDetails && !isLoading) {
      console.log('✅ Bird details loaded successfully:', {
        birdName,
        hasImages: birdDetails.subImages.length > 0,
        imageCount: birdDetails.subImages.length,
        hasAudio: !!birdDetails.audioFile,
        locationCount: birdDetails.locations.length,
        timestamp: new Date().toISOString()
      });
    }
  }, [birdDetails, isLoading, birdName]);

  useEffect(() => {
    if (birdDetails) {
      setEditedDescription(birdDetails.description);
      setEditedNotes(birdDetails.notes);
    }
  }, [birdDetails]);

  const handleSave = async () => {
    if (!birdDetails) return;

    try {
      await updateMutation.mutateAsync({
        birdName: birdDetails.arabicName,
        newDescription: editedDescription,
        newNotes: editedNotes
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const handleCancel = () => {
    if (birdDetails) {
      setEditedDescription(birdDetails.description);
      setEditedNotes(birdDetails.notes);
    }
    setIsEditing(false);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !birdDetails) return;

    if (!file.type.startsWith('image/')) {
      toast.error('❌ يرجى اختيار ملف صورة صحيح', {
        duration: 3000,
        position: 'bottom-center',
      });
      return;
    }

    setUploadingImage(true);

    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}-${birdDetails.arabicName}.${file.name.split('.').pop()}`;
      const filePath = `bird-gallery/${fileName}`;
      
      await uploadFile(filePath, file);
      
      await addSubImageMutation.mutateAsync({
        birdName: birdDetails.arabicName,
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
      setUploadingImage(false);
    }
  };

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !birdDetails) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('❌ يرجى اختيار ملف صوتي صحيح (MP3, WAV)', {
        duration: 3000,
        position: 'bottom-center',
      });
      return;
    }

    setUploadingAudio(true);

    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}-${birdDetails.arabicName}.${file.name.split('.').pop()}`;
      const audioFilePath = `bird-audio/${fileName}`;
      
      await uploadFile(audioFilePath, file);
      
      await addAudioFileMutation.mutateAsync({
        birdName: birdDetails.arabicName,
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
      setUploadingAudio(false);
    }
  };

  const handleDeleteImage = async (imagePath: string) => {
    if (!birdDetails) return;

    try {
      await deleteSubImageMutation.mutateAsync({
        birdName: birdDetails.arabicName,
        imagePath
      });
    } catch (error) {
      console.error('Delete image error:', error);
    }
  };

  const handlePlayAudio = () => {
    if (!audioRef.current || !birdDetails?.audioFile) return;

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      const audioUrl = `/api/blob-storage/file/${encodeURIComponent(birdDetails.audioFile)}`;
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlayingAudio(false);
    const handlePause = () => setIsPlayingAudio(false);

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8 text-right" dir="rtl">
        <div className="text-center text-xl text-muted-foreground">جاري تحميل التفاصيل...</div>
      </div>
    );
  }

  if (detailsError) {
    return (
      <div className="min-h-screen bg-background p-8 text-right" dir="rtl">
        <div className="mx-auto max-w-4xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-right">
              <div className="space-y-2">
                <p className="font-semibold">فشل تحميل تفاصيل الطائر</p>
                <p className="text-sm">تعذر الاتصال بالخادم أو قاعدة البيانات. يرجى المحاولة مرة أخرى.</p>
                <Button onClick={() => navigate({ to: '/gallery' })} variant="outline" size="sm" className="mt-2">
                  العودة للمعرض
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!birdDetails) {
    return (
      <div className="min-h-screen bg-background p-8 text-right" dir="rtl">
        <div className="mx-auto max-w-4xl">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-right">
              <p>لم يتم العثور على بيانات هذا الطائر.</p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8 text-right" dir="rtl">
      <div className="mx-auto max-w-4xl">
        <Button
          onClick={() => navigate({ to: '/gallery' })}
          variant="ghost"
          className="mb-6"
        >
          <ArrowRight className="ml-2 h-5 w-5" />
          العودة للمعرض
        </Button>

        <div className="bg-card rounded-lg shadow-lg p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">{birdDetails.arabicName}</h1>
              {birdDetails.scientificName && (
                <p className="text-lg text-muted-foreground italic" dir="ltr">
                  {birdDetails.scientificName}
                </p>
              )}
              {birdDetails.englishName && (
                <p className="text-lg text-muted-foreground" dir="ltr">
                  {birdDetails.englishName}
                </p>
              )}
            </div>
            {canModify && !isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit className="ml-2 h-5 w-5" />
                تعديل
              </Button>
            )}
          </div>

          {/* Image Gallery */}
          {birdDetails.subImages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold flex items-center">
                  <Camera className="ml-2 h-6 w-6" />
                  معرض الصور ({birdDetails.subImages.length})
                </h2>
                {canModify && (
                  <label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    <Button variant="outline" disabled={uploadingImage} asChild>
                      <span>
                        {uploadingImage ? (
                          <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                        ) : (
                          <Camera className="ml-2 h-5 w-5" />
                        )}
                        إضافة صورة
                      </span>
                    </Button>
                  </label>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {birdDetails.subImages.map((imagePath, index) => (
                  <ImageCard
                    key={index}
                    imagePath={imagePath}
                    birdName={birdDetails.arabicName}
                    onDelete={canModify ? () => handleDeleteImage(imagePath) : undefined}
                    onClick={() => setSelectedImage(imagePath)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Audio Section */}
          {birdDetails.audioFile && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center">
                <Music className="ml-2 h-6 w-6" />
                الملف الصوتي
              </h2>
              <div className="bg-muted rounded-lg p-4">
                <Button onClick={handlePlayAudio} className="w-full">
                  {isPlayingAudio ? 'إيقاف' : 'تشغيل'} الصوت
                </Button>
                <audio ref={audioRef} className="hidden" />
              </div>
            </div>
          )}

          {canModify && !birdDetails.audioFile && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center">
                <Music className="ml-2 h-6 w-6" />
                إضافة ملف صوتي
              </h2>
              <label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                  disabled={uploadingAudio}
                />
                <Button variant="outline" disabled={uploadingAudio} asChild>
                  <span>
                    {uploadingAudio ? (
                      <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Music className="ml-2 h-5 w-5" />
                    )}
                    رفع ملف صوتي
                  </span>
                </Button>
              </label>
            </div>
          )}

          {/* Locations */}
          {birdDetails.locations.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center">
                <MapPin className="ml-2 h-6 w-6" />
                المواقع ({birdDetails.locations.length})
              </h2>
              <div className="space-y-2">
                {birdDetails.locations.map((location, index) => (
                  <div key={index} className="bg-muted rounded-lg p-3">
                    <p className="text-sm">
                      خط العرض: {location.latitude.toFixed(6)} | خط الطول: {location.longitude.toFixed(6)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">الوصف</h2>
            {isEditing ? (
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                rows={6}
                className="text-right"
              />
            ) : (
              <p className="text-muted-foreground whitespace-pre-wrap">
                {birdDetails.description || 'لا يوجد وصف'}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">ملاحظات</h2>
            {isEditing ? (
              <Textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                rows={4}
                className="text-right"
              />
            ) : (
              <p className="text-muted-foreground whitespace-pre-wrap">
                {birdDetails.notes || 'لا توجد ملاحظات'}
              </p>
            )}
          </div>

          {isEditing && (
            <div className="flex gap-4">
              <Button onClick={handleSave} className="flex-1">
                <Save className="ml-2 h-5 w-5" />
                حفظ التغييرات
              </Button>
              <Button onClick={handleCancel} variant="outline" className="flex-1">
                <X className="ml-2 h-5 w-5" />
                إلغاء
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-[90vh]">
            <FullImage imagePath={selectedImage} birdName={birdDetails.arabicName} />
          </div>
        </div>
      )}
    </div>
  );
}

function ImageCard({ 
  imagePath, 
  birdName,
  onDelete, 
  onClick 
}: { 
  imagePath: string; 
  birdName: string;
  onDelete?: () => void; 
  onClick: () => void;
}) {
  const { data: imageUrl, isLoading, error } = useFileUrl(imagePath);
  const [retryCount, setRetryCount] = useState(0);

  // Log image loading details
  useEffect(() => {
    if (error) {
      console.error('❌ Image card loading error:', {
        birdName,
        imagePath,
        error,
        errorMessage: (error as any)?.message,
        timestamp: new Date().toISOString(),
        retryCount
      });
    }
  }, [error, imagePath, birdName, retryCount]);

  useEffect(() => {
    if (imageUrl) {
      console.log('✅ Image card loaded successfully:', {
        birdName,
        imagePath,
        imageUrl: imageUrl.substring(0, 50) + '...',
        timestamp: new Date().toISOString()
      });
    }
  }, [imageUrl, imagePath, birdName]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="aspect-square bg-muted rounded-lg flex flex-col items-center justify-center p-2 text-center">
        <AlertCircle className="h-6 w-6 text-destructive mb-1" />
        <p className="text-xs text-muted-foreground mb-1">فشل التحميل</p>
        <p className="text-xs text-muted-foreground mb-2 break-all" dir="ltr">{imagePath}</p>
        <Button onClick={handleRetry} variant="outline" size="sm">
          إعادة
        </Button>
      </div>
    );
  }

  return (
    <div className="relative group">
      <img
        src={imageUrl}
        alt="صورة الطائر"
        className="aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
        onClick={onClick}
        onError={() => {
          console.error('❌ Image card render error:', {
            birdName,
            imagePath,
            imageUrl,
            timestamp: new Date().toISOString()
          });
        }}
      />
      {onDelete && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          variant="destructive"
          size="sm"
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function FullImage({ imagePath, birdName }: { imagePath: string; birdName: string }) {
  const { data: imageUrl, isLoading, error } = useFileUrl(imagePath);

  // Log full image loading details
  useEffect(() => {
    if (error) {
      console.error('❌ Full image loading error:', {
        birdName,
        imagePath,
        error,
        errorMessage: (error as any)?.message,
        timestamp: new Date().toISOString()
      });
    }
  }, [error, imagePath, birdName]);

  useEffect(() => {
    if (imageUrl) {
      console.log('✅ Full image loaded successfully:', {
        birdName,
        imagePath,
        imageUrl: imageUrl.substring(0, 50) + '...',
        timestamp: new Date().toISOString()
      });
    }
  }, [imageUrl, imagePath, birdName]);

  if (isLoading) {
    return (
      <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="w-full h-96 bg-muted rounded-lg flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-2" />
        <p className="text-white mb-2">فشل تحميل الصورة</p>
        <p className="text-sm text-gray-300 break-all" dir="ltr">{imagePath}</p>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt="صورة الطائر"
      className="max-w-full max-h-full object-contain rounded-lg"
      onError={() => {
        console.error('❌ Full image render error:', {
          birdName,
          imagePath,
          imageUrl,
          timestamp: new Date().toISOString()
        });
      }}
    />
  );
}
