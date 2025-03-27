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
