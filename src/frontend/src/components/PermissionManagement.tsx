import { useState } from 'react';
import { useIsAppManager, useAssignCallerUserRole } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { UserPlus, Shield, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';
import { Principal } from '@icp-sdk/core/principal';
import { UserRole } from '../backend';

export default function PermissionManagement() {
  const { identity } = useInternetIdentity();
  const { data: isAppManager, isLoading: loadingAppManager } = useIsAppManager();
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
    } catch (error: any) {
      console.error('Error assigning role:', error);
      setErrorMessage(error.message || 'حدث خطأ أثناء تعيين الدور');
    }
  };

  const handleGrantSelfAccess = async () => {
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
    } catch (error: any) {
      console.error('Error granting self access:', error);
      setErrorMessage(error.message || 'حدث خطأ أثناء منح الصلاحية');
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

  // Access denied for non-App Manager users
  if (!isAppManager) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6" dir="rtl">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800 mr-2">
            <strong>غير مصرح:</strong> هذه الصفحة متاحة فقط لمديري الموقع. يمكن لمديري الموقع فقط تعيين أدوار المستخدمين.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-3">
          <Shield className="h-10 w-10 text-blue-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">إدارة الصلاحيات</h1>
        <p className="text-sm sm:text-base text-gray-600">
          تعيين وإدارة أدوار المستخدمين الذين يمكنهم تعديل البيانات ورفع الملفات
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

      {/* Self-Assignment Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center">
            <UserPlus className="h-5 w-5 ml-2 text-blue-600" />
            منح نفسك صلاحية التعديل
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            كمدير للموقع، يمكنك منح نفسك صلاحية التعديل لتعديل البيانات ورفع الملفات
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
            <Button
              onClick={handleGrantSelfAccess}
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
                  <UserPlus className="h-5 w-5 ml-2" />
                  امنحني صلاحية التعديل
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assign Role to User Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center">
            <UserPlus className="h-5 w-5 ml-2 text-green-600" />
            تعيين دور لمستخدم
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            أدخل معرف المستخدم (Principal ID) واختر الدور المناسب
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label htmlFor="principal-input" className="block text-sm font-medium text-gray-700 mb-2">
                معرف المستخدم (Principal ID)
              </label>
              <Input
                id="principal-input"
                type="text"
                value={principalInput}
                onChange={(e) => setPrincipalInput(e.target.value)}
                placeholder="مثال: xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxx"
                className="w-full font-mono text-sm"
                dir="ltr"
              />
              <p className="text-xs text-gray-500 mt-1">
                يمكن للمستخدمين العثور على معرفهم عن طريق تسجيل الدخول والتحقق من إعدادات حسابهم
              </p>
            </div>

            <div>
              <label htmlFor="role-select" className="block text-sm font-medium text-gray-700 mb-2">
                الدور
              </label>
              <select
                id="role-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">مستخدم مخول (يمكنه التعديل)</option>
                <option value="admin">مدير (صلاحيات كاملة)</option>
                <option value="guest">ضيف (عرض فقط)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {selectedRole === 'admin' && 'المدير لديه صلاحيات كاملة بما في ذلك تعيين الأدوار'}
                {selectedRole === 'user' && 'المستخدم المخول يمكنه إضافة وتعديل وحذف البيانات'}
                {selectedRole === 'guest' && 'الضيف يمكنه عرض البيانات فقط دون التعديل'}
              </p>
            </div>

            <Button
              onClick={handleAssignRole}
              disabled={assignRoleMutation.isPending || !principalInput.trim()}
              className="w-full bg-green-600 hover:bg-green-700 text-white min-h-[44px]"
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

      {/* Information Card */}
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center">
            <Info className="h-5 w-5 ml-2 text-gray-600" />
            معلومات مهمة عن الأدوار
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Shield className="h-4 w-4 ml-2 text-blue-600" />
                مدير (Admin)
              </h3>
              <ul className="space-y-1 text-sm text-gray-700 mr-6">
                <li className="flex items-start">
                  <span className="text-blue-600 ml-2">•</span>
                  <span>صلاحيات كاملة لإدارة التطبيق</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 ml-2">•</span>
                  <span>يمكنه تعيين وإلغاء أدوار المستخدمين</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 ml-2">•</span>
                  <span>يمكنه إضافة وتعديل وحذف جميع البيانات</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <UserPlus className="h-4 w-4 ml-2 text-green-600" />
                مستخدم مخول (User)
              </h3>
              <ul className="space-y-1 text-sm text-gray-700 mr-6">
                <li className="flex items-start">
                  <span className="text-green-600 ml-2">•</span>
                  <span>يمكنه إضافة وتعديل وحذف بيانات الطيور</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 ml-2">•</span>
                  <span>يمكنه رفع الصور والملفات الصوتية</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 ml-2">•</span>
                  <span>لا يمكنه تعيين أدوار المستخدمين</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <AlertCircle className="h-4 w-4 ml-2 text-gray-600" />
                ضيف (Guest)
              </h3>
              <ul className="space-y-1 text-sm text-gray-700 mr-6">
                <li className="flex items-start">
                  <span className="text-gray-600 ml-2">•</span>
                  <span>يمكنه عرض البيانات فقط</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-600 ml-2">•</span>
                  <span>لا يمكنه التعديل أو رفع الملفات</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-600 ml-2">•</span>
                  <span>الدور الافتراضي للمستخدمين الجدد</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
