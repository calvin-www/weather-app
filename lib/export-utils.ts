import { WeatherRecord } from '@prisma/client';
import { parseISO, format } from 'date-fns';

export const validFormats = ['json', 'csv', 'xml'] as const;
export type ExportFormat = typeof validFormats[number];

type ExportFunction = (data: WeatherRecord[]) => string;

export type ExportFormats = Record<ExportFormat, ExportFunction>;

export const exportFormats: ExportFormats = {
  json: (data: WeatherRecord[]) => JSON.stringify(data, null, 2),
  
  csv: (data: WeatherRecord[]) => {
    // CSV headers
    const headers = [
      'ID', 'Location', 'Latitude', 'Longitude', 
      'Start Date', 'End Date', 'Min Temp', 'Max Temp', 
      'Description', 'Created At', 'Updated At'
    ];
    
    // Convert data to CSV rows
    const rows = data.map(record => [
      record.id,
      `"${record.location}"`,
      record.latitude,
      record.longitude,
      format(parseISO(record.startDate.toISOString()), 'yyyy-MM-dd'),
      format(parseISO(record.endDate.toISOString()), 'yyyy-MM-dd'),
      record.temperature_min,
      record.temperature_max,
      `"${record.description}"`,
      format(parseISO(record.createdAt.toISOString()), 'yyyy-MM-dd HH:mm:ss'),
      format(parseISO(record.updatedAt.toISOString()), 'yyyy-MM-dd HH:mm:ss')
    ]);
    
    return [headers, ...rows].map(e => e.join(',')).join('\n');
  },
  
  xml: (data: WeatherRecord[]) => {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n<weather_records>\n';
    const xmlFooter = '</weather_records>';
    
    const xmlRows = data.map(record => `
  <record>
    <id>${record.id}</id>
    <location>${record.location}</location>
    <latitude>${record.latitude}</latitude>
    <longitude>${record.longitude}</longitude>
    <start_date>${format(parseISO(record.startDate.toISOString()), 'yyyy-MM-dd')}</start_date>
    <end_date>${format(parseISO(record.endDate.toISOString()), 'yyyy-MM-dd')}</end_date>
    <temperature_min>${record.temperature_min}</temperature_min>
    <temperature_max>${record.temperature_max}</temperature_max>
    <description>${record.description}</description>
    <created_at>${format(parseISO(record.createdAt.toISOString()), 'yyyy-MM-dd HH:mm:ss')}</created_at>
    <updated_at>${format(parseISO(record.updatedAt.toISOString()), 'yyyy-MM-dd HH:mm:ss')}</updated_at>
  </record>
    `).join('\n');
    
    return xmlHeader + xmlRows + xmlFooter;
  }
};

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export type ExportMimeTypes = Record<ExportFormat, string>;

export const exportMimeTypes: ExportMimeTypes = {
  json: 'application/json',
  csv: 'text/csv',
  xml: 'application/xml'
};
