// app/api/experiments/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/lib/storage-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const experiment = await StorageService.getExperiment(id);

    if (!experiment) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(experiment);
  } catch (error: any) {
    console.error('Get experiment error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch experiment' },
      { status: 500 }
    );
  }
}

