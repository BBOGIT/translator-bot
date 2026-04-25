import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { AIConfig } from './config/ai.config';
import { OpenAIService } from './providers/openai.service';
import { DeepseekService } from './providers/deepseek.service';
import { GeminiService } from './providers/gemini.service';
import { MetricsModule } from '../common/metrics/metrics.module';
import { AICacheService } from './services/ai-cache.service';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000, // Default timeout 30 seconds
      maxRedirects: 5
    }),
    ConfigModule,
    MetricsModule,
    CacheModule
  ],
  providers: [
    AIConfig,
    AiService,
    OpenAIService,
    DeepseekService,
    GeminiService,
    AICacheService
  ],
  exports: [AiService, AICacheService]
})
export class AiModule {}
