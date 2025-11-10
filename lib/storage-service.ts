// lib/storage-service.ts

import { createClient } from '@vercel/postgres';
import { Experiment, Response, ExperimentRow, ResponseRow, CreateResponseInput, QualityMetrics } from './types';
import { MetricsCalculator } from './metrics-calculator';

// Lazy initialization of database client
let db: ReturnType<typeof createClient> | null = null;

function getDb() {
  if (!db) {
    // Check for required environment variable
    if (!process.env.POSTGRES_URL) {
      throw new Error('POSTGRES_URL environment variable is not set. Please check your .env.local file.');
    }

    // Validate it's not a placeholder
    if (process.env.POSTGRES_URL.includes('your_postgres') || process.env.POSTGRES_URL.includes('placeholder')) {
      throw new Error(
        'POSTGRES_URL appears to be a placeholder. Please set the actual connection string from Vercel dashboard.'
      );
    }

    // createClient() automatically reads from POSTGRES_URL env var
    // But we explicitly ensure we're using the pooled connection
    db = createClient();
  }
  return db;
}

export class StorageService {
  /**
   * Create a new experiment
   */
  static async createExperiment(prompt: string): Promise<Experiment> {
    const result = await getDb().sql<ExperimentRow>`
      INSERT INTO experiments (prompt)
      VALUES (${prompt})
      RETURNING *
    `;

    const row = result.rows[0];
    return this.mapExperimentRow(row);
  }

  /**
   * Get a single experiment by ID
   */
  static async getExperiment(id: string): Promise<Experiment | null> {
    const result = await getDb().sql<ExperimentRow>`
      SELECT * FROM experiments
      WHERE id = ${id}
    `;

    if (result.rows.length === 0) {
      return null;
    }

    const experiment = this.mapExperimentRow(result.rows[0]);

    // Fetch responses for this experiment (pass prompt for details recalculation)
    const responses = await this.getExperimentResponses(id, experiment.prompt);
    experiment.responses = responses;

    return experiment;
  }

  /**
   * Get all experiments
   */
  static async getAllExperiments(): Promise<Experiment[]> {
    const result = await getDb().sql<ExperimentRow>`
      SELECT * FROM experiments
      ORDER BY created_at DESC
    `;

    return result.rows.map((row) => this.mapExperimentRow(row));
  }

  /**
   * Get all responses for an experiment
   */
  static async getExperimentResponses(experimentId: string, prompt?: string): Promise<Response[]> {
    const result = await getDb().sql<ResponseRow>`
      SELECT * FROM responses
      WHERE experiment_id = ${experimentId}
      ORDER BY created_at ASC
    `;

    // If we have the prompt, we can recalculate details
    return result.rows.map((row) => this.mapResponseRow(row, prompt));
  }

  /**
   * Create a new response
   */
  static async createResponse(input: CreateResponseInput): Promise<Response> {
    const { experimentId, temperature, topP, responseText, metrics, responseTimeMs, tokenCount } = input;

    const result = await getDb().sql<ResponseRow>`
      INSERT INTO responses (
        experiment_id,
        temperature,
        top_p,
        model,
        response_text,
        coherence_score,
        completeness_score,
        structural_score,
        overall_score,
        response_time_ms,
        token_count
      )
      VALUES (
        ${experimentId},
        ${temperature},
        ${topP},
        'gpt-4o-mini',
        ${responseText},
        ${metrics.coherence},
        ${metrics.completeness},
        ${metrics.structural},
        ${metrics.overall},
        ${responseTimeMs},
        ${tokenCount}
      )
      RETURNING *
    `;

    return this.mapResponseRow(result.rows[0]);
  }

  /**
   * Map database row to Experiment domain model
   */
  private static mapExperimentRow(row: ExperimentRow): Experiment {
    return {
      id: row.id,
      prompt: row.prompt,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Map database row to Response domain model
   */
  private static mapResponseRow(row: ResponseRow, prompt?: string): Response {
    const metrics: QualityMetrics = {
      coherence: row.coherence_score ?? 0,
      completeness: row.completeness_score ?? 0,
      structural: row.structural_score ?? 0,
      overall: row.overall_score ?? 0,
      // Recalculate details if we have the prompt, otherwise use empty details
      details: prompt
        ? MetricsCalculator.calculateAll(row.response_text, prompt).details
        : {
            wordCount: 0,
            sentenceCount: 0,
            avgSentenceLength: 0,
            paragraphCount: 0,
            punctuationDensity: 0,
            lexicalDiversity: 0,
          },
    };

    return {
      id: row.id,
      experimentId: row.experiment_id,
      temperature: Number(row.temperature),
      topP: Number(row.top_p),
      model: row.model,
      responseText: row.response_text,
      metrics,
      responseTimeMs: row.response_time_ms ?? 0,
      tokenCount: row.token_count ?? 0,
      createdAt: new Date(row.created_at),
    };
  }
}
