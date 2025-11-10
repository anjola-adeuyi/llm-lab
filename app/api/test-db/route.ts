// app/api/test-db/route.ts

import { NextResponse } from 'next/server';
import { StorageService } from '@/lib/storage-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[Test DB] Testing database connection...');

    // Try to fetch experiments (simple read operation)
    const experiments = await StorageService.getAllExperiments();

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      experimentCount: experiments.length,
    });
  } catch (error: any) {
    console.error('[Test DB] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
