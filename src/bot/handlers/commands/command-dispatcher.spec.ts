import {
  Test,
  TestingModule
} from '@nestjs/testing';
import { CommandDispatcher } from './command-dispatcher';
import { MainMenuCommandHandler } from './main-menu.handler';
import { LearnWordsCommandHandler } from './learn-words.handler';
import { RepetitionCommandHandler } from './repetition.handler';
import { ProgressCommandHandler } from './progress.handler';
import { WordProcessingHandler } from './word.handler';
import { CustomerHandler } from './customer.handler';
import { CommandContext } from './interfaces';
import { WebhookResponseDto } from '../../webhook/dto';
import { Logger } from '@nestjs/common';
import { COMMANDS } from './constants';
import { WebhookTypeEnum } from '../../webhook/enum/webhook-type.enum';
import { ChannelEnum } from '../../webhook/enum/channel.enum';
import { CustomerState } from '../../customer/enum/customer-state.enum';

// Mock all handlers and services
const createMockHandler = (name: string) => {
  return {
    canHandle: jest.fn(),
    execute: jest.fn(),
    constructor: { name }
  };
};

const createMockServices = () => {
  return {
    customerService: {
      update: jest.fn(),
      findByChatId: jest.fn()
    },
    messageService: {
      TelegramSendMessage: jest.fn()
    },
    wordService: {
      getLearnedWordsWithPagination: jest.fn()
    },
    telegramService: {
      sendMessage: jest.fn()
    },
    aiService: {
      processText: jest.fn()
    },
    wordRepetitionJob: {
      scheduleRepetition: jest.fn()
    }
  };
};

