'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Response } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ResponseCardProps {
  response: Response;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
  if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
  return 'bg-red-100 dark:bg-red-900/30';
}

export function ResponseCard({ response }: ResponseCardProps) {
  const { metrics, temperature, topP, responseText, responseTimeMs, tokenCount } = response;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Temp: {temperature} | Top P: {topP}
          </CardTitle>
          <div
            className={cn(
              'px-3 py-1 rounded-full text-sm font-semibold',
              getScoreBgColor(metrics.overall),
              getScoreColor(metrics.overall)
            )}
          >
            {metrics.overall}/100
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className={cn('text-2xl font-bold', getScoreColor(metrics.coherence))}>{metrics.coherence}</div>
            <div className="text-xs text-muted-foreground">Coherence</div>
          </div>
          <div className="text-center">
            <div className={cn('text-2xl font-bold', getScoreColor(metrics.completeness))}>{metrics.completeness}</div>
            <div className="text-xs text-muted-foreground">Completeness</div>
          </div>
          <div className="text-center">
            <div className={cn('text-2xl font-bold', getScoreColor(metrics.structural))}>{metrics.structural}</div>
            <div className="text-xs text-muted-foreground">Structural</div>
          </div>
        </div>

        {/* Response Text */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Response:</h4>
          <p className="text-sm text-muted-foreground line-clamp-6">{responseText}</p>
        </div>

        {/* Performance Metrics */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>{responseTimeMs}ms</span>
          <span>{tokenCount} tokens</span>
          <span>{metrics.details.wordCount} words</span>
        </div>
      </CardContent>
    </Card>
  );
}
