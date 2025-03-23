// src/jobs/jobs.module.ts
import { Module } from '@nestjs/common';
import { WordRepetitionJob } from './word-repetition.job';
import { PrismaModule } from '../prisma/prisma.module';
import { MessageModule } from '../message/message.module';

@Module({
  imports: [PrismaModule, MessageModule],
  providers: [WordRepetitionJob],
  exports: [WordRepetitionJob]
})
export class JobsModule {}
