import { Injectable } from '@nestjs/common';
import { CommandContext } from '../handlers/core/interfaces';
import { BaseStateStrategy } from './base-state.strategy';
import { CustomerState } from '../../customer/enum/customer-state.enum';
import { logError } from '../handlers/core/error-handler';

/**
 * Стратегія для обробки стану WaitingForWordInput
 *
 * Використовується, коли користувач має ввести слово для вивчення
 */
@Injectable()
export class WaitingForWordInputStrategy extends BaseStateStrategy {
  constructor() {
    super('WaitingForWordInput');
  }

  /**
   * Обробляє введене користувачем слово для вивчення
   */
  protected async processState(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, customer, services } =
      context;
    const {
      customerService,
      messageService,
      aiService,
      wordService
    } = services;

    try {
      // Обробка введеного тексту
      if (dto.text) {
        try {
          // Спроба розпізнати введений текст через AI
          const aiResponse =
            await aiService.processText(dto.text);

          if (
            aiResponse &&
            aiResponse.translation
          ) {
            // Зберігаємо слово в базу даних
            await wordService.createWord({
              word: dto.text,
              translation: aiResponse.translation,
              customerId: customer.id,
              examples: aiResponse.examples,
              needToLearn: true
            });

            // Відправляємо повідомлення про збереження
            await messageService.TelegramSendMessage(
              {
                chatId: dto.chatId,
                templateName: 'savedWord',
                lang,
                dynamicVariables: {
                  word: dto.text,
                  translation:
                    aiResponse.translation,
                  examples: Array.isArray(
                    aiResponse.examples
                  )
                    ? aiResponse.examples.join(
                        '\n'
                      )
                    : aiResponse.examples || ''
                }
              }
            );

            // Повертаємося до головного меню (або можемо залишити в поточному стані для додаткових слів)
            await customerService.update({
              chatId: dto.chatId,
              state: CustomerState.MainMenu
            });
          } else {
            // Якщо переклад не отримано
            await messageService.TelegramSendMessage(
              {
                chatId: dto.chatId,
                templateName: 'errorMessage',
                lang
              }
            );

            // Повертаємося до головного меню
            await customerService.update({
              chatId: dto.chatId,
              state: CustomerState.MainMenu
            });
          }
        } catch (error) {
          // Обробка помилки перекладу
          logError(
            'Error processing word input',
            error,
            {
              customerId: customer.id,
              inputText: dto.text
            }
          );

          await messageService.TelegramSendMessage(
            {
              chatId: dto.chatId,
              templateName: 'errorMessage',
              lang
            }
          );

          // Повертаємося до головного меню
          await customerService.update({
            chatId: dto.chatId,
            state: CustomerState.MainMenu
          });
        }
      } else {
        // Якщо текст порожній
        await messageService.TelegramSendMessage({
          chatId: dto.chatId,
          templateName: 'errorMessage',
          lang
        });

        // Залишаємо в тому ж стані для повторного введення
      }
    } catch (error) {
      logError(
        'Error in WaitingForWordInput strategy',
        error,
        {
          customerId: customer.id
        }
      );

      // Повідомляємо про помилку
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'errorMessage',
        lang
      });

      // Повертаємося до головного меню
      await customerService.update({
        chatId: dto.chatId,
        state: CustomerState.MainMenu
      });
    }
  }

  /**
   * Повертає відповідне значення перерахування стану
   */
  protected getStateEnum(): CustomerState {
    return CustomerState.WaitingForWordInput;
  }
}
