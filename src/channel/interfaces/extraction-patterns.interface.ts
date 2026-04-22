import { ChannelInfo } from './channel-info.interface';

export interface ExtractionPatterns {
  wordRegex: string;
  translationRegex: string;
  examplesRegex: string;
  confidence: number;
}

export interface ExtractedContent {
  word: string;
  translation: string;
  examples: string;
  success: boolean;
  error?: string;
}

export interface ChannelExtractionResult {
  extractedContent?: ExtractedContent;
  channelInfo: ChannelInfo;
  configExists: boolean;
  configCreated?: boolean;
  error?: string;
}
