import { NextResponse } from 'next/server';
import { db } from '../../../lib/prisma';
import { exportFormats, exportMimeTypes, ExportFormat, validFormats } from '../../../lib/export-utils';

// READ
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    // If no ID is provided, fetch all records
    if (!id) {
      const records = await db.weatherRecord.findMany({
        orderBy: { createdAt: 'desc' }
      });
      console.log('Found records:', records);
      return NextResponse.json(records);
    }

    // Fetch single record by ID
    const record = await db.weatherRecord.findUnique({
      where: { id: parseInt(id) }
    });

    if (!record) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
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

// EXPORT
export async function POST(request: Request) {
  try {
    const { action, recordIds, format } = await request.json();

    if (action === 'export') {
      if (!validFormats.includes(format)) {
        return NextResponse.json(
          { error: 'Invalid export format' },
          { status: 400 }
        );
      }

      const exportFormat = format as ExportFormat;

      // Fetch selected records
      const records = await db.weatherRecord.findMany({
        where: {
          id: { in: recordIds.map((id: string) => parseInt(id)) }
        }
      });

      // Convert to selected format using properly typed function
      const exportContent = exportFormats[exportFormat](records);

      // Return export data with properly typed mime type
      return NextResponse.json({
        content: exportContent,
        mimeType: exportMimeTypes[exportFormat],
        filename: `weather_records_export_${exportFormat}`
      });
    }

    // Existing POST logic for creating records
    const data = await request.json();
    console.log('Creating new record with data:', data);
    
    // Validate required fields
    if (!data.location || data.latitude == null || data.longitude == null || 
        !data.startDate || !data.endDate || !data.weatherData) {
      console.error('Missing required fields:', data);
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prepare record data
    const recordData: any = {
      location: data.location,
      latitude: typeof data.latitude === 'string' ? parseFloat(data.latitude) : data.latitude,
      longitude: typeof data.longitude === 'string' ? parseFloat(data.longitude) : data.longitude,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      temperature_min: data.weatherData.forecast.reduce((min: number, day: any) => 
        Math.min(min, day.temp_min), Infinity),
      temperature_max: data.weatherData.forecast.reduce((max: number, day: any) => 
        Math.max(max, day.temp_max), -Infinity),
      description: data.weatherData.current.description || '',
      // Optional: Store additional weather data as JSON
      weatherData: JSON.stringify(data.weatherData)
    };

    const record = await db.weatherRecord.create({
      data: recordData
    });
    
    console.log('Created record:', record);
    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error('Failed to create record:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create record' },
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
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    const data = await request.json();
    console.log('Received update data:', JSON.stringify(data, null, 2));

    // Validate input data
    if (!data) {
      console.error('Update failed: No update data provided');
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      );
    }

    // Prepare update data with optional fields
    const updateData: any = {};

    // Update location if provided
    if (data.location) {
      updateData.location = data.location;
    }

    // Update coordinates if provided
    if (data.latitude != null && data.longitude != null) {
      updateData.latitude = typeof data.latitude === 'string' 
        ? parseFloat(data.latitude) 
        : data.latitude;
      updateData.longitude = typeof data.longitude === 'string' 
        ? parseFloat(data.longitude) 
        : data.longitude;
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
      data: updateData
    });
    
    console.log('Successfully updated record:', JSON.stringify(record, null, 2));
    return NextResponse.json({ 
      success: true, 
      record,
      message: 'Record updated successfully' 
    });
  } catch (error) {
    console.error('Failed to update record:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to update record',
        details: error instanceof Error ? error.stack : null
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
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    console.log('Deleting record:', id);
    await db.weatherRecord.delete({
      where: { id: parseInt(id) }
    });
    console.log('Record deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete record:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to delete record',
        details: error instanceof Error ? error.stack : null
      },
      { status: 500 }
    );
  }
}
