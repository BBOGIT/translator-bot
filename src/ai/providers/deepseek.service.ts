import {
  Injectable,
  Logger
} from '@nestjs/common';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat';
import { AIConfig } from '../config/ai.config';
import { IAIProvider } from '../interfaces/ai-provider.interface';
import { AIResponse } from '../interfaces/ai-response.interface';
import { AIProviderError } from '../../common/errors/domain-errors';

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
        throw new AIProviderError(
          'Deepseek',
          'Empty response from Deepseek',
          {
            errorCode: 'DEEPSEEK_EMPTY_RESPONSE',
            reportable: false
          }
        );
      }

      try {
        // Clean up content and fix common format issues before parsing
        let cleanContent = content
          .replace(/\t+$/g, '')
          .replace(/\n\s+\n/g, '');

        // Fix numbered examples format: "examples": "1. First example", "2. Second example"
        if (
          cleanContent.includes('"examples":') &&
          (cleanContent.match(
            /"examples":\s*"[^"]*?[0-9]+\.\s+[^"]*?"/
          ) ||
            cleanContent.match(
              /"examples":\s*"[^"]*?"[\s,]+"[0-9]+\.\s+/
            ))
        ) {
          // Extract all examples (including those split across multiple properties)
          const examplesRegex =
            /"examples":\s*"([^"]*)"|"([0-9]+\.\s+[^"]*)"/g;
          const examples = [];
          let match;

          while (
            (match =
              examplesRegex.exec(
                cleanContent
              )) !== null
          ) {
            const example = match[1] || match[2];
            if (example) examples.push(example);
          }

          // Join all examples into one string
          const allExamples = examples.join(' ');

          // Split by numbered pattern and filter out empty strings
          const splitExamples = allExamples
            .split(/(?=[0-9]+\.\s+)/)
            .filter(ex => ex.trim().length > 0)
            .map(ex => ex.trim());

          // Create proper JSON array of examples
          const fixedExamplesJson =
            JSON.stringify(splitExamples);

          // Replace the incorrect examples format with proper JSON array
          cleanContent = cleanContent.replace(
            /"examples":\s*"[^"]*?"(?:[\s,]+"[0-9]+\.\s+[^"]*?")*/,
            `"examples": ${fixedExamplesJson}`
          );
        } else {
          // Apply the original fix for non-numbered examples
          cleanContent = cleanContent.replace(
            /(\n|,)\s+"examples":\s+"([^"]+)"/g,
            '$1"examples": ["$2"]'
          );
        }

        const parsedResponse = JSON.parse(
          cleanContent
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
        throw new AIProviderError(
          'Deepseek',
          'Invalid JSON response from Deepseek',
          {
            cause: parseError,
            errorCode: 'DEEPSEEK_PARSE_ERROR',
            reportable: true
          }
        );
      }
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }

      let statusCode: number | undefined;
      let errorCode =
        'DEEPSEEK_TEXT_PROCESSING_FAILED';

      if (error instanceof OpenAI.APIError) {
        statusCode = error.status;
        if (error.code) {
          errorCode = `DEEPSEEK_API_ERROR_${error.code.toUpperCase()}`;
        } else {
          errorCode =
            'DEEPSEEK_API_ERROR_UNKNOWN';
        }
      }

      this.logger.error(
        `Deepseek text processing error: ${error.message}`,
        {
          originalError: error,
          stack: error.stack
        }
      );

      throw new AIProviderError(
        'Deepseek',
        `Deepseek text processing failed: ${error.message}`,
        {
          cause: error,
          statusCode,
          errorCode,
          reportable: true
        }
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
        throw new AIProviderError(
          'Deepseek',
          'Invalid response format from Deepseek vision API',
          {
            errorCode:
              'DEEPSEEK_IMAGE_EMPTY_RESPONSE',
            reportable: false
          }
        );
      }

      try {
        // Clean up content and fix common format issues before parsing
        let cleanContent = content
          .replace(/\t+$/g, '')
          .replace(/\n\s+\n/g, '');

        // Fix numbered examples format: "examples": "1. First example", "2. Second example"
        if (
          cleanContent.includes('"examples":') &&
          (cleanContent.match(
            /"examples":\s*"[^"]*?[0-9]+\.\s+[^"]*?"/
          ) ||
            cleanContent.match(
              /"examples":\s*"[^"]*?"[\s,]+"[0-9]+\.\s+/
            ))
        ) {
          // Extract all examples (including those split across multiple properties)
          const examplesRegex =
            /"examples":\s*"([^"]*)"|"([0-9]+\.\s+[^"]*)"/g;
          const examples = [];
          let match;

          while (
            (match =
              examplesRegex.exec(
                cleanContent
              )) !== null
          ) {
            const example = match[1] || match[2];
            if (example) examples.push(example);
          }

          // Join all examples into one string
          const allExamples = examples.join(' ');

          // Split by numbered pattern and filter out empty strings
          const splitExamples = allExamples
            .split(/(?=[0-9]+\.\s+)/)
            .filter(ex => ex.trim().length > 0)
            .map(ex => ex.trim());

          // Create proper JSON array of examples
          const fixedExamplesJson =
            JSON.stringify(splitExamples);

          // Replace the incorrect examples format with proper JSON array
          cleanContent = cleanContent.replace(
            /"examples":\s*"[^"]*?"(?:[\s,]+"[0-9]+\.\s+[^"]*?")*/,
            `"examples": ${fixedExamplesJson}`
          );
        } else {
          // Apply the original fix for non-numbered examples
          cleanContent = cleanContent.replace(
            /(\n|,)\s+"examples":\s+"([^"]+)"/g,
            '$1"examples": ["$2"]'
          );
        }

        const parsedResponse = JSON.parse(
          cleanContent
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
        throw new AIProviderError(
          'Deepseek',
          'Invalid JSON response from Deepseek vision API',
          {
            cause: parseError,
            errorCode:
              'DEEPSEEK_IMAGE_PARSE_ERROR',
            reportable: true
          }
        );
      }
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }

      let statusCode: number | undefined;
      let errorCode =
        'DEEPSEEK_IMAGE_PROCESSING_FAILED';

      if (error instanceof OpenAI.APIError) {
        statusCode = error.status;
        if (error.code) {
          errorCode = `DEEPSEEK_API_ERROR_${error.code.toUpperCase()}`;
        } else {
          errorCode =
            'DEEPSEEK_API_ERROR_UNKNOWN';
        }
      }

      this.logger.error(
        `Deepseek image processing error: ${error.message}`,
        {
          originalError: error,
          stack: error.stack
        }
      );

      throw new AIProviderError(
        'Deepseek',
        `Deepseek image processing failed: ${error.message}`,
        {
          cause: error,
          statusCode,
          errorCode,
          reportable: true
        }
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
      throw new AIProviderError(
        'Deepseek',
        'Invalid response format: missing required fields',
        {
          errorCode:
            'DEEPSEEK_INVALID_RESPONSE_FORMAT',
          reportable: true
        }
      );
    }

    if (
      typeof response.translation !== 'string'
    ) {
      throw new AIProviderError(
        'Deepseek',
        'Invalid response format: translation must be a string',
        {
          errorCode:
            'DEEPSEEK_INVALID_RESPONSE_FORMAT',
          reportable: true
        }
      );
    }

    if (
      !Array.isArray(response.examples) &&
      typeof response.examples !== 'string'
    ) {
      throw new AIProviderError(
        'Deepseek',
        'Invalid response format: examples must be an array or string',
        {
          errorCode:
            'DEEPSEEK_INVALID_RESPONSE_FORMAT',
          reportable: true
        }
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
