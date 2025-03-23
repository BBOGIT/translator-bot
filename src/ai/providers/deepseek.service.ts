import {
  Injectable,
  Logger
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat';
import { AIConfig } from '../config/ai.config';
import { IAIProvider } from '../interfaces/ai-provider.interface';
import { AIResponse } from '../interfaces/ai-response.interface';
import {
  AIServiceError,
  AIValidationError
} from '../errors/ai.errors';

@Injectable()
export class DeepseekService
  implements IAIProvider
{
  private readonly logger = new Logger(
    DeepseekService.name
  );
  private readonly openai: OpenAI;

  constructor(private readonly config: AIConfig) {
    this.openai = new OpenAI({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: this.config.deepseekConfig.apiKey
    });
  }

  async processText(
    text: string
  ): Promise<AIResponse> {
    try {
      const messages: ChatCompletionMessageParam[] =
        [
          {
            role: 'system',
            content:
              'You are a translator assistant. Always respond in the following JSON format:\n{\n"translation": "Ukrainian translation of the text",\n"examples": ["example1", "example2", "example3"]\n}'
          },
          {
            role: 'user',
            content: `Translate this English text to Ukrainian and provide usage examples: "${text}"`
          }
        ];

      const completion =
        await this.openai.chat.completions.create(
          {
            model:
              this.config.deepseekConfig.model,
            messages,
            max_tokens:
              this.config.deepseekConfig
                .maxTokens,
            temperature:
              this.config.deepseekConfig
                .temperature,
            response_format: {
              type: 'json_object'
            }
          }
        );

      const content =
        completion.choices[0]?.message?.content;

      if (!content) {
        throw new AIValidationError(
          'Empty response from OpenAI'
        );
      }

      try {
        const parsedResponse = JSON.parse(
          content
        ) as AIResponse;
        this.validateResponse(parsedResponse);
        return this.formatResponse(
          parsedResponse
        );
      } catch (parseError) {
        this.logger.error(
          'Failed to parse OpenAI response:',
          {
            content,
            error: parseError
          }
        );
        throw new AIValidationError(
          'Invalid JSON response from OpenAI'
        );
      }
    } catch (error) {
      if (error instanceof AIValidationError) {
        throw error;
      }
      throw new AIServiceError(
        'OpenAI text processing failed',
        error
      );
    }
  }

  async processImage(
    imageBuffer: Buffer
  ): Promise<AIResponse> {
    try {
      const base64Image =
        imageBuffer.toString('base64');

      const completion =
        await this.openai.chat.completions.create(
          {
            model:
              this.config.deepseekConfig
                .imageModel,
            messages: [
              {
                role: 'system',
                content: `You are a translator assistant. When provided with text or images, respond in the following JSON format:
  
  {
  "translation": "Ukrainian translation of the text or image content",
  "examples": ["example1", "example2", "example3"]
  }
  
  If an image is provided, first extract the English text from the image, then provide the Ukrainian translation.`
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Translate the text in this image to Ukrainian and provide usage examples:'
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:image/jpeg;base64,${base64Image}`
                    }
                  }
                ]
              }
            ],
            max_tokens:
              this.config.deepseekConfig
                .maxTokens,
            temperature:
              this.config.deepseekConfig
                .temperature,
            response_format: {
              type: 'json_object'
            }
          }
        );

      const content =
        completion.choices[0]?.message?.content;

      if (!content) {
        throw new AIValidationError(
          'Invalid response format from OpenAI vision API'
        );
      }

      try {
        const parsedResponse = JSON.parse(
          content
        ) as AIResponse;
        this.validateResponse(parsedResponse);
        return this.formatResponse(
          parsedResponse
        );
      } catch (parseError) {
        this.logger.error(
          'Failed to parse OpenAI response:',
          {
            content,
            error: parseError
          }
        );
        throw new AIValidationError(
          'Invalid JSON response from OpenAI'
        );
      }
    } catch (error) {
      if (error instanceof AIValidationError) {
        throw error;
      }
      throw new AIServiceError(
        'OpenAI image processing failed',
        error
      );
    }
  }

  private validateResponse(
    response: AIResponse
  ): void {
    if (
      !response.translation ||
      !response.examples
    ) {
      throw new AIValidationError(
        'Invalid response format: missing required fields'
      );
    }

    if (
      typeof response.translation !== 'string'
    ) {
      throw new AIValidationError(
        'Invalid response format: translation must be a string'
      );
    }

    if (
      !Array.isArray(response.examples) &&
      typeof response.examples !== 'string'
    ) {
      throw new AIValidationError(
        'Invalid response format: examples must be an array or string'
      );
    }
  }

  private formatResponse(
    response: AIResponse
  ): AIResponse {
    return {
      translation: response.translation.trim(),
      examples: Array.isArray(response.examples)
        ? response.examples
        : response.examples.trim().split('\n')
    };
  }
}
