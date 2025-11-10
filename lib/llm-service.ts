// lib/llm-service.ts

import OpenAI from 'openai';
import { LLMParams } from './types';

// Lazy initialization of OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    // Validate it's not a placeholder
    if (process.env.OPENAI_API_KEY.includes('your_openai') || process.env.OPENAI_API_KEY.includes('placeholder')) {
      throw new Error('OPENAI_API_KEY appears to be a placeholder. Please set your actual API key.');
    }

    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export class LLMService {
  /**
   * Generate a response using OpenAI API
   */
  static async generate(prompt: string, params: LLMParams): Promise<string> {
    const client = getOpenAIClient();

    console.log(
      `[LLM Service] Generating with model=${params.model || 'gpt-4o-mini'}, temp=${params.temperature}, topP=${
        params.topP
      }`
    );

    try {
      const response = await client.chat.completions.create({
        model: params.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: params.temperature,
        top_p: params.topP,
        max_tokens: 1000,
      });

      console.log(`[LLM Service] API response received, choices: ${response.choices.length}`);

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content returned from OpenAI API');
      }

      console.log(`[LLM Service] Content length: ${content.length} characters`);
      return content;
    } catch (error: any) {
      console.error('[LLM Service] Error details:', {
        message: error.message,
        status: error.status,
        code: error.code,
        type: error.type,
      });

      // Handle rate limit errors
      if (error.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      }

      // Handle authentication errors
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your environment variables.');
      }

      // Handle network/timeout errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new Error('Failed to connect to OpenAI API. Please check your internet connection.');
      }

      // Handle other errors
      throw new Error(`OpenAI API error: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Estimate token count for a text string
   * Simple estimation: ~4 characters per token (rough approximation)
   */
  static estimateTokens(text: string): number {
    // Rough estimation: OpenAI uses approximately 4 characters per token
    // This is a simplified approach; actual tokenization is more complex
    return Math.ceil(text.length / 4);
  }
}
