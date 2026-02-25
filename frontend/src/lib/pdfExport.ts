/**
 * PDF Export Utility
 * Converts bird data to HTML format for printing/PDF export
 * Uses native browser APIs without external dependencies
 */

import type { BirdData } from '../backend';

/**
 * Exports bird data to printable HTML format that can be saved as PDF
 * @param birdDataArray Array of bird data to export
 */
export function exportBirdsToPDF(birdDataArray: BirdData[]): void {
  // Generate HTML content
  const html = generatePrintableHTML(birdDataArray);
  
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    throw new Error('فشل فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.');
  }
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for content to load, then trigger print dialog
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
}

/**
 * Generates printable HTML content with proper styling
 * @param birdDataArray Array of bird data
 * @returns HTML string
 */
function generatePrintableHTML(birdDataArray: BirdData[]): string {
  const dateStr = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const tableRows = birdDataArray.map(bird => `
    <tr>
      <td>${escapeHTML(bird.arabicName || '')}</td>
      <td>${escapeHTML(bird.englishName || '')}</td>
      <td>${escapeHTML(bird.scientificName || '')}</td>
      <td>${escapeHTML((bird.description || '').substring(0, 100))}${bird.description && bird.description.length > 100 ? '...' : ''}</td>
      <td>${escapeHTML((bird.notes || '').substring(0, 100))}${bird.notes && bird.notes.length > 100 ? '...' : ''}</td>
      <td>${bird.locations?.length || 0}</td>
      <td>${bird.subImages?.length || 0}</td>
      <td>${bird.audioFile ? 'نعم' : 'لا'}</td>
    </tr>
  `).join('');
  
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>تقرير بيانات الطيور</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 20mm;
          background: white;
          color: #333;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #2980b9;
        }
        
        .header h1 {
          font-size: 28px;
          color: #2c3e50;
          margin-bottom: 10px;
        }
        
        .header .date {
          font-size: 14px;
          color: #7f8c8d;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 11px;
        }
        
        th, td {
          border: 1px solid #bdc3c7;
          padding: 8px;
          text-align: right;
        }
        
        th {
          background-color: #2980b9;
          color: white;
          font-weight: bold;
          text-align: center;
        }
        
        tr:nth-child(even) {
          background-color: #f5f5f5;
        }
        
        tr:hover {
          background-color: #e8f4f8;
        }
        
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #7f8c8d;
          padding-top: 20px;
          border-top: 1px solid #ecf0f1;
        }
        
        @media print {
          body {
            padding: 10mm;
          }
          
          .no-print {
            display: none;
          }
          
          table {
            page-break-inside: auto;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          thead {
            display: table-header-group;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>تقرير بيانات الطيور</h1>
        <div class="date">تاريخ التقرير: ${dateStr}</div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>الاسم العربي</th>
            <th>الاسم الإنجليزي</th>
            <th>الاسم العلمي</th>
            <th>الوصف</th>
            <th>الملاحظات</th>
            <th>المواقع</th>
            <th>الصور</th>
            <th>صوت</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      <div class="footer">
        <p>عدد السجلات: ${birdDataArray.length}</p>
        <p>تم إنشاء هذا التقرير بواسطة نظام إدارة بيانات الطيور - محافظة البريمي</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Escapes HTML special characters
 * @param text Text to escape
 * @returns Escaped text
 */
function escapeHTML(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
