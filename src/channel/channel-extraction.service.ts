import {
  Injectable,
  Logger
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import {
  ChannelInfo,
  ExtractionPatterns,
  ExtractedContent,
  ChannelExtractionResult
} from './interfaces';
import { CreateChannelConfigDto } from './dto/create-channel-config.dto';
import { ChannelExtractionConfig } from '@prisma/client';

@Injectable()
export class ChannelExtractionService {
  private readonly logger = new Logger(
    ChannelExtractionService.name
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService
  ) {}

  /**
   * Основной метод для извлечения данных из сообщения канала
   */
  async extractFromChannelMessage(
    content: string,
    channelInfo: ChannelInfo
  ): Promise<ChannelExtractionResult> {
    try {
      // Ищем существующую конфигурацию для канала
      const existingConfig =
        await this.findConfigByChannelId(
          channelInfo.id
        );

      if (
        existingConfig &&
        existingConfig.isActive
      ) {
        const extractedContent =
          this.extractContentUsingConfig(
            content,
            existingConfig
          );

        if (
          extractedContent.success ||
          !existingConfig.createdByAI
        ) {
          return {
            extractedContent,
            channelInfo,
            configExists: true
          };
        }

        // AI-generated config no longer matches — regenerate patterns
        this.logger.warn(
          `AI config failed for channel ${channelInfo.id}, regenerating patterns`
        );

        const freshPatterns =
          await this.generatePatternsWithAI(
            content,
            channelInfo
          );

        const updatedConfig = await this.updateConfig(
          channelInfo.id,
          {
            wordRegex: freshPatterns.wordRegex,
            translationRegex:
              freshPatterns.translationRegex,
            examplesRegex: freshPatterns.examplesRegex
          }
        );

        if (!updatedConfig) {
          return {
            channelInfo,
            configExists: true,
            error: 'Failed to update channel config'
          };
        }

        const reExtracted =
          this.extractContentUsingConfig(
            content,
            updatedConfig
          );

        return {
          extractedContent: reExtracted,
          channelInfo,
          configExists: true
        };
      }

      // No active config — generate with AI
      this.logger.log(
        `No active config found for channel ${channelInfo.id}, generating new patterns with AI`
      );

      const patterns =
        await this.generatePatternsWithAI(
          content,
          channelInfo
        );

      // Сохраняем новую конфигурацию
      const newConfig = await this.createConfig({
        channelId: channelInfo.id,
        channelTitle: channelInfo.title,
        channelUsername: channelInfo.username,
        wordRegex: patterns.wordRegex,
        translationRegex:
          patterns.translationRegex,
        examplesRegex: patterns.examplesRegex,
        createdByAI: true,
        isActive: true
      });

      // Пытаемся извлечь данные используя новые паттерны
      const extractedContent =
        this.extractContentUsingConfig(
          content,
          newConfig
        );

      return {
        extractedContent,
        channelInfo,
        configExists: false,
        configCreated: true
      };
    } catch (error) {
      this.logger.error(
        `Error extracting from channel message: ${error.message}`,
        error.stack
      );

      return {
        channelInfo,
        configExists: false,
        error: error.message
      };
    }
  }

  /**
   * Извлекает контент используя конфигурацию канала
   */
  private extractContentUsingConfig(
    content: string,
    config: ChannelExtractionConfig
  ): ExtractedContent {
    try {
      const wordMatch = content.match(
        new RegExp(config.wordRegex, 'iu')
      );
      const translationMatch = content.match(
        new RegExp(config.translationRegex, 'iu')
      );
      const examplesMatches = [
        ...content.matchAll(
          new RegExp(config.examplesRegex, 'gisu')
        )
      ];

      if (!wordMatch || !translationMatch) {
        return {
          word: '',
          translation: '',
          examples: [],
          success: false,
          error:
            'Could not extract word or translation using current patterns'
        };
      }

      const word =
        wordMatch[1]?.trim() ||
        wordMatch[0]?.trim() ||
        '';
      const translation =
        translationMatch[1]?.trim() ||
        translationMatch[0]?.trim() ||
        '';
      const examples =
        examplesMatches.length > 0
          ? examplesMatches
              .map(
                m =>
                  m[1]?.trim() || m[0]?.trim()
              )
              .filter(Boolean)
          : [];

      // Очистка данных
      const cleanWord =
        this.cleanExtractedWord(word);
      const cleanTranslation =
        this.cleanExtractedTranslation(
          translation
        );
      const cleanExamples =
        this.cleanExtractedExamples(examples);

      return {
        word: cleanWord,
        translation: cleanTranslation,
        examples: cleanExamples,
        success: true
      };
    } catch (error) {
      this.logger.error(
        `Error extracting content using config: ${error.message}`,
        error.stack
      );

      return {
        word: '',
        translation: '',
        examples: [],
        success: false,
        error: `Regex extraction failed: ${error.message}`
      };
    }
  }

  /**
   * Генерирует паттерны для извлечения данных используя AI
   */
  private async generatePatternsWithAI(
    content: string,
    channelInfo: ChannelInfo
  ): Promise<ExtractionPatterns> {
    const prompt = `
Analyze this Telegram channel message and create JavaScript regex patterns to extract:
1. English word (main word being taught)
2. Ukrainian/Russian translation (all translations, separated by semicolons) 
3. Examples with translations (numbered examples with English and Ukrainian/Russian text)

Channel: ${channelInfo.title || channelInfo.username || 'Unknown'}
Message content:
"${content}"

Expected format example:
- Word: "genuine"  
- Translation: "подлинный; неподдельный; настоящий; истинный"
- Examples: "1️⃣ Not genuine.\nНе настоящий.\n\n2️⃣ Do you believe..."

Create regex patterns that can extract these 3 components. Return ONLY valid JSON:
{
  "wordRegex": "regex_pattern_with_capture_group",
  "translationRegex": "regex_pattern_with_capture_group",
  "examplesRegex": "regex_pattern_with_capture_group",
  "confidence": 0.95
}

Use capture groups (parentheses) to extract the main content. Make patterns flexible for similar message formats.
    `;

    const fallbackPatterns: ExtractionPatterns = {
      wordRegex: '[😸-😿]\\s*([a-zA-Z]+(?:\\s+[a-zA-Z]+)*)',
      translationRegex: '-\\s*([^\\n]+)',
      examplesRegex: '([0-9]️⃣[\\s\\S]*?)(?=\\n\\n[0-9]️⃣|\\s*$)',
      confidence: 0.3
    };

    try {
      const response =
        await this.aiService.generateRegexPatterns(
          content,
          channelInfo
        );

      const allValid = [
        response.wordRegex,
        response.translationRegex,
        response.examplesRegex
      ].every(p => this.isValidRegex(p));

      if (!allValid) {
        this.logger.warn(
          `AI returned invalid regex pattern for channel ${channelInfo.id}, using fallback`
        );
        return fallbackPatterns;
      }

      return response;
    } catch (error) {
      this.logger.error(
        `AI pattern generation failed: ${error.message}`,
        error.stack
      );

      return fallbackPatterns;
    }
  }

  private isValidRegex(pattern: string): boolean {
    try {
      new RegExp(pattern, 'u');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Находит конфигурацию по ID канала
   */
  async findConfigByChannelId(
    channelId: string
  ): Promise<ChannelExtractionConfig | null> {
    return this.prisma.channelExtractionConfig.findUnique(
      {
        where: { channelId }
      }
    );
  }

  /**
   * Создает новую конфигурацию канала
   */
  async createConfig(
    data: CreateChannelConfigDto
  ): Promise<ChannelExtractionConfig> {
    return this.prisma.channelExtractionConfig.create(
      {
        data: {
          channelId: data.channelId,
          channelTitle: data.channelTitle,
          channelUsername: data.channelUsername,
          wordRegex: data.wordRegex,
          translationRegex: data.translationRegex,
          examplesRegex: data.examplesRegex,
          isActive: data.isActive ?? true,
          createdByAI: data.createdByAI ?? false
        }
      }
    );
  }

  /**
   * Очистка извлеченного слова
   */
  private cleanExtractedWord(
    word: string
  ): string {
    return word
      .replace(/[^a-zA-Z\s]/g, '')
      .trim()
      .toLowerCase();
  }

  /**
   * Очистка извлеченного перевода
   */
  private cleanExtractedTranslation(
    translation: string
  ): string {
    return translation
      .replace(/^\s*[-–—]\s*/, '')
      .trim();
  }

  /**
   * Очистка извлеченных примеров
   */
  private cleanExtractedExamples(
    examples: string[]
  ): string[] {
    return examples.map(e => e.trim()).filter(Boolean);
  }

  /**
   * Получить все активные конфигурации
   */
  async getAllActiveConfigs(): Promise<
    ChannelExtractionConfig[]
  > {
    return this.prisma.channelExtractionConfig.findMany(
      {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      }
    );
  }

  /**
   * Обновить конфигурацию канала
   */
  async updateConfig(
    channelId: string,
    data: Partial<CreateChannelConfigDto>
  ): Promise<ChannelExtractionConfig | null> {
    const existingConfig =
      await this.findConfigByChannelId(channelId);

    if (!existingConfig) {
      return null;
    }

    return this.prisma.channelExtractionConfig.update(
      {
        where: { channelId },
        data
      }
    );
  }

  /**
   * Деактивировать конфигурацию канала
   */
  async deactivateConfig(
    channelId: string
  ): Promise<boolean> {
    try {
      await this.prisma.channelExtractionConfig.update(
        {
          where: { channelId },
          data: { isActive: false }
        }
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to deactivate config for channel ${channelId}: ${error.message}`
      );
      return false;
    }
  }
}
