import {
  Test,
  TestingModule
} from '@nestjs/testing';
import { BotTestController } from './bot-test.controller';
import { CommandDispatcher } from '../handlers/command-dispatcher';
import { CustomerService } from '../../customer/customer.service';
import { MessageService } from '../../message/message.service';
import { TelegramService } from '../../telegram/telegram.service';
import { AiService } from '../../ai/ai.service';
import { WordService } from '../../word/word.service';
import { WordRepetitionJob } from '../../jobs/word-repetition.job';
import { WebhookTypeEnum } from '../../webhook/enum/webhook-type.enum';
import { ChannelEnum } from '../../webhook/enum/channel.enum';
import { CustomerState } from '../../customer/enum/customer-state.enum';

// Спрощений тест для перевірки основних функцій
describe('BotTestController', () => {
  let controller: BotTestController;

  const mockCommandDispatcher = {
    dispatchCommand: jest.fn()
  };
  const mockCustomerService = {
    findByChatId: jest.fn(),
    create: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [BotTestController],
        providers: [
          {
            provide: CommandDispatcher,
            useValue: mockCommandDispatcher
          },
          {
            provide: CustomerService,
            useValue: mockCustomerService
          },
          {
            provide: MessageService,
            useValue: {}
          },
          {
            provide: TelegramService,
            useValue: {}
          },
          { provide: AiService, useValue: {} },
          { provide: WordService, useValue: {} },
          {
            provide: WordRepetitionJob,
            useValue: {}
          }
        ]
      }).compile();

    controller = module.get<BotTestController>(
      BotTestController
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return HTML content from getTestPage', () => {
    const result = controller.getTestPage();
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain(
      '<title>Bot Handler Test</title>'
    );
  });
});
