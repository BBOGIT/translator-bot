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
export class OpenAIService
  implements IAIProvider
{
  private readonly logger = new Logger(
    OpenAIService.name
  );
  private readonly openai: OpenAI;

  constructor(private readonly config: AIConfig) {
    this.openai = new OpenAI({
      apiKey: this.config.openAIConfig.apiKey
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
            content: `You are a translator assistant. Always respond in the following JSON format: 
              { "extractedText": "The word in English",
                "translation": "Ukrainian translation of the text",
                "examples": "example1 in English", "example2 in English", "example3 in English"
              }`
          },
          {
            role: 'user',
            content: `Translate this English text to Ukrainian and provide usage examples: "${text}"`
          }
        ];

      const completion =
        await this.openai.chat.completions.create(
          {
            model: this.config.openAIConfig.model,
            messages,
            max_tokens:
              this.config.openAIConfig.maxTokens,
            temperature:
              this.config.openAIConfig
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
              this.config.openAIConfig.imageModel,
            messages: [
              {
                role: 'system',
                content: `You are a translator assistant. First extract the English text from the image, then provide the Ukrainian translation. If there are many words, choose the most difficult word.`
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Extract the most complex or challenging English word or phrase from the image, then translate it to Ukrainian. Provide three practical usage examples of this word/phrase in English sentences.

Respond in the following JSON format:
{
  "extractedText": "The most complex English word or phrase identified in the image",
  "translation": "Ukrainian translation of the extracted text",
  "examples": ["Example sentence 1 using the word/phrase in English", "Example sentence 2 using the word/phrase in English", "Example sentence 3 using the word/phrase in English"]
}`
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
              this.config.openAIConfig.maxTokens,
            temperature:
              this.config.openAIConfig
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

        try {
          // Try to clean up the JSON string before re-attempting to parse
          let cleanContent = content;

          // Remove trailing tabs, spaces, or other control characters
          cleanContent = cleanContent.replace(
            /\t+$/g,
            ''
          );

          // Fix common issues with examples format
          if (
            cleanContent.includes(
              '"examples":'
            ) &&
            !cleanContent.includes(
              '"examples": ['
            )
          ) {
            const examplesMatches =
              cleanContent.match(
                /"examples":\s*"(.+?)"/
              );
            if (
              examplesMatches &&
              examplesMatches[1]
            ) {
              const examplesText =
                examplesMatches[1];
              const fixedExamples = `"examples": ["${examplesText}"]`;
              cleanContent = cleanContent.replace(
                /"examples":\s*"(.+?)"/,
                fixedExamples
              );
            }
          }

          const reparsedResponse = JSON.parse(
            cleanContent
          ) as AIResponse;
          this.validateResponse(reparsedResponse);
          return this.formatResponse(
            reparsedResponse
          );
        } catch (reparseError) {
          // If all parsing attempts fail, throw the original error
          throw new AIValidationError(
            'Invalid JSON response from OpenAI'
          );
        }
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
      extractedText: response.extractedText,
      translation: response.translation.trim(),
      examples: Array.isArray(response.examples)
        ? response.examples
        : response.examples.trim().split('\n')
    };
  }
}
