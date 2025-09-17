import {
  Test,
  TestingModule
} from '@nestjs/testing';
import { MessageService } from './message.service';
import { TelegramService } from '../telegram/telegram.service';
import { RedisService } from '../redis/redis.service';

// Спрощений мінімальний тест
describe('MessageService', () => {
  let service: MessageService;

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          MessageService,
          {
            provide: TelegramService,
            useValue: {}
          },
          { provide: RedisService, useValue: {} }
        ]
      }).compile();

    service = module.get<MessageService>(
      MessageService
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
