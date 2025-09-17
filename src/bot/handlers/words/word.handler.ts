import {
  Injectable,
  Logger
} from '@nestjs/common';
import {
  CommandContext,
  CommandHandler
} from '../core/interfaces';
import { COMMANDS } from '../core/constants';
import { CustomerState } from '../../../customer/enum/customer-state.enum';

/**
 * Обробник для обробки команд, пов'язаних зі словами, який делегує обробку іншим обробникам
 * Це класс-контейнер, який був спростований, а його функціонал був розподілений між:
 * - LearningWordsHandler - обробка навчання новим словам
 * - WordTranslationHandler - обробка введення перекладів
 * - WordRepetitionHandler - обробка повторення слів
 */
@Injectable()
export class WordProcessingHandler
  implements CommandHandler
{
  private readonly logger = new Logger(
    WordProcessingHandler.name
  );

  /**
   * Перевіряє, чи може цей обробник опрацювати команду (для зворотньої сумісності)
   */
  canHandle(
    command: string,
    customerState?: string
  ): boolean {
    // Зауваження: ця функціональність передана іншим обробникам
    // Залишено для зворотньої сумісності
    return false;
  }

  /**
   * Виконує обробку команд, пов'язаних із словами, делегуючи обробку іншим обробникам
   */
  async execute(
    context: CommandContext
  ): Promise<void> {
    // Зауваження: ця функціональність передана іншим обробникам
    this.logger.log(
      `WordProcessingHandler is deprecated. Use specific handlers instead.`
    );
  }
}