describe('CommandDispatcher', () => {
  let dispatcher: CommandDispatcher;
  let mainMenuHandler: MainMenuCommandHandler;
  let learnWordsHandler: LearnWordsCommandHandler;
  let repetitionHandler: RepetitionCommandHandler;
  let progressHandler: ProgressCommandHandler;
  let wordHandler: WordProcessingHandler;
  let customerHandler: CustomerHandler;
  let mockServices: any;
  let mockMessageService: any;
  let mockCustomerHandler: any;
  let loggerSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let mockCommandContext: CommandContext;

  beforeEach(async () => {
    // Create mock services
    mockMessageService = {
      TelegramSendMessage: jest
        .fn()
        .mockResolvedValue(undefined)
    };

    mockServices = {
      messageService: mockMessageService,
      customerService: {
        create: jest.fn(),
        update: jest.fn()
      }
    };

    mockCustomerHandler = {
      handleNewCustomer: jest
        .fn()
        .mockResolvedValue(undefined)
    };

    // Set up mock context
    mockCommandContext = {
      dto: {
        chatId: '123456789',
        text: '/test',
        lang: 'uk',
        webhookType: WebhookTypeEnum.text,
        firstName: 'Test',
        lastName: 'User',
        channel: ChannelEnum.telegram,
        originalWebhook: { update_id: 12345 }
      },
      lang: 'uk',
      customer: {
        id: 1,
        chatId: '123456789',
        firstName: 'Test',
        lastName: 'User',
        state: CustomerState.MainMenu,
        channel: ChannelEnum.telegram,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      services: mockServices
    };

    // Create spies
    loggerSpy = jest.spyOn(
      Logger.prototype,
      'log'
    );
    errorSpy = jest.spyOn(
      Logger.prototype,
      'error'
    );

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          CommandDispatcher,
          {
            provide: MainMenuCommandHandler,
            useValue: {
              canHandle: jest.fn(),
              execute: jest
                .fn()
                .mockResolvedValue(undefined)
            }
          },
          {
            provide: LearnWordsCommandHandler,
            useValue: {
              canHandle: jest.fn(),
              execute: jest
                .fn()
                .mockResolvedValue(undefined)
            }
          },
          {
            provide: RepetitionCommandHandler,
            useValue: {
              canHandle: jest.fn(),
              execute: jest
                .fn()
                .mockResolvedValue(undefined)
            }
          },
          {
            provide: ProgressCommandHandler,
            useValue: {
              canHandle: jest.fn(),
              execute: jest
                .fn()
                .mockResolvedValue(undefined)
            }
          },
          {
            provide: WordProcessingHandler,
            useValue: {
              canHandle: jest.fn(),
              execute: jest
                .fn()
                .mockResolvedValue(undefined)
            }
          },
          {
            provide: CustomerHandler,
            useValue: mockCustomerHandler
          }
        ]
      }).compile();

    dispatcher = module.get<CommandDispatcher>(
      CommandDispatcher
    );
    mainMenuHandler =
      module.get<MainMenuCommandHandler>(
        MainMenuCommandHandler
      );
    learnWordsHandler =
      module.get<LearnWordsCommandHandler>(
        LearnWordsCommandHandler
      );
    repetitionHandler =
      module.get<RepetitionCommandHandler>(
        RepetitionCommandHandler
      );
    progressHandler =
      module.get<ProgressCommandHandler>(
        ProgressCommandHandler
      );
    wordHandler =
      module.get<WordProcessingHandler>(
        WordProcessingHandler
      );
    customerHandler = module.get<CustomerHandler>(
      CustomerHandler
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(dispatcher).toBeDefined();
  });

  describe('dispatchCommand', () => {
    it('should dispatch commands to the correct handler', async () => {
      // Setup
      const mockHandler = {
        canHandle: jest.fn(),
        execute: jest.fn(),
        constructor: { name: 'MockHandler' }
      };

      // Setup handler to handle test command
      mockHandler.canHandle.mockImplementation(
        command => command === '/test'
      );

      const dispatcher = new CommandDispatcher(
        null,
        null,
        null,
        null,
        null,
        mockCustomerHandler as any
      );
      (dispatcher as any).handlers = [
        mockHandler
      ];

      // Test command dispatch
      await dispatcher.dispatchCommand(
        mockCommandContext
      );

      // Assertions
      expect(
        mockHandler.canHandle
      ).toHaveBeenCalledWith('/test');
      expect(
        mockHandler.execute
      ).toHaveBeenCalledWith(mockCommandContext);
      expect(loggerSpy).toHaveBeenCalledWith(
        'Handler found: MockHandler'
      );
    });

    it('should send not found message when no handler matches', async () => {
      // Setup handlers to reject all commands
      const mockHandler = {
        canHandle: jest
          .fn()
          .mockReturnValue(false),
        execute: jest.fn(),
        constructor: { name: 'MockHandler' }
      };

      const dispatcher = new CommandDispatcher(
        null,
        null,
        null,
        null,
        null,
        mockCustomerHandler as any
      );
      (dispatcher as any).handlers = [
        mockHandler
      ];

      // Test command dispatch with no matching handler
      await dispatcher.dispatchCommand(
        mockCommandContext
      );

      // Assertions
      expect(
        mockHandler.canHandle
      ).toHaveBeenCalledWith('/test');
      expect(
        mockHandler.execute
      ).not.toHaveBeenCalled();
      expect(
        mockMessageService.TelegramSendMessage
      ).toHaveBeenCalledWith({
        chatId: '123456789',
        templateName: 'notFoundCommand',
        lang: 'uk'
      });
    });

    it('should handle new customer when no customer exists', async () => {
      // Setup command context with no customer
      const contextWithoutCustomer = {
        ...mockCommandContext,
        customer: null
      };

      // Setup handlers to reject all commands
      const mockHandler = {
        canHandle: jest
          .fn()
          .mockReturnValue(false),
        execute: jest.fn(),
        constructor: { name: 'MockHandler' }
      };

      const dispatcher = new CommandDispatcher(
        null,
        null,
        null,
        null,
        null,
        mockCustomerHandler as any
      );
      (dispatcher as any).handlers = [
        mockHandler
      ];

      // Test command dispatch with no customer
      await dispatcher.dispatchCommand(
        contextWithoutCustomer
      );

      // Assertions
      expect(
        mockHandler.canHandle
      ).toHaveBeenCalledWith('/test');
      expect(
        mockCustomerHandler.handleNewCustomer
      ).toHaveBeenCalledWith(
        contextWithoutCustomer
      );
      expect(
        mockMessageService.TelegramSendMessage
      ).not.toHaveBeenCalled();
    });

    it('should handle errors and send error message', async () => {
      // Setup handler to throw error
      const mockHandler = {
        canHandle: jest
          .fn()
          .mockImplementation(() => {
            throw new Error('Test error');
          }),
        execute: jest.fn(),
        constructor: { name: 'MockHandler' }
      };

      const dispatcher = new CommandDispatcher(
        null,
        null,
        null,
        null,
        null,
        customerHandler as any
      );
      (dispatcher as any).handlers = [
        mockHandler
      ];

      // Test command dispatch with error
      await dispatcher.dispatchCommand(
        mockCommandContext
      );

      // Assertions
      expect(errorSpy).toHaveBeenCalledWith(
        'Error dispatching command: Test error',
        expect.any(String)
      );
      expect(
        mockMessageService.TelegramSendMessage
      ).toHaveBeenCalledWith({
        chatId: '123456789',
        templateName: 'errorMessage',
        lang: 'uk',
        dynamicVariables: {
          errorMessage: expect.any(String)
        }
      });
    });
  });
});
