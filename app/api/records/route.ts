import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma client
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
};

type GlobalThisWithPrisma = typeof globalThis & {
  prisma?: ReturnType<typeof prismaClientSingleton>;
};

const globalForPrisma = global as GlobalThisWithPrisma;

const db = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

export { db };

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

// CREATE
export async function POST(request: Request) {
  try {
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
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    const data = await request.json();
    console.log('Updating record', id, 'with data:', data);
    
    // Prepare update data
    const updateData: any = {
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      description: data.description || ''
    };

    // If full weather data is provided, update additional fields
    if (data.weatherData) {
      updateData.temperature_min = data.weatherData.forecast.reduce((min: number, day: any) => 
        Math.min(min, day.temp_min), Infinity);
      updateData.temperature_max = data.weatherData.forecast.reduce((max: number, day: any) => 
        Math.max(max, day.temp_max), -Infinity);
      updateData.weatherData = JSON.stringify(data.weatherData);
    }

    const record = await db.weatherRecord.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    console.log('Updated record:', record);
    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error('Failed to update record:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update record' },
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
      { error: error instanceof Error ? error.message : 'Failed to delete record' },
      { status: 500 }
    );
  }
}
