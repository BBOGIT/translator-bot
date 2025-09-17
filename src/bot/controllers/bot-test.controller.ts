import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Logger,
  Query
} from '@nestjs/common';
import { CommandDispatcher } from '../handlers/commands/command-dispatcher';
import { WebhookResponseDto } from '../../webhook/dto';
import { WebhookTypeEnum } from '../../webhook/enum/webhook-type.enum';
import { ChannelEnum } from '../../webhook/enum/channel.enum';
import { CustomerService } from '../../customer/customer.service';
import { MessageService } from '../../message/message.service';
import { TelegramService } from '../../telegram/telegram.service';
import { AiService } from '../../ai/ai.service';
import { WordService } from '../../word/word.service';
import { WordRepetitionJob } from '../../jobs/word-repetition.job';
import { CustomerState } from '../../customer/enum/customer-state.enum';

/**
 * Test controller for bot handlers
 */
@Controller('bot-test')
export class BotTestController {
  private readonly logger = new Logger(
    BotTestController.name
  );

  constructor(
    private readonly commandDispatcher: CommandDispatcher,
    private readonly customerService: CustomerService,
    private readonly messageService: MessageService,
    private readonly telegramService: TelegramService,
    private readonly aiService: AiService,
    private readonly wordService: WordService,
    private readonly wordRepetitionJob: WordRepetitionJob
  ) {}

  /**
   * Test endpoint for simulating a webhook for testing handlers
   */
  @Post('webhook')
  async testWebhook(
    @Body() webhookDto: WebhookResponseDto
  ) {
    this.logger.log(
      `Received test webhook: ${JSON.stringify(
        webhookDto
      )}`
    );
    try {
      // Find the customer
      const customer =
        await this.customerService.findByChatId(
          webhookDto.chatId
        );

      // Create context with all the services
      const context = {
        dto: webhookDto,
        lang: webhookDto.lang,
        customer,
        services: {
          customerService: this.customerService,
          messageService: this.messageService,
          telegramService: this.telegramService,
          aiService: this.aiService,
          wordService: this.wordService,
          wordRepetitionJob:
            this.wordRepetitionJob
        }
      };

      // Dispatch command
      await this.commandDispatcher.dispatchCommand(
        context
      );

      return {
        success: true,
        message: 'Command processed'
      };
    } catch (error) {
      this.logger.error(
        `Error processing test webhook: ${error.message}`,
        error.stack
      );
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get test webhook template
   */
  @Get('template/:command')
  getTestTemplate(
    @Param('command') command: string,
    @Query('chatId') chatId?: string
  ) {
    const targetChatId = chatId || '123456789';

    // Додаємо префікс "/" до команди, якщо його немає
    const commandText = command.startsWith('/')
      ? command
      : `/${command}`;

    return {
      chatId: targetChatId,
      text: commandText,
      lang: 'uk',
      webhookType: WebhookTypeEnum.text,
      firstName: 'Test',
      lastName: 'User',
      channel: ChannelEnum.telegram,
      originalWebhook: {
        update_id: 12345,
        message: {
          message_id: 67890,
          from: {
            id: parseInt(targetChatId),
            first_name: 'Test',
            last_name: 'User',
            language_code: 'uk'
          },
          chat: {
            id: parseInt(targetChatId),
            first_name: 'Test',
            last_name: 'User',
            type: 'private'
          },
          text: commandText
        }
      }
    };
  }

  /**
   * Test customer creation endpoint
   */
  @Post('customer')
  async createTestCustomer(
    @Body('chatId') chatId?: string
  ) {
    try {
      const testChatId = chatId || '123456789';

      const testCustomer =
        await this.customerService.findByChatId(
          testChatId
        );

      if (testCustomer) {
        return {
          success: true,
          message: 'Test customer already exists',
          customer: testCustomer
        };
      }

      const newCustomer =
        await this.customerService.create({
          chatId: testChatId,
          firstName: 'Test',
          lastName: 'User',
          state: CustomerState.MainMenu,
          channel: ChannelEnum.telegram
        });

      return {
        success: true,
        message: 'Test customer created',
        customer: newCustomer
      };
    } catch (error) {
      this.logger.error(
        `Error creating test customer: ${error.message}`,
        error.stack
      );
      return {
        success: false,
        error: error.message
      };
    }
  }
}
