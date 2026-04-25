import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { AIConfig } from '../config/ai.config';
import { IAIProvider } from '../interfaces/ai-provider.interface';
import { AIResponse } from '../interfaces/ai-response.interface';
import { AIProviderError } from '../../common/errors/domain-errors';

const GEMINI_BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta/openai/';

@Injectable()
export class GeminiService implements IAIProvider {
  private readonly logger = new Logger(GeminiService.name);
  private readonly openai: OpenAI;

  constructor(private readonly config: AIConfig) {
    this.openai = new OpenAI({
      baseURL: GEMINI_BASE_URL,
      apiKey: this.config.geminiConfig.apiKey,
    });
  }

  async processText(text: string): Promise<AIResponse> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.config.geminiConfig.model,
        messages: [
          {
            role: 'system',
            content: `You are a translator assistant. Always respond in the following JSON format:
{"extractedText": "The word in English", "translation": "Ukrainian translation", "examples": ["example1", "example2", "example3"]}`,
          },
          {
            role: 'user',
            content: `Translate this English text to Ukrainian and provide 3 usage examples in English: "${text}"`,
          },
        ],
        max_tokens: this.config.geminiConfig.maxTokens,
        temperature: this.config.geminiConfig.temperature,
        response_format: { type: 'json_object' },
      });

      return this.parseResponse(
        completion.choices[0]?.message?.content,
        'GEMINI_EMPTY_RESPONSE',
        'GEMINI_PARSE_ERROR',
      );
    } catch (error) {
      this.handleError(error, 'GEMINI_TEXT_PROCESSING_FAILED');
    }
  }

  async processImage(imageBuffer: Buffer): Promise<AIResponse> {
    try {
      const base64Image = imageBuffer.toString('base64');

      const completion = await this.openai.chat.completions.create({
        model: this.config.geminiConfig.imageModel,
        messages: [
          {
            role: 'system',
            content: `You are a translator assistant. Extract the English word or phrase from the image and respond in JSON:
{"extractedText": "extracted English word/phrase", "translation": "Ukrainian translation", "examples": ["example1", "example2", "example3"]}`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract the English text from this image and translate it to Ukrainian with 3 usage examples:',
              },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${base64Image}` },
              },
            ],
          },
        ],
        max_tokens: this.config.geminiConfig.maxTokens,
        temperature: this.config.geminiConfig.temperature,
        response_format: { type: 'json_object' },
      });

      return this.parseResponse(
        completion.choices[0]?.message?.content,
        'GEMINI_IMAGE_EMPTY_RESPONSE',
        'GEMINI_IMAGE_PARSE_ERROR',
      );
    } catch (error) {
      this.handleError(error, 'GEMINI_IMAGE_PROCESSING_FAILED');
    }
  }

  async generateRegexPatterns(
    content: string,
    channelInfo?: { title?: string; username?: string },
  ): Promise<{ wordRegex: string; translationRegex: string; examplesRegex: string; confidence: number }> {
    try {
      const channelContext = channelInfo
        ? `Channel: ${channelInfo.title ?? ''} (@${channelInfo.username ?? ''})`
        : '';

      const completion = await this.openai.chat.completions.create({
        model: this.config.geminiConfig.model,
        messages: [
          {
            role: 'system',
            content: `You are a regex pattern generator. Respond only in JSON:
{"wordRegex": "pattern", "translationRegex": "pattern", "examplesRegex": "pattern", "confidence": 0.0-1.0}`,
          },
          {
            role: 'user',
            content: `Generate regex patterns to extract word, translation, and examples from this message format.\n${channelContext}\n\nExample message:\n${content}`,
          },
        ],
        max_tokens: this.config.geminiConfig.maxTokens,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) {
        return this.fallbackRegex();
      }
      return JSON.parse(raw);
    } catch {
      return this.fallbackRegex();
    }
  }

  private parseResponse(
    content: string | null | undefined,
    emptyCode: string,
    parseCode: string,
  ): AIResponse {
    if (!content) {
      throw new AIProviderError('Gemini', 'Empty response from Gemini', {
        errorCode: emptyCode,
        reportable: false,
      });
    }

    try {
      const cleaned = content.replace(/\t+$/g, '').replace(/\n\s+\n/g, '');
      const parsed = JSON.parse(cleaned) as AIResponse;

      if (!parsed.translation) {
        throw new Error('Missing translation field');
      }

      const examples = Array.isArray(parsed.examples)
        ? parsed.examples
        : parsed.examples
          ? [parsed.examples as string]
          : [];

      return {
        extractedText: parsed.extractedText ?? '',
        translation: parsed.translation,
        examples,
      };
    } catch (parseError) {
      this.logger.error('Failed to parse Gemini response', { content, error: parseError });
      throw new AIProviderError('Gemini', 'Invalid JSON response from Gemini', {
        cause: parseError,
        errorCode: parseCode,
        reportable: true,
      });
    }
  }

  private handleError(error: unknown, defaultCode: string): never {
    if (error instanceof AIProviderError) throw error;

    let statusCode: number | undefined;
    let errorCode = defaultCode;

    if (error instanceof OpenAI.APIError) {
      statusCode = error.status;
      errorCode = error.code
        ? `GEMINI_API_ERROR_${error.code.toUpperCase()}`
        : 'GEMINI_API_ERROR_UNKNOWN';
    }

    this.logger.error(`Gemini error: ${(error as Error).message}`, { error });

    throw new AIProviderError(
      'Gemini',
      `Gemini processing failed: ${(error as Error).message}`,
      { cause: error as Error, statusCode, errorCode, reportable: true },
    );
  }

  private fallbackRegex() {
    return {
      wordRegex: '(?:😼|🔤)\\s*([a-zA-Z]+)\\s*-',
      translationRegex: '-\\s*([^\\n]+?)(?:\\n|$)',
      examplesRegex: '([0-9]️⃣[\\s\\S]*?)(?:\\n\\n[A-Z]|$)',
      confidence: 0.3,
    };
  }
}
