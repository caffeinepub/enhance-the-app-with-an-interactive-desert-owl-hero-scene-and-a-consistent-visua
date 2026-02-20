import { useState, useEffect } from 'react';
import { Camera, Upload, Play, Pause, Volume2, MapPin, Loader2, Image as ImageIcon, Music, Map, Home, Trash2 } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useFileList, useFileUrl, useFileUpload, useFileDelete } from '../blob-storage/FileStorage';
import { useBirdAudio, useUploadAudio, useAllBirdData, useAddSubImage, useHasAudioFile, useCanModifyData, useDeleteSubImage, useInvalidateBirdData, useBirdExists } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import BirdDetailsPage from './BirdDetailsPage';

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

interface BirdGalleryProps {
  onShowBirdOnMap: (birdName: string) => void;
  birdTableData?: Array<{
    localName: string;
    scientificName: string;
    notes: string;
    briefDescription: string;
  }>;
}

// Utility function to normalize bird names - MUST MATCH BACKEND
function normalizeBirdName(name: string): string {
  if (!name) return '';
  let normalized = name.trim();
  normalized = normalized.replace(/[\u064B-\u065F\u0670]/g, '');
  normalized = normalized.replace(/\u0640/g, '');
  normalized = normalized.replace(/\s+/g, '');
  normalized = normalized.replace(/-/g, '');
  normalized = normalized.replace(/sub$/i, '');
  
  // Remove "ال" prefix if present
  if (normalized.startsWith('ال')) {
    normalized = normalized.substring(2);
  }
  
  return normalized;
}

