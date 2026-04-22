import {
  Test,
  TestingModule
} from '@nestjs/testing';
import { CustomerHandler } from './customer.handler';
import { CommandContext } from './interfaces';
import { WebhookResponseDto } from '../../webhook/dto';
import { Logger } from '@nestjs/common';
import { WebhookTypeEnum } from '../../webhook/enum/webhook-type.enum';
import { ChannelEnum } from '../../webhook/enum/channel.enum';
import { CustomerState } from '../../customer/enum/customer-state.enum';

describe('CustomerHandler', () => {
  let handler: CustomerHandler;
  let mockServices: any;

  beforeEach(async () => {
    // Mock services
    mockServices = {
      customerService: {
        create: jest.fn(),
        update: jest.fn()
      },
      messageService: {
        TelegramSendMessage: jest.fn()
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
        providers: [CustomerHandler]
      }).compile();

    handler = module.get<CustomerHandler>(
      CustomerHandler
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('handleNewCustomer', () => {
    it('should create a new customer and send welcome message', async () => {
      // Setup
      mockServices.customerService.create.mockResolvedValue(
        {
          id: 1,
          chatId: '123456789',
          firstName: 'Test',
          lastName: 'User'
        }
      );

      const context: CommandContext = {
        dto: {
          chatId: '123456789',
          text: '/start',
          webhookType: WebhookTypeEnum.text,
          channel: ChannelEnum.telegram,
          firstName: 'Test',
          lastName: 'User',
          originalWebhook: { update_id: 12345 },
          lang: 'uk'
        },
        lang: 'uk',
        customer: null,
        services: mockServices
      };

      // Execute
      await handler.handleNewCustomer(context);

      // Assertions
      expect(
        mockServices.customerService.create
      ).toHaveBeenCalledWith({
        chatId: '123456789',
        firstName: 'Test',
        lastName: 'User',
        channel: ChannelEnum.telegram,
        state: CustomerState.WelcomeMessage
      });
      expect(
        mockServices.messageService
          .TelegramSendMessage
      ).toHaveBeenNthCalledWith(1, {
        chatId: '123456789',
        templateName: 'welcomeMessage',
        lang: 'uk'
      });
      expect(
        mockServices.customerService.update
      ).toHaveBeenCalledWith({
        chatId: '123456789',
        state: CustomerState.MainMenu
      });
      expect(
        mockServices.messageService
          .TelegramSendMessage
      ).toHaveBeenNthCalledWith(2, {
        chatId: '123456789',
        templateName: 'mainMenu',
        lang: 'uk'
      });
    });

    it('should handle errors when creating a customer', async () => {
      // Setup
      const error = new Error(
        'Failed to create customer'
      );
      mockServices.customerService.create.mockRejectedValue(
        error
      );

      const context: CommandContext = {
        dto: {
          chatId: '123456789',
          text: '/start',
          webhookType: WebhookTypeEnum.text,
          channel: ChannelEnum.telegram,
          firstName: 'Test',
          lastName: 'User',
          originalWebhook: { update_id: 12345 },
          lang: 'uk'
        },
        lang: 'uk',
        customer: null,
        services: mockServices
      };

      // Execute - should not throw
      await handler.handleNewCustomer(context);

      // Assertions - should log error but not crash
      expect(
        mockServices.customerService.create
      ).toHaveBeenCalled();
      expect(
        Logger.prototype.error
      ).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to create new customer'
        ),
        expect.anything()
      );
      expect(
        mockServices.messageService
          .TelegramSendMessage
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
