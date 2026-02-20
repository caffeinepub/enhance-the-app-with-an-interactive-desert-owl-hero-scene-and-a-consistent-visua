/**
 * Memory Management System
 * Provides automatic memory monitoring, optimization, and recovery mechanisms
 * OPTIMIZED: Lower thresholds for earlier recovery before browser crashes
 */

interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercentage: number;
}

interface MemoryManagerConfig {
  warningThreshold: number; // Percentage (e.g., 50)
  criticalThreshold: number; // Percentage (e.g., 65)
  checkInterval: number; // Milliseconds
  autoRecovery: boolean;
  onWarning?: (stats: MemoryStats) => void;
  onCritical?: (stats: MemoryStats) => void;
  onRecovery?: () => void;
}

class MemoryManager {
  private config: MemoryManagerConfig;
  private intervalId: number | null = null;
  private isRecovering = false;
  private recoveryCallbacks: Set<() => void> = new Set();
  private lastRecoveryTime = 0;
  private readonly MIN_RECOVERY_INTERVAL = 20000; // Reduced to 20 seconds for faster recovery

  constructor(config: Partial<MemoryManagerConfig> = {}) {
    this.config = {
      // CRITICAL FIX: Reduced thresholds to trigger recovery earlier
      warningThreshold: 50, // Reduced from 70% to 50%
      criticalThreshold: 65, // Reduced from 85% to 65%
      checkInterval: 5000, // Reduced from 10s to 5s for more frequent checks
      autoRecovery: true,
      ...config,
    };
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats(): MemoryStats | null {
    try {
      if ('memory' in performance && (performance as any).memory) {
        const memory = (performance as any).memory;
        const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        
        return {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usagePercentage,
        };
      }
    } catch (error) {
      console.error('[MemoryManager] Error getting memory stats:', error);
    }
    return null;
  }

  /**
   * Start monitoring memory usage
   */
  startMonitoring(): void {
    if (this.intervalId !== null) {
      return; // Already monitoring
    }

    this.intervalId = window.setInterval(() => {
      this.checkMemory();
    }, this.config.checkInterval);

    console.log('[MemoryManager] Started monitoring with reduced thresholds');
  }

  /**
   * Stop monitoring memory usage
   */
  stopMonitoring(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[MemoryManager] Stopped monitoring');
    }
  }

  /**
   * Check current memory usage and trigger actions if needed
   */
  private checkMemory(): void {
    const stats = this.getMemoryStats();
    if (!stats) return;

    const { usagePercentage } = stats;

    if (usagePercentage >= this.config.criticalThreshold) {
      console.warn('[MemoryManager] CRITICAL memory usage:', usagePercentage.toFixed(2) + '%');
      this.config.onCritical?.(stats);
      
      // Check if enough time has passed since last recovery
      const now = Date.now();
      const timeSinceLastRecovery = now - this.lastRecoveryTime;
      
      if (this.config.autoRecovery && !this.isRecovering && timeSinceLastRecovery >= this.MIN_RECOVERY_INTERVAL) {
        this.triggerRecovery();
      }
    } else if (usagePercentage >= this.config.warningThreshold) {
      console.warn('[MemoryManager] Warning: High memory usage:', usagePercentage.toFixed(2) + '%');
      this.config.onWarning?.(stats);
    }
  }

  /**
   * Trigger automatic memory recovery
   */
  private async triggerRecovery(): Promise<void> {
    if (this.isRecovering) return;

    this.isRecovering = true;
    this.lastRecoveryTime = Date.now();
    console.log('[MemoryManager] Triggering automatic recovery...');

    try {
      // Notify all registered recovery callbacks
      this.recoveryCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('[MemoryManager] Recovery callback error:', error);
        }
      });

      // Clear caches aggressively
      this.clearCaches();

      // Force garbage collection if available (Chrome DevTools)
      if ('gc' in window && typeof (window as any).gc === 'function') {
        try {
          (window as any).gc();
        } catch (e) {
          console.error('[MemoryManager] GC error:', e);
        }
      }

      // Wait a bit for recovery to take effect
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.config.onRecovery?.();
      console.log('[MemoryManager] Recovery completed');
    } catch (error) {
      console.error('[MemoryManager] Recovery failed:', error);
    } finally {
      this.isRecovering = false;
    }
  }

  /**
   * Register a callback to be called during recovery
   */
  onRecovery(callback: () => void): () => void {
    this.recoveryCallbacks.add(callback);
    return () => this.recoveryCallbacks.delete(callback);
  }

  /**
   * Clear browser caches aggressively
   */
  private clearCaches(): void {
    try {
      // Clear session storage temp items
      if (typeof sessionStorage !== 'undefined') {
        try {
          sessionStorage.removeItem('tempImageCache');
          sessionStorage.removeItem('temp3DCache');
          sessionStorage.removeItem('tempMapCache');
        } catch (e) {
          console.error('[MemoryManager] Session storage clear error:', e);
        }
      }

      // Request browser to clear caches if supported
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name.includes('temp') || name.includes('cache')) {
              caches.delete(name).catch(e => {
                console.error('[MemoryManager] Cache delete error:', e);
              });
            }
          });
        }).catch(e => {
          console.error('[MemoryManager] Cache keys error:', e);
        });
      }
    } catch (error) {
      console.error('[MemoryManager] Cache clearing error:', error);
    }
  }

  /**
   * Force immediate memory check and recovery if needed
   */
  forceCheck(): void {
    this.checkMemory();
  }

  /**
   * Get formatted memory usage string
   */
  getFormattedMemoryUsage(): string {
    const stats = this.getMemoryStats();
    if (!stats) return 'Memory stats unavailable';

    const usedMB = (stats.usedJSHeapSize / 1024 / 1024).toFixed(2);
    const limitMB = (stats.jsHeapSizeLimit / 1024 / 1024).toFixed(2);
    
    return `${usedMB} MB / ${limitMB} MB (${stats.usagePercentage.toFixed(1)}%)`;
  }
}

// Singleton instance
let memoryManagerInstance: MemoryManager | null = null;

export function getMemoryManager(config?: Partial<MemoryManagerConfig>): MemoryManager {
  if (!memoryManagerInstance) {
    memoryManagerInstance = new MemoryManager(config);
  }
  return memoryManagerInstance;
}

export { MemoryManager };
export type { MemoryStats, MemoryManagerConfig };
