// app/api/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { LLMService } from '@/lib/llm-service';
import { MetricsCalculator } from '@/lib/metrics-calculator';
import { StorageService } from '@/lib/storage-service';
import { GenerateRequest, GenerateResponse } from '@/lib/types';

// Increase timeout for long-running requests (up to 5 minutes)
export const maxDuration = 300; // 5 minutes in seconds
export const dynamic = 'force-dynamic';

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

  console.log('[Generate API] Request received');

  try {
    let body: GenerateRequest;
    try {
      body = await request.json();
      console.log('[Generate API] Request body parsed:', {
        prompt: body.prompt?.substring(0, 50),
        parameterRanges: body.parameterRanges,
      });
    } catch (parseError) {
      console.error('[Generate API] JSON parse error:', parseError);
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

    console.log('[Generate API] Creating experiment record...');
    // Create experiment record
    let experiment;
    try {
      experiment = await StorageService.createExperiment(prompt);
      console.log('[Generate API] Experiment created:', experiment.id);
    } catch (dbError: any) {
      console.error('[Generate API] Database error creating experiment:', dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError.message || 'Failed to create experiment'}` },
        { status: 500 }
      );
    }

    // Generate all parameter combinations
    const combinations = generateCombinations(parameterRanges.temperature, parameterRanges.topP);
    console.log(`[Generate API] Generated ${combinations.length} parameter combinations`);

    // Parallel LLM calls with error handling
    console.log('[Generate API] Starting LLM API calls...');
    const responses = await Promise.allSettled(
      combinations.map(async ({ temperature, topP }, index) => {
        const startTime = Date.now();
        console.log(
          `[Generate API] Starting LLM call ${index + 1}/${combinations.length} (temp=${temperature}, topP=${topP})`
        );

        try {
          // Call OpenAI
          const responseText = await LLMService.generate(prompt, {
            temperature,
            topP,
            model: 'gpt-4o-mini',
          });
          console.log(`[Generate API] LLM call ${index + 1} completed, response length: ${responseText.length}`);

          // Calculate metrics
          const metrics = MetricsCalculator.calculateAll(responseText, prompt);
          const responseTimeMs = Date.now() - startTime;

          // Store response
          console.log(`[Generate API] Storing response ${index + 1}...`);
          const storedResponse = await StorageService.createResponse({
            experimentId: experiment.id,
            temperature,
            topP,
            responseText,
            metrics,
            responseTimeMs,
            tokenCount: LLMService.estimateTokens(responseText),
          });
          console.log(`[Generate API] Response ${index + 1} stored successfully`);
          return storedResponse;
        } catch (error: any) {
          console.error(`[Generate API] Error in LLM call ${index + 1}:`, error.message);
          throw error;
        }
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
        '[Generate API] Some LLM calls failed:',
        errors.map((e) => {
          const reason = (e as PromiseRejectedResult).reason;
          return reason instanceof Error ? reason.message : String(reason);
        })
      );
    }

    console.log(`[Generate API] Completed: ${successfulResponses.length}/${combinations.length} successful`);

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
    console.error('[Generate API] Top-level error:', error);
    console.error('[Generate API] Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Failed to generate responses', details: error.toString() },
      { status: 500 }
    );
  }
}
