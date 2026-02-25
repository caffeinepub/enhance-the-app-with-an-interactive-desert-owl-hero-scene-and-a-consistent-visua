import { useEffect, useState, useCallback, useRef } from 'react';
import { getMemoryManager, MemoryStats } from '../lib/memoryManager';
import { toast } from 'sonner';

interface UseMemoryOptimizationOptions {
  enableMonitoring?: boolean;
  enableAutoRecovery?: boolean;
  showNotifications?: boolean;
}

export function useMemoryOptimization(options: UseMemoryOptimizationOptions = {}) {
  const {
    enableMonitoring = true,
    enableAutoRecovery = true,
    showNotifications = true,
  } = options;

  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [showRecoveryNotification, setShowRecoveryNotification] = useState(false);
  
  // Use refs to prevent infinite loops
  const managerRef = useRef<ReturnType<typeof getMemoryManager> | null>(null);
  const isInitializedRef = useRef(false);
  const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize manager only once with optimized thresholds
  useEffect(() => {
    if (!isInitializedRef.current) {
      managerRef.current = getMemoryManager({
        autoRecovery: enableAutoRecovery,
        warningThreshold: 50, // Reduced from 70%
        criticalThreshold: 65, // Reduced from 85%
        checkInterval: 5000, // Check every 5 seconds
        onWarning: (stats) => {
          setMemoryStats(stats);
          if (showNotifications) {
            console.warn('[Memory] Warning threshold reached:', stats.usagePercentage.toFixed(2) + '%');
          }
        },
        onCritical: (stats) => {
          setMemoryStats(stats);
          if (showNotifications) {
            console.error('[Memory] Critical threshold reached:', stats.usagePercentage.toFixed(2) + '%');
          }
        },
        onRecovery: () => {
          setIsRecovering(false);
          setShowRecoveryNotification(true);
          
          if (showNotifications) {
            toast.success('✅ تم تحسين استخدام الذاكرة', {
              description: 'تم تحرير الموارد بنجاح',
              duration: 3000,
            });
          }

          // Auto-hide notification after 5 seconds
          if (recoveryTimeoutRef.current) {
            clearTimeout(recoveryTimeoutRef.current);
          }
          recoveryTimeoutRef.current = setTimeout(() => {
            setShowRecoveryNotification(false);
          }, 5000);
        },
      });
      isInitializedRef.current = true;
    }
  }, []); // Empty deps - only run once

  // Start/stop monitoring based on enableMonitoring flag
  useEffect(() => {
    const manager = managerRef.current;
    if (!manager) return;

    if (enableMonitoring) {
      manager.startMonitoring();
      
      // Update stats immediately
      const stats = manager.getMemoryStats();
      setMemoryStats(stats);
    } else {
      manager.stopMonitoring();
    }

    return () => {
      if (enableMonitoring) {
        manager.stopMonitoring();
      }
    };
  }, [enableMonitoring]);

  // Register recovery callback
  useEffect(() => {
    const manager = managerRef.current;
    if (!manager) return;

    const unregister = manager.onRecovery(() => {
      setIsRecovering(true);
      
      // Clear any large data structures
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('tempImageCache');
          sessionStorage.removeItem('temp3DCache');
          sessionStorage.removeItem('tempMapCache');
        } catch (e) {
          console.error('[Memory] Cache clear error:', e);
        }
      }
    });

    return unregister;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current);
      }
    };
  }, []);

  const forceRecovery = useCallback(() => {
    const manager = managerRef.current;
    if (manager) {
      manager.forceCheck();
    }
  }, []);

  const getFormattedUsage = useCallback(() => {
    const manager = managerRef.current;
    return manager ? manager.getFormattedMemoryUsage() : 'N/A';
  }, []);

  return {
    memoryStats,
    isRecovering,
    showRecoveryNotification,
    setShowRecoveryNotification,
    forceRecovery,
    getFormattedUsage,
  };
}
