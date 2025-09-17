// src/jobs/jobs.module.ts
import { Module } from '@nestjs/common';
import { WordRepetitionJob } from './word-repetition.job';
import { PrismaModule } from '../prisma/prisma.module';
import { MessageModule } from '../message/message.module';
import { WordModule } from '../word/word.module';

@Module({
  imports: [
    PrismaModule,
    MessageModule,
    WordModule
  ],
  providers: [WordRepetitionJob],
  exports: [WordRepetitionJob]
})
export class JobsModule {}
