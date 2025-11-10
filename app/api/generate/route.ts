// app/api/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { LLMService } from '@/lib/llm-service';
import { MetricsCalculator } from '@/lib/metrics-calculator';
import { StorageService } from '@/lib/storage-service';
import { GenerateRequest, GenerateResponse } from '@/lib/types';

/**
 * Helper to generate parameter combinations
 */
function generateCombinations(temps: number[], topPs: number[]) {
  return temps.flatMap((temperature) => topPs.map((topP) => ({ temperature, topP })));
}

/**
 * Helper to calculate average score
 */
function calculateAverageScore(responses: any[]) {
  if (responses.length === 0) return 0;
  const sum = responses.reduce((acc, r) => acc + r.metrics.overall, 0);
  return Math.round(sum / responses.length);
}

export async function POST(request: NextRequest) {
  const experimentStartTime = Date.now();

  try {
    let body: GenerateRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    const { prompt, parameterRanges } = body;

    // Input validation
    if (!prompt || prompt.length < 10) {
      return NextResponse.json({ error: 'Prompt must be at least 10 characters' }, { status: 400 });
    }

    if (!parameterRanges?.temperature || !parameterRanges?.topP) {
      return NextResponse.json({ error: 'Parameter ranges for temperature and topP are required' }, { status: 400 });
    }

    if (parameterRanges.temperature.length === 0 || parameterRanges.topP.length === 0) {
      return NextResponse.json({ error: 'At least one value must be provided for each parameter' }, { status: 400 });
    }

    // Create experiment record
    const experiment = await StorageService.createExperiment(prompt);

    // Generate all parameter combinations
    const combinations = generateCombinations(parameterRanges.temperature, parameterRanges.topP);

    // Parallel LLM calls with error handling
    const responses = await Promise.allSettled(
      combinations.map(async ({ temperature, topP }) => {
        const startTime = Date.now();

        // Call OpenAI
        const responseText = await LLMService.generate(prompt, {
          temperature,
          topP,
          model: 'gpt-4o-mini',
        });

        // Calculate metrics
        const metrics = MetricsCalculator.calculateAll(responseText, prompt);
        const responseTimeMs = Date.now() - startTime;

        // Store response
        return await StorageService.createResponse({
          experimentId: experiment.id,
          temperature,
          topP,
          responseText,
          metrics,
          responseTimeMs,
          tokenCount: LLMService.estimateTokens(responseText),
        });
      })
    );

    // Filter successful responses
    const successfulResponses = responses
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<any>).value);

    // Log errors for debugging
    const errors = responses.filter((r) => r.status === 'rejected');
    if (errors.length > 0) {
      console.error(
        'Some LLM calls failed:',
        errors.map((e) => (e as PromiseRejectedResult).reason)
      );
    }

    // Return results
    const result: GenerateResponse = {
      experimentId: experiment.id,
      responses: successfulResponses,
      metadata: {
        totalGenerated: successfulResponses.length,
        totalTimeMs: Date.now() - experimentStartTime,
        averageScore: calculateAverageScore(successfulResponses),
      },
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Generate API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate responses' }, { status: 500 });
  }
}
