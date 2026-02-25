import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MemoryRecoveryNotificationProps {
  show: boolean;
  onDismiss?: () => void;
}

export default function MemoryRecoveryNotification({ show, onDismiss }: MemoryRecoveryNotificationProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!show) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onDismiss?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [show, onDismiss]);

  if (!show) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-full px-4 animate-in slide-in-from-top duration-300">
      <Alert className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-400 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="bg-blue-500 rounded-full p-2 animate-pulse">
            <RefreshCw className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <AlertDescription className="text-blue-900 font-bold text-base" dir="rtl">
              تم إعادة تحميل الواجهة لتفادي مشكلة الذاكرة، يرجى الانتظار لحظات…
            </AlertDescription>
            <p className="text-blue-700 text-sm mt-2" dir="rtl">
              سيتم إغلاق هذه الرسالة تلقائياً خلال {countdown} ثوانٍ
            </p>
          </div>
        </div>
      </Alert>
    </div>
  );
}
