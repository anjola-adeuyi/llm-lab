// app/api/export/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/lib/storage-service';
import { ExportFormat } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const format = (searchParams.get('format') || 'json') as ExportFormat;

    const experiment = await StorageService.getExperiment(id);

    if (!experiment) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      );
    }

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'ID',
        'Temperature',
        'Top P',
        'Model',
        'Response Text',
        'Coherence Score',
        'Completeness Score',
        'Structural Score',
        'Overall Score',
        'Response Time (ms)',
        'Token Count',
        'Created At',
      ];

      const rows = (experiment.responses || []).map((r) => [
        r.id,
        r.temperature,
        r.topP,
        r.model,
        `"${r.responseText.replace(/"/g, '""')}"`, // Escape quotes for CSV
        r.metrics.coherence,
        r.metrics.completeness,
        r.metrics.structural,
        r.metrics.overall,
        r.responseTimeMs,
        r.tokenCount,
        r.createdAt.toISOString(),
      ]);

      const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="experiment-${id}.csv"`,
        },
      });
    } else {
      // Generate JSON
      return NextResponse.json(experiment, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="experiment-${id}.json"`,
        },
      });
    }
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export experiment' },
      { status: 500 }
    );
  }
}

