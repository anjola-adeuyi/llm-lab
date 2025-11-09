// lib/types.ts

// Core domain models
export interface Experiment {
  id: string;
  prompt: string;
  createdAt: Date;
  updatedAt: Date;
  responses?: Response[];
}

export interface Response {
  id: string;
  experimentId: string;

  // LLM configuration
  temperature: number;
  topP: number;
  model: string;

  // Content
  responseText: string;

  // Quality metrics
  metrics: QualityMetrics;

  // Performance
  responseTimeMs: number;
  tokenCount: number;

  createdAt: Date;
}

// Quality metrics breakdown
export interface QualityMetrics {
  coherence: number; // 0-100: Sentence flow and logical connectivity
  completeness: number; // 0-100: Content coverage and depth
  structural: number; // 0-100: Formatting and organization
  overall: number; // 0-100: Weighted average
  details: MetricDetails;
}

export interface MetricDetails {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  paragraphCount: number;
  punctuationDensity: number;
  lexicalDiversity: number;
}

// API request/response types
export interface GenerateRequest {
  prompt: string;
  parameterRanges: {
    temperature: number[]; // e.g., [0.1, 0.5, 0.9]
    topP: number[]; // e.g., [0.5, 0.9, 1.0]
  };
}

export interface GenerateResponse {
  experimentId: string;
  responses: Response[];
  metadata: {
    totalGenerated: number;
    totalTimeMs: number;
    averageScore: number;
  };
}

// Export formats
export type ExportFormat = 'json' | 'csv';

// Database row types (for Vercel Postgres)
export interface ExperimentRow {
  id: string;
  prompt: string;
  created_at: Date;
  updated_at: Date;
}

export interface ResponseRow {
  id: string;
  experiment_id: string;
  temperature: number;
  top_p: number;
  model: string;
  response_text: string;
  coherence_score: number | null;
  completeness_score: number | null;
  structural_score: number | null;
  overall_score: number | null;
  response_time_ms: number | null;
  token_count: number | null;
  created_at: Date;
}

// Input types for creating responses
export interface CreateResponseInput {
  experimentId: string;
  temperature: number;
  topP: number;
  responseText: string;
  metrics: QualityMetrics;
  responseTimeMs: number;
  tokenCount: number;
}

// LLM service types
export interface LLMParams {
  temperature: number;
  topP: number;
  model?: string;
}

