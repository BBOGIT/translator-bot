import { Injectable } from '@nestjs/common';
import { CommandContext } from '../handlers/core/interfaces';
import { BaseStateStrategy } from './base-state.strategy';
import { CustomerState } from '../../customer/enum/customer-state.enum';
import { COMMANDS } from '../handlers/core/constants';

@Injectable()
export class RepeatWordsNowStrategy extends BaseStateStrategy {
  constructor() {
    super('RepeatWordsNow');
  }

  canHandle(
    command: string,
    context: CommandContext
  ): boolean {
    const isCorrectState = super.canHandle(
      command,
      context
    );

    return (
      isCorrectState ||
      command === COMMANDS.MAIN_MENU ||
      command.startsWith(
        COMMANDS.PREVIOUS_WORD
      ) ||
      command.startsWith(COMMANDS.NEXT_WORD) ||
      command.startsWith(
        COMMANDS.I_HAVE_LEARNED_BUTTON
      ) ||
      command.startsWith(COMMANDS.I_NEED_TO_LEARN)
    );
  }

  protected async processState(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, services } = context;
    const { customerService, messageService } =
      services;
    const command = dto.text;

    if (command === COMMANDS.MAIN_MENU) {
      await customerService.update({
        chatId: dto.chatId,
        state: CustomerState.MainMenu
      });

      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'mainMenu',
        lang
      });
    } else if (
      command === COMMANDS.REPEAT_WORDS
    ) {
      await customerService.update({
        chatId: dto.chatId,
        state: CustomerState.RepeatWordsMain
      });

      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'repeatWords',
        lang
      });
    } else if (
      command.startsWith(
        COMMANDS.PREVIOUS_WORD
      ) ||
      command.startsWith(COMMANDS.NEXT_WORD)
    ) {
      await this.handleWordNavigation(context);
    } else if (
      command.startsWith(
        COMMANDS.I_HAVE_LEARNED_BUTTON
      ) ||
      command.startsWith(COMMANDS.I_NEED_TO_LEARN)
    ) {
      await this.handleLearningStatus(context);
    } else {
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'notFoundCommand',
        lang
      });
    }
  }

  private async handleWordNavigation(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, customer, services } =
      context;
    const { messageService, wordService } =
      services;

    const commandParts = dto.text.split('_');
    if (commandParts.length !== 2) {
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'errorMessage',
        lang
      });
      return;
    }

    const currentWordId = parseInt(
      commandParts[1]
    );
    const direction = dto.text.startsWith(
      COMMANDS.NEXT_WORD
    )
      ? 'next'
      : 'previous';

    try {
      const nextWord =
        await wordService.getNextWordForRepetition(
          customer.id,
          currentWordId,
          direction
        );

      if (!nextWord) {
        await messageService.TelegramSendMessage({
          chatId: dto.chatId,
          templateName: 'notFoundWords',
          lang
        });
        return;
      }

      let processedExamples = '';
      if (nextWord.examples) {
        try {
          const examplesArray = JSON.parse(
            nextWord.examples
          );
          if (Array.isArray(examplesArray)) {
            processedExamples =
              examplesArray.join('\n');
          } else {
            processedExamples = nextWord.examples;
          }
        } catch {
          processedExamples = nextWord.examples;
        }
      }

      if (
        nextWord.videoExample &&
        nextWord.videoExample !== 'null' &&
        nextWord.videoExample.trim() !== ''
      ) {
        await messageService.TelegramSendMessage({
          messageType: 'sendVideo',
          templateName: 'repeatWordsNow',
          videoUrl: nextWord.videoExample,
          chatId: dto.chatId,
          lang,
          dynamicVariables: {
            word: nextWord.word,
            translation: nextWord.translation,
            examples: processedExamples
          },
          wordId: nextWord.id.toString()
        });
      } else {
        await messageService.TelegramSendMessage({
          templateName: 'repeatWordsNowText',
          chatId: dto.chatId,
          lang,
          dynamicVariables: {
            word: nextWord.word,
            translation: nextWord.translation,
            examples: processedExamples
          },
          wordId: nextWord.id.toString()
        });
      }
    } catch (error) {
      console.error(
        `Помилка при навігації між словами: ${error.message}`,
        error.stack
      );

      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'errorMessage',
        lang,
        dynamicVariables: {
          errorMessage:
            'Помилка при отриманні слова'
        }
      });
    }
  }

  private async handleLearningStatus(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, services } = context;
    const { messageService } = services;

    const commandParts = dto.text.split('_');
    if (commandParts.length !== 2) {
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'errorMessage',
        lang
      });
      return;
    }

    const wordId = commandParts[1];
    const isLearned = dto.text.startsWith(
      COMMANDS.I_HAVE_LEARNED_BUTTON
    );

    // Логіка оновлення статусу вивчення слова
    try {
      // Оновлюємо статус повторення слова через WordService
      await services.wordService.updateWordRepetitionStatus(
        {
          wordId: parseInt(wordId),
          success: isLearned
        }
      );

      this.logger.log(
        `Word repetition status updated: wordId=${wordId}, success=${isLearned}`
      );

      // Відправляємо повідомлення про успішне оновлення
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: isLearned
          ? 'iknowWord'
          : 'learnWord',
        lang,
        dynamicVariables: {
          wordId: wordId
        }
      });
    } catch (error) {
      this.logger.error(
        `Error updating word repetition status: ${error.message}`,
        error.stack
      );

      // Відправляємо повідомлення про помилку
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'errorMessage',
        lang,
        dynamicVariables: {
          errorMessage:
            'Помилка при оновленні статусу слова'
        }
      });
    }
  }

  protected getStateEnum(): CustomerState {
    return CustomerState.RepeatWordsNow;
  }
}
