import { AIResponse } from './ai-response.interface';

export interface IAIProvider {
  processText(text: string): Promise<AIResponse>;
  processImage(
    imageBuffer: Buffer
  ): Promise<AIResponse>;
  generateRegexPatterns(
    content: string,
    channelInfo?: {
      title?: string;
      username?: string;
    }
  ): Promise<{
    wordRegex: string;
    translationRegex: string;
    examplesRegex: string;
    confidence: number;
  }>;
}
