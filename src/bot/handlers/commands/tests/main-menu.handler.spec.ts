import {
  Test,
  TestingModule
} from '@nestjs/testing';
import { MainMenuCommandHandler } from './main-menu.handler';
import { CommandContext } from './interfaces';
import { WebhookResponseDto } from '../../webhook/dto';
import { COMMANDS } from './constants';
import { Logger } from '@nestjs/common';
import { WebhookTypeEnum } from '../../webhook/enum/webhook-type.enum';
import { ChannelEnum } from '../../webhook/enum/channel.enum';
import { CustomerState } from '../../customer/enum/customer-state.enum';

describe('MainMenuCommandHandler', () => {
  let handler: MainMenuCommandHandler;
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
      telegramService: {
        sendMessage: jest.fn()
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
        providers: [MainMenuCommandHandler]
      }).compile();

    handler = module.get<MainMenuCommandHandler>(
      MainMenuCommandHandler
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('canHandle', () => {
    it('should return true for START command', () => {
      expect(
        handler.canHandle(COMMANDS.START)
      ).toBe(true);
    });

    it('should return true for MAIN_MENU command', () => {
      expect(
        handler.canHandle(COMMANDS.MAIN_MENU)
      ).toBe(true);
    });

    it('should return false for other commands', () => {
      expect(
        handler.canHandle(COMMANDS.LEARN_WORDS)
      ).toBe(false);
    });
  });

  describe('execute', () => {
    it('should update customer state to MainMenu', async () => {
      // Mock data
      const dto: WebhookResponseDto = {
        chatId: '123456789',
        text: COMMANDS.START,
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
        state: CustomerState.WaitingForWordInput,
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

      // Execute
      await handler.execute(context);

      // Assertions
      expect(
        mockServices.customerService.update
      ).toHaveBeenCalledWith({
        chatId: '123456789',
        state: CustomerState.MainMenu
      });
    });

    it('should send main menu message', async () => {
      // Mock data
      const dto: WebhookResponseDto = {
        chatId: '123456789',
        text: COMMANDS.START,
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
        state: CustomerState.WaitingForWordInput,
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

      // Execute
      await handler.execute(context);

      // Assertions
      expect(
        mockServices.messageService
          .TelegramSendMessage
      ).toHaveBeenCalledWith({
        chatId: '123456789',
        templateName: 'mainMenu',
        lang: 'uk'
      });
    });
  });
});
