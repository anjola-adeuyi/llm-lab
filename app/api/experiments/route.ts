// app/api/experiments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/lib/storage-service';

export async function GET() {
  try {
    const experiments = await StorageService.getAllExperiments();
    return NextResponse.json(experiments);
  } catch (error: any) {
    console.error('Get experiments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch experiments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || prompt.length < 10) {
      return NextResponse.json(
        { error: 'Prompt must be at least 10 characters' },
        { status: 400 }
      );
    }

    const experiment = await StorageService.createExperiment(prompt);
    return NextResponse.json(experiment);
  } catch (error: any) {
    console.error('Create experiment error:', error);
    return NextResponse.json(
      { error: 'Failed to create experiment' },
      { status: 500 }
    );
  }
}