// Component for displaying image with loading state and delete button
function GalleryImage({ 
  imagePath, 
  alt, 
  className, 
  onClick,
  onDelete,
  showDelete = false
}: { 
  imagePath: string; 
  alt: string; 
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  showDelete?: boolean;
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
    <div className="relative group">
      <img 
        src={imageUrl} 
        alt={alt}
        className={`object-cover rounded-lg transition-transform hover:scale-105 cursor-pointer ${className}`}
        onClick={onClick}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
      {showDelete && onDelete && (
        <button
          onClick={onDelete}
          className="absolute top-2 left-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
          title="حذف الصورة"
          aria-label="حذف الصورة"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// Gallery Audio Player Component - Enhanced with better visibility
function GalleryAudioPlayer({ birdName }: { birdName: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { data: audioPath } = useBirdAudio(birdName);
  const { data: audioUrl, isLoading } = useFileUrl(audioPath || '');

  useEffect(() => {
    if (audioUrl) {
      try {
        const audioElement = new Audio(audioUrl);
        audioElement.addEventListener('ended', () => setIsPlaying(false));
        audioElement.addEventListener('error', () => {
          setError('خطأ في تحميل الصوت');
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
        setError('خطأ في تحميل الصوت');
      }
    }
  }, [audioUrl]);

  const togglePlay = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {
        setError('خطأ في تشغيل الصوت');
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  if (!audioPath || isLoading) {
    return null;
  }

  if (error || !audioUrl) return null;

  return (
    <Button
      onClick={togglePlay}
      variant="outline"
      size="sm"
      className={`flex-1 transition-all duration-300 font-bold shadow-md hover:shadow-lg ${
        isPlaying 
          ? 'bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 text-green-800 border-green-400 hover:border-green-500' 
          : 'bg-gradient-to-r from-orange-100 to-red-100 hover:from-orange-200 hover:to-red-200 text-orange-800 border-orange-400 hover:border-orange-500'
      }`}
    >
      <div className="flex items-center justify-center w-full">
        {isPlaying ? (
          <>
            <Pause className="h-4 w-4 ml-2" />
            <span className="font-bold">⏸ إيقاف</span>
          </>
        ) : (
          <>
            <Play className="h-4 w-4 ml-2" />
            <span className="font-bold">▶ تشغيل الصوت</span>
          </>
        )}
      </div>
    </Button>
  );
}

// Image upload modal - UNLIMITED with full metadata and intelligent bird name matching
function ImageUploadModal({ 
  isOpen, 
  onClose, 
  onUploadSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onUploadSuccess: () => void;
}) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [arabicName, setArabicName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [englishName, setEnglishName] = useState('');
  const [description, setDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [birdNameWarning, setBirdNameWarning] = useState<string | null>(null);
  
  const { uploadFile } = useFileUpload();
  const uploadAudioMutation = useUploadAudio();
  const addSubImageMutation = useAddSubImage();
  const invalidateBirdData = useInvalidateBirdData();
  const { data: birdExists, refetch: checkBirdExists } = useBirdExists(arabicName.trim());

  // Check bird existence when name changes
  useEffect(() => {
    const checkName = async () => {
      if (arabicName.trim().length > 0) {
        await checkBirdExists();
        if (birdExists === false) {
          setBirdNameWarning('⚠️ هذا الاسم غير موجود في قاعدة البيانات. سيتم إنشاء سجل جديد تلقائياً عند الرفع.');
        } else if (birdExists === true) {
          setBirdNameWarning('✅ تم العثور على الطائر في قاعدة البيانات. سيتم ربط الصور به تلقائياً.');
        }
      } else {
        setBirdNameWarning(null);
      }
    };

    const timeoutId = setTimeout(checkName, 500);
    return () => clearTimeout(timeoutId);
  }, [arabicName, birdExists, checkBirdExists]);

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

  const handleAudioSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        setUploadError('يرجى اختيار ملف صوتي صحيح (MP3, WAV)');
        return;
      }
      setSelectedAudioFile(file);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !arabicName.trim()) {
      setUploadError('يرجى اختيار الصور وإدخال اسم الطائر');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadSuccess(false);
      
      const timestamp = Date.now();
      const totalFiles = selectedFiles.length;
      const birdNameTrimmed = arabicName.trim();
      
      // Upload all images and link them to the bird record using intelligent matching
      let successCount = 0;
      let failedCount = 0;
      
      for (let index = 0; index < selectedFiles.length; index++) {
        const file = selectedFiles[index];
        const fileName = `${timestamp}-${birdNameTrimmed}-${index + 1}.${file.name.split('.').pop()}`;
        const filePath = `bird-gallery/${fileName}`;
        
        try {
          // Upload to blob storage
          await uploadFile(filePath, file, (progress) => {
            const imageProgress = ((index + progress) / totalFiles) * 70;
            setUploadProgress(Math.round(imageProgress));
          });
          
          // Link to bird record in backend - backend will use intelligent name matching
          await addSubImageMutation.mutateAsync({
            birdName: birdNameTrimmed,
            imagePath: filePath
          });
          
          successCount++;
        } catch (linkError: any) {
          console.error('Image linking error:', linkError);
          failedCount++;
          
          // If it's a permission error, stop the upload
          if (linkError?.message?.includes('صلاحية') || linkError?.message?.includes('Unauthorized')) {
            throw linkError;
          }
          // Otherwise continue with other images
        }
      }
      
      setUploadProgress(75);
      
      // Upload audio file if provided
      if (selectedAudioFile) {
        const audioFileName = `${timestamp}-${birdNameTrimmed}.${selectedAudioFile.name.split('.').pop()}`;
        const audioFilePath = `bird-audio/${audioFileName}`;
        
        setUploadProgress(80);
        await uploadFile(audioFilePath, selectedAudioFile);
        
        setUploadProgress(90);
        try {
          // Backend will use intelligent name matching
          await uploadAudioMutation.mutateAsync({
            birdName: birdNameTrimmed,
            audioFilePath: audioFilePath
          });
        } catch (audioError: any) {
          console.error('Audio registration error:', audioError);
          // Don't fail the entire upload if audio fails
        }
      }
      
      setUploadProgress(100);
      setUploadSuccess(true);
      
      // Show comprehensive Arabic success notification
      if (successCount > 0) {
        if (selectedAudioFile) {
          toast.success('✅ تم حفظ الملفات بنجاح!', {
            description: `تم رفع ${successCount} صورة والملف الصوتي وربطها بسجل "${birdNameTrimmed}" بنجاح${failedCount > 0 ? ` (فشل ${failedCount} صورة)` : ''}`,
            duration: 4000,
            position: 'bottom-center',
          });
        } else {
          toast.success('✅ تم إضافة الصورة بنجاح!', {
            description: `تم رفع ${successCount} صورة وربطها بسجل "${birdNameTrimmed}" بنجاح${failedCount > 0 ? ` (فشل ${failedCount} صورة)` : ''}`,
            duration: 3000,
            position: 'bottom-center',
          });
        }
      }
      
      // Force immediate cache invalidation and data refresh
      invalidateBirdData();
      
      // Wait a moment to show success, then close
      setTimeout(() => {
        setSelectedFiles([]);
        setSelectedAudioFile(null);
        setArabicName('');
        setScientificName('');
        setEnglishName('');
        setDescription('');
        setFullDescription('');
        setUploadProgress(0);
        setUploadSuccess(false);
        setBirdNameWarning(null);
        
        onUploadSuccess();
        onClose();
      }, 1500);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      let errorMessage = error?.message || 'حدث خطأ أثناء رفع الملفات. يرجى المحاولة مرة أخرى';
      
      // Provide specific error messages
      if (errorMessage.includes('صلاحية') || errorMessage.includes('Unauthorized')) {
        errorMessage = 'ليس لديك صلاحية لرفع الملفات. يرجى تسجيل الدخول أو الحصول على الصلاحيات المناسبة.';
      }
      
      setUploadError(errorMessage);
      
      toast.error('❌ فشل رفع الصور', {
        description: errorMessage,
        duration: 4000,
        position: 'bottom-center',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    setSelectedAudioFile(null);
    setArabicName('');
    setScientificName('');
    setEnglishName('');
    setDescription('');
    setFullDescription('');
    setUploadProgress(0);
    setUploadError(null);
    setUploadSuccess(false);
    setBirdNameWarning(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Upload className="h-6 w-6 ml-2" />
            رفع صور الطيور مع المعلومات الكاملة
          </DialogTitle>
          <DialogDescription>
            ارفع عدد غير محدود من الصور لأنواع الطيور مع جميع المعلومات والملفات الصوتية. النظام يتعرف تلقائياً على أسماء الطيور حتى مع اختلافات التشكيل أو المسافات.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <div className="space-y-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="arabicName" className="text-sm font-medium text-gray-700 mb-2">
                  الاســم العربي *
                </Label>
                <input
                  id="arabicName"
                  type="text"
                  value={arabicName}
                  onChange={(e) => setArabicName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                  dir="rtl"
                  placeholder="أدخل الاسم العربي للطائر (مع أو بدون 'ال')"
                  disabled={isUploading}
                />
                {birdNameWarning && (
                  <p className={`text-xs mt-1 ${birdExists ? 'text-green-600' : 'text-yellow-600'}`}>
                    {birdNameWarning}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="scientificName" className="text-sm font-medium text-gray-700 mb-2">
                  الاســم العلمـي
                </Label>
                <input
                  id="scientificName"
                  type="text"
                  value={scientificName}
                  onChange={(e) => setScientificName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                  dir="ltr"
                  placeholder="Scientific name (optional)"
                  disabled={isUploading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="englishName" className="text-sm font-medium text-gray-700 mb-2">
                الاسـم الأجنبي
              </Label>
              <input
                id="englishName"
                type="text"
                value={englishName}
                onChange={(e) => setEnglishName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                dir="ltr"
                placeholder="English name (optional)"
                disabled={isUploading}
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2">
                وصف مختصر
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                dir="rtl"
                placeholder="وصف مختصر عن الطائر (اختياري)"
                disabled={isUploading}
              />
            </div>

            <div>
              <Label htmlFor="fullDescription" className="text-sm font-medium text-gray-700 mb-2">
                الوصف الكامل والملاحظات التفصيلية
              </Label>
              <Textarea
                id="fullDescription"
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                dir="rtl"
                placeholder="أدخل الوصف الكامل والملاحظات التفصيلية عن الطائر (اختياري)"
                disabled={isUploading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="images" className="text-sm font-medium text-gray-700 mb-2">
                  اختر صور الطائر * (غير محدودة)
                </Label>
                <input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isUploading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  يمكنك اختيار عدد غير محدود من الصور. الصورة الأولى ستكون الصورة الرئيسية
                </p>
              </div>

              <div>
                <Label htmlFor="audio" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Music className="h-4 w-4 ml-1" />
                  أضف الصوت (اختياري)
                </Label>
                <input
                  id="audio"
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={isUploading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  ملفات صوتية مدعومة: MP3, WAV
                </p>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    الصور المختارة
                  </h4>
                  <Badge variant="default">
                    {selectedFiles.length} صورة
                  </Badge>
                </div>
                <ScrollArea className="h-48 border rounded-lg p-2">
                  <div className="grid grid-cols-3 gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                        {index === 0 && (
                          <Badge className="absolute top-1 right-1 text-xs bg-blue-600">
                            رئيسية
                          </Badge>
                        )}
                        <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <p className="text-xs text-blue-600 mt-2">
                  ✓ تم اختيار {selectedFiles.length} صورة
                </p>
              </div>
            )}

            {selectedAudioFile && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Music className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-green-900">✓ ملف صوتي مختار</p>
                    <p className="text-xs text-green-700">{selectedAudioFile.name}</p>
                  </div>
                </div>
              </div>
            )}

            {uploadSuccess && (
              <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4">
                <p className="text-green-900 font-bold text-center">✓ تم الرفع بنجاح!</p>
              </div>
            )}

            {isUploading && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">جاري الرفع والربط بقاعدة البيانات...</span>
                  <span className="text-sm text-blue-700">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-blue-700 mt-2 text-center">
                  النظام يستخدم التعرف الذكي على أسماء الطيور للربط التلقائي
                </p>
              </div>
            )}

            {uploadError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800 font-medium">❌ {uploadError}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t">
          <Button onClick={handleCancel} disabled={isUploading} variant="outline">
            إلغاء
          </Button>
          <Button onClick={handleUpload} disabled={selectedFiles.length === 0 || !arabicName.trim() || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري الرفع...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 ml-2" />
                رفع {selectedFiles.length} صورة
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function BirdGallery({ onShowBirdOnMap, birdTableData }: BirdGalleryProps) {
  const navigate = useNavigate();
  const [birdSpecies, setBirdSpecies] = useState<BirdSpecies[]>([]);
  const [selectedBird, setSelectedBird] = useState<BirdSpecies | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailsPage, setShowDetailsPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { data: uploadedFiles, refetch: refetchFiles } = useFileList();
  const { data: allBirdData, refetch: refetchBirdData } = useAllBirdData();
  const { data: canModify } = useCanModifyData();
  const invalidateBirdData = useInvalidateBirdData();

  useEffect(() => {
    if (!uploadedFiles) {
      setIsLoading(false);
      return;
    }

    const birdFiles = uploadedFiles.filter(file => 
      file.path.startsWith('bird-gallery/') && 
      (file.path.endsWith('.jpg') || file.path.endsWith('.jpeg') || file.path.endsWith('.png'))
    );

    // Use a plain object to ensure unique birds by normalized name
    const birdGroupsRecord: Record<string, { name: string; images: string[] }> = {};
    
    birdFiles.forEach(file => {
      const fileName = file.path.split('/').pop() || '';
      const match = fileName.match(/^\d+-(.+)-\d+\.(jpg|jpeg|png)$/i) || 
                    fileName.match(/^\d+-(.+)-sub-\d+\.(jpg|jpeg|png)$/i) ||
                    fileName.match(/^\d+-(.+)-main\.(jpg|jpeg|png)$/i);
      
      if (match) {
        const birdName = match[1];
        const normalizedName = normalizeBirdName(birdName);
        
        // Check if we already have this bird (by normalized name)
        if (!birdGroupsRecord[normalizedName]) {
          birdGroupsRecord[normalizedName] = { name: birdName, images: [] };
        }
        
        // Add image to the bird's collection
        birdGroupsRecord[normalizedName].images.push(file.path);
      }
    });

    const species: BirdSpecies[] = Object.values(birdGroupsRecord).map(({ name, images }) => {
      const sortedImages = images.sort();
      
      // Find matching bird data using normalized name comparison
      const normalizedName = normalizeBirdName(name);
      const birdData = allBirdData?.find(([birdName]) => {
        const normalizedBirdName = normalizeBirdName(birdName);
        return normalizedBirdName === normalizedName;
      });
      
      const audioFile = birdData?.[1]?.audioFile;
      const locationCount = birdData?.[1]?.locations?.length || 0;
      
      // Use the actual bird name from backend if found, otherwise use the file name
      const actualBirdName = birdData?.[0] || name;
      
      // Try to find matching data from bird table
      const tableData = birdTableData?.find(row => {
        const normalizedTableName = normalizeBirdName(row.localName);
        return normalizedTableName === normalizedName;
      });
      
      // Get full description from table data
      const fullDescription = tableData?.notes || tableData?.briefDescription || '';
      const scientificName = tableData?.scientificName || '';
      
      return {
        id: actualBirdName,
        arabicName: actualBirdName,
        scientificName: scientificName,
        englishName: '',
        description: tableData?.briefDescription || `طائر ${actualBirdName}`,
        fullDescription: fullDescription,
        notes: tableData?.notes || '',
        mainImage: sortedImages[0],
        subImages: sortedImages.slice(1),
        audioFile: audioFile || undefined,
        locationCount: locationCount
      };
    });

    setBirdSpecies(species);
    setIsLoading(false);
  }, [uploadedFiles, allBirdData, birdTableData]);

  const handleUploadSuccess = () => {
    // Force immediate data refresh with cache invalidation
    invalidateBirdData();
    
    // Refetch data after a short delay to ensure backend has processed
    setTimeout(() => {
      refetchFiles();
      refetchBirdData();
    }, 500);
  };

  const handleBirdClick = (bird: BirdSpecies) => {
    setSelectedBird(bird);
    setShowDetailsPage(true);
  };

  const handleShowOnMap = async (bird: BirdSpecies, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Check if bird has locations
    if (!bird.locationCount || bird.locationCount === 0) {
      toast.error('⚠️ لا توجد إحداثيات متاحة لهذا الطائر', {
        description: `الطائر "${bird.arabicName}" لا يحتوي على مواقع مسجلة في قاعدة البيانات`,
        duration: 4000,
        position: 'bottom-center',
      });
      return;
    }
    
    if (bird.locationCount > 1) {
      toast.info('⚠️ هذا الطائر لديه عدة مواقع', {
        description: `سيتم عرض جميع المواقع (${bird.locationCount} موقع) على الخريطة`,
        duration: 3000,
        position: 'bottom-center',
      });
    } else {
      toast.success('✅ تم العثور على موقع الطائر', {
        description: `سيتم عرض موقع "${bird.arabicName}" على الخريطة`,
        duration: 2000,
        position: 'bottom-center',
      });
    }
    
    // Navigate to the all-locations map page
    // The map will automatically filter to show only this bird's locations
    try {
      // Store the bird name for the map to use
      onShowBirdOnMap(bird.arabicName);
      
      // Navigate to the map page
      await navigate({ to: '/all-locations' });
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('⚠️ حدث خطأ أثناء الانتقال إلى الخريطة', {
        description: 'يرجى المحاولة مرة أخرى',
        duration: 3000,
        position: 'bottom-center',
      });
    }
  };

  const handleRefresh = () => {
    invalidateBirdData();
    refetchFiles();
    refetchBirdData();
    
    toast.success('✅ تم تحديث البيانات بنجاح', {
      description: 'تم تحديث البيانات من الخادم',
      duration: 2000,
      position: 'bottom-center',
    });
  };

  const handleBackToGallery = () => {
    setShowDetailsPage(false);
    setSelectedBird(null);
    // Force refresh when returning to gallery
    invalidateBirdData();
    refetchFiles();
    refetchBirdData();
  };

  const handleBackToHome = () => {
    navigate({ to: '/' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">جاري تحميل المعرض...</h2>
          <p className="text-gray-600">يتم تحضير صور أنواع الطيور</p>
        </div>
      </div>
    );
  }

  // Show dedicated details page if active
  if (showDetailsPage && selectedBird) {
    return (
      <BirdDetailsPage
        bird={selectedBird}
        onBack={handleBackToGallery}
        onRefresh={handleRefresh}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Home Button - Icon Only */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleBackToHome}
              className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              title="عودة إلى الصفحة الرئيسية"
              aria-label="عودة إلى الصفحة الرئيسية"
            >
              <Home className="h-6 w-6" />
            </button>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">معرض أنواع الطيور</h1>
            <p className="text-lg text-gray-600 mb-6">
              اكتشف تنوع الطيور في محافظة البريمي من خلال مجموعة شاملة من الصور والمعلومات
            </p>
            
            <div className="flex items-center justify-center space-x-4 space-x-reverse">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Camera className="h-6 w-6 text-blue-600" />
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{birdSpecies.length}</p>
                    <p className="text-sm text-gray-600">نوع من الطيور</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <ImageIcon className="h-6 w-6 text-green-600" />
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {birdSpecies.reduce((total, bird) => total + bird.subImages.length + 1, 0)}
                    </p>
                    <p className="text-sm text-gray-600">صورة إجمالية</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Button - Only for authorized users */}
        {canModify && (
          <div className="mb-8 text-center">
            <Button
              onClick={() => setShowUploadModal(true)}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Upload className="h-5 w-5 ml-2" />
              رفع صور جديدة
            </Button>
          </div>
        )}

        {/* Gallery Grid */}
        {birdSpecies.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-50 rounded-xl p-12 max-w-md mx-auto">
              <Camera className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">المعرض فارغ</h3>
              <p className="text-gray-600 mb-6">
                ابدأ ببناء مجموعتك من صور الطيور عبر رفع الصور الأولى
              </p>
              {canModify && (
                <Button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4 ml-2" />
                  رفع أول صورة
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {birdSpecies.map((bird) => (
              <BirdCard
                key={bird.id}
                bird={bird}
                onBirdClick={handleBirdClick}
                onShowOnMap={handleShowOnMap}
                canModify={canModify || false}
                onRefresh={handleRefresh}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal - Only for authorized users */}
      {canModify && (
        <ImageUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}

// Separate BirdCard component to handle audio checking per bird and image deletion
function BirdCard({
  bird,
  onBirdClick,
  onShowOnMap,
  canModify,
  onRefresh
}: {
  bird: BirdSpecies;
  onBirdClick: (bird: BirdSpecies) => void;
  onShowOnMap: (bird: BirdSpecies, event: React.MouseEvent) => void;
  canModify: boolean;
  onRefresh: () => void;
}) {
  const { data: hasAudio } = useHasAudioFile(bird.arabicName);
  const showAudioPlayer = hasAudio || !!bird.audioFile;
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteSubImageMutation = useDeleteSubImage();
  const { deleteFile } = useFileDelete();
  const invalidateBirdData = useInvalidateBirdData();

  const handleDeleteImage = (imagePath: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setImageToDelete(imagePath);
  };

  const confirmDelete = async () => {
    if (!imageToDelete) return;

    setIsDeleting(true);
    
    try {
      // First, delete the file from blob storage
      await deleteFile(imageToDelete);
      
      // Then, remove the reference from the bird's subImages array in the backend
      await deleteSubImageMutation.mutateAsync({
        birdName: bird.arabicName,
        imagePath: imageToDelete
      });
      
      // Show success message
      toast.success('✅ تم حذف الصورة بنجاح', {
        description: 'تم حذف الصورة من المعرض والتخزين بنجاح وتحديث جميع الأجهزة',
        duration: 3000,
        position: 'bottom-center',
      });
      
      // Close the dialog
      setImageToDelete(null);
      
      // Force immediate data refresh to update the gallery across all devices
      invalidateBirdData();
      
      // Refresh the gallery after a short delay
      setTimeout(() => {
        onRefresh();
      }, 500);
    } catch (error: any) {
      console.error('Delete image error:', error);
      
      // Provide specific error messages based on the error type
      let errorMessage = 'فشل في حذف الصورة. يرجى المحاولة مرة أخرى';
      
      if (error?.message?.includes('صلاحية') || error?.message?.includes('Unauthorized')) {
        errorMessage = 'ليس لديك صلاحية لحذف الصور';
      } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        errorMessage = 'فشل الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت';
      }
      
      toast.error('❌ حدث خطأ أثناء حذف الصورة', {
        description: errorMessage,
        duration: 4000,
        position: 'bottom-center',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setImageToDelete(null);
  };

  return (
    <>
      <Card 
        className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 overflow-hidden"
        onClick={() => onBirdClick(bird)}
      >
        <div className="relative">
          <GalleryImage
            imagePath={bird.mainImage}
            alt={bird.arabicName}
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
            showDelete={canModify}
            onDelete={(e) => handleDeleteImage(bird.mainImage, e)}
          />
          
          {showAudioPlayer && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full p-2 shadow-lg animate-pulse">
              <Volume2 className="h-5 w-5" />
            </div>
          )}
          
          {bird.subImages.length > 0 && (
            <div className="absolute top-3 right-3 bg-black/70 text-white rounded-full px-2 py-1 text-xs font-medium">
              +{bird.subImages.length}
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            {bird.arabicName}
          </h3>
          
          {bird.scientificName && (
            <p className="text-sm text-gray-600 italic mb-2" dir="ltr">
              {bird.scientificName}
            </p>
          )}
          
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {bird.description}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <div className="flex items-center">
              <ImageIcon className="h-4 w-4 ml-1" />
              {bird.subImages.length + 1} صورة
            </div>
            {bird.locationCount !== undefined && bird.locationCount > 0 && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 ml-1" />
                {bird.locationCount} موقع
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            {showAudioPlayer && (
              <div className="flex gap-2">
                <GalleryAudioPlayer birdName={bird.arabicName} />
              </div>
            )}
            
            <Button
              onClick={(e) => onShowOnMap(bird, e)}
              variant="outline"
              size="sm"
              className="w-full bg-green-50 hover:bg-green-100 text-green-700 border-green-300 hover:border-green-400 transition-colors font-medium shadow-sm hover:shadow-md"
            >
              <Map className="h-4 w-4 ml-2" />
              عرض على الخريطة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!imageToDelete} onOpenChange={cancelDelete}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذه الصورة؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الصورة نهائياً من المعرض والتخزين الخلفي. لا يمكن التراجع عن هذا الإجراء.
              <br />
              <br />
              <strong>ملاحظة:</strong> سيتم تحديث المعرض تلقائياً على جميع الأجهزة والصفحات بعد الحذف.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel onClick={cancelDelete} disabled={isDeleting}>
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف نهائياً
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
