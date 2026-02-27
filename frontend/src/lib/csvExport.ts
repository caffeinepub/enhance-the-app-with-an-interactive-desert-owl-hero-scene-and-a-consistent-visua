import { BirdData, LocationEntry } from '../backend';

function escapeCSVField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatLocations(locations: LocationEntry[]): string {
  if (!locations || locations.length === 0) return '';
  return locations
    .map(loc => {
      const parts: string[] = [];
      if (loc.location) parts.push(loc.location);
      if (loc.governorate) parts.push(loc.governorate);
      if (loc.mountainName) parts.push(loc.mountainName);
      if (loc.valleyName) parts.push(loc.valleyName);
      if (loc.coordinate) {
        parts.push(`(${loc.coordinate.latitude.toFixed(4)}, ${loc.coordinate.longitude.toFixed(4)})`);
      }
      return parts.join(' - ');
    })
    .join(' | ');
}

function formatCoordinates(locations: LocationEntry[]): string {
  if (!locations || locations.length === 0) return '';
  return locations
    .map(loc =>
      loc.coordinate
        ? `${loc.coordinate.latitude.toFixed(4)},${loc.coordinate.longitude.toFixed(4)}`
        : ''
    )
    .filter(Boolean)
    .join(' | ');
}

export function exportBirdDataToCSV(birds: BirdData[]): void {
  const BOM = '\uFEFF';
  const headers = [
    'الاسم العربي',
    'الاسم العلمي',
    'الاسم الإنجليزي',
    'الاسم المحلي',
    'الوصف',
    'ملاحظات',
    'المواقع',
    'الإحداثيات',
    'عدد المواقع',
    'الصور الفرعية',
    'ملف الصوت',
  ];

  const rows = birds.map(bird => [
    escapeCSVField(bird.arabicName || ''),
    escapeCSVField(bird.scientificName || ''),
    escapeCSVField(bird.englishName || ''),
    escapeCSVField(bird.localName || ''),
    escapeCSVField(bird.description || ''),
    escapeCSVField(bird.notes || ''),
    escapeCSVField(formatLocations(bird.locations || [])),
    escapeCSVField(formatCoordinates(bird.locations || [])),
    escapeCSVField(String(bird.locations?.length || 0)),
    escapeCSVField((bird.subImages || []).join(' | ')),
    escapeCSVField(bird.audioFile || ''),
  ]);

  const csvContent =
    BOM +
    [headers.map(escapeCSVField).join(','), ...rows.map(row => row.join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bird-data-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
