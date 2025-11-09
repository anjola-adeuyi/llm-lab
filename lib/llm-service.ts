// lib/llm-service.ts

import OpenAI from 'openai';
import { LLMParams } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class LLMService {
  /**
   * Generate a response using OpenAI API
   */
  static async generate(prompt: string, params: LLMParams): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    try {
      const response = await openai.chat.completions.create({
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

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content returned from OpenAI API');
      }

      return content;
    } catch (error: any) {
      // Handle rate limit errors
      if (error.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      }

      // Handle authentication errors
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your environment variables.');
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

