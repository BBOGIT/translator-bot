import { Module } from '@nestjs/common';
import { ChannelExtractionService } from './channel-extraction.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  providers: [ChannelExtractionService],
  exports: [ChannelExtractionService]
})
export class ChannelModule {}
