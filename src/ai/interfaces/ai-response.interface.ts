export interface AIResponse {
  translation: string;
  examples: string[] | string;
  extractedText?: string;
}
