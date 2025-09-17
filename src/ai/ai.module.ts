import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { AIConfig } from './config/ai.config';
import { OpenAIService } from './providers/openai.service';
import { DeepseekService } from './providers/deepseek.service';
import { MetricsModule } from '../common/metrics/metrics.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000, // Default timeout 30 seconds
      maxRedirects: 5
    }),
    ConfigModule,
    MetricsModule
  ],
  providers: [
    AIConfig,
    AiService,
    OpenAIService,
    DeepseekService
  ],
  exports: [AiService]
})
export class AiModule {}
