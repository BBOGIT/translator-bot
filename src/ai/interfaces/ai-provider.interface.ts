import { AIResponse } from './ai-response.interface';

export interface IAIProvider {
  processText(text: string): Promise<AIResponse>;
  processImage(
    imageBuffer: Buffer
  ): Promise<AIResponse>;
}
