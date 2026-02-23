import { useState } from 'react';
import { useIsAppManager, useAssignCallerUserRole } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { UserPlus, Shield, AlertCircle, CheckCircle2, Loader2, Info, Clock } from 'lucide-react';
import { Principal } from '@icp-sdk/core/principal';
import { UserRole } from '../backend';

export default function PermissionManagement() {
  const { identity } = useInternetIdentity();
  const { data: isAppManager, isLoading: loadingAppManager, refetch: refetchAppManager } = useIsAppManager();
  const assignRoleMutation = useAssignCallerUserRole();

  const [principalInput, setPrincipalInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('user' as UserRole);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Get current user's principal
  const currentUserPrincipal = identity?.getPrincipal().toString() || '';

  const handleAssignRole = async () => {
    setSuccessMessage('');
    setErrorMessage('');

    if (!principalInput.trim()) {
      setErrorMessage('يرجى إدخال معرف المستخدم (Principal ID)');
      return;
    }

    try {
      // Validate principal format and convert to Principal type
      const userPrincipal = Principal.fromText(principalInput.trim());

      await assignRoleMutation.mutateAsync({
        user: userPrincipal,
        role: selectedRole,
      });

      const roleNameArabic = selectedRole === 'admin' ? 'مدير' : selectedRole === 'user' ? 'مستخدم مخول' : 'ضيف';
      setSuccessMessage(`✅ تم تعيين دور "${roleNameArabic}" بنجاح`);
      setPrincipalInput('');
      
      // Refetch admin status after successful assignment
      setTimeout(() => {
        refetchAppManager();
      }, 500);
    } catch (error: any) {
      console.error('Error assigning role:', error);
      
      // Check if it's an ingress_expiry error
      if (error.message && error.message.includes('ingress_expiry')) {
        setErrorMessage('⚠️ خطأ في التوقيت: يرجى التأكد من أن ساعة جهازك مضبوطة بشكل صحيح. قد تحتاج إلى مزامنة الوقت مع خادم الإنترنت.');
      } else {
        setErrorMessage(error.message || 'حدث خطأ أثناء تعيين الدور');
      }
    }
  };

  const handleGrantSelfAdmin = async () => {
    if (!currentUserPrincipal) {
      setErrorMessage('لم يتم العثور على معرف المستخدم الحالي');
      return;
    }

    setSuccessMessage('');
    setErrorMessage('');

    try {
      const userPrincipal = Principal.fromText(currentUserPrincipal);

      await assignRoleMutation.mutateAsync({
        user: userPrincipal,
        role: 'admin' as UserRole,
      });

      setSuccessMessage('✅ تم منحك صلاحيات المدير! يمكنك الآن إدارة جميع الصلاحيات');
      
      // Refetch admin status after successful assignment
      setTimeout(() => {
        refetchAppManager();
      }, 500);
    } catch (error: any) {
      console.error('Error granting self admin:', error);
      
      // Check if it's an ingress_expiry error
      if (error.message && error.message.includes('ingress_expiry')) {
        setErrorMessage('⚠️ خطأ في التوقيت: يرجى التأكد من أن ساعة جهازك مضبوطة بشكل صحيح. قد تحتاج إلى مزامنة الوقت مع خادم الإنترنت.');
      } else {
        setErrorMessage(error.message || 'حدث خطأ أثناء منح الصلاحية');
      }
    }
  };

  const handleGrantSelfUser = async () => {
    if (!currentUserPrincipal) {
      setErrorMessage('لم يتم العثور على معرف المستخدم الحالي');
      return;
    }

    setSuccessMessage('');
    setErrorMessage('');

    try {
      const userPrincipal = Principal.fromText(currentUserPrincipal);

      await assignRoleMutation.mutateAsync({
        user: userPrincipal,
        role: 'user' as UserRole,
      });

      setSuccessMessage('✅ تم منحك صلاحية التعديل! يمكنك الآن تعديل البيانات ورفع الملفات');
      
      // Refetch admin status after successful assignment
      setTimeout(() => {
        refetchAppManager();
      }, 500);
    } catch (error: any) {
      console.error('Error granting self access:', error);
      
      // Check if it's an ingress_expiry error
      if (error.message && error.message.includes('ingress_expiry')) {
        setErrorMessage('⚠️ خطأ في التوقيت: يرجى التأكد من أن ساعة جهازك مضبوطة بشكل صحيح. قد تحتاج إلى مزامنة الوقت مع خادم الإنترنت.');
      } else {
        setErrorMessage(error.message || 'حدث خطأ أثناء منح الصلاحية');
      }
    }
  };

  // Loading state
  if (loadingAppManager) {
    return (
      <div className="flex items-center justify-center p-8" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // If not an admin, show self-grant option
  if (!isAppManager) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6" dir="rtl">
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <AlertDescription className="text-amber-800 mr-2">
            <strong>تنبيه:</strong> لا تملك حالياً صلاحيات المدير. إذا كنت أول مستخدم في النظام، يمكنك منح نفسك صلاحيات المدير.
          </AlertDescription>
        </Alert>

        {/* Self-Grant Admin Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl flex items-center">
              <Shield className="h-5 w-5 ml-2 text-blue-600" />
              منح نفسك صلاحيات المدير
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              إذا كنت أول مستخدم أو المدير الرئيسي للنظام، يمكنك منح نفسك صلاحيات المدير الكاملة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>معرفك الحالي:</strong>
                </p>
                <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                  {currentUserPrincipal}
                </p>
              </div>
              
              {/* Success/Error Messages */}
              {successMessage && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <AlertDescription className="text-green-800 mr-2">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}

              {errorMessage && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <AlertDescription className="text-red-800 mr-2">
                    {errorMessage}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleGrantSelfAdmin}
                disabled={assignRoleMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white min-h-[44px]"
              >
                {assignRoleMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin ml-2" />
                    جاري منح الصلاحية...
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5 ml-2" />
                    منح نفسي صلاحيات المدير
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Self-Grant User Card */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl flex items-center">
              <UserPlus className="h-5 w-5 ml-2 text-green-600" />
              منح نفسك صلاحية التعديل
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              إذا كنت تحتاج فقط إلى صلاحية تعديل البيانات ورفع الملفات دون إدارة المستخدمين
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Success/Error Messages */}
              {successMessage && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <AlertDescription className="text-green-800 mr-2">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}

              {errorMessage && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <AlertDescription className="text-red-800 mr-2">
                    {errorMessage}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleGrantSelfUser}
                disabled={assignRoleMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 text-white min-h-[44px]"
              >
                {assignRoleMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin ml-2" />
                    جاري منح الصلاحية...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 ml-2" />
                    منح نفسي صلاحية التعديل
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin interface
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
          <Shield className="h-7 w-7 ml-3 text-blue-600" />
          إدارة الصلاحيات
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          تعيين وإدارة أدوار المستخدمين الذين يمكنهم تعديل البيانات ورفع الملفات
        </p>
      </div>

      {/* Time Sync Warning */}
      <Alert className="border-blue-200 bg-blue-50">
        <Clock className="h-5 w-5 text-blue-600" />
        <AlertDescription className="text-blue-800 mr-2">
          <strong>ملاحظة:</strong> إذا واجهت أخطاء في التوقيت، تأكد من أن ساعة جهازك مضبوطة بشكل صحيح ومتزامنة مع الإنترنت.
        </AlertDescription>
      </Alert>

      {/* Role Permissions Reference */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center">
            <Info className="h-5 w-5 ml-2 text-purple-600" />
            الأدوار والصلاحيات
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            فهم الصلاحيات المرتبطة بكل دور قبل تعيينها للمستخدمين
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Admin Role */}
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-start">
                <Shield className="h-6 w-6 text-blue-600 ml-3 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">مدير (Admin)</h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="text-green-600 ml-2">✓</span>
                      <span>الوصول الكامل إلى النظام</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 ml-2">✓</span>
                      <span>تعيين وإدارة أدوار المستخدمين الآخرين</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 ml-2">✓</span>
                      <span>تعديل البيانات وحذفها</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 ml-2">✓</span>
                      <span>رفع وحذف الملفات (الصور والصوتيات)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 ml-2">✓</span>
                      <span>حفظ جميع البيانات بشكل شامل</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* User Role */}
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-start">
                <UserPlus className="h-6 w-6 text-green-600 ml-3 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">مستخدم مخول (User)</h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="text-green-600 ml-2">✓</span>
                      <span>تعديل البيانات وحذفها</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 ml-2">✓</span>
                      <span>رفع وحذف الملفات (الصور والصوتيات)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 ml-2">✓</span>
                      <span>إضافة بيانات جديدة للطيور</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 ml-2">✗</span>
                      <span>لا يمكن تعيين أدوار المستخدمين الآخرين</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 ml-2">✗</span>
                      <span>لا يمكن حفظ جميع البيانات بشكل شامل</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Guest Role */}
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-start">
                <AlertCircle className="h-6 w-6 text-gray-500 ml-3 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">ضيف (Guest)</h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="text-green-600 ml-2">✓</span>
                      <span>عرض البيانات فقط (قراءة فقط)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 ml-2">✗</span>
                      <span>لا يمكن تعديل أو حذف البيانات</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 ml-2">✗</span>
                      <span>لا يمكن رفع الملفات</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assign Role Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center">
            <UserPlus className="h-5 w-5 ml-2 text-blue-600" />
            تعيين دور لمستخدم
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            أدخل معرف المستخدم (Principal ID) واختر الدور المناسب
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Principal Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                معرف المستخدم (Principal ID)
              </label>
              <Input
                type="text"
                value={principalInput}
                onChange={(e) => setPrincipalInput(e.target.value)}
                placeholder="مثال: xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxx"
                className="w-full text-left font-mono text-sm"
                dir="ltr"
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اختر الدور
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedRole('admin' as UserRole)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedRole === 'admin'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <Shield className={`h-6 w-6 mx-auto mb-2 ${
                    selectedRole === 'admin' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <p className={`font-medium ${
                    selectedRole === 'admin' ? 'text-blue-900' : 'text-gray-700'
                  }`}>
                    مدير
                  </p>
                </button>

                <button
                  onClick={() => setSelectedRole('user' as UserRole)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedRole === 'user'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <UserPlus className={`h-6 w-6 mx-auto mb-2 ${
                    selectedRole === 'user' ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <p className={`font-medium ${
                    selectedRole === 'user' ? 'text-green-900' : 'text-gray-700'
                  }`}>
                    مستخدم مخول
                  </p>
                </button>

                <button
                  onClick={() => setSelectedRole('guest' as UserRole)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedRole === 'guest'
                      ? 'border-gray-600 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <AlertCircle className={`h-6 w-6 mx-auto mb-2 ${
                    selectedRole === 'guest' ? 'text-gray-600' : 'text-gray-400'
                  }`} />
                  <p className={`font-medium ${
                    selectedRole === 'guest' ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    ضيف
                  </p>
                </button>
              </div>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-800 mr-2">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            {errorMessage && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-red-800 mr-2">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Assign Button */}
            <Button
              onClick={handleAssignRole}
              disabled={assignRoleMutation.isPending || !principalInput.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white min-h-[44px]"
            >
              {assignRoleMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin ml-2" />
                  جاري تعيين الدور...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 ml-2" />
                  تعيين الدور
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current User Info */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center">
            <Info className="h-5 w-5 ml-2 text-gray-600" />
            معلومات المستخدم الحالي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-2">
              <strong>معرفك الحالي:</strong>
            </p>
            <p className="text-xs font-mono bg-white p-3 rounded border border-gray-200 break-all">
              {currentUserPrincipal}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              يمكنك مشاركة هذا المعرف مع المدير لمنحك الصلاحيات المناسبة
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
