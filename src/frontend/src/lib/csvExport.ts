/**
 * CSV Export Utility
 * Converts bird data to CSV format with proper Arabic text encoding
 */

import type { BirdData } from '../backend';

/**
 * Converts bird data array to CSV format with UTF-8 BOM for Excel compatibility
 * @param birdDataArray Array of bird data to export
 * @returns CSV string with UTF-8 BOM
 */
export function convertBirdDataToCSV(birdDataArray: BirdData[]): string {
  // UTF-8 BOM for Excel compatibility with Arabic text
  const BOM = '\uFEFF';
  
  // CSV Headers in Arabic
  const headers = [
    'المعرف',
    'الاسم العربي',
    'الاسم العلمي',
    'الاسم الإنجليزي',
    'الوصف',
    'الملاحظات',
    'المواقع',
    'ملف الصوت',
    'الصور الفرعية'
  ];
  
  // Create header row
  let csv = headers.join(',') + '\n';
  
  // Add data rows
  birdDataArray.forEach(bird => {
    const row = [
      bird.id.toString(),
      escapeCSVField(bird.arabicName),
      escapeCSVField(bird.scientificName),
      escapeCSVField(bird.englishName),
      escapeCSVField(bird.description),
      escapeCSVField(bird.notes),
      escapeCSVField(formatLocations(bird.locations)),
      escapeCSVField(bird.audioFile || ''),
      escapeCSVField(formatSubImages(bird.subImages))
    ];
    
    csv += row.join(',') + '\n';
  });
  
  return BOM + csv;
}

/**
 * Escapes a CSV field by wrapping it in quotes and escaping internal quotes
 * @param field Field value to escape
 * @returns Escaped field value
 */
function escapeCSVField(field: string): string {
  if (!field) return '""';
  
  // Replace double quotes with two double quotes (CSV standard)
  const escaped = field.replace(/"/g, '""');
  
  // Wrap in quotes
  return `"${escaped}"`;
}

/**
 * Formats location coordinates as a readable string
 * @param locations Array of coordinates
 * @returns Formatted location string
 */
function formatLocations(locations: Array<{ latitude: number; longitude: number }>): string {
  if (!locations || locations.length === 0) return '';
  
  return locations
    .map((loc, index) => `موقع ${index + 1}: (${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)})`)
    .join(' | ');
}

/**
 * Formats sub-images array as a readable string
 * @param subImages Array of image paths
 * @returns Formatted sub-images string
 */
function formatSubImages(subImages: string[]): string {
  if (!subImages || subImages.length === 0) return '';
  
  return subImages.join(' | ');
}

/**
 * Downloads CSV data as a file
 * @param csvContent CSV content string
 * @param filename Filename for the download
 */
export function downloadCSV(csvContent: string, filename: string = 'bird-data.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    // Create a link to the file
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  }
}

/**
 * Exports bird data to CSV file with timestamp
 * @param birdDataArray Array of bird data to export
 */
export function exportBirdDataToCSV(birdDataArray: BirdData[]): void {
  const csvContent = convertBirdDataToCSV(birdDataArray);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `bird-data-${timestamp}.csv`;
  
  downloadCSV(csvContent, filename);
}
