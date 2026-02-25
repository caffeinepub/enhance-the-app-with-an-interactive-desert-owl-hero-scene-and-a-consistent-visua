/**
 * WebGL Detection Utility
 * Detects WebGL support and provides fallback logic for mobile devices
 */

export interface WebGLSupport {
  supported: boolean;
  version: number | null;
  isMobile: boolean;
  shouldUseFallback: boolean;
}

/**
 * Detect if device is mobile
 */
export function isMobileDevice(): boolean {
  // Check user agent
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  // Check touch support
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Check screen size
  const isSmallScreen = window.innerWidth <= 768;
  
  return mobileRegex.test(userAgent) || (hasTouch && isSmallScreen);
}

/**
 * Detect WebGL support
 */
export function detectWebGL(): WebGLSupport {
  const isMobile = isMobileDevice();
  
  try {
    const canvas = document.createElement('canvas');
    
    // Try WebGL 2
    let gl: WebGL2RenderingContext | WebGLRenderingContext | null = canvas.getContext('webgl2');
    if (gl && gl instanceof WebGL2RenderingContext) {
      return {
        supported: true,
        version: 2,
        isMobile,
        shouldUseFallback: isMobile, // Use fallback on mobile even if WebGL is supported
      };
    }
    
    // Try WebGL 1
    gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
    if (!gl) {
      gl = canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    }
    
    if (gl && gl instanceof WebGLRenderingContext) {
      return {
        supported: true,
        version: 1,
        isMobile,
        shouldUseFallback: isMobile, // Use fallback on mobile even if WebGL is supported
      };
    }
    
    // No WebGL support
    return {
      supported: false,
      version: null,
      isMobile,
      shouldUseFallback: true,
    };
  } catch (e) {
    console.warn('WebGL detection failed:', e);
    return {
      supported: false,
      version: null,
      isMobile,
      shouldUseFallback: true,
    };
  }
}

/**
 * Check if WebGL context is available
 */
export function isWebGLAvailable(): boolean {
  const support = detectWebGL();
  return support.supported && !support.shouldUseFallback;
}

/**
 * Normalize bird name for consistent matching
 * Removes extra spaces, dashes, and special characters
 */
export function normalizeBirdName(name: string): string {
  if (!name) return '';
  
  // Trim whitespace
  let normalized = name.trim();
  
  // Remove Arabic tatweel character (ـ)
  normalized = normalized.replace(/\u0640/g, '');
  
  // Remove all spaces
  normalized = normalized.replace(/\s+/g, '');
  
  // Remove dashes
  normalized = normalized.replace(/-/g, '');
  
  // Remove "sub" suffix if present
  if (normalized.toLowerCase().endsWith('sub')) {
    normalized = normalized.slice(0, -3);
  }
  
  return normalized;
}

/**
 * Compare two bird names after normalization
 */
export function areBirdNamesEqual(name1: string, name2: string): boolean {
  return normalizeBirdName(name1) === normalizeBirdName(name2);
}
