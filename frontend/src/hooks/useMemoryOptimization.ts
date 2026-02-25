import { useEffect, useCallback, useState } from 'react';

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

declare global {
  interface Performance {
    memory?: MemoryInfo;
  }
}

const WARNING_THRESHOLD = 0.50;
const CRITICAL_THRESHOLD = 0.65;
const CHECK_INTERVAL = 5000;
const MIN_RECOVERY_INTERVAL = 20000;

export function useMemoryOptimization() {
  const [memoryUsage, setMemoryUsage] = useState<number>(0);
  const [showNotification, setShowNotification] = useState(false);
  const lastRecoveryRef = { current: 0 };

  const getMemoryUsage = useCallback((): number => {
    if (!performance.memory) return 0;
    return performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
  }, []);

  const formatMemoryUsage = useCallback((): string => {
    if (!performance.memory) return 'غير متاح';
    const used = performance.memory.usedJSHeapSize / (1024 * 1024);
    const total = performance.memory.jsHeapSizeLimit / (1024 * 1024);
    return `${used.toFixed(1)} MB / ${total.toFixed(1)} MB`;
  }, []);

  const triggerRecovery = useCallback(() => {
    const now = Date.now();
    if (now - lastRecoveryRef.current < MIN_RECOVERY_INTERVAL) return;
    lastRecoveryRef.current = now;

    // Clear session storage caches
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('cache_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => sessionStorage.removeItem(key));
    } catch {}

    sessionStorage.setItem('memoryRecovery', 'true');
    window.location.reload();
  }, []);

  useEffect(() => {
    if (!performance.memory) return;

    const interval = setInterval(() => {
      const usage = getMemoryUsage();
      setMemoryUsage(usage);

      if (usage >= CRITICAL_THRESHOLD) {
        triggerRecovery();
      } else if (usage >= WARNING_THRESHOLD) {
        setShowNotification(true);
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [getMemoryUsage, triggerRecovery]);

  return {
    memoryUsage,
    showNotification,
    formatMemoryUsage,
    triggerRecovery,
  };
}
