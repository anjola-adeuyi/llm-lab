// app/experiments/page.tsx

'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Experiment } from '@/lib/types';

export default function ExperimentsPage() {
  const {
    data: experiments,
    isLoading,
    error,
  } = useQuery<Experiment[]>({
    queryKey: ['experiments'],
    queryFn: async () => {
      const response = await fetch('/api/experiments');
      if (!response.ok) {
        throw new Error('Failed to fetch experiments');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <h1 className="text-4xl font-bold mb-8">Experiments</h1>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border bg-card p-6"
            >
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold mb-8">Experiments</h1>
        <div className="text-destructive">Error loading experiments</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Experiments</h1>
          <p className="text-muted-foreground">View and compare all your LLM experiments</p>
        </div>
        <Link
          href="/"
          className="text-primary hover:underline"
        >
          ← Create New
        </Link>
      </div>

      {experiments && experiments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No experiments yet</p>
            <Link
              href="/"
              className="text-primary hover:underline"
            >
              Create your first experiment →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {experiments?.map((experiment) => (
            <Link
              key={experiment.id}
              href={`/experiments/${experiment.id}`}
            >
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{experiment.prompt}</CardTitle>
                  <CardDescription>
                    Created {format(new Date(experiment.createdAt), 'PPp')}
                    {experiment.responses && experiment.responses.length > 0 && (
                      <>
                        {' '}
                        · {experiment.responses.length} response{experiment.responses.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
