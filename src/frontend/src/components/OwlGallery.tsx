import { useState, useEffect } from 'react';
import { Camera, Upload, Play, Pause, Volume2, VolumeX, Eye, Heart, MapPin, Info, X, ChevronLeft, ChevronRight, Loader2, Image as ImageIcon, Music, FileImage, Sparkles } from 'lucide-react';
import { useFileList, useFileUrl, useFileUpload } from '../blob-storage/FileStorage';
import { useBirdAudio, useUploadAudio } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface BirdSpecies {
  id: string;
  arabicName: string;
  scientificName: string;
  description: string;
  mainImage: string;
  subImages: string[];
  audioFile?: string;
  locationCount?: number;
}

// Component for displaying image with loading state
function GalleryImage({ imagePath, alt, className, onClick }: { 
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
      className={`object-cover rounded-lg transition-transform hover:scale-105 cursor-pointer ${className}`}
      onClick={onClick}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
      }}
    />
  );
}

// Audio player component
function AudioPlayer({ audioPath, birdName }: { audioPath: string; birdName: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const { data: audioUrl } = useFileUrl(audioPath);

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

  if (!audioUrl) return null;

  return (
    <div className="flex items-center space-x-2 space-x-reverse bg-blue-50 rounded-lg p-3">
      <button
        onClick={togglePlay}
        className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </button>
      <div className="flex-1">
        <p className="text-sm font-medium text-blue-900">صوت {birdName}</p>
        <p className="text-xs text-blue-700">انقر للتشغيل/الإيقاف</p>
      </div>
      <Volume2 className="h-5 w-5 text-blue-600" />
    </div>
  );
}

// Image upload modal
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
  const [arabicName, setArabicName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const { uploadFile } = useFileUpload();

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
    if (selectedFiles.length === 0 || !arabicName.trim()) {
      setUploadError('يرجى اختيار الصور وإدخال اسم الطائر');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      
      const timestamp = Date.now();
      const uploadPromises = selectedFiles.map(async (file, index) => {
        const fileName = `${timestamp}-${arabicName.trim()}-${index + 1}.${file.name.split('.').pop()}`;
        const filePath = `owl-gallery/${fileName}`;
        
        await uploadFile(filePath, file, (progress) => {
          setUploadProgress(Math.round(progress));
        });
        
        return filePath;
      });

      await Promise.all(uploadPromises);
      
      // Reset form
      setSelectedFiles([]);
      setArabicName('');
      setScientificName('');
      setDescription('');
      setUploadProgress(0);
      
      onUploadSuccess();
      onClose();
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('حدث خطأ أثناء رفع الصور. يرجى المحاولة مرة أخرى');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    setArabicName('');
    setScientificName('');
    setDescription('');
    setUploadProgress(0);
    setUploadError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Upload className="h-6 w-6 ml-2" />
            رفع صور الطيور
          </DialogTitle>
          <DialogDescription>
            ارفع صور أنواع الطيور مع المعلومات الأساسية
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Bird Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الاسم العربي *
              </label>
              <input
                type="text"
                value={arabicName}
                onChange={(e) => setArabicName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                dir="rtl"
                placeholder="أدخل الاسم العربي للطائر"
                disabled={isUploading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الاسم العلمي
              </label>
              <input
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

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              وصف مختصر
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              dir="rtl"
              placeholder="وصف مختصر عن الطائر (اختياري)"
              disabled={isUploading}
            />
          </div>

          {/* File Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اختر صور الطائر *
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isUploading}
            />
            <p className="text-xs text-gray-500 mt-1">
              يمكنك اختيار عدة صور. الصورة الأولى ستكون الصورة الرئيسية
            </p>
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                الصور المختارة ({selectedFiles.length})
              </h4>
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">جاري الرفع...</span>
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

          {/* Error Message */}
          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{uploadError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 space-x-reverse">
            <Button
              onClick={handleCancel}
              disabled={isUploading}
              variant="outline"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || !arabicName.trim() || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الرفع...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 ml-2" />
                  رفع الصور
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Bird detail modal
function BirdDetailModal({ 
  bird, 
  isOpen, 
  onClose 
}: { 
  bird: BirdSpecies | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showSubImages, setShowSubImages] = useState(false);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  
  const { data: birdAudio } = useBirdAudio(bird?.arabicName || '');
  const { uploadFile } = useFileUpload();
  const uploadAudioMutation = useUploadAudio();

  if (!bird) return null;

  const allImages = [bird.mainImage, ...bird.subImages];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleAudioUpload = async () => {
    if (!selectedAudioFile || !bird) return;

    try {
      setIsUploadingAudio(true);
      
      const fileName = `${Date.now()}-${bird.arabicName}.${selectedAudioFile.name.split('.').pop()}`;
      const filePath = `bird-audio/${fileName}`;
      
      await uploadFile(filePath, selectedAudioFile);
      await uploadAudioMutation.mutateAsync({
        birdName: bird.arabicName,
        audioFilePath: filePath
      });
      
      setSelectedAudioFile(null);
      
    } catch (error) {
      console.error('Audio upload error:', error);
    } finally {
      setIsUploadingAudio(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {bird.arabicName}
          </DialogTitle>
          {bird.scientificName && (
            <DialogDescription className="text-lg italic text-gray-600" dir="ltr">
              {bird.scientificName}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-6">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="relative">
              <GalleryImage
                imagePath={allImages[currentImageIndex]}
                alt={bird.arabicName}
                className="w-full h-80 object-cover rounded-lg"
              />
              
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 space-x-reverse">
                    {allImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-3 h-3 rounded-full transition-colors ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Image Counter */}
            {allImages.length > 1 && (
              <div className="text-center">
                <Badge variant="outline">
                  {currentImageIndex + 1} من {allImages.length}
                </Badge>
              </div>
            )}

            {/* Sub-images Toggle */}
            {bird.subImages.length > 0 && (
              <div className="text-center">
                <Button
                  onClick={() => setShowSubImages(!showSubImages)}
                  variant="outline"
                  size="sm"
                >
                  <Eye className="h-4 w-4 ml-2" />
                  {showSubImages ? 'إخفاء' : 'عرض'} الصور الفرعية ({bird.subImages.length})
                </Button>
              </div>
            )}

            {/* Sub-images Grid */}
            {showSubImages && bird.subImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {bird.subImages.map((imagePath, index) => (
                  <GalleryImage
                    key={index}
                    imagePath={imagePath}
                    alt={`${bird.arabicName} - صورة ${index + 1}`}
                    className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80"
                    onClick={() => setCurrentImageIndex(index + 1)}
                  />
                ))}
              </div>
            )}
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
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">الاسم العربي</h4>
                  <p className="text-gray-700">{bird.arabicName}</p>
                </div>
                {bird.scientificName && (
                  <div>
                    <h4 className="font-medium text-gray-900">الاسم العلمي</h4>
                    <p className="text-gray-700 italic" dir="ltr">{bird.scientificName}</p>
                  </div>
                )}
                {bird.locationCount !== undefined && (
                  <div>
                    <h4 className="font-medium text-gray-900">عدد المواقع المسجلة</h4>
                    <p className="text-gray-700 flex items-center">
                      <MapPin className="h-4 w-4 ml-1" />
                      {bird.locationCount} موقع
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            {bird.description && (
              <Card>
                <CardHeader>
                  <CardTitle>الوصف</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{bird.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Audio Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Music className="h-5 w-5 ml-2" />
                  الصوت
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {birdAudio ? (
                  <AudioPlayer audioPath={birdAudio} birdName={bird.arabicName} />
                ) : (
                  <p className="text-gray-500 text-sm">لا يوجد ملف صوتي مرفوع</p>
                )}
                
                {/* Audio Upload */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">رفع ملف صوتي</h4>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setSelectedAudioFile(e.target.files?.[0] || null)}
                      className="flex-1 text-sm"
                      disabled={isUploadingAudio}
                    />
                    <Button
                      onClick={handleAudioUpload}
                      disabled={!selectedAudioFile || isUploadingAudio}
                      size="sm"
                    >
                      {isUploadingAudio ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </Button>
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
                  <p>الصور الفرعية: {bird.subImages.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function OwlGallery() {
  const [birdSpecies, setBirdSpecies] = useState<BirdSpecies[]>([]);
  const [selectedBird, setSelectedBird] = useState<BirdSpecies | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { data: uploadedFiles, refetch: refetchFiles } = useFileList();

  // Process uploaded files into bird species
  useEffect(() => {
    if (!uploadedFiles) {
      setIsLoading(false);
      return;
    }

    const birdFiles = uploadedFiles.filter(file => 
      file.path.startsWith('owl-gallery/') && 
      (file.path.endsWith('.jpg') || file.path.endsWith('.jpeg') || file.path.endsWith('.png'))
    );

    // Group files by bird name
    const birdGroups: { [key: string]: string[] } = {};
    
    birdFiles.forEach(file => {
      const fileName = file.path.split('/').pop() || '';
      const match = fileName.match(/^\d+-(.+)-\d+\.(jpg|jpeg|png)$/i);
      
      if (match) {
        const birdName = match[1];
        if (!birdGroups[birdName]) {
          birdGroups[birdName] = [];
        }
        birdGroups[birdName].push(file.path);
      }
    });

    // Convert to BirdSpecies array
    const species: BirdSpecies[] = Object.entries(birdGroups).map(([name, images]) => {
      const sortedImages = images.sort(); // Sort to ensure consistent order
      return {
        id: name,
        arabicName: name,
        scientificName: '', // Could be extracted from metadata if available
        description: `طائر ${name} من الطيور الموجودة في محافظة البريمي`,
        mainImage: sortedImages[0],
        subImages: sortedImages.slice(1),
        locationCount: 0 // Could be calculated from location data
      };
    });

    setBirdSpecies(species);
    setIsLoading(false);
  }, [uploadedFiles]);

  const handleUploadSuccess = () => {
    refetchFiles();
  };

  const handleBirdClick = (bird: BirdSpecies) => {
    setSelectedBird(bird);
    setShowDetailModal(true);
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

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        {/* Upload Button */}
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

        {/* Gallery Grid */}
        {birdSpecies.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-50 rounded-xl p-12 max-w-md mx-auto">
              <Camera className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">المعرض فارغ</h3>
              <p className="text-gray-600 mb-6">
                ابدأ ببناء مجموعتك من صور الطيور عبر رفع الصور الأولى
              </p>
              <Button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="h-4 w-4 ml-2" />
                رفع أول صورة
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {birdSpecies.map((bird) => (
              <Card 
                key={bird.id} 
                className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 overflow-hidden"
                onClick={() => handleBirdClick(bird)}
              >
                <div className="relative">
                  <GalleryImage
                    imagePath={bird.mainImage}
                    alt={bird.arabicName}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  
                  {/* Audio Icon Overlay */}
                  {bird.audioFile && (
                    <div className="absolute top-3 left-3 bg-blue-600 text-white rounded-full p-2 shadow-lg">
                      <Volume2 className="h-4 w-4" />
                    </div>
                  )}
                  
                  {/* Image Count Badge */}
                  {bird.subImages.length > 0 && (
                    <div className="absolute top-3 right-3 bg-black/70 text-white rounded-full px-2 py-1 text-xs font-medium">
                      +{bird.subImages.length}
                    </div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <div className="flex items-center justify-between">
                        <Eye className="h-5 w-5" />
                        <span className="text-sm font-medium">عرض التفاصيل</span>
                      </div>
                    </div>
                  </div>
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
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <ImageUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Detail Modal */}
      <BirdDetailModal
        bird={selectedBird}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedBird(null);
        }}
      />
    </div>
  );
}
