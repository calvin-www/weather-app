import { WeatherRecord } from '@prisma/client';
import { format } from 'date-fns';

export const validFormats = ['json', 'csv', 'xml'] as const;
export type ExportFormat = (typeof validFormats)[number];

type ExportFunction = (data: WeatherRecord[]) => string;

export type ExportFormats = Record<ExportFormat, ExportFunction>;

interface WeatherData {
  current: {
    temp_min: number;
    temp_max: number;
    description: string;
  };
}

export const exportFormats: ExportFormats = {
  json: (data: WeatherRecord[]) => JSON.stringify(data, null, 2),

  csv: (data: WeatherRecord[]) => {
    // CSV headers
    const headers = [
      'ID',
      'Location',
      'Latitude',
      'Longitude',
      'Start Date',
      'End Date',
      'Weather Data',
      'Created At',
      'Updated At',
    ];

    // Convert data to CSV rows
    const rows = data.map((record) => {
      const weatherData = record.weatherData
        ? (JSON.parse(record.weatherData) as WeatherData)
        : null;

      return [
        record.id,
        `"${record.location}"`,
        record.latitude,
        record.longitude,
        format(record.startDate, 'yyyy-MM-dd'),
        format(record.endDate, 'yyyy-MM-dd'),
        `"${record.weatherData || ''}"`,
        format(record.createdAt, 'yyyy-MM-dd HH:mm:ss'),
        format(record.updatedAt, 'yyyy-MM-dd HH:mm:ss'),
      ];
    });

    return [headers, ...rows].map((e) => e.join(',')).join('\n');
  },

  xml: (data: WeatherRecord[]) => {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n<weather_records>\n';
    const xmlFooter = '</weather_records>';

    const xmlRows = data
      .map((record) => {
        const weatherData = record.weatherData
          ? (JSON.parse(record.weatherData) as WeatherData)
          : null;

        return `
  <record>
    <id>${record.id}</id>
    <location>${record.location}</location>
    <latitude>${record.latitude}</latitude>
    <longitude>${record.longitude}</longitude>
    <start_date>${format(record.startDate, 'yyyy-MM-dd')}</start_date>
    <end_date>${format(record.endDate, 'yyyy-MM-dd')}</end_date>
    <weather_data>${record.weatherData ? `<![CDATA[${record.weatherData}]]>` : ''}</weather_data>
    <created_at>${format(record.createdAt, 'yyyy-MM-dd HH:mm:ss')}</created_at>
    <updated_at>${format(record.updatedAt, 'yyyy-MM-dd HH:mm:ss')}</updated_at>
  </record>`;
      })
      .join('\n');

    return xmlHeader + xmlRows + '\n' + xmlFooter;
  },
};

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export type ExportMimeTypes = Record<ExportFormat, string>;

export const exportMimeTypes: ExportMimeTypes = {
  json: 'application/json',
  csv: 'text/csv',
  xml: 'application/xml',
};
