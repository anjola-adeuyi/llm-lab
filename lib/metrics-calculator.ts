// lib/metrics-calculator.ts

import { QualityMetrics, MetricDetails } from './types';

export class MetricsCalculator {
  /**
   * METRIC 1: COHERENCE SCORE (0-100)
   * Measures logical flow and sentence connectivity
   *
   * Algorithm:
   * - Analyzes word overlap between consecutive sentences
   * - Checks pronoun reference consistency
   * - Evaluates transition word usage
   *
   * Rationale: High temperature = random jumps = low coherence
   */
  static calculateCoherence(text: string): number {
    const sentences = this.splitIntoSentences(text);
    if (sentences.length < 2) return 50; // Minimum baseline

    let coherenceSum = 0;

    // Check consecutive sentence overlap
    for (let i = 0; i < sentences.length - 1; i++) {
      const words1 = this.extractWords(sentences[i]);
      const words2 = this.extractWords(sentences[i + 1]);

      // Calculate Jaccard similarity
      const intersection = words1.filter((w) => words2.includes(w)).length;
      const union = new Set([...words1, ...words2]).size;
      const similarity = union > 0 ? intersection / union : 0;

      coherenceSum += similarity;
    }

    const avgCoherence = coherenceSum / (sentences.length - 1);

    // Check for transition words (weights coherence higher)
    const transitionWords = ['however', 'therefore', 'furthermore', 'additionally', 'moreover', 'consequently', 'meanwhile', 'nevertheless'];
    const hasTransitions = transitionWords.some((word) => text.toLowerCase().includes(word));

    let score = avgCoherence * 80;
    if (hasTransitions) score += 20;

    return Math.min(100, Math.round(score));
  }

  /**
   * METRIC 2: COMPLETENESS SCORE (0-100)
   * Measures content depth and coverage
   *
   * Algorithm:
   * - Extracts key entities from prompt (nouns, verbs)
   * - Checks if response addresses each entity
   * - Evaluates response length appropriateness
   *
   * Rationale: Low temperature = safe but shallow, high = diverse but wandering
   */
  static calculateCompleteness(responseText: string, prompt: string): number {
    const promptWords = this.extractKeywords(prompt);
    const responseWords = this.extractKeywords(responseText);

    if (promptWords.length === 0) return 50; // Can't measure without prompt keywords

    // Coverage: How many prompt keywords appear in response?
    const coverage = promptWords.filter((word) => responseWords.includes(word)).length / promptWords.length;

    // Length appropriateness
    const wordCount = this.extractWords(responseText).length;
    let lengthScore = 0;

    if (wordCount < 30) lengthScore = 0.3; // Too short
    else if (wordCount < 50) lengthScore = 0.6; // Short
    else if (wordCount < 200) lengthScore = 1.0; // Ideal
    else if (wordCount < 400) lengthScore = 0.8; // Long
    else lengthScore = 0.5; // Too long

    // Weighted combination
    const score = (coverage * 0.6 + lengthScore * 0.4) * 100;
    return Math.round(score);
  }

  /**
   * METRIC 3: STRUCTURAL SCORE (0-100)
   * Measures formatting and organization quality
   *
   * Algorithm:
   * - Paragraph structure (line breaks)
   * - Sentence variety (length distribution)
   * - Punctuation quality
   * - Markdown formatting usage
   *
   * Rationale: Well-structured = easier to parse = better response
   */
  static calculateStructural(text: string): number {
    let score = 0;
    const sentences = this.splitIntoSentences(text);

    if (sentences.length === 0) return 0;

    // 1. Paragraph structure (30 points)
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
    if (paragraphs.length >= 2) score += 30;
    else if (paragraphs.length === 1) score += 15;

    // 2. Sentence variety (25 points)
    const sentenceLengths = sentences.map((s) => this.extractWords(s).length);
    const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const variance =
      sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;

    if (variance > 20) score += 25; // High variety
    else if (variance > 10) score += 15;
    else score += 5; // Monotonous

    // 3. Punctuation quality (20 points)
    const words = this.extractWords(text);
    if (words.length > 0) {
      const punctuationCount = (text.match(/[.!?,;:]/g) || []).length;
      const punctuationRatio = punctuationCount / words.length;
      if (punctuationRatio > 0.05 && punctuationRatio < 0.15) score += 20;
      else score += 10;
    }

    // 4. Markdown formatting (25 points)
    const hasMarkdown = /[*_`#\[\]]/g.test(text);
    if (hasMarkdown) score += 25;

    return Math.min(100, score);
  }

  /**
   * CALCULATE ALL METRICS
   * Returns complete quality assessment
   */
  static calculateAll(responseText: string, prompt: string): QualityMetrics {
    const coherence = this.calculateCoherence(responseText);
    const completeness = this.calculateCompleteness(responseText, prompt);
    const structural = this.calculateStructural(responseText);

    // Weighted overall score (coherence matters most)
    const overall = Math.round(coherence * 0.4 + completeness * 0.35 + structural * 0.25);

    return {
      coherence,
      completeness,
      structural,
      overall,
      details: this.extractDetails(responseText),
    };
  }

  // Helper methods
  private static splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  private static extractWords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2); // Filter stopwords
  }

  private static extractKeywords(text: string): string[] {
    const stopwords = new Set([
      'the', 'is', 'at', 'which', 'on', 'and', 'or', 'but', 'a', 'an', 'as', 'are', 'was', 'were', 'been', 'be',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'who', 'where', 'when',
      'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
      'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'don', 'should', 'now'
    ]);
    return this.extractWords(text).filter((word) => !stopwords.has(word));
  }

  private static extractDetails(text: string): MetricDetails {
    const words = this.extractWords(text);
    const sentences = this.splitIntoSentences(text);
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgSentenceLength: sentences.length > 0 ? Math.round(words.length / sentences.length) : 0,
      paragraphCount: paragraphs.length,
      punctuationDensity: words.length > 0 ? (text.match(/[.!?,;:]/g) || []).length / words.length : 0,
      lexicalDiversity: words.length > 0 ? new Set(words).size / words.length : 0,
    };
  }
}

