import { useEffect, useState } from 'react';

export default function MemoryRecoveryNotification() {
  const [show, setShow] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const recovered = sessionStorage.getItem('memoryRecovery');
    if (recovered) {
      sessionStorage.removeItem('memoryRecovery');
      setShow(true);
      setCountdown(5);
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    if (countdown <= 0) {
      setShow(false);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [show, countdown]);

  if (!show) return null;

  return (
    <div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-amber-100 border border-amber-400 text-amber-900 px-6 py-3 rounded-xl shadow-lg text-sm font-medium"
      dir="rtl"
    >
      <p>تم إعادة تحميل الواجهة لتفادي مشكلة الذاكرة، يرجى الانتظار لحظات…</p>
      <p className="text-xs text-amber-700 mt-1 text-center">سيتم إغلاق هذا الإشعار خلال {countdown} ثوانٍ</p>
    </div>
  );
}
