import { useState, useEffect } from 'react';
import { ArrowRight, MapPin, Music, Play, Pause, Volume2, Loader2, X, Trash2, Upload, Camera, Edit, Save } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useBirdAudio, useAddAudioFile, useAddSubImage, useHasAudioFile, useBirdExists, useAllBirdData, useBirdDetails, useUpdateDescriptionAndNotes } from '../hooks/useQueries';
import { useFileUrl, useFileUpload, useFileDelete } from '../blob-storage/FileStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface BirdDetailsPageProps {
  initialBirdName: string;
  onClose: () => void;
}

export default function BirdDetailsPage({ initialBirdName, onClose }: BirdDetailsPageProps) {
  const navigate = useNavigate();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedNotes, setEditedNotes] = useState('');
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const { data: birdDetails, isLoading: isLoadingDetails } = useBirdDetails(initialBirdName);
  const { data: audioPath } = useBirdAudio(initialBirdName);
  const { data: audioUrl, isLoading: isLoadingAudio } = useFileUrl(audioPath || '');
  const { data: hasAudio } = useHasAudioFile(initialBirdName);
  const addAudioFileMutation = useAddAudioFile();
  const addSubImageMutation = useAddSubImage();
  const updateDescriptionMutation = useUpdateDescriptionAndNotes();
  const { uploadFile } = useFileUpload();
  const { deleteFile } = useFileDelete();

  const birdName = birdDetails?.arabicName || initialBirdName;
  const scientificName = birdDetails?.scientificName || '';
  const englishName = birdDetails?.englishName || '';
  const description = birdDetails?.description || '';
  const notes = birdDetails?.notes || '';
  const subImages = birdDetails?.subImages || [];
  const locationCount = birdDetails?.locations?.length || 0;

  useEffect(() => {
    if (description) {
      setEditedDescription(description);
    }
    if (notes) {
      setEditedNotes(notes);
    }
  }, [description, notes]);

  useEffect(() => {
    if (audioUrl) {
      const audioElement = new Audio(audioUrl);
      audioElement.addEventListener('ended', () => setIsPlaying(false));
      setAudio(audioElement);
      
      return () => {
        audioElement.pause();
        audioElement.removeEventListener('ended', () => setIsPlaying(false));
      };
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
      setUploadingImage(false);
    }
  };

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
      setUploadingAudio(false);
    }
  };

  const handleSaveDescription = async () => {
    setIsSavingDescription(true);

    try {
      await updateDescriptionMutation.mutateAsync({
        birdName: birdName,
        newDescription: editedDescription,
        newNotes: editedNotes,
      });

      toast.success('✅ تم حفظ التعديلات بنجاح', {
        description: 'تم تحديث الوصف والملاحظات',
        duration: 3000,
        position: 'bottom-center',
      });

      setIsEditingDescription(false);
    } catch (error: any) {
      console.error('Save description error:', error);
      toast.error('❌ فشل حفظ التعديلات', {
        description: error?.message || 'حدث خطأ أثناء حفظ التعديلات',
        duration: 3000,
        position: 'bottom-center',
      });
    } finally {
      setIsSavingDescription(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedDescription(description);
    setEditedNotes(notes);
    setIsEditingDescription(false);
  };

  if (isLoadingDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center" dir="rtl">
        <Loader2 className="h-12 w-12 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-6 px-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              <ArrowRight className="h-5 w-5 ml-2" />
              رجوع
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-center flex-1">
              {birdName}
            </h1>
            <div className="w-24"></div>
          </div>
          {scientificName && (
            <p className="text-amber-100 text-center mt-2 italic" dir="ltr">
              {scientificName}
            </p>
          )}
          {englishName && (
            <p className="text-amber-100 text-center mt-1" dir="ltr">
              {englishName}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                  <span>معرض الصور</span>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={uploadingImage}
                      asChild
                    >
                      <span>
                        {uploadingImage ? (
                          <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4 ml-2" />
                        )}
                        إضافة صورة
                      </span>
                    </Button>
                  </label>
                </h2>

                {subImages.length > 0 ? (
                  <>
                    <ImageDisplay imagePath={subImages[selectedImageIndex]} alt={birdName} />
                    
                    {subImages.length > 1 && (
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        {subImages.map((imagePath, index) => (
                          <ImageThumbnail
                            key={index}
                            imagePath={imagePath}
                            alt={`${birdName} ${index + 1}`}
                            isSelected={index === selectedImageIndex}
                            onClick={() => setSelectedImageIndex(index)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                    <p className="text-gray-500">لا توجد صور متاحة</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Audio Player */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                  <span>الملف الصوتي</span>
                  {!hasAudio && (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioUpload}
                        className="hidden"
                        disabled={uploadingAudio}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={uploadingAudio}
                        asChild
                      >
                        <span>
                          {uploadingAudio ? (
                            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                          ) : (
                            <Music className="h-4 w-4 ml-2" />
                          )}
                          إضافة صوت
                        </span>
                      </Button>
                    </label>
                  )}
                </h2>

                {hasAudio && audioUrl ? (
                  <Button
                    onClick={togglePlay}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    size="lg"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-5 w-5 ml-2" />
                        إيقاف الصوت
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 ml-2" />
                        تشغيل الصوت
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="bg-gray-100 rounded-lg p-8 text-center">
                    <Volume2 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">لا يوجد ملف صوتي متاح</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">الوصف والملاحظات</h2>
                  {!isEditingDescription ? (
                    <Button
                      onClick={() => setIsEditingDescription(true)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="h-4 w-4 ml-2" />
                      تعديل
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveDescription}
                        size="sm"
                        disabled={isSavingDescription}
                      >
                        {isSavingDescription ? (
                          <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 ml-2" />
                        )}
                        حفظ
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="outline"
                        size="sm"
                        disabled={isSavingDescription}
                      >
                        <X className="h-4 w-4 ml-2" />
                        إلغاء
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">الوصف:</h3>
                    {isEditingDescription ? (
                      <Textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        rows={6}
                        className="w-full text-right"
                        dir="rtl"
                        placeholder="أدخل وصف الطائر..."
                      />
                    ) : (
                      <p className="text-gray-600 whitespace-pre-wrap">
                        {description || 'لا يوجد وصف متاح'}
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">الملاحظات:</h3>
                    {isEditingDescription ? (
                      <Textarea
                        value={editedNotes}
                        onChange={(e) => setEditedNotes(e.target.value)}
                        rows={4}
                        className="w-full text-right"
                        dir="rtl"
                        placeholder="أدخل ملاحظات إضافية..."
                      />
                    ) : (
                      <p className="text-gray-600 whitespace-pre-wrap">
                        {notes || 'لا توجد ملاحظات متاحة'}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">معلومات إضافية</h2>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-700">
                    <MapPin className="h-5 w-5 ml-2 text-amber-600" />
                    <span className="font-semibold ml-2">عدد المواقع:</span>
                    <span>{locationCount}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Camera className="h-5 w-5 ml-2 text-amber-600" />
                    <span className="font-semibold ml-2">عدد الصور:</span>
                    <span>{subImages.length}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Music className="h-5 w-5 ml-2 text-amber-600" />
                    <span className="font-semibold ml-2">ملف صوتي:</span>
                    <span>{hasAudio ? 'متوفر' : 'غير متوفر'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Image Display Component
function ImageDisplay({ imagePath, alt }: { imagePath: string; alt: string }) {
  const { data: imageUrl, isLoading } = useFileUrl(imagePath);

  if (isLoading) {
    return (
      <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center">
        <p className="text-gray-500">فشل تحميل الصورة</p>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className="w-full h-96 object-cover rounded-lg"
    />
  );
}

// Image Thumbnail Component
function ImageThumbnail({
  imagePath,
  alt,
  isSelected,
  onClick,
}: {
  imagePath: string;
  alt: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { data: imageUrl, isLoading } = useFileUrl(imagePath);

  if (isLoading) {
    return (
      <div className="bg-gray-200 rounded-lg h-20 flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="bg-gray-200 rounded-lg h-20 flex items-center justify-center">
        <p className="text-xs text-gray-500">خطأ</p>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`relative rounded-lg overflow-hidden h-20 transition-all ${
        isSelected ? 'ring-4 ring-amber-500' : 'ring-2 ring-gray-200 hover:ring-amber-300'
      }`}
    >
      <img
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-cover"
      />
    </button>
  );
}
