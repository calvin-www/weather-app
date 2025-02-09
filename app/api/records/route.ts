import { NextResponse } from 'next/server';

import { db } from '../../../lib/prisma';
import {
  exportFormats,
  exportMimeTypes,
  ExportFormat,
  validFormats,
} from '../../../lib/export-utils';

// READ
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // If no ID is provided, fetch all records
    if (!id) {
      const records = await db.weatherRecord.findMany({
        orderBy: { createdAt: 'desc' },
      });

      console.log('Found records:', records);

      return NextResponse.json(records);
    }

    // Fetch single record by ID
    const record = await db.weatherRecord.findUnique({
      where: { id: parseInt(id) },
    });

    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    console.log('Found record:', record);

    return NextResponse.json(record);
  } catch (error) {
    console.error('Failed to fetch record:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch record' },
      { status: 500 }
    );
  }
}

// EXPORT AND CREATE
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // Handle export action
    if (action === 'export') {
      const { recordIds, format } = body;

      console.log('Export request received:', { recordIds, format });

      if (!Array.isArray(recordIds) || recordIds.length === 0) {
        console.error('Invalid recordIds:', recordIds);
        return NextResponse.json({ error: 'Invalid record IDs' }, { status: 400 });
      }

      if (!validFormats.includes(format)) {
        console.error('Invalid format:', format);
        return NextResponse.json({ error: 'Invalid export format' }, { status: 400 });
      }

      try {
        const records = await db.weatherRecord.findMany({
          where: {
            id: {
              in: recordIds.map(id => Number(id)),
            },
          },
        });

        console.log(`Found ${records.length} records to export`);

        if (!records.length) {
          return NextResponse.json({ error: 'No records found' }, { status: 404 });
        }

        const exportedData = exportFormats[format as ExportFormat](records);
        const filename = `weather_records_${new Date().toISOString().split('T')[0]}`;
        const mimeType = exportMimeTypes[format as ExportFormat];

        console.log('Export successful:', { format, filename, recordCount: records.length });

        return NextResponse.json({
          success: true,
          content: exportedData,
          filename,
          mimeType,
        });
      } catch (error) {
        console.error('Export processing error:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to process export' },
          { status: 500 }
        );
      }
    }

    // Handle record creation
    const { location, latitude, longitude, startDate, endDate, weatherData } = body;

    // Validate required fields
    if (!location || !weatherData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
      // Create record
      const record = await db.weatherRecord.create({
        data: {
          location,
          latitude,
          longitude,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          weatherData,
        },
      });

      return NextResponse.json({
        success: true,
        record,
      });
    } catch (error) {
      console.error('Failed to create record:', error);

      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to create record' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process request',
      },
      { status: 500 }
    );
  }
}

// UPDATE
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      console.error('Update failed: No record ID provided');

      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    const data = await request.json();

    console.log('Received update data:', JSON.stringify(data, null, 2));

    // Validate input data
    if (!data) {
      console.error('Update failed: No update data provided');

      return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
    }

    // Prepare update data with optional fields
    const updateData: any = {};

    // Update location if provided
    if (data.location) {
      updateData.location = data.location;
    }

    // Update coordinates if provided
    if (data.latitude != null && data.longitude != null) {
      updateData.latitude =
        typeof data.latitude === 'string' ? parseFloat(data.latitude) : data.latitude;
      updateData.longitude =
        typeof data.longitude === 'string' ? parseFloat(data.longitude) : data.longitude;
    }

    // Update date range if provided
    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      updateData.endDate = new Date(data.endDate);
    }

    // Update weather data if provided
    if (data.weatherData) {
      // Calculate min and max temperatures from forecast
      if (data.weatherData.forecast && data.weatherData.forecast.length > 0) {
        updateData.temperature_min = data.weatherData.forecast.reduce(
          (min: number, day: any) => Math.min(min, day.temp_min),
          Infinity
        );
        updateData.temperature_max = data.weatherData.forecast.reduce(
          (max: number, day: any) => Math.max(max, day.temp_max),
          -Infinity
        );
      }

      // Update description
      if (data.weatherData.current?.description) {
        updateData.description = data.weatherData.current.description;
      }

      // Store full weather data as JSON
      updateData.weatherData = JSON.stringify(data.weatherData);
    }

    console.log('Prepared update data:', JSON.stringify(updateData, null, 2));

    // Perform the update
    const record = await db.weatherRecord.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    console.log('Successfully updated record:', JSON.stringify(record, null, 2));

    return NextResponse.json({
      success: true,
      record,
      message: 'Record updated successfully',
    });
  } catch (error) {
    console.error('Failed to update record:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update record',
        details: error instanceof Error ? error.stack : null,
      },
      { status: 500 }
    );
  }
}

// DELETE
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    console.log('Deleting record:', id);
    await db.weatherRecord.delete({
      where: { id: parseInt(id) },
    });
    console.log('Record deleted successfully');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete record:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete record',
        details: error instanceof Error ? error.stack : null,
      },
      { status: 500 }
    );
  }
}
