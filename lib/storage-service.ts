// lib/storage-service.ts

import { neon } from '@neondatabase/serverless';
import { Experiment, Response, ExperimentRow, ResponseRow, CreateResponseInput, QualityMetrics } from './types';
import { MetricsCalculator } from './metrics-calculator';

// Lazy initialization of database client
let sql: ReturnType<typeof neon> | null = null;

function getDb() {
  if (!sql) {
    console.log('[Storage Service] Initializing database client...');
    // Check for required environment variable (Neon uses DATABASE_URL)
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL or POSTGRES_URL environment variable is not set. Please check your .env.local file.'
      );
    }

    // Validate it's not a placeholder
    if (connectionString.includes('your_postgres') || connectionString.includes('placeholder')) {
      throw new Error(
        'DATABASE_URL appears to be a placeholder. Please set the actual connection string from Vercel dashboard.'
      );
    }

    console.log(
      '[Storage Service] Creating Neon database client with connection string:',
      connectionString.substring(0, 30) + '...'
    );
    // Neon uses the neon() function with connection string
    sql = neon(connectionString);
    console.log('[Storage Service] Database client created successfully');
  }
  return sql;
}

export class StorageService {
  /**
   * Create a new experiment
   */
  static async createExperiment(prompt: string): Promise<Experiment> {
    console.log('[Storage Service] Creating experiment...');
    try {
      const sql = getDb();
      const result = (await sql`
        INSERT INTO experiments (prompt)
        VALUES (${prompt})
        RETURNING *
      `) as ExperimentRow[];

      const row = result[0];
      console.log('[Storage Service] Experiment created:', row.id);
      return this.mapExperimentRow(row);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Storage Service] Error creating experiment:', errorMessage);
      throw error;
    }
  }

  /**
   * Get a single experiment by ID
   */
  static async getExperiment(id: string): Promise<Experiment | null> {
    const sql = getDb();
    const result = (await sql`
      SELECT * FROM experiments
      WHERE id = ${id}
    `) as ExperimentRow[];

    if (result.length === 0) {
      return null;
    }

    const experiment = this.mapExperimentRow(result[0]);

    // Fetch responses for this experiment (pass prompt for details recalculation)
    const responses = await this.getExperimentResponses(id, experiment.prompt);
    experiment.responses = responses;

    return experiment;
  }

  /**
   * Get all experiments
   */
  static async getAllExperiments(): Promise<Experiment[]> {
    const sql = getDb();
    const result = (await sql`
      SELECT * FROM experiments
      ORDER BY created_at DESC
    `) as ExperimentRow[];

    return result.map((row) => this.mapExperimentRow(row));
  }

  /**
   * Get all responses for an experiment
   */
  static async getExperimentResponses(experimentId: string, prompt?: string): Promise<Response[]> {
    const sql = getDb();
    const result = (await sql`
      SELECT * FROM responses
      WHERE experiment_id = ${experimentId}
      ORDER BY created_at ASC
    `) as ResponseRow[];

    // If we have the prompt, we can recalculate details
    return result.map((row) => this.mapResponseRow(row, prompt));
  }

  /**
   * Create a new response
   */
  static async createResponse(input: CreateResponseInput): Promise<Response> {
    const { experimentId, temperature, topP, responseText, metrics, responseTimeMs, tokenCount } = input;

    console.log(`[Storage Service] Creating response for experiment ${experimentId}...`);
    try {
      const sql = getDb();
      const result = (await sql`
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
      `) as ResponseRow[];

      console.log(`[Storage Service] Response created: ${result[0].id}`);
      return this.mapResponseRow(result[0]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Storage Service] Error creating response:', errorMessage);
      throw error;
    }
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
