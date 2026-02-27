import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Home, Shield, UserPlus, RefreshCw } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useAssignCallerUserRole } from '../hooks/useQueries';
import { UserRole } from '../backend';

const ADMIN_PRINCIPAL = '5uylz-j7fcd-isj73-gp57f-xwwyy-po2ib-7iboa-fdkdv-nrsam-3bd3r-qqe';

export default function PermissionManagement() {
  const navigate = useNavigate();
  const { identity, isInitializing } = useInternetIdentity();
  const { mutateAsync: assignRole, isPending: isAssigning } = useAssignCallerUserRole();

  const [targetPrincipal, setTargetPrincipal] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.user);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isAdminChecking, setIsAdminChecking] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);

  const isAuthenticated = !!identity;
  const currentPrincipal = identity?.getPrincipal().toString();

  useEffect(() => {
    // While identity is still initializing, keep checking state true
    if (isInitializing) {
      setIsAdminChecking(true);
      return;
    }
    // Once initialization is done, evaluate the principal
    setIsAdminChecking(true);
    if (identity) {
      const principalStr = identity.getPrincipal().toString();
      setIsAdminUser(principalStr === ADMIN_PRINCIPAL);
    } else {
      setIsAdminUser(false);
    }
    setIsAdminChecking(false);
  }, [identity, isInitializing]);

  const handleAssignRole = async () => {
    if (!targetPrincipal.trim()) {
      setMessage({ type: 'error', text: 'يرجى إدخال معرف المستخدم' });
      return;
    }
    try {
      await assignRole({ user: targetPrincipal.trim(), role: selectedRole });
      setMessage({ type: 'success', text: 'تم تعيين الدور بنجاح' });
      setTargetPrincipal('');
    } catch (err) {
      setMessage({ type: 'error', text: 'فشل تعيين الدور. تأكد من صحة المعرف.' });
    }
  };

  // Still checking identity / initializing — show loading
  if (isAdminChecking || isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-foreground/60 font-arabic">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-foreground font-arabic mb-3">تسجيل الدخول مطلوب</h2>
          <p className="text-foreground/60 font-arabic mb-6">يجب تسجيل الدخول للوصول إلى إدارة الصلاحيات</p>
          <button
            onClick={() => navigate({ to: '/' })}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-arabic font-semibold hover:bg-primary/90 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>العودة إلى الرئيسية</span>
          </button>
        </div>
      </div>
    );
  }

  // Not admin
  if (!isAdminUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-foreground font-arabic mb-3">غير مصرح</h2>
          <p className="text-foreground/60 font-arabic mb-6">هذه الصفحة متاحة للمسؤولين فقط</p>
          <button
            onClick={() => navigate({ to: '/' })}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-arabic font-semibold hover:bg-primary/90 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>العودة إلى الرئيسية</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate({ to: '/' })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors font-arabic text-sm"
          >
            <Home className="w-4 h-4" />
            <span>الرئيسية</span>
          </button>
          <h1 className="text-xl font-bold text-foreground font-arabic flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span>إدارة الصلاحيات</span>
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <>
          {/* Current User Info */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-foreground font-arabic mb-3">معلومات المسؤول</h2>
            <div className="text-sm text-foreground/70 font-arabic space-y-2">
              <p>المعرف: <span className="font-mono text-xs text-foreground/50 break-all">{currentPrincipal}</span></p>
              <p>الدور: <span className="text-primary font-semibold">مسؤول</span></p>
            </div>
          </div>

          {/* Assign Role Form */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-foreground font-arabic mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              <span>تعيين دور لمستخدم</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-arabic text-foreground/70 mb-2">
                  معرف المستخدم (Principal ID)
                </label>
                <input
                  type="text"
                  value={targetPrincipal}
                  onChange={(e) => setTargetPrincipal(e.target.value)}
                  placeholder="أدخل معرف المستخدم..."
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-arabic text-foreground/70 mb-2">الدور</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value={UserRole.admin}>مسؤول (Admin)</option>
                  <option value={UserRole.user}>مستخدم (User)</option>
                  <option value={UserRole.guest}>ضيف (Guest)</option>
                </select>
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-sm font-arabic ${
                  message.type === 'success'
                    ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                    : 'bg-destructive/10 text-destructive border border-destructive/20'
                }`}>
                  {message.text}
                </div>
              )}

              <button
                onClick={handleAssignRole}
                disabled={isAssigning || !targetPrincipal.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-arabic font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isAssigning ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>{isAssigning ? 'جاري التعيين...' : 'تعيين الدور'}</span>
              </button>
            </div>
          </div>

          {/* Return to Home */}
          <div className="text-center mt-8">
            <button
              onClick={() => navigate({ to: '/' })}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-arabic font-semibold hover:bg-primary/90 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>العودة إلى الرئيسية</span>
            </button>
          </div>
        </>
      </div>
    </div>
  );
}
