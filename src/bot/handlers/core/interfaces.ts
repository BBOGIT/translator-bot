import { WebhookResponseDto } from '../../../webhook/dto';
import { Customer } from '../../../customer/types/customer.type';
import { CustomerService } from '../../../customer/customer.service';
import { MessageService } from '../../../message/message.service';
import { WordService } from '../../../word/word.service';
import { TelegramService } from '../../../telegram/telegram.service';
import { AiService } from '../../../ai/ai.service';
import { WordRepetitionJob } from '../../../jobs/word-repetition.job';

/**
 * Context object containing all necessary data for command execution
 */
export interface CommandContext {
  dto: WebhookResponseDto;
  lang: string;
  customer?: Customer;
  services: {
    customerService: CustomerService;
    messageService: MessageService;
    wordService: WordService;
    telegramService: TelegramService;
    aiService: AiService;
    wordRepetitionJob: WordRepetitionJob;
  };
}

/**
 * Interface for all command handlers
 */
export interface CommandHandler {
  /**
   * Checks if this handler can process the given command
   */
  canHandle(
    command: string,
    customerState?: string
  ): boolean;

  /**
   * Executes the command logic
   */
  execute(context: CommandContext): Promise<void>;
}
