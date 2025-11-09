-- Database schema for LLM Lab
-- Run this in my Vercel Postgres database

-- experiments table
CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- responses table (1:many with experiments)
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,

  -- LLM parameters
  temperature DECIMAL(3,2) NOT NULL,
  top_p DECIMAL(3,2) NOT NULL,
  model VARCHAR(50) DEFAULT 'gpt-4o-mini',

  -- Response content
  response_text TEXT NOT NULL,

  -- Quality metrics
  coherence_score DECIMAL(5,2),
  completeness_score DECIMAL(5,2),
  structural_score DECIMAL(5,2),
  overall_score DECIMAL(5,2),

  -- Performance tracking
  response_time_ms INTEGER,
  token_count INTEGER,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_experiments_created ON experiments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_responses_experiment ON responses(experiment_id);
CREATE INDEX IF NOT EXISTS idx_responses_created ON responses(created_at DESC);

