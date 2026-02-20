import { useState, useEffect } from 'react';
import { ArrowLeft, Camera, Upload, Play, Pause, Volume2, Eye, MapPin, Info, X, ChevronLeft, ChevronRight, Loader2, Image as ImageIcon, Music, FileImage, CheckCircle2, AlertTriangle, Save, Edit, Download } from 'lucide-react';
import { useFileUrl, useFileUpload } from '../blob-storage/FileStorage';
import { useBirdAudio, useUploadAudio, useAddSubImage, useHasAudioFile, useBirdExists, useAllBirdData, useBirdDetails, useUpdateDescriptionAndNotes, useSaveChanges } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface BirdSpecies {
  id: string;
  arabicName: string;
  scientificName: string;
  englishName?: string;
  description: string;
  mainImage: string;
  subImages: string[];
  audioFile?: string;
  locationCount?: number;
  fullDescription?: string;
  notes?: string;
}

interface BirdDetailsPageProps {
  bird: BirdSpecies;
  onBack: () => void;
  onRefresh: () => void;
}

// Component for displaying image with loading state
function DetailImage({ imagePath, alt, className, onClick }: { 
  imagePath: string; 
  alt: string; 
  className?: string;
  onClick?: () => void;
}) {
  const { data: imageUrl, isLoading } = useFileUrl(imagePath);

  if (isLoading) {
    return (
      <div className={`bg-gray-200 rounded-lg flex items-center justify-center ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className={`bg-gray-200 rounded-lg flex items-center justify-center ${className}`}>
        <ImageIcon className="h-8 w-8 text-gray-400" />
      </div>
    );
  }

  return (
    <img 
      src={imageUrl} 
      alt={alt}
      className={`object-cover rounded-lg ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} ${className}`}
      onClick={onClick}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
      }}
    />
  );
}

// Audio player component with enhanced visibility
function AudioPlayer({ audioPath, birdName }: { audioPath: string; birdName: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: audioUrl, isLoading } = useFileUrl(audioPath);

  useEffect(() => {
    if (audioUrl) {
      try {
        const audioElement = new Audio(audioUrl);
        audioElement.addEventListener('ended', () => setIsPlaying(false));
        audioElement.addEventListener('error', () => {
          setError('حدث خطأ في تحميل الملف الصوتي');
          setIsPlaying(false);
        });
        setAudio(audioElement);
        setError(null);
        
        return () => {
          audioElement.pause();
          audioElement.removeEventListener('ended', () => setIsPlaying(false));
          audioElement.removeEventListener('error', () => {});
        };
      } catch (err) {
        setError('حدث خطأ في تحميل الملف الصوتي');
      }
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {
        setError('حدث خطأ في تشغيل الصوت');
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-center space-x-3 space-x-reverse">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <p className="text-blue-900 font-medium">جاري تحميل الملف الصوتي...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center space-x-3 space-x-reverse">
          <Volume2 className="h-6 w-6 text-red-600" />
          <p className="text-red-900 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!audioUrl) return null;

  return (
    <div className="bg-gradient-to-r from-orange-50 via-yellow-50 to-green-50 border-2 border-orange-300 rounded-xl p-6 shadow-lg">
      <div className="flex items-center space-x-4 space-x-reverse">
        <button
          onClick={togglePlay}
          className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-full hover:from-orange-700 hover:to-red-700 active:from-orange-800 active:to-red-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-110 active:scale-95"
        >
          {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 mr-1" />}
        </button>
        <div className="flex-1">
          <p className="text-xl font-bold text-orange-900 mb-1">🔊 تشغيل صوت الطائر</p>
          <p className="text-base text-orange-700 font-medium">استمع إلى صوت {birdName}</p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <Volume2 className="h-8 w-8 text-orange-600" />
          <div className={`w-4 h-4 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
        </div>
      </div>
      {isPlaying && (
        <div className="mt-3 text-center">
          <p className="text-sm text-green-700 font-medium animate-pulse">▶ جاري التشغيل...</p>
        </div>
      )}
    </div>
  );
}

// Sub-image upload modal - UNLIMITED with automatic save
function SubImageUploadModal({
  isOpen,
  onClose,
  birdName,
  onUploadSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  birdName: string;
  onUploadSuccess: () => void;
}) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const { uploadFile } = useFileUpload();
  const addSubImageMutation = useAddSubImage();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      setUploadError('يرجى اختيار ملفات صور فقط');
      return;
    }
    
    setSelectedFiles(imageFiles);
    setUploadError(null);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadError('يرجى اختيار صور للرفع');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      
      const timestamp = Date.now();
      const totalFiles = selectedFiles.length;
      
      for (let index = 0; index < selectedFiles.length; index++) {
        const file = selectedFiles[index];
        const fileName = `${timestamp}-${birdName}-sub-${index + 1}.${file.name.split('.').pop()}`;
        const filePath = `bird-gallery/${fileName}`;
        
        await uploadFile(filePath, file, (progress) => {
          const overallProgress = ((index + progress) / totalFiles) * 90;
          setUploadProgress(Math.round(overallProgress));
        });
        
        // Automatically save to backend immediately after upload
        await addSubImageMutation.mutateAsync({
          birdName: birdName,
          imagePath: filePath
        });
      }
      
      setUploadProgress(100);
      
      // Show success toast in Arabic
      toast.success('✅ تم حفظ الملف بنجاح!', {
        description: `تم رفع وحفظ ${totalFiles} صورة بنجاح`,
        duration: 3000,
        position: 'bottom-center',
      });
      
      setSelectedFiles([]);
      setUploadProgress(0);
      onUploadSuccess();
      onClose();
      
    } catch (error: any) {
      console.error('Sub-image upload error:', error);
      const errorMessage = error?.message || 'حدث خطأ أثناء رفع الصور';
      setUploadError(errorMessage);
      toast.error('❌ فشل حفظ الملف', {
        description: errorMessage,
        duration: 3000,
        position: 'bottom-center',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    setUploadProgress(0);
    setUploadError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <FileImage className="h-6 w-6 ml-2" />
            إضافة صورة فرعية
          </DialogTitle>
          <DialogDescription>
            أضف عدد غير محدود من الصور الفرعية لـ {birdName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <div className="space-y-6 py-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اختر الصور الفرعية (غير محدودة)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isUploading}
              />
            </div>

            {selectedFiles.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">الصور المختارة</h4>
                  <Badge variant="default">
                    {selectedFiles.length} صورة
                  </Badge>
                </div>
                <ScrollArea className="h-64 border rounded-lg p-2">
                  <div className="grid grid-cols-4 gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Sub-image ${index + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-bold">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {isUploading && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">جاري رفع وحفظ الصور...</span>
                  <span className="text-sm text-blue-700">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {uploadError && (
              <Alert className="border-red-300 bg-red-50">
                <AlertDescription className="text-red-900 font-medium">
                  ❌ {uploadError}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t">
          <Button onClick={handleCancel} disabled={isUploading} variant="outline" className="hover:bg-gray-100 active:bg-gray-200">
            إلغاء
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={selectedFiles.length === 0 || isUploading}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري الرفع والحفظ...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 ml-2" />
                رفع وحفظ {selectedFiles.length} صورة
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function BirdDetailsPage({ bird, onBack, onRefresh }: BirdDetailsPageProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showSubImages, setShowSubImages] = useState(false);
  const [showSubImageUpload, setShowSubImageUpload] = useState(false);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [uploadedAudioPath, setUploadedAudioPath] = useState<string | null>(null);
  
  // Editable description state
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  
  // PDF export state
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  
  // Fetch complete bird details from backend
  const { data: backendBirdDetails, refetch: refetchBirdDetails, isLoading: detailsLoading } = useBirdDetails(bird.arabicName);
  const { data: birdAudio, refetch: refetchAudio, isLoading: audioLoading } = useBirdAudio(bird.arabicName);
  const { data: hasAudio, refetch: refetchHasAudio, isLoading: hasAudioLoading } = useHasAudioFile(bird.arabicName);
  const { data: birdExistsInDB, isLoading: birdExistsLoading, refetch: refetchBirdExists } = useBirdExists(bird.arabicName);
  const { data: allBirdData, refetch: refetchAllBirdData } = useAllBirdData();
  const { uploadFile } = useFileUpload();
  const uploadAudioMutation = useUploadAudio();
  const updateDescriptionMutation = useUpdateDescriptionAndNotes();

  // COMPREHENSIVE MERGING LOGIC - Always prioritize table data over backend data
  const mergedBirdData = {
    arabicName: bird.arabicName,
    scientificName: (bird.scientificName && bird.scientificName.trim()) 
      ? bird.scientificName.trim()
      : (backendBirdDetails?.scientificName && backendBirdDetails.scientificName.trim())
        ? backendBirdDetails.scientificName.trim()
        : '',
    englishName: (bird.englishName && bird.englishName.trim()) 
      ? bird.englishName.trim()
      : (backendBirdDetails?.englishName && backendBirdDetails.englishName.trim())
        ? backendBirdDetails.englishName.trim()
        : '',
    fullDescription: (() => {
      if (bird.fullDescription && bird.fullDescription.trim()) {
        return bird.fullDescription.trim();
      }
      if (bird.notes && bird.notes.trim()) {
        return bird.notes.trim();
      }
      if (backendBirdDetails?.notes && backendBirdDetails.notes.trim()) {
        return backendBirdDetails.notes.trim();
      }
      if (backendBirdDetails?.description && backendBirdDetails.description.trim()) {
        return backendBirdDetails.description.trim();
      }
      return '';
    })(),
    briefDescription: bird.description || '',
    subImages: backendBirdDetails?.subImages || bird.subImages || [],
    audioFile: backendBirdDetails?.audioFile || bird.audioFile,
    locationCount: backendBirdDetails?.locations?.length || bird.locationCount || 0
  };

  const allImages = [bird.mainImage, ...mergedBirdData.subImages];

  // Get actual location count from backend data
  const actualLocationCount = allBirdData?.find(([name]) => {
    const normalizedName = name.trim().toLowerCase().replace(/[-\s]/g, '');
    const normalizedBirdName = bird.arabicName.trim().toLowerCase().replace(/[-\s]/g, '');
    return normalizedName === normalizedBirdName;
  })?.[1]?.locations?.length || mergedBirdData.locationCount || 0;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // AUTOMATIC AUDIO UPLOAD - saves immediately without extra button
  const handleAudioUpload = async () => {
    if (!selectedAudioFile || !bird) return;

    try {
      setIsUploadingAudio(true);
      
      const fileName = `${Date.now()}-${bird.arabicName.trim()}.${selectedAudioFile.name.split('.').pop()}`;
      const filePath = `bird-audio/${fileName}`;
      
      // Upload file to storage
      const uploadResult = await uploadFile(filePath, selectedAudioFile);
      
      if (!uploadResult || !uploadResult.path) {
        throw new Error('❌ فشل رفع الملف الصوتي');
      }
      
      // Automatically save to backend immediately
      await uploadAudioMutation.mutateAsync({
        birdName: bird.arabicName.trim(),
        audioFilePath: uploadResult.path
      });
      
      // Store the uploaded path for immediate display
      setUploadedAudioPath(uploadResult.path);
      setSelectedAudioFile(null);
      
      // Show success toast in Arabic immediately
      toast.success('✅ تم حفظ الملف بنجاح!', {
        description: 'تم رفع وحفظ الملف الصوتي بنجاح',
        duration: 3000,
        position: 'bottom-center',
      });
      
      // Refetch all related data to sync across pages
      setTimeout(async () => {
        await Promise.all([
          refetchAudio(),
          refetchHasAudio(),
          refetchBirdExists(),
          refetchAllBirdData(),
          refetchBirdDetails()
        ]);
        onRefresh(); // Trigger parent refresh
      }, 500);
      
    } catch (error: any) {
      console.error('Audio upload error:', error);
      
      setUploadedAudioPath(null);
      
      let errorMessage = error?.message || 'حدث خطأ أثناء رفع الملف الصوتي';
      
      toast.error('❌ فشل حفظ الملف', {
        description: errorMessage,
        duration: 5000,
        position: 'bottom-center',
      });
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const handleSubImageUploadSuccess = () => {
    // Refetch all data to sync across pages
    setTimeout(async () => {
      await Promise.all([
        refetchAllBirdData(),
        refetchBirdExists(),
        refetchBirdDetails()
      ]);
      onRefresh();
    }, 500);
  };

  const handleEditDescription = () => {
    setEditedDescription(mergedBirdData.fullDescription);
    setIsEditingDescription(true);
  };

  const handleSaveDescription = async () => {
    try {
      setIsSavingDescription(true);

      await updateDescriptionMutation.mutateAsync({
        birdName: bird.arabicName,
        newDescription: editedDescription,
        newNotes: editedDescription
      });

      setIsEditingDescription(false);

      // Refetch data to sync
      setTimeout(async () => {
        await Promise.all([
          refetchBirdDetails(),
          refetchAllBirdData()
        ]);
        onRefresh();
      }, 500);

    } catch (error: any) {
      console.error('Description save error:', error);
    } finally {
      setIsSavingDescription(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingDescription(false);
    setEditedDescription('');
  };

  // PDF Export Function
  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('فشل فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.');
      }

      const pdfContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>تفاصيل الطائر - ${mergedBirdData.arabicName}</title>
          <style>
            @page { size: A4; margin: 2cm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', 'Tahoma', sans-serif; direction: rtl; text-align: right; line-height: 1.8; color: #333; background: white; padding: 20px; }
            .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { font-size: 32px; color: #1e40af; margin-bottom: 10px; font-weight: bold; }
            .header .subtitle { font-size: 18px; color: #64748b; font-style: italic; }
            .section { margin: 25px 0; page-break-inside: avoid; }
            .section-title { font-size: 22px; color: #1e40af; font-weight: bold; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #93c5fd; }
            .info-grid { display: grid; grid-template-columns: 1fr; gap: 15px; margin: 15px 0; }
            .info-item { background: #f8fafc; padding: 15px; border-radius: 8px; border-right: 4px solid #3b82f6; }
            .info-label { font-weight: bold; color: #1e40af; font-size: 16px; margin-bottom: 5px; }
            .info-value { color: #475569; font-size: 15px; line-height: 1.6; }
            .description-box { background: #f1f5f9; padding: 20px; border-radius: 8px; border: 1px solid #cbd5e1; white-space: pre-wrap; line-height: 2; font-size: 15px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${mergedBirdData.arabicName}</h1>
            ${mergedBirdData.scientificName ? `<div class="subtitle" dir="ltr">${mergedBirdData.scientificName}</div>` : ''}
            ${mergedBirdData.englishName ? `<div class="subtitle" dir="ltr">${mergedBirdData.englishName}</div>` : ''}
          </div>

          <div class="section">
            <div class="section-title">معلومات أساسية</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">الاسم العربي</div>
                <div class="info-value">${mergedBirdData.arabicName}</div>
              </div>
              ${mergedBirdData.scientificName ? `
              <div class="info-item">
                <div class="info-label">الاسم العلمي</div>
                <div class="info-value" dir="ltr">${mergedBirdData.scientificName}</div>
              </div>
              ` : ''}
              ${mergedBirdData.englishName ? `
              <div class="info-item">
                <div class="info-label">الاسم الأجنبي</div>
                <div class="info-value" dir="ltr">${mergedBirdData.englishName}</div>
              </div>
              ` : ''}
              <div class="info-item">
                <div class="info-label">عدد المواقع المسجلة</div>
                <div class="info-value">${actualLocationCount} موقع</div>
              </div>
              ${mergedBirdData.subImages.length > 0 ? `
              <div class="info-item">
                <div class="info-label">عدد الصور الفرعية</div>
                <div class="info-value">${mergedBirdData.subImages.length} صورة</div>
              </div>
              ` : ''}
            </div>
          </div>

          ${mergedBirdData.fullDescription ? `
          <div class="section">
            <div class="section-title">الوصف الكامل والملاحظات التفصيلية</div>
            <div class="description-box">${mergedBirdData.fullDescription}</div>
          </div>
          ` : ''}

          <div class="footer">
            <p>تم إنشاء هذا المستند من تطبيق طائر البوم بمحافظة البريمي</p>
            <p>تاريخ الإنشاء: ${new Date().toLocaleDateString('ar-SA')}</p>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(pdfContent);
      printWindow.document.close();

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          setIsExportingPDF(false);
        }, 500);
      };

    } catch (error: any) {
      console.error('PDF export error:', error);
      alert('حدث خطأ أثناء تصدير PDF: ' + (error?.message || 'خطأ غير معروف'));
      setIsExportingPDF(false);
    }
  };

  // Determine if we should show the audio player
  const audioPath = uploadedAudioPath || birdAudio || mergedBirdData.audioFile;
  const audioExists = !!audioPath;
  const isCheckingAudio = audioLoading || hasAudioLoading;

  // Improved bird existence check
  const birdHasLocations = actualLocationCount > 0;
  const birdIsInDatabase = birdExistsInDB === true || birdHasLocations;

  // Check if we have full description
  const hasFullDescription = !!mergedBirdData.fullDescription && mergedBirdData.fullDescription.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button onClick={onBack} variant="outline" size="sm" className="hover:bg-gray-100 active:bg-gray-200">
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة للمعرض
            </Button>
            <div className="text-center flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{mergedBirdData.arabicName}</h1>
              {mergedBirdData.scientificName && (
                <p className="text-lg italic text-gray-600 mt-1" dir="ltr">{mergedBirdData.scientificName}</p>
              )}
              {mergedBirdData.englishName && (
                <p className="text-base text-gray-500 mt-1" dir="ltr">{mergedBirdData.englishName}</p>
              )}
            </div>
            <Button 
              onClick={handleExportPDF} 
              disabled={isExportingPDF}
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isExportingPDF ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري التصدير...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 ml-2" />
                  تحميل كـ PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="relative">
                <DetailImage
                  imagePath={allImages[currentImageIndex]}
                  alt={mergedBirdData.arabicName}
                  className="w-full h-96 object-cover"
                />
                
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white active:bg-gray-100 rounded-full p-3 shadow-lg transition-all duration-200"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white active:bg-gray-100 rounded-full p-3 shadow-lg transition-all duration-200"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                    
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 space-x-reverse">
                      {allImages.slice(0, 10).map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-3 h-3 rounded-full transition-colors ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                      {allImages.length > 10 && (
                        <span className="text-white text-xs bg-black/50 px-2 rounded">
                          +{allImages.length - 10}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Audio Player - Always show when audio exists */}
            {audioExists && audioPath && (
              <Card className="border-2 border-orange-300 shadow-xl">
                <CardContent className="p-6">
                  <AudioPlayer audioPath={audioPath} birdName={mergedBirdData.arabicName} />
                </CardContent>
              </Card>
            )}

            {/* Loading state for audio check */}
            {!audioExists && isCheckingAudio && !uploadedAudioPath && (
              <Card>
                <CardContent className="p-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-center space-x-3 space-x-reverse">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <p className="text-blue-900 font-medium">جاري التحقق من الملف الصوتي...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No audio message */}
            {!audioExists && !isCheckingAudio && !uploadedAudioPath && (
              <Card className="border-2 border-gray-300">
                <CardContent className="p-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <Volume2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium mb-2">لا يوجد ملف صوتي متاح</p>
                    <p className="text-sm text-gray-500">يمكنك رفع ملف صوتي من الأسفل</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Image Counter */}
            {allImages.length > 1 && (
              <div className="text-center">
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {currentImageIndex + 1} من {allImages.length}
                </Badge>
              </div>
            )}

            {/* Sub-images Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Camera className="h-5 w-5 ml-2" />
                    الصور الفرعية ({mergedBirdData.subImages.length})
                  </CardTitle>
                  <Button
                    onClick={() => setShowSubImageUpload(true)}
                    variant="outline"
                    size="sm"
                    className="hover:bg-blue-50 active:bg-blue-100 transition-all duration-200"
                  >
                    <Upload className="h-4 w-4 ml-2" />
                    إضافة صورة فرعية
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {mergedBirdData.subImages.length > 0 && (
                  <>
                    <Button
                      onClick={() => setShowSubImages(!showSubImages)}
                      variant="outline"
                      size="sm"
                      className="w-full mb-4 hover:bg-gray-100 active:bg-gray-200 transition-all duration-200"
                    >
                      <Eye className="h-4 w-4 ml-2" />
                      {showSubImages ? 'إخفاء' : 'عرض'} جميع الصور الفرعية
                    </Button>

                    {showSubImages && (
                      <ScrollArea className="h-80 border rounded-lg p-2">
                        <div className="grid grid-cols-3 gap-2">
                          {mergedBirdData.subImages.map((imagePath, index) => (
                            <DetailImage
                              key={index}
                              imagePath={imagePath}
                              alt={`${mergedBirdData.arabicName} - صورة ${index + 1}`}
                              className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80"
                              onClick={() => setCurrentImageIndex(index + 1)}
                            />
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Information Section */}
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 ml-2" />
                  معلومات أساسية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">الاســم العربي</h4>
                  <p className="text-gray-700 text-lg">{mergedBirdData.arabicName}</p>
                </div>
                {mergedBirdData.scientificName && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">الاســم العلمـي</h4>
                    <p className="text-gray-700 italic text-lg" dir="ltr">{mergedBirdData.scientificName}</p>
                  </div>
                )}
                {mergedBirdData.englishName && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">الاسـم الأجنبي</h4>
                    <p className="text-gray-700 text-lg" dir="ltr">{mergedBirdData.englishName}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">عدد المواقع المسجلة</h4>
                  <p className="text-gray-700 flex items-center text-lg">
                    <MapPin className="h-5 w-5 ml-1" />
                    {actualLocationCount} موقع
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">حالة قاعدة البيانات</h4>
                  <div className="flex items-center">
                    {birdExistsLoading || detailsLoading ? (
                      <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                        <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                        جاري التحقق...
                      </Badge>
                    ) : birdIsInDatabase ? (
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        ✓ موجود في قاعدة البيانات
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        ⚠️ غير موجود في قاعدة البيانات
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Editable Description with Scrollable Area */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>الوصف الكامل والملاحظات التفصيلية</CardTitle>
                  {!isEditingDescription && (
                    <Button onClick={handleEditDescription} variant="outline" size="sm" className="hover:bg-blue-50 active:bg-blue-100 transition-all duration-200">
                      <Edit className="h-4 w-4 ml-2" />
                      تحرير
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditingDescription ? (
                  <div className="space-y-4">
                    <Textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      placeholder="أدخل الوصف والملاحظات التفصيلية للطائر..."
                      className="min-h-[320px] text-base leading-relaxed"
                      dir="rtl"
                    />
                    <div className="flex justify-end space-x-3 space-x-reverse">
                      <Button onClick={handleCancelEdit} variant="outline" disabled={isSavingDescription} className="hover:bg-gray-100 active:bg-gray-200">
                        إلغاء
                      </Button>
                      <Button onClick={handleSaveDescription} disabled={isSavingDescription} className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                        {isSavingDescription ? (
                          <>
                            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                            جاري الحفظ...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 ml-2" />
                            حفظ
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : hasFullDescription ? (
                  <ScrollArea className="h-80 pr-3">
                    <div className="text-gray-700 leading-relaxed text-base whitespace-pre-wrap">
                      {mergedBirdData.fullDescription}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-gray-500 mb-3">لا يوجد وصف</p>
                    <Button onClick={handleEditDescription} variant="outline" size="sm" className="hover:bg-blue-50 active:bg-blue-100 transition-all duration-200">
                      <Edit className="h-4 w-4 ml-2" />
                      إضافة وصف
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Audio Section - AUTOMATIC SAVE */}
            <Card className="border-2 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-900">
                  <Music className="h-5 w-5 ml-2" />
                  إدارة الملف الصوتي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Audio status indicator */}
                {isCheckingAudio && !uploadedAudioPath ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <div className="flex-1">
                        <p className="text-base font-bold text-blue-900">جاري التحقق...</p>
                        <p className="text-sm text-blue-700">يتم التحقق من وجود ملف صوتي</p>
                      </div>
                    </div>
                  </div>
                ) : audioExists ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Volume2 className="h-6 w-6 text-green-600" />
                      <div className="flex-1">
                        <p className="text-base font-bold text-green-900">✓ ملف صوتي متوفر</p>
                        <p className="text-sm text-green-700">يمكنك تشغيل الصوت من الأعلى</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Music className="h-6 w-6 text-yellow-600" />
                      <div className="flex-1">
                        <p className="text-base font-bold text-yellow-900">لا يوجد ملف صوتي</p>
                        <p className="text-sm text-yellow-700">قم برفع ملف صوتي للطائر</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Audio Upload - AUTOMATIC SAVE */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Upload className="h-5 w-5 ml-2" />
                    {audioExists ? 'استبدال الملف الصوتي' : 'رفع ملف صوتي جديد'}
                  </h4>
                  
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        setSelectedAudioFile(e.target.files?.[0] || null);
                      }}
                      className="w-full text-sm border border-gray-300 rounded-md p-2"
                      disabled={isUploadingAudio}
                    />
                    {selectedAudioFile && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="text-sm text-blue-900 font-medium">
                          📎 ملف مختار: {selectedAudioFile.name}
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          الحجم: {(selectedAudioFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                    <Button
                      onClick={handleAudioUpload}
                      disabled={!selectedAudioFile || isUploadingAudio}
                      className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 active:from-orange-800 active:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      size="lg"
                    >
                      {isUploadingAudio ? (
                        <>
                          <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                          جاري الرفع والحفظ...
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 ml-2" />
                          رفع وحفظ الملف الصوتي
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                      سيتم حفظ الملف تلقائياً بعد الرفع وعرض رسالة "✅ تم حفظ الملف بنجاح!" فوراً
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Image Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="h-5 w-5 ml-2" />
                  معلومات الصور
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>إجمالي الصور: {allImages.length}</p>
                  <p>الصور الفرعية: {mergedBirdData.subImages.length}</p>
                  <p className="text-blue-600">✓ يمكن رفع عدد غير محدود من الصور</p>
                  <p className="text-green-600">✓ يتم الحفظ تلقائياً بعد الرفع</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Sub-image Upload Modal */}
      <SubImageUploadModal
        isOpen={showSubImageUpload}
        onClose={() => setShowSubImageUpload(false)}
        birdName={mergedBirdData.arabicName}
        onUploadSuccess={handleSubImageUploadSuccess}
      />
    </div>
  );
}
