// app/experiments/[id]/page.tsx

'use client';

import { useQuery } from '@tanstack/react-query';
import { use } from 'react';
import { ResponseCard } from '@/components/response-card';
import { ComparisonTable } from '@/components/comparison-table';
import { MetricsChart } from '@/components/metrics-chart';
import { ExportButton } from '@/components/export-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Experiment } from '@/lib/types';
import Link from 'next/link';

export default function ExperimentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const {
    data: experiment,
    isLoading,
    error,
  } = useQuery<Experiment>({
    queryKey: ['experiment', id],
    queryFn: async () => {
      const response = await fetch(`/api/experiments/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch experiment');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 bg-muted rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !experiment) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-destructive">Error loading experiment</div>
      </div>
    );
  }

  const responses = experiment.responses || [];

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <Link
          href="/experiments"
          className="text-primary hover:underline mb-4 inline-block"
        >
          ← Back to Experiments
        </Link>
        <h1 className="text-4xl font-bold mb-2">Experiment Details</h1>
        <p className="text-muted-foreground">Created {format(new Date(experiment.createdAt), 'PPp')}</p>
      </div>

      {/* Prompt Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{experiment.prompt}</p>
        </CardContent>
      </Card>

      {/* Export Buttons */}
      <div className="mb-8 flex gap-4">
        <ExportButton
          experimentId={id}
          format="json"
        />
        <ExportButton
          experimentId={id}
          format="csv"
        />
      </div>

      {/* Response Cards Grid */}
      {responses.length > 0 && (
        <>
          <h2 className="text-2xl font-bold mb-4">Responses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {responses.map((response) => (
              <ResponseCard
                key={response.id}
                response={response}
              />
            ))}
          </div>

          {/* Metrics Charts */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Metrics Visualization</h2>
            <MetricsChart responses={responses} />
          </div>

          {/* Comparison Table */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Comparison Table</h2>
            <ComparisonTable responses={responses} />
          </div>
        </>
      )}

      {responses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No responses generated yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
