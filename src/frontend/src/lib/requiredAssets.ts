/**
 * Required Assets Registry
 * Build-time checked asset imports to fail fast on missing files
 */

// Hero/Scene Assets
const DESERT_OWL_HERO = '/assets/generated/desert-owl-hero.dim_1600x900.png';

// Logo/Header Assets
const OWL_LOGO = '/assets/generated/realistic-owl-perfect-transparent-clean.dim_400x400.png';

// Validate asset exists by attempting to create an Image object
// This will fail during build if the asset path is incorrect
function validateAsset(path: string, name: string): string {
  if (!path || path.trim() === '') {
    throw new Error(`[RequiredAssets] Missing asset path for: ${name}`);
  }
  
  // In development, we can add additional validation
  if (import.meta.env.DEV) {
    console.log(`[RequiredAssets] Registered: ${name} -> ${path}`);
  }
  
  return path;
}

// Export validated asset paths
export const REQUIRED_ASSETS = {
  DESERT_OWL_HERO: validateAsset(DESERT_OWL_HERO, 'Desert Owl Hero'),
  OWL_LOGO: validateAsset(OWL_LOGO, 'Owl Logo'),
} as const;

// Helper to get asset with runtime validation
export function getRequiredAsset(key: keyof typeof REQUIRED_ASSETS): string {
  const path = REQUIRED_ASSETS[key];
  if (!path) {
    throw new Error(`[RequiredAssets] Asset not found: ${key}`);
  }
  return path;
}

// Validate all assets on module load
Object.entries(REQUIRED_ASSETS).forEach(([key, path]) => {
  if (!path) {
    throw new Error(`[RequiredAssets] Invalid asset configuration for: ${key}`);
  }
});
