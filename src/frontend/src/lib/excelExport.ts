/**
 * Excel Export Utility
 * Converts bird data to CSV format (Excel-compatible) with proper Arabic text encoding
 * Uses native browser APIs without external dependencies
 */

import type { BirdData } from '../backend';

/**
 * Exports bird data to CSV format (.csv) that can be opened in Excel
 * @param birdDataArray Array of bird data to export
 */
export function exportBirdsToExcel(birdDataArray: BirdData[]): void {
  // UTF-8 BOM for Excel compatibility with Arabic text
  const BOM = '\uFEFF';
  
  // CSV Headers in Arabic
  const headers = [
    'الاسم العربي',
    'الاسم الإنجليزي',
    'الاسم العلمي',
    'الوصف',
    'الملاحظات',
    'عدد المواقع',
    'عدد الصور',
    'يوجد صوت'
  ];
  
  // Create header row
  let csv = headers.join(',') + '\n';
  
  // Add data rows
  birdDataArray.forEach(bird => {
    const row = [
      escapeCSVField(bird.arabicName || ''),
      escapeCSVField(bird.englishName || ''),
      escapeCSVField(bird.scientificName || ''),
      escapeCSVField(bird.description || ''),
      escapeCSVField(bird.notes || ''),
      (bird.locations?.length || 0).toString(),
      (bird.subImages?.length || 0).toString(),
      bird.audioFile ? 'نعم' : 'لا'
    ];
    
    csv += row.join(',') + '\n';
  });
  
  // Create blob and download
  const csvContent = BOM + csv;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `birds_export_${timestamp}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
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
