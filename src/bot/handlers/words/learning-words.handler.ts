import {
  Injectable,
  Logger,
  ForbiddenException
} from '@nestjs/common';
import {
  CommandContext,
  CommandHandler
} from '../core/interfaces';
import { CustomerState } from '../../../customer/enum/customer-state.enum';
import { withErrorHandling } from '../core/error-handler';

/**
 * Обробник для функціоналу навчання слів
 */
@Injectable()
export class LearningWordsHandler
  implements CommandHandler
{
  private readonly logger = new Logger(
    LearningWordsHandler.name
  );

  /**
   * Перевіряє, чи може цей обробник опрацювати команду
   */
  canHandle(
    command: string,
    customerState?: string
  ): boolean {
    // Обробляємо введення в станах навчання слів
    if (
      customerState ===
      CustomerState.WaitingForWordInput
    ) {
      return true;
    }
    return false;
  }

  /**
   * Виконує логіку навчання слів
   */
  async execute(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, customer, services } =
      context;

    if (!customer) {
      this.logger.error(
        `No customer found for word learning: ${dto.text}`
      );
      return;
    }

    return withErrorHandling(
      async () => {
        this.logger.log(
          `Processing word input for learning: ${dto.text}, state: ${customer.state}`
        );

        // Обробка введення слова для навчання
        if (
          customer.state ===
          CustomerState.WaitingForWordInput
        ) {
          await this.handleWordInputForLearning(
            context
          );
        }

        this.logger.log(
          `Word learning process completed for chat ${dto.chatId}`
        );
      },
      `Failed to process word learning: ${dto.text}`,
      dto.chatId,
      lang,
      services.messageService,
      {
        customerId: customer.id,
        state: customer.state
      }
    );
  }

  /**
   * Обробка введення слова в стані WaitingForWordInput
   */
  private async handleWordInputForLearning(
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
      // Обробка текстового повідомлення
      if (dto.text) {
        // Спроба розпарсити JSON, якщо користувач відправив JSON
        let jsonData;
        try {
          jsonData = JSON.parse(dto.text);
          const hasRequiredFields =
            jsonData.word &&
            jsonData.translation &&
            jsonData.examples !== undefined;

          if (hasRequiredFields) {
            // Використовуємо прямі дані JSON без виклику AI сервісу
            try {
              await wordService.createWord({
                word: jsonData.word,
                translation: jsonData.translation,
                examples: Array.isArray(
                  jsonData.examples
                )
                  ? JSON.stringify(
                      jsonData.examples
                    )
                  : jsonData.examples,
                customerId: customer.id,
                needToLearn:
                  jsonData.needToLearn !==
                  undefined
                    ? jsonData.needToLearn
                    : true,
                videoExample:
                  jsonData.videoExample || null,
                imageExample:
                  jsonData.imageExample || null
              });

              await messageService.TelegramSendMessage(
                {
                  chatId: dto.chatId,
                  templateName: 'savedWord',
                  lang,
                  dynamicVariables: {
                    word: jsonData.word,
                    translation:
                      jsonData.translation,
                    examples:
                      (Array.isArray(
                        jsonData.examples
                      )
                        ? JSON.stringify(
                            jsonData.examples
                          )
                        : jsonData.examples) ||
                      'No examples provided'
                  }
                }
              );

              // Повертаємось до головного меню
              await customerService.update({
                chatId: dto.chatId,
                state: CustomerState.MainMenu
              });
              return;
            } catch (error) {
              if (
                error instanceof
                ForbiddenException
              ) {
                await messageService.TelegramSendMessage(
                  {
                    chatId: dto.chatId,
                    templateName:
                      'wordAlreadyExists',
                    lang,
                    dynamicVariables: {
                      word: jsonData.word
                    }
                  }
                );
                await customerService.update({
                  chatId: dto.chatId,
                  state: CustomerState.MainMenu
                });
              } else {
                this.logger.error(
                  `Error creating word from JSON: ${error.message}`
                );
                await messageService.TelegramSendMessage(
                  {
                    chatId: dto.chatId,
                    templateName:
                      'savedWordError',
                    lang
                  }
                );
              }
            }
          }
        } catch (e) {
          // Не валідний JSON, продовжуємо зі стандартною обробкою
        }

        // Стандартна обробка слова через AI
        try {
          const { translation, examples } =
            await aiService.processText(dto.text);

          await wordService.createWord({
            word: dto.text,
            translation,
            examples: Array.isArray(examples)
              ? JSON.stringify(examples)
              : examples,
            customerId: customer.id,
            needToLearn: true
          });

          await messageService.TelegramSendMessage(
            {
              chatId: dto.chatId,
              templateName: 'savedWord',
              lang,
              dynamicVariables: {
                word: dto.text,
                translation,
                examples:
                  JSON.stringify(examples) ||
                  'No examples provided'
              }
            }
          );

          // Повертаємось до головного меню
          await customerService.update({
            chatId: dto.chatId,
            state: CustomerState.MainMenu
          });
        } catch (error) {
          if (
            error instanceof ForbiddenException
          ) {
            await messageService.TelegramSendMessage(
              {
                chatId: dto.chatId,
                templateName: 'wordAlreadyExists',
                lang,
                dynamicVariables: {
                  word: dto.text
                }
              }
            );
            await customerService.update({
              chatId: dto.chatId,
              state: CustomerState.MainMenu
            });
          } else {
            this.logger.error(
              `Error processing text: ${error.message}`
            );
            await messageService.TelegramSendMessage(
              {
                chatId: dto.chatId,
                templateName: 'savedWordError',
                lang
              }
            );
          }
        }
      } else {
        // Повідомлення для користувача, що очікуємо текст
        await messageService.TelegramSendMessage({
          chatId: dto.chatId,
          templateName: 'waitingForWordInput',
          lang
        });
      }
    } catch (error) {
      this.logger.error(
        `Error in handleWordInputForLearning: ${error.message}`
      );
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'savedWordError',
        lang
      });
    }
  }
}
