import {
  Test,
  TestingModule
} from '@nestjs/testing';
import { WordService } from './word.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

// Спрощений мінімальний тест
describe('WordService', () => {
  let service: WordService;

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          WordService,
          {
            provide: PrismaService,
            useValue: {}
          },
          { provide: AiService, useValue: {} }
        ]
      }).compile();

    service =
      module.get<WordService>(WordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
