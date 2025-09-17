import {
  Test,
  TestingModule
} from '@nestjs/testing';
import { RepetitionCommandHandler } from './repetition.handler';
import { CommandContext } from './interfaces';
import { WebhookResponseDto } from '../../webhook/dto';
import { COMMANDS } from './constants';
import { Logger } from '@nestjs/common';
import { WebhookTypeEnum } from '../../webhook/enum/webhook-type.enum';
import { ChannelEnum } from '../../webhook/enum/channel.enum';
import { CustomerState } from '../../customer/enum/customer-state.enum';

describe('RepetitionCommandHandler', () => {
  let handler: RepetitionCommandHandler;
  let mockServices: any;

  beforeEach(async () => {
    // Mock services
    mockServices = {
      customerService: {
        update: jest.fn(),
        findByChatId: jest.fn()
      },
      messageService: {
        TelegramSendMessage: jest.fn()
      },
      wordService: {
        getLearnedWordsWithPagination: jest.fn(),
        getAll: jest.fn()
      },
      wordRepetitionJob: {
        scheduleRepetition: jest.fn()
      }
    };

    // Mock logger
    jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => ({}));
    jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => ({}));

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [RepetitionCommandHandler]
      }).compile();

    handler =
      module.get<RepetitionCommandHandler>(
        RepetitionCommandHandler
      );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('canHandle', () => {
    it('should return true for REPEAT_WORDS command', () => {
      expect(
        handler.canHandle(COMMANDS.REPEAT_WORDS)
      ).toBe(true);
    });

    it('should return true for REPEAT_WORDS_NOW command', () => {
      expect(
        handler.canHandle(
          COMMANDS.REPEAT_WORDS_NOW
        )
      ).toBe(true);
    });

    it('should return false for other commands', () => {
      expect(
        handler.canHandle(COMMANDS.START)
      ).toBe(false);
    });
  });

  describe('execute', () => {
    it('should update customer state to RepeatWordsMain', async () => {
      // Mock data
      const dto: WebhookResponseDto = {
        chatId: '123456789',
        text: COMMANDS.REPEAT_WORDS,
        lang: 'uk',
        webhookType: WebhookTypeEnum.text,
        firstName: 'Test',
        lastName: 'User',
        channel: ChannelEnum.telegram,
        originalWebhook: { update_id: 12345 }
      };

      const customer = {
        id: 1,
        chatId: '123456789',
        firstName: 'Test',
        lastName: 'User',
        state: CustomerState.MainMenu,
        channel: ChannelEnum.telegram,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const context: CommandContext = {
        dto,
        lang: 'uk',
        customer,
        services: mockServices
      };

      // Mock empty words array
      mockServices.wordService.getLearnedWordsWithPagination.mockResolvedValue(
        {
          words: [],
          total: 0
        }
      );

      // Execute
      await handler.execute(context);

      // Assertions
      expect(
        mockServices.customerService.update
      ).toHaveBeenCalledWith({
        chatId: '123456789',
        state: CustomerState.RepeatWordsMain
      });
    });

    it('should send no words message when no words available', async () => {
      // Mock services
      mockServices.wordService.getAll.mockResolvedValue(
        []
      );

      // Test context
      const context: CommandContext = {
        dto: {
          chatId: '123456789',
          text: COMMANDS.REPEAT_WORDS,
          webhookType: WebhookTypeEnum.text,
          channel: ChannelEnum.telegram,
          originalWebhook: {
            update_id: 12345,
            message: {
              message_id: 123,
              from: {
                id: 123456,
                first_name: 'Test',
                language_code: 'en'
              }
            }
          },
          lang: 'uk'
        },
        lang: 'uk',
        customer: {
          id: 1,
          chatId: '123456789',
          state: CustomerState.MainMenu,
          firstName: 'Test',
          lastName: 'User',
          channel: ChannelEnum.telegram,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        services: mockServices
      };

      // Execute
      await handler.execute(context);

      // Assertions
      expect(
        mockServices.messageService
          .TelegramSendMessage
      ).toHaveBeenCalledWith({
        chatId: '123456789',
        templateName: 'repeatWords',
        lang: 'uk'
      });
      expect(
        mockServices.customerService.update
      ).toHaveBeenCalledWith({
        chatId: '123456789',
        state: CustomerState.RepeatWordsMain
      });
    });

    it('should schedule repetition when words are available', async () => {
      // Mock words
      const mockWords = [
        {
          id: 1,
          word: 'hello',
          translation: 'привіт'
        },
        {
          id: 2,
          word: 'world',
          translation: 'світ'
        }
      ];
      mockServices.wordService.getAll.mockResolvedValue(
        mockWords
      );

      // Test context
      const context: CommandContext = {
        dto: {
          chatId: '123456789',
          text: COMMANDS.REPEAT_WORDS_NOW,
          webhookType: WebhookTypeEnum.text,
          channel: ChannelEnum.telegram,
          originalWebhook: {
            update_id: 12345,
            message: {
              message_id: 123,
              from: {
                id: 123456,
                first_name: 'Test',
                language_code: 'en'
              }
            }
          },
          lang: 'uk'
        },
        lang: 'uk',
        customer: {
          id: 1,
          chatId: '123456789',
          state: CustomerState.MainMenu,
          firstName: 'Test',
          lastName: 'User',
          channel: ChannelEnum.telegram,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        services: mockServices
      };

      // Execute
      await handler.execute(context);

      // Assertions
      expect(
        mockServices.customerService.update
      ).toHaveBeenCalledWith({
        chatId: '123456789',
        state: CustomerState.RepeatWordsNow
      });
      expect(
        mockServices.messageService
          .TelegramSendMessage
      ).toHaveBeenCalledWith({
        chatId: '123456789',
        templateName: 'repeatWordsNow',
        lang: 'uk',
        dynamicVariables: {
          repeatWordsTextNow:
            'Час повторювати слова!',
          wordId: '1',
          videoUrl:
            'https://example.com/video.mp4'
        }
      });
    });
  });
});
