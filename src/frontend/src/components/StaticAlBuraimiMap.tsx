import { useState, useEffect } from 'react';
import { Upload, Loader2, RotateCcw } from 'lucide-react';
import { useFileUpload, useFileList, useFileUrl } from '../blob-storage/FileStorage';
import { Button } from './ui/button';
import { useActor } from '../hooks/useActor';
import { useIsAppManager, useGetActiveMapReference } from '../hooks/useQueries';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

const AL_BURAIMI_MAP_PATH = 'al-buraimi-map/official-map.png';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_RETRIES = 5;
const RETRY_DELAY = 3000; // 3 seconds
const BACKEND_CHECK_TIMEOUT = 15000; // 15 seconds

// Helper function to format file size in Arabic
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 بايت';
  const k = 1024;
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Helper function to wait for backend to be available with improved reliability
async function waitForBackend(
  actor: any,
  maxWaitTime: number = BACKEND_CHECK_TIMEOUT
): Promise<boolean> {
  const startTime = Date.now();
  let lastError: any = null;
  
  while (Date.now() - startTime < maxWaitTime) {
    if (actor) {
      try {
        // Test backend connection with a simple query
        await actor.getTotalBirdCount();
        console.log('✅ النظام متصل ومتاح');
        return true;
      } catch (error) {
        lastError = error;
        console.log('⏳ في انتظار اتصال النظام...', error);
      }
    }
    
    // Wait 1 second before next check
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.error('❌ فشل الاتصال بالنظام بعد', maxWaitTime / 1000, 'ثانية. آخر خطأ:', lastError);
  return false;
}

// Helper function to implement retry logic with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  baseDelay: number = RETRY_DELAY
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.error(`محاولة ${attempt + 1} من ${maxRetries} فشلت:`, error);
      
      // Don't retry on permission errors or invalid file errors
      const errorMessage = error?.message || error?.toString() || '';
      if (
        errorMessage.includes('Unauthorized') ||
        errorMessage.includes('not authorized') ||
        errorMessage.includes('يرجى اختيار') ||
        errorMessage.includes('حجم الملف') ||
        errorMessage.includes('صيغة')
      ) {
        throw error;
      }
      
      // If this isn't the last attempt, wait before retrying
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(1.5, attempt); // Exponential backoff
        console.log(`⏳ إعادة المحاولة بعد ${Math.round(delay / 1000)} ثانية...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('فشلت جميع المحاولات');
}

export default function StaticAlBuraimiMap() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);
  
  const { uploadFile } = useFileUpload();
  const { data: files } = useFileList();
  const { actor, isFetching: isActorFetching } = useActor();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAppManager();
  
  // Fetch the active map reference from backend
  const { data: activeMapPath, isLoading: isLoadingMapRef, refetch: refetchMapRef } = useGetActiveMapReference();
  
  // Determine which path to use for fetching the map URL
  const mapPathToUse = activeMapPath || AL_BURAIMI_MAP_PATH;
  
  // Get the URL for the uploaded map from blob storage
  const { data: uploadedMapUrl, isLoading: isLoadingMapUrl, refetch: refetchMapUrl } = useFileUrl(mapPathToUse);

  // Check if a custom map has been uploaded
  const hasCustomMap = !!activeMapPath || files?.some(file => file.path === AL_BURAIMI_MAP_PATH);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (uploadSuccess) {
      const timer = setTimeout(() => {
        setUploadSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [uploadSuccess]);

  // Clear restore success message after 5 seconds
  useEffect(() => {
    if (restoreSuccess) {
      const timer = setTimeout(() => {
        setRestoreSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [restoreSuccess]);

  // Clear upload error after 10 seconds to allow retry
  useEffect(() => {
    if (uploadError) {
      const timer = setTimeout(() => {
        setUploadError(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [uploadError]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset states
    setUploadError(null);
    setUploadSuccess(false);
    setUploadProgress(0);
    setCurrentAttempt(0);

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['png', 'jpg', 'jpeg'];
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension || '')) {
      setUploadError(
        `❌ صيغة الملف غير مدعومة\n\n` +
        `الملف المحدد: ${file.name}\n` +
        `الصيغة المطلوبة: PNG أو JPG أو JPEG فقط\n\n` +
        `يرجى اختيار ملف صورة بصيغة صحيحة والمحاولة مرة أخرى.`
      );
      event.target.value = '';
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > MAX_FILE_SIZE) {
      const actualSize = formatFileSize(file.size);
      const maxSize = formatFileSize(MAX_FILE_SIZE);
      setUploadError(
        `❌ حجم الملف كبير جداً\n\n` +
        `حجم الملف الحالي: ${actualSize}\n` +
        `الحد الأقصى المسموح: ${maxSize}\n\n` +
        `يرجى اختيار ملف أصغر حجماً والمحاولة مرة أخرى.`
      );
      event.target.value = '';
      return;
    }

    // Wait for actor to be ready if it's still fetching
    if (isActorFetching || !actor) {
      console.log('⏳ في انتظار تهيئة النظام...');
      setIsCheckingBackend(true);
      
      // Wait up to 10 seconds for actor to be ready
      const actorWaitStart = Date.now();
      while ((isActorFetching || !actor) && Date.now() - actorWaitStart < 10000) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setIsCheckingBackend(false);
      
      // Check if actor is still not available
      if (!actor) {
        setUploadError(
          `❌ النظام غير متاح حالياً\n\n` +
          `تعذر تهيئة الاتصال بالنظام.\n\n` +
          `يرجى:\n` +
          `1. التحقق من اتصال الإنترنت\n` +
          `2. تحديث الصفحة والمحاولة مرة أخرى`
        );
        event.target.value = '';
        return;
      }
    }

    // Check backend availability before starting upload
    setIsCheckingBackend(true);
    console.log('🔍 التحقق من توفر النظام...');
    
    const isBackendAvailable = await waitForBackend(actor, BACKEND_CHECK_TIMEOUT);
    setIsCheckingBackend(false);
    
    if (!isBackendAvailable) {
      setUploadError(
        `❌ النظام غير متاح حالياً\n\n` +
        `تعذر الاتصال بالنظام بعد ${BACKEND_CHECK_TIMEOUT / 1000} ثانية.\n\n` +
        `يرجى:\n` +
        `1. التحقق من اتصال الإنترنت\n` +
        `2. الانتظار قليلاً ثم المحاولة مرة أخرى\n` +
        `3. تحديث الصفحة إذا استمرت المشكلة`
      );
      event.target.value = '';
      return;
    }

    setIsUploading(true);

    try {
      console.log(`📤 بدء رفع الخريطة: ${file.name} (${formatFileSize(file.size)})`);
      
      // Upload with retry logic
      await retryWithBackoff(async () => {
        setCurrentAttempt(prev => prev + 1);
        
        try {
          console.log(`🔄 محاولة الرفع ${currentAttempt + 1} من ${MAX_RETRIES}...`);
          
          // Verify backend is still available before each attempt
          if (!actor) {
            throw new Error('النظام غير متصل');
          }
          
          // Upload the file with progress tracking
          const result = await uploadFile(AL_BURAIMI_MAP_PATH, file, (progress) => {
            setUploadProgress(progress);
            console.log(`📊 تقدم الرفع: ${progress}%`);
          });
          
          console.log('✅ تم رفع الملف بنجاح إلى التخزين:', result);
          
          // Register the map upload in backend for backup system
          if (actor) {
            try {
              console.log('📝 تسجيل الخريطة في نظام النسخ الاحتياطي...');
              
              // Retry registration with backend check
              await retryWithBackoff(async () => {
                // Verify backend connection before registration
                const backendReady = await waitForBackend(actor, 8000);
                if (!backendReady) {
                  throw new Error('النظام غير متاح للتسجيل');
                }
                
                await actor.uploadMapImage(AL_BURAIMI_MAP_PATH);
                console.log('✅ تم تسجيل الخريطة في نظام النسخ الاحتياطي بنجاح');
              }, 3, 2000);
            } catch (backupError: any) {
              console.warn('⚠️ تحذير: فشل تسجيل الخريطة في نظام النسخ الاحتياطي:', backupError);
              // Don't fail the upload if backup registration fails
            }
          }
          
          return result;
        } catch (uploadError: any) {
          console.error('❌ خطأ في رفع الخريطة:', uploadError);
          
          const errorMessage = uploadError?.message || uploadError?.toString() || '';
          
          // Check for specific error types
          if (errorMessage.includes('Unauthorized') || errorMessage.includes('not authorized')) {
            throw new Error(
              `❌ خطأ في الصلاحيات\n\n` +
              `ليس لديك صلاحية لرفع الخرائط.\n` +
              `يرجى تسجيل الدخول أولاً والمحاولة مرة أخرى.`
            );
          }
          
          if (errorMessage.includes('النظام غير متصل') || errorMessage.includes('النظام غير متاح')) {
            throw new Error(
              `⚠️ النظام غير متاح مؤقتاً\n\n` +
              `تعذر الاتصال بالنظام.\n` +
              `سيتم إعادة المحاولة تلقائياً...`
            );
          }
          
          if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('fetch')) {
            throw new Error(
              `⚠️ خطأ في الاتصال بالشبكة\n\n` +
              `تعذر الاتصال بالخادم.\n` +
              `يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.`
            );
          }
          
          if (errorMessage.includes('size') || errorMessage.includes('large')) {
            throw new Error(
              `❌ خطأ في حجم الملف\n\n` +
              `الملف كبير جداً للرفع.\n` +
              `يرجى اختيار ملف أصغر حجماً (الحد الأقصى: ${formatFileSize(MAX_FILE_SIZE)}).`
            );
          }
          
          // Re-throw to trigger retry
          throw uploadError;
        }
      }, MAX_RETRIES, RETRY_DELAY);

      // Success!
      setUploadSuccess(true);
      setUploadError(null);
      setUploadProgress(100);
      setCurrentAttempt(0);
      
      console.log('🎉 اكتملت عملية رفع الخريطة بنجاح!');
      
      // Refetch the map reference and URL to display the new map immediately
      setTimeout(async () => {
        await refetchMapRef();
        await refetchMapUrl();
      }, 500);
    } catch (error: any) {
      console.error('💥 فشل رفع الخريطة بعد جميع المحاولات:', error);
      
      const errorMessage = error?.message || error?.toString() || '';
      
      // Set user-friendly error message
      if (errorMessage.includes('❌') || errorMessage.includes('⚠️')) {
        // Already formatted error message
        setUploadError(errorMessage);
      } else if (errorMessage.includes('فشلت جميع المحاولات')) {
        setUploadError(
          `❌ فشل رفع الخريطة بعد ${MAX_RETRIES} محاولات\n\n` +
          `تعذر إكمال عملية الرفع بعد عدة محاولات.\n\n` +
          `الأسباب المحتملة:\n` +
          `• ضعف اتصال الإنترنت\n` +
          `• النظام غير متاح مؤقتاً\n` +
          `• حجم الملف كبير جداً\n\n` +
          `يرجى:\n` +
          `1. التحقق من اتصال الإنترنت\n` +
          `2. تحديث الصفحة والمحاولة مرة أخرى\n` +
          `3. اختيار ملف أصغر حجماً إن أمكن`
        );
      } else if (errorMessage.includes('يرجى اختيار') || errorMessage.includes('حجم الملف') || errorMessage.includes('صيغة')) {
        setUploadError(errorMessage);
      } else {
        setUploadError(
          `❌ حدث خطأ غير متوقع\n\n` +
          `تفاصيل الخطأ: ${errorMessage}\n\n` +
          `يرجى المحاولة مرة أخرى.\n` +
          `إذا استمرت المشكلة، يرجى تحديث الصفحة.`
        );
      }
      
      setUploadProgress(0);
      setCurrentAttempt(0);
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleRestoreBackup = async () => {
    if (!actor) {
      setRestoreError(
        `❌ النظام غير متاح حالياً\n\n` +
        `تعذر الاتصال بالنظام.\n` +
        `يرجى المحاولة لاحقاً.`
      );
      return;
    }

    setIsRestoring(true);
    setRestoreError(null);
    setRestoreSuccess(false);
    setShowRestoreDialog(false);

    try {
      console.log('🔄 بدء استرجاع الصورة الأصلية...');
      await actor.restoreBackupMap();
      setRestoreSuccess(true);
      console.log('✅ تم استرجاع الصورة الأصلية بنجاح');
      
      // Refetch the map reference and URL to display the restored map
      setTimeout(async () => {
        await refetchMapRef();
        await refetchMapUrl();
      }, 1000);
    } catch (error: any) {
      console.error('❌ فشل استرجاع الصورة الأصلية:', error);
      
      const errorMessage = error?.message || error?.toString() || '';
      
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('not authorized')) {
        setRestoreError(
          `❌ خطأ في الصلاحيات\n\n` +
          `ليس لديك صلاحية لاسترجاع الصورة الأصلية.\n` +
          `هذه العملية متاحة فقط لمدير التطبيق.`
        );
      } else if (errorMessage.includes('No backup')) {
        setRestoreError(
          `❌ لا توجد نسخة احتياطية\n\n` +
          `لا توجد نسخة احتياطية متاحة للاسترجاع.\n` +
          `يرجى رفع خريطة جديدة أولاً.`
        );
      } else {
        setRestoreError(
          `❌ حدث خطأ أثناء الاسترجاع\n\n` +
          `تفاصيل الخطأ: ${errorMessage}\n\n` +
          `يرجى المحاولة مرة أخرى.`
        );
      }
    } finally {
      setIsRestoring(false);
    }
  };

  // Determine if we're loading the map
  const isLoadingMap = isLoadingMapRef || isLoadingMapUrl;
  
  // Determine if upload button should be enabled - simplified and more lenient
  const canUpload = !isUploading && !isCheckingBackend;

  return (
    <div className="w-full flex flex-col items-center justify-center bg-gray-50 rounded-lg overflow-hidden shadow-lg border border-gray-200 p-4 sm:p-6">
      {/* Display uploaded map image if available */}
      {uploadedMapUrl && !isLoadingMap && (
        <div className="w-full mb-4">
          <div className="relative w-full rounded-lg overflow-hidden shadow-md border-2 border-blue-200">
            <img 
              src={uploadedMapUrl} 
              alt="خريطة محافظة البريمي الرسمية" 
              className="w-full h-auto object-contain"
              style={{ maxHeight: '600px' }}
              onError={(e) => {
                console.error('خطأ في تحميل صورة الخريطة');
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>
      )}

      {/* Loading state for map */}
      {isLoadingMap && (
        <div className="w-full mb-4 flex items-center justify-center bg-blue-50 rounded-lg p-8 border-2 border-blue-200">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-blue-800 text-sm font-medium">يتم تحميل الخريطة...</p>
          </div>
        </div>
      )}

      {/* Backend checking state */}
      {isCheckingBackend && (
        <div className="w-full mb-4 flex items-center justify-center bg-amber-50 rounded-lg p-6 border-2 border-amber-200">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin text-amber-600 mx-auto mb-2" />
            <p className="text-amber-800 text-sm font-medium">جاري التحقق من توفر النظام...</p>
          </div>
        </div>
      )}

      {/* No map uploaded message - Horizontal Table Layout */}
      {!isLoadingMap && !uploadedMapUrl && !hasCustomMap && (
        <div className="w-full mb-4 bg-amber-50 rounded-lg p-4 sm:p-6 border-2 border-amber-200">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="w-1/2 text-center align-middle p-2 sm:p-3 border-l border-amber-300">
                    <p className="text-amber-900 text-sm sm:text-base font-semibold">لم يتم رفع خريطة بعد</p>
                  </td>
                  <td className="w-1/2 text-center align-middle p-2 sm:p-3">
                    <p className="text-amber-900 text-sm sm:text-base font-semibold">يرجى رفع الصورة الرسمية لمحافظة البريمي باستخدام الزر أدناه</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload and Restore Buttons */}
      <div className="w-full max-w-4xl space-y-3">
        {/* Upload Button - Icon Only with Tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full">
                <input
                  id="map-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={!canUpload}
                />
                <Button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('map-upload') as HTMLInputElement;
                    if (input && canUpload) {
                      input.click();
                    }
                  }}
                  disabled={!canUpload}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading || isCheckingBackend ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      {isCheckingBackend ? (
                        <span className="text-sm">جاري التحقق من النظام...</span>
                      ) : uploadProgress > 0 ? (
                        <span className="text-sm">
                          {uploadProgress}%
                          {currentAttempt > 0 && ` (محاولة ${currentAttempt})`}
                        </span>
                      ) : (
                        <span className="text-sm">جاري الرفع...</span>
                      )}
                    </>
                  ) : (
                    <Upload className="h-6 w-6" />
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-center">
              <p className="text-sm font-semibold">رفع الصورة الرسمية لمحافظة البريمي</p>
              <p className="text-xs text-gray-400 mt-1">الصيغ المدعومة: PNG، JPG، JPEG</p>
              <p className="text-xs text-gray-400">الحد الأقصى: 50 ميجابايت</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Restore Button - Admin Only */}
        {!isAdminLoading && isAdmin && hasCustomMap && (
          <Button
            type="button"
            onClick={() => setShowRestoreDialog(true)}
            disabled={isRestoring || isCheckingBackend}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRestoring ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>جاري استرجاع الصورة الأصلية...</span>
              </>
            ) : (
              <>
                <RotateCcw className="h-5 w-5" />
                <span>استرجاع الصورة الأصلية</span>
              </>
            )}
          </Button>
        )}

        {/* Progress Bar */}
        {isUploading && uploadProgress > 0 && (
          <div className="w-full space-y-2">
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-center text-gray-600">
              جاري الرفع... {uploadProgress}%
              {currentAttempt > 0 && ` (محاولة ${currentAttempt} من ${MAX_RETRIES})`}
            </p>
          </div>
        )}

        {/* Upload Success Message */}
        {uploadSuccess && (
          <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg shadow-sm animate-pulse">
            <div className="flex items-start gap-3">
              <div className="text-2xl">✅</div>
              <div className="flex-1">
                <p className="text-green-900 text-base font-bold mb-1">
                  تم رفع الخريطة بنجاح!
                </p>
                <p className="text-green-800 text-sm">
                  تم حفظ الخريطة المخصصة بنجاح وهي معروضة الآن.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Error Message */}
        {uploadError && (
          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg shadow-sm">
            <div className="flex items-start gap-3">
              <div className="text-2xl shrink-0">❌</div>
              <div className="flex-1">
                <p className="text-red-900 text-sm font-medium whitespace-pre-line leading-relaxed">
                  {uploadError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Restore Success Message */}
        {restoreSuccess && (
          <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg shadow-sm animate-pulse">
            <div className="flex items-start gap-3">
              <div className="text-2xl">✅</div>
              <div className="flex-1">
                <p className="text-green-900 text-base font-bold mb-1">
                  تم استرجاع الصورة الأصلية بنجاح!
                </p>
                <p className="text-green-800 text-sm">
                  تم استرجاع الخريطة السابقة وهي معروضة الآن.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Restore Error Message */}
        {restoreError && (
          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg shadow-sm">
            <div className="flex items-start gap-3">
              <div className="text-2xl shrink-0">❌</div>
              <div className="flex-1">
                <p className="text-red-900 text-sm font-medium whitespace-pre-line leading-relaxed">
                  {restoreError}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right text-lg font-bold">
              استرجاع الصورة الأصلية
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right text-base leading-relaxed">
              هل أنت متأكد من استرجاع الصورة الأصلية؟
              <br /><br />
              سيتم استبدال الخريطة الحالية بالنسخة الاحتياطية السابقة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction
              onClick={handleRestoreBackup}
              className="bg-amber-600 hover:bg-amber-700 font-semibold"
            >
              نعم، استرجع الصورة
            </AlertDialogAction>
            <AlertDialogCancel className="font-semibold">إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
