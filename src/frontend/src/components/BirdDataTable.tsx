import { useState, useMemo, useEffect } from 'react';
import { Trash2, Save, Loader2, LogIn, LogOut, User, RefreshCw, Plus, Download, Music, Camera, Image as ImageIcon, Edit } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { 
  useGetAllBirdDetails, 
  useDeleteBirdData, 
  useSaveAllBirdData,
  useIsAppManager,
  useCanModifyData,
  useInvalidateBirdData,
  useAddBirdWithDetails,
  useSaveChanges,
  useAddSubImage,
  useAddAudioFile
} from '../hooks/useQueries';
import { useFileUpload } from '../blob-storage/FileStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import type { BirdData } from '../backend';

interface BirdDataTableProps {
  owlTableData: any[];
  onOwlDataUpdate: (data: any[]) => void;
  uploadedFiles: any[];
}

// Helper function to export table data to Excel
function exportToExcel(data: any[], filename: string = 'bird-data.xlsx') {
  if (!data || data.length === 0) {
    toast.error('❌ لا توجد بيانات للتصدير', {
      duration: 3000,
      position: 'bottom-center',
    });
    return;
  }

  const headers = ['الاسم المحلي', 'الاسم العلمي', 'الموقع', 'اسم الجبل', 'اسم الوادي', 'الولاية', 'خط العرض', 'خط الطول', 'الملاحظات'];
  let tableHTML = '<table><thead><tr>';
  
  headers.forEach(header => {
    tableHTML += `<th>${header}</th>`;
  });
  tableHTML += '</tr></thead><tbody>';

  data.forEach(row => {
    tableHTML += '<tr>';
    tableHTML += `<td>${row.arabicName || ''}</td>`;
    tableHTML += `<td>${row.scientificName || ''}</td>`;
    tableHTML += `<td>${row.location || ''}</td>`;
    tableHTML += `<td>${row.mountainName || ''}</td>`;
    tableHTML += `<td>${row.valleyName || ''}</td>`;
    tableHTML += `<td>${row.state || ''}</td>`;
    tableHTML += `<td>${row.latitude || ''}</td>`;
    tableHTML += `<td>${row.longitude || ''}</td>`;
    tableHTML += `<td>${row.notes || ''}</td>`;
    tableHTML += '</tr>';
  });
  
  tableHTML += '</tbody></table>';

  const uri = 'data:application/vnd.ms-excel;base64,';
  const template = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:x="urn:schemas-microsoft-com:office:excel" 
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; direction: rtl; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #4CAF50; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        ${tableHTML}
      </body>
    </html>
  `;

  const base64 = (s: string) => window.btoa(unescape(encodeURIComponent(s)));
  const link = document.createElement('a');
  link.href = uri + base64(template);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast.success('✅ تم تصدير البيانات بنجاح', {
    description: `تم تنزيل ملف ${filename} إلى جهازك`,
    duration: 3000,
    position: 'bottom-center',
  });
}

// Helper function to parse location info from notes
function parseLocationInfo(notes: string) {
  const locationMatch = notes.match(/الموقع:\s*([^\|]+)/);
  const mountainMatch = notes.match(/اسم الجبل:\s*([^\|]+)/);
  const valleyMatch = notes.match(/اسم الوادي:\s*([^\|]+)/);
  const stateMatch = notes.match(/الولاية:\s*([^\|]+)/);

  return {
    location: locationMatch ? locationMatch[1].trim() : '',
    mountainName: mountainMatch ? mountainMatch[1].trim() : '',
    valleyName: valleyMatch ? valleyMatch[1].trim() : '',
    state: stateMatch ? stateMatch[1].trim() : '',
  };
}

export default function BirdDataTable({ owlTableData, onOwlDataUpdate, uploadedFiles }: BirdDataTableProps) {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { data: isAppManager = false, isLoading: isLoadingAppManager } = useIsAppManager();
  const { data: canModify = false, isLoading: isLoadingCanModify, refetch: refetchCanModify } = useCanModifyData();
  const { data: allBirdData = [], isLoading, refetch } = useGetAllBirdDetails();
  const deleteBirdMutation = useDeleteBirdData();
  const saveAllBirdDataMutation = useSaveAllBirdData();
  const addBirdWithDetailsMutation = useAddBirdWithDetails();
  const saveChangesMutation = useSaveChanges();
  const addSubImageMutation = useAddSubImage();
  const addAudioFileMutation = useAddAudioFile();
  const invalidateBirdData = useInvalidateBirdData();
  const { uploadFile, isUploading } = useFileUpload();

  const [birdToDelete, setBirdToDelete] = useState<string | null>(null);
  const [showAddDataDialog, setShowAddDataDialog] = useState(false);
  const [editingBird, setEditingBird] = useState<{ name: string; data: BirdData } | null>(null);
  const [uploadingForBird, setUploadingForBird] = useState<string | null>(null);
  const [savingBird, setSavingBird] = useState<string | null>(null);
  const [permissionsChecked, setPermissionsChecked] = useState(false);
  
  const [addDataForm, setAddDataForm] = useState({
    arabicName: '',
    scientificName: '',
    englishName: '',
    description: '',
    notes: '',
    latitude: '',
    longitude: '',
    location: '',
    mountainName: '',
    valleyName: '',
    state: '',
  });

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  // Automatic permission checking on page initialization
  useEffect(() => {
    if (isAuthenticated && !isLoadingCanModify && !isLoadingAppManager && !permissionsChecked) {
      refetchCanModify();
      setPermissionsChecked(true);
    }
  }, [isAuthenticated, isLoadingCanModify, isLoadingAppManager, permissionsChecked, refetchCanModify]);

  // Reset permissions check when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setPermissionsChecked(false);
    }
  }, [isAuthenticated]);

  const tableData = useMemo(() => {
    return allBirdData.map(([birdName, birdData]) => {
      const locationInfo = parseLocationInfo(birdData.notes);
      const firstLocation = birdData.locations[0];
      
      return {
        birdName,
        arabicName: birdData.arabicName,
        scientificName: birdData.scientificName,
        location: locationInfo.location,
        mountainName: locationInfo.mountainName,
        valleyName: locationInfo.valleyName,
        state: locationInfo.state,
        latitude: firstLocation ? firstLocation.latitude.toFixed(6) : '',
        longitude: firstLocation ? firstLocation.longitude.toFixed(6) : '',
        notes: birdData.notes,
        fullData: birdData,
      };
    });
  }, [allBirdData]);

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      invalidateBirdData();
      setPermissionsChecked(false);
      toast.success('✅ تم تسجيل الخروج بنجاح', {
        duration: 2000,
        position: 'bottom-center',
      });
    } else {
      try {
        await login();
        toast.success('✅ تم تسجيل الدخول بنجاح', {
          duration: 2000,
          position: 'bottom-center',
        });
        // Trigger permission check after successful login
        setTimeout(() => {
          refetchCanModify();
          setPermissionsChecked(true);
        }, 500);
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const handleDeleteBird = async () => {
    if (!birdToDelete) return;

    if (!isAuthenticated) {
      toast.error('⚠️ لا تملك صلاحية للإجراء', {
        description: 'يرجى تسجيل الدخول أولاً للحصول على صلاحيات الحذف',
        duration: 4000,
        position: 'bottom-center',
      });
      return;
    }

    if (!canModify) {
      toast.error('⚠️ لا تملك صلاحية للإجراء', {
        description: 'يُسمح فقط لمدير التطبيق والمستخدمين المخولين بحذف البيانات',
        duration: 4000,
        position: 'bottom-center',
      });
      return;
    }

    try {
      await deleteBirdMutation.mutateAsync(birdToDelete);
      toast.success('✅ تم حذف البيانات بنجاح وتحديث جميع الأقسام فورًا', {
        description: `تم حذف بيانات "${birdToDelete}" من الجدول والمعرض والخريطة`,
        duration: 3000,
        position: 'bottom-center',
      });
      setBirdToDelete(null);
      
      setTimeout(() => {
        invalidateBirdData();
        refetch();
      }, 500);
    } catch (error: any) {
      console.error('Delete error:', error);
      
      if (error?.message?.includes('صلاحية') || error?.message?.includes('Unauthorized')) {
        toast.error('⚠️ لا تملك صلاحية للإجراء', {
          description: 'يُسمح فقط لمدير التطبيق والمستخدمين المخولين بحذف البيانات',
          duration: 4000,
          position: 'bottom-center',
        });
      } else {
        toast.error('❌ حدث خطأ أثناء الحذف، يرجى المحاولة مرة أخرى.', {
          description: error?.message || 'فشل في حذف البيانات',
          duration: 3000,
          position: 'bottom-center',
        });
      }
    }
  };

  const handleRefresh = () => {
    invalidateBirdData();
    refetch();
    if (isAuthenticated) {
      refetchCanModify();
    }
    toast.success('✅ تم تحديث البيانات بنجاح', {
      description: 'تم تحديث الجدول بأحدث البيانات من قاعدة البيانات',
      duration: 2000,
      position: 'bottom-center',
    });
  };

  const handleOpenAddDataDialog = () => {
    if (!isAuthenticated) {
      toast.error('⚠️ لا تملك صلاحية للإجراء', {
        description: 'يرجى تسجيل الدخول أولاً للحصول على صلاحيات إضافة البيانات',
        duration: 4000,
        position: 'bottom-center',
      });
      return;
    }

    if (!canModify) {
      toast.error('⚠️ لا تملك صلاحية للإجراء', {
        description: 'يُسمح فقط لمدير التطبيق والمستخدمين المخولين بإضافة البيانات',
        duration: 4000,
        position: 'bottom-center',
      });
      return;
    }

    setShowAddDataDialog(true);
  };

  const handleCloseAddDataDialog = () => {
    setShowAddDataDialog(false);
    setAddDataForm({
      arabicName: '',
      scientificName: '',
      englishName: '',
      description: '',
      notes: '',
      latitude: '',
      longitude: '',
      location: '',
      mountainName: '',
      valleyName: '',
      state: '',
    });
  };

  const handleAddDataFormChange = (field: string, value: string) => {
    setAddDataForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddData = async () => {
    if (!isAuthenticated) {
      toast.error('⚠️ لا تملك صلاحية للإجراء', {
        description: 'يرجى تسجيل الدخول أولاً للحصول على صلاحيات إضافة البيانات',
        duration: 4000,
        position: 'bottom-center',
      });
      return;
    }

    if (!canModify) {
      toast.error('⚠️ لا تملك صلاحية للإجراء', {
        description: 'يُسمح فقط لمدير التطبيق والمستخدمين المخولين بإضافة البيانات',
        duration: 4000,
        position: 'bottom-center',
      });
      return;
    }

    if (!addDataForm.arabicName.trim()) {
      toast.error('❌ الاسم المحلي مطلوب', {
        description: 'يرجى إدخال الاسم المحلي للطائر',
        duration: 3000,
        position: 'bottom-center',
      });
      return;
    }

    if (!addDataForm.latitude.trim() || !addDataForm.longitude.trim()) {
      toast.error('❌ الإحداثيات مطلوبة', {
        description: 'يرجى إدخال خط العرض وخط الطول',
        duration: 3000,
        position: 'bottom-center',
      });
      return;
    }

    const latitude = parseFloat(addDataForm.latitude);
    const longitude = parseFloat(addDataForm.longitude);

    if (isNaN(latitude) || isNaN(longitude)) {
      toast.error('❌ إحداثيات غير صحيحة', {
        description: 'يرجى إدخال أرقام صحيحة لخط العرض وخط الطول',
        duration: 3000,
        position: 'bottom-center',
      });
      return;
    }

    const locationInfo = [
      addDataForm.location && `الموقع: ${addDataForm.location}`,
      addDataForm.mountainName && `اسم الجبل: ${addDataForm.mountainName}`,
      addDataForm.valleyName && `اسم الوادي: ${addDataForm.valleyName}`,
      addDataForm.state && `الولاية: ${addDataForm.state}`,
    ].filter(Boolean).join(' | ');

    const combinedNotes = [addDataForm.notes.trim(), locationInfo].filter(Boolean).join('\n\n');

    try {
      await addBirdWithDetailsMutation.mutateAsync({
        arabicName: addDataForm.arabicName.trim(),
        scientificName: addDataForm.scientificName.trim(),
        englishName: addDataForm.englishName.trim(),
        description: addDataForm.description.trim(),
        notes: combinedNotes,
        latitude,
        longitude,
        audioFilePath: null,
        subImages: [],
      });

      toast.success('✅ تم إضافة البيانات بنجاح وتحديث جميع الأقسام فورًا', {
        description: 'تم إضافة بيانات الطائر إلى الجدول والمعرض والخريطة',
        duration: 3000,
        position: 'bottom-center',
      });

      handleCloseAddDataDialog();

      setTimeout(() => {
        invalidateBirdData();
        refetch();
      }, 500);
    } catch (error: any) {
      console.error('Add data error:', error);
      
      if (error?.message?.includes('صلاحية') || error?.message?.includes('Unauthorized')) {
        toast.error('⚠️ لا تملك صلاحية للإجراء', {
          description: 'يُسمح فقط لمدير التطبيق والمستخدمين المخولين بإضافة البيانات',
          duration: 4000,
          position: 'bottom-center',
        });
      } else {
        toast.error('❌ حدث خطأ أثناء الإضافة، يرجى المحاولة مرة أخرى.', {
          description: error?.message || 'فشل في إضافة البيانات',
          duration: 4000,
          position: 'bottom-center',
        });
      }
    }
  };

  const handleUploadMainImage = async (birdName: string, file: File) => {
    if (!isAuthenticated) {
      toast.error('⚠️ لا تملك صلاحية للإجراء', {
        description: 'يرجى تسجيل الدخول أولاً للحصول على صلاحيات رفع الصور',
        duration: 4000,
        position: 'bottom-center',
      });
      return;
    }

    if (!canModify) {
      toast.error('⚠️ لا تملك صلاحية للإجراء', {
        description: 'يُسمح فقط لمدير التطبيق والمستخدمين المخولين برفع الصور',
        duration: 3000,
        position: 'bottom-center',
      });
      return;
    }

    setUploadingForBird(birdName);

    try {
      const imagePath = `birds/${birdName}/main/${Date.now()}_${file.name}`;
      const { path } = await uploadFile(imagePath, file);
      
      await addSubImageMutation.mutateAsync({
        birdName,
        imagePath: path,
      });

      toast.success('✅ تم رفع الملف بنجاح!', {
        description: 'تم إضافة الصورة إلى سجل الطائر والمعرض',
        duration: 3000,
        position: 'bottom-center',
      });

      setTimeout(() => {
        invalidateBirdData();
        refetch();
      }, 500);
    } catch (error: any) {
      console.error('Main image upload error:', error);
      
      if (error?.message?.includes('صلاحية') || error?.message?.includes('Unauthorized')) {
        toast.error('⚠️ لا تملك صلاحية للإجراء', {
          description: 'يُسمح فقط لمدير التطبيق والمستخدمين المخولين برفع الصور',
          duration: 4000,
          position: 'bottom-center',
        });
      } else {
        toast.error('❌ فشل رفع الملف', {
          description: error?.message || 'حدث خطأ أثناء رفع الصورة',
          duration: 3000,
          position: 'bottom-center',
        });
      }
    } finally {
      setUploadingForBird(null);
    }
  };

  const handleUploadSubImage = async (birdName: string, file: File) => {
    if (!isAuthenticated) {
      toast.error('⚠️ لا تملك صلاحية للإجراء', {
        description: 'يرجى تسجيل الدخول أولاً للحصول على صلاحيات رفع الصور',
        duration: 4000,
        position: 'bottom-center',
      });
      return;
    }

    if (!canModify) {
      toast.error('⚠️ لا تملك صلاحية للإجراء', {
        description: 'يُسمح فقط لمدير التطبيق والمستخدمين المخولين برفع الصور',
        duration: 3000,
        position: 'bottom-center',
      });
      return;
    }

    setUploadingForBird(birdName);

    try {
      const imagePath = `birds/${birdName}/sub/${Date.now()}_${file.name}`;
      const { path } = await uploadFile(imagePath, file);
      
      await addSubImageMutation.mutateAsync({
        birdName,
        imagePath: path,
      });

      toast.success('✅ تم رفع الملف بنجاح!', {
        description: 'تم إضافة الصورة إلى سجل الطائر والمعرض',
        duration: 3000,
        position: 'bottom-center',
      });

      setTimeout(() => {
        invalidateBirdData();
        refetch();
      }, 500);
    } catch (error: any) {
      console.error('Sub image upload error:', error);
      
      if (error?.message?.includes('صلاحية') || error?.message?.includes('Unauthorized')) {
        toast.error('⚠️ لا تملك صلاحية للإجراء', {
          description: 'يُسمح فقط لمدير التطبيق والمستخدمين المخولين برفع الصور',
          duration: 4000,
          position: 'bottom-center',
        });
      } else {
        toast.error('❌ فشل رفع الملف', {
          description: error?.message || 'حدث خطأ أثناء رفع الصورة',
          duration: 3000,
          position: 'bottom-center',
        });
      }
    } finally {
      setUploadingForBird(null);
    }
  };

  const handleAudioUpload = async (birdName: string, file: File) => {
    if (!isAuthenticated) {
      toast.error('⚠️ لا تملك صلاحية للإجراء', {
        description: 'يرجى تسجيل الدخول أولاً للحصول على صلاحيات رفع الملفات الصوتية',
        duration: 4000,
        position: 'bottom-center',
      });
      return;
    }

    if (!canModify) {
      toast.error('⚠️ لا تملك صلاحية للإجراء', {
        description: 'يُسمح فقط لمدير التطبيق والمستخدمين المخولين برفع الملفات الصوتية',
        duration: 3000,
        position: 'bottom-center',
      });
      return;
    }

    setUploadingForBird(birdName);

    try {
      const audioPath = `birds/${birdName}/audio/${Date.now()}_${file.name}`;
      const { path } = await uploadFile(audioPath, file);
      
      await addAudioFileMutation.mutateAsync({
        birdName,
        audioFilePath: path,
      });

      toast.success('✅ تم رفع الملف بنجاح!', {
        description: 'تم إضافة الملف الصوتي إلى سجل الطائر',
        duration: 3000,
        position: 'bottom-center',
      });

      setTimeout(() => {
        invalidateBirdData();
        refetch();
      }, 500);
    } catch (error: any) {
      console.error('Audio upload error:', error);
      
      if (error?.message?.includes('صلاحية') || error?.message?.includes('Unauthorized')) {
        toast.error('⚠️ لا تملك صلاحية للإجراء', {
          description: 'يُسمح فقط لمدير التطبيق والمستخدمين المخولين برفع الملفات الصوتية',
          duration: 4000,
          position: 'bottom-center',
        });
      } else {
        toast.error('❌ فشل رفع الملف', {
          description: error?.message || 'حدث خطأ أثناء رفع الملف الصوتي',
          duration: 3000,
          position: 'bottom-center',
        });
      }
    } finally {
      setUploadingForBird(null);
    }
  };

  const handleSaveBird = async (birdName: string) => {
    if (!isAuthenticated) {
      toast.error('⚠️ لا تملك صلاحية للإجراء', {
        description: 'يرجى تسجيل الدخول أولاً للحصول على صلاحيات الحفظ',
        duration: 4000,
        position: 'bottom-center',
      });
      return;
    }

    if (!canModify) {
      toast.error('⚠️ لا تملك صلاحية للإجراء', {
        description: 'يُسمح فقط لمدير التطبيق والمستخدمين المخولين بحفظ التغييرات',
        duration: 4000,
        position: 'bottom-center',
      });
      return;
    }

    const birdEntry = allBirdData.find(([name]) => name === birdName);
    if (!birdEntry) return;

    setSavingBird(birdName);

    try {
      await saveChangesMutation.mutateAsync({
        birdName,
        updatedData: birdEntry[1],
      });

      toast.success('✅ تم حفظ التغييرات بنجاح!', {
        description: 'تم تحديث بيانات الطائر وتحديث جميع الصفحات فورًا',
        duration: 3000,
        position: 'bottom-center',
      });

      setTimeout(() => {
        invalidateBirdData();
        refetch();
      }, 500);
    } catch (error: any) {
      console.error('Save error:', error);
      
      if (error?.message?.includes('صلاحية') || error?.message?.includes('Unauthorized')) {
        toast.error('⚠️ لا تملك صلاحية للإجراء', {
          description: 'يُسمح فقط لمدير التطبيق والمستخدمين المخولين بحفظ التغييرات',
          duration: 4000,
          position: 'bottom-center',
        });
      } else {
        toast.error('⚠️ لم يتم الحفظ', {
          description: error?.message || 'حدث خطأ أثناء حفظ التغييرات',
          duration: 3000,
          position: 'bottom-center',
        });
      }
    } finally {
      setSavingBird(null);
    }
  };

  const handleEditBird = (birdName: string) => {
    if (!isAuthenticated) {
      toast.error('⚠️ لا تملك صلاحية للإجراء', {
        description: 'يرجى تسجيل الدخول أولاً للحصول على صلاحيات التحرير',
        duration: 4000,
        position: 'bottom-center',
      });
      return;
    }

    if (!canModify) {
      toast.error('⚠️ لا تملك صلاحية للإجراء', {
        description: 'يُسمح فقط لمدير التطبيق والمستخدمين المخولين بتحرير البيانات',
        duration: 4000,
        position: 'bottom-center',
      });
      return;
    }

    const birdEntry = allBirdData.find(([name]) => name === birdName);
    if (birdEntry) {
      setEditingBird({ name: birdName, data: birdEntry[1] });
      toast.info('✏️ تم تفعيل وضع التحرير', {
        description: `يمكنك الآن تعديل بيانات "${birdEntry[1].arabicName}"`,
        duration: 2000,
        position: 'bottom-center',
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingBird) return;

    if (!isAuthenticated) {
      toast.error('⚠️ لا تملك صلاحية للإجراء', {
        description: 'يرجى تسجيل الدخول أولاً للحصول على صلاحيات الحفظ',
        duration: 4000,
        position: 'bottom-center',
      });
      return;
    }

    if (!canModify) {
      toast.error('⚠️ لا تملك صلاحية للإجراء', {
        description: 'يُسمح فقط لمدير التطبيق والمستخدمين المخولين بحفظ التغييرات',
        duration: 4000,
        position: 'bottom-center',
      });
      return;
    }

    setSavingBird(editingBird.name);

    try {
      await saveChangesMutation.mutateAsync({
        birdName: editingBird.name,
        updatedData: editingBird.data,
      });

      toast.success('✅ تم تعديل البيانات بنجاح وتحديث جميع الأقسام فورًا', {
        description: 'تم تحديث بيانات الطائر وتحديث جميع الصفحات فورًا',
        duration: 3000,
        position: 'bottom-center',
      });

      setEditingBird(null);

      setTimeout(() => {
        invalidateBirdData();
        refetch();
      }, 500);
    } catch (error: any) {
      console.error('Save edit error:', error);
      
      if (error?.message?.includes('صلاحية') || error?.message?.includes('Unauthorized')) {
        toast.error('⚠️ لا تملك صلاحية للإجراء', {
          description: 'يُسمح فقط لمدير التطبيق والمستخدمين المخولين بحفظ التغييرات',
          duration: 4000,
          position: 'bottom-center',
        });
      } else {
        toast.error('⚠️ لم يتم الحفظ', {
          description: error?.message || 'حدث خطأ أثناء حفظ التغييرات',
          duration: 3000,
          position: 'bottom-center',
        });
      }
    } finally {
      setSavingBird(null);
    }
  };

  const handleExportToExcel = () => {
    exportToExcel(tableData, 'بيانات-الطيور.xlsx');
  };

  // Determine if buttons should be enabled
  const buttonsEnabled = isAuthenticated && canModify && !isLoadingCanModify;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4 md:p-6" dir="rtl">
      <Card className="w-full mx-auto shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <CardTitle className="text-xl md:text-2xl font-bold flex items-center">
              <User className="h-5 w-5 md:h-6 md:w-6 ml-2" />
              جدول بيانات الطيور
            </CardTitle>
            <div className="flex items-center gap-2 md:gap-3">
              <Button
                onClick={handleRefresh}
                variant="secondary"
                size="sm"
                disabled={isLoading}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
              <Button
                onClick={handleAuth}
                disabled={isLoggingIn}
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري تسجيل الدخول...
                  </>
                ) : isAuthenticated ? (
                  <>
                    <LogOut className="h-4 w-4 ml-2" />
                    تسجيل الخروج
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 ml-2" />
                    تسجيل الدخول
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-blue-100 mt-2 text-sm md:text-base">
            {isAuthenticated 
              ? canModify 
                ? 'يمكنك الآن تعديل وحذف وإضافة البيانات' 
                : 'يمكنك عرض البيانات فقط'
              : 'قم بتسجيل الدخول للحصول على صلاحيات التعديل'
            }
          </p>
        </CardHeader>

        <CardContent className="p-4 md:p-6 bg-white">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">جاري تحميل البيانات...</p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-wrap gap-3 justify-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleOpenAddDataDialog}
                        disabled={!buttonsEnabled || addBirdWithDetailsMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-5 w-5 ml-2" />
                        إضافة البيانات
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>إضافة بيانات طائر جديد</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleExportToExcel}
                        disabled={tableData.length === 0}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 shadow-lg"
                      >
                        <Download className="h-5 w-5 ml-2" />
                        تصدير إلى Excel
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>تنزيل البيانات بصيغة Excel</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {tableData.length === 0 ? (
                <div className="text-center py-12 bg-white">
                  <p className="text-gray-600 text-lg mb-4">لا توجد بيانات متاحة</p>
                  <p className="text-gray-500 mb-6">ابدأ بإضافة بيانات الطيور من خلال زر "إضافة البيانات"</p>
                  <Button
                    onClick={handleOpenAddDataDialog}
                    disabled={!buttonsEnabled}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-5 w-5 ml-2" />
                    إضافة أول طائر
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-center py-4 mb-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <p className="text-lg text-gray-700">
                      إجمالي الأنواع: <span className="font-bold text-blue-600 text-2xl">{tableData.length}</span>
                    </p>
                  </div>

                  <div className="overflow-x-auto rounded-lg border-2 border-gray-300 shadow-xl">
                    <table className="w-full border-collapse bg-white" style={{ minWidth: '2400px' }}>
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-600 to-green-600">
                          <th className="text-right font-bold text-white text-base px-3 py-4 border-l border-white/20" style={{ width: '10%' }}>الاسم المحلي</th>
                          <th className="text-right font-bold text-white text-base px-3 py-4 border-l border-white/20" style={{ width: '10%' }}>الاسم العلمي</th>
                          <th className="text-right font-bold text-white text-base px-3 py-4 border-l border-white/20" style={{ width: '8%' }}>الموقع</th>
                          <th className="text-right font-bold text-white text-base px-3 py-4 border-l border-white/20" style={{ width: '8%' }}>اسم الجبل</th>
                          <th className="text-right font-bold text-white text-base px-3 py-4 border-l border-white/20" style={{ width: '8%' }}>اسم الوادي</th>
                          <th className="text-right font-bold text-white text-base px-3 py-4 border-l border-white/20" style={{ width: '7%' }}>الولاية</th>
                          <th className="text-center font-bold text-white text-base px-3 py-4 border-l border-white/20" style={{ width: '6%' }}>خط العرض</th>
                          <th className="text-center font-bold text-white text-base px-3 py-4 border-l border-white/20" style={{ width: '6%' }}>خط الطول</th>
                          <th className="text-right font-bold text-white text-base px-3 py-4 border-l border-white/20" style={{ width: '10%' }}>الملاحظات</th>
                          {buttonsEnabled && <th className="text-center font-bold text-white text-base px-3 py-4" style={{ width: '27%' }}>الإجراءات</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.map((row, index) => (
                          <tr 
                            key={row.birdName} 
                            className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors border-b border-gray-200`}
                          >
                            <td className="font-bold text-gray-900 text-sm px-3 py-3 border-l border-gray-200">{row.arabicName}</td>
                            <td className="text-gray-700 italic text-sm px-3 py-3 border-l border-gray-200">{row.scientificName || '-'}</td>
                            <td className="text-gray-700 text-sm px-3 py-3 border-l border-gray-200">{row.location || '-'}</td>
                            <td className="text-gray-700 text-sm px-3 py-3 border-l border-gray-200">{row.mountainName || '-'}</td>
                            <td className="text-gray-700 text-sm px-3 py-3 border-l border-gray-200">{row.valleyName || '-'}</td>
                            <td className="text-gray-700 text-sm px-3 py-3 border-l border-gray-200">{row.state || '-'}</td>
                            <td className="text-gray-700 text-sm px-3 py-3 border-l border-gray-200 text-center font-mono">{row.latitude || '-'}</td>
                            <td className="text-gray-700 text-sm px-3 py-3 border-l border-gray-200 text-center font-mono">{row.longitude || '-'}</td>
                            <td className="text-gray-700 text-sm px-3 py-3 border-l border-gray-200 max-w-[150px] truncate" title={row.notes}>{row.notes || '-'}</td>
                            {buttonsEnabled && (
                              <td className="px-3 py-3">
                                <div className="flex gap-1 flex-wrap items-center justify-center">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-2 py-1 shadow-md text-xs"
                                          disabled={uploadingForBird === row.birdName || isUploading}
                                          onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = 'image/*';
                                            input.onchange = (e: any) => {
                                              const file = e.target?.files?.[0];
                                              if (file) handleUploadMainImage(row.birdName, file);
                                            };
                                            input.click();
                                          }}
                                        >
                                          {uploadingForBird === row.birdName ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <>
                                              <Camera className="h-3 w-3 ml-1" />
                                              <span>رفع صورة رئيسية</span>
                                            </>
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>📸 رفع صورة رئيسية</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          className="bg-green-600 hover:bg-green-700 text-white font-medium px-2 py-1 shadow-md text-xs"
                                          disabled={uploadingForBird === row.birdName || isUploading}
                                          onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = 'image/*';
                                            input.onchange = (e: any) => {
                                              const file = e.target?.files?.[0];
                                              if (file) handleUploadSubImage(row.birdName, file);
                                            };
                                            input.click();
                                          }}
                                        >
                                          {uploadingForBird === row.birdName ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <>
                                              <ImageIcon className="h-3 w-3 ml-1" />
                                              <span>رفع صورة فرعية</span>
                                            </>
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>🖼️ رفع صورة فرعية</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-2 py-1 shadow-md text-xs"
                                          disabled={uploadingForBird === row.birdName || isUploading}
                                          onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = 'audio/*';
                                            input.onchange = (e: any) => {
                                              const file = e.target?.files?.[0];
                                              if (file) handleAudioUpload(row.birdName, file);
                                            };
                                            input.click();
                                          }}
                                        >
                                          {uploadingForBird === row.birdName ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <>
                                              <Music className="h-3 w-3 ml-1" />
                                              <span>إضافة صوت</span>
                                            </>
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>🎤 إضافة صوت</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          onClick={() => handleEditBird(row.birdName)}
                                          size="sm"
                                          className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium px-2 py-1 shadow-md text-xs"
                                        >
                                          <Edit className="h-3 w-3 ml-1" />
                                          <span>تحرير</span>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>✏️ تحرير</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          onClick={() => handleSaveBird(row.birdName)}
                                          size="sm"
                                          className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-2 py-1 shadow-md text-xs"
                                          disabled={savingBird === row.birdName}
                                        >
                                          {savingBird === row.birdName ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <>
                                              <Save className="h-3 w-3 ml-1" />
                                              <span>حفظ</span>
                                            </>
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>💾 حفظ</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          onClick={() => setBirdToDelete(row.birdName)}
                                          size="sm"
                                          variant="destructive"
                                          className="bg-red-600 hover:bg-red-700 text-white font-medium px-2 py-1 shadow-md text-xs"
                                        >
                                          <Trash2 className="h-3 w-3 ml-1" />
                                          <span>حذف</span>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>🗑️ حذف</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!birdToDelete} onOpenChange={() => setBirdToDelete(null)}>
        <AlertDialogContent dir="rtl" className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذا الطائر؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف جميع بيانات "{birdToDelete}" نهائياً من قاعدة البيانات. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBird}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteBirdMutation.isPending}
            >
              {deleteBirdMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                'حذف نهائياً'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Data Dialog */}
      <Dialog open={showAddDataDialog} onOpenChange={setShowAddDataDialog}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto bg-white" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-bold flex items-center text-blue-600">
              <Plus className="h-6 w-6 ml-2" />
              إضافة بيانات طائر جديد
            </DialogTitle>
            <DialogDescription>
              أدخل معلومات الطائر الجديد. الحقول المطلوبة: الاسم المحلي، خط العرض، وخط الطول.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="arabicName" className="text-right font-bold text-red-600">
                  الاسم المحلي *
                </Label>
                <Input
                  id="arabicName"
                  value={addDataForm.arabicName}
                  onChange={(e) => handleAddDataFormChange('arabicName', e.target.value)}
                  placeholder="مثال: البومة النسارية"
                  className="bg-white border-2 border-blue-300"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scientificName" className="text-right font-bold">
                  الاسم العلمي
                </Label>
                <Input
                  id="scientificName"
                  value={addDataForm.scientificName}
                  onChange={(e) => handleAddDataFormChange('scientificName', e.target.value)}
                  placeholder="مثال: Bubo bubo"
                  className="bg-white border-2"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-right font-bold">
                  الموقع
                </Label>
                <Input
                  id="location"
                  value={addDataForm.location}
                  onChange={(e) => handleAddDataFormChange('location', e.target.value)}
                  placeholder="مثال: جبل حفيت"
                  className="bg-white border-2"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mountainName" className="text-right font-bold">
                  اسم الجبل
                </Label>
                <Input
                  id="mountainName"
                  value={addDataForm.mountainName}
                  onChange={(e) => handleAddDataFormChange('mountainName', e.target.value)}
                  placeholder="مثال: جبل حفيت"
                  className="bg-white border-2"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valleyName" className="text-right font-bold">
                  اسم الوادي
                </Label>
                <Input
                  id="valleyName"
                  value={addDataForm.valleyName}
                  onChange={(e) => handleAddDataFormChange('valleyName', e.target.value)}
                  placeholder="مثال: وادي الجزي"
                  className="bg-white border-2"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state" className="text-right font-bold">
                  الولاية
                </Label>
                <Input
                  id="state"
                  value={addDataForm.state}
                  onChange={(e) => handleAddDataFormChange('state', e.target.value)}
                  placeholder="مثال: البريمي"
                  className="bg-white border-2"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="latitude" className="text-right font-bold text-red-600">
                  خط العرض *
                </Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={addDataForm.latitude}
                  onChange={(e) => handleAddDataFormChange('latitude', e.target.value)}
                  placeholder="مثال: 24.2500"
                  className="bg-white border-2 border-blue-300"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude" className="text-right font-bold text-red-600">
                  خط الطول *
                </Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={addDataForm.longitude}
                  onChange={(e) => handleAddDataFormChange('longitude', e.target.value)}
                  placeholder="مثال: 55.7833"
                  className="bg-white border-2 border-blue-300"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-right font-bold">
                الوصف
              </Label>
              <Textarea
                id="description"
                value={addDataForm.description}
                onChange={(e) => handleAddDataFormChange('description', e.target.value)}
                placeholder="أدخل وصف الطائر..."
                className="bg-white border-2 min-h-[80px]"
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-right font-bold">
                ملاحظات
              </Label>
              <Textarea
                id="notes"
                value={addDataForm.notes}
                onChange={(e) => handleAddDataFormChange('notes', e.target.value)}
                placeholder="أدخل ملاحظات إضافية..."
                className="bg-white border-2 min-h-[80px]"
                dir="rtl"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-3 pt-4 border-t-2">
            <Button
              variant="outline"
              onClick={handleCloseAddDataDialog}
              disabled={addBirdWithDetailsMutation.isPending}
              className="px-8 py-3 font-bold"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleAddData}
              disabled={addBirdWithDetailsMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3"
            >
              {addBirdWithDetailsMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                  جاري الإضافة...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 ml-2" />
                  إضافة البيانات
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bird Dialog */}
      {editingBird && (
        <Dialog open={!!editingBird} onOpenChange={() => setEditingBird(null)}>
          <DialogContent className="max-w-2xl bg-white" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">تعديل بيانات: {editingBird.data.arabicName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>الاسم العلمي</Label>
                <Input
                  value={editingBird.data.scientificName}
                  onChange={(e) => setEditingBird({
                    ...editingBird,
                    data: { ...editingBird.data, scientificName: e.target.value }
                  })}
                  className="bg-white border-2"
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={editingBird.data.description}
                  onChange={(e) => setEditingBird({
                    ...editingBird,
                    data: { ...editingBird.data, description: e.target.value }
                  })}
                  className="bg-white border-2 min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingBird(null)}>إلغاء</Button>
              <Button
                onClick={handleSaveEdit}
                disabled={saveChangesMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {saveChangesMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 ml-2" />
                    حفظ التغييرات
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

