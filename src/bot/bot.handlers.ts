import { WebhookResponseDto } from '../webhook/dto';
import {
  CustomerState,
  Customer
} from './bot.types';
import { ChannelEnum } from '../webhook/enum';
import { format } from 'date-fns';
import messageAttributes from '../message/attributes.json';
import { WordRepetitionJob } from '../jobs/word-repetition.job';
import { WordService } from 'src/word/word.service';
import { MessageService } from 'src/message/message.service';
import { TelegramService } from 'src/telegram/telegram.service';
import { AiService } from 'src/ai/ai.service';
import { Logger } from '@nestjs/common';

const logger = new Logger('BotHandlers');

export async function handleLearnWordsCommand(
  dto: WebhookResponseDto,
  lang: string,
  customerService: any,
  messageService: MessageService,
  wordRepetitionJob: WordRepetitionJob,
  wordService: WordService,
  telegramService: TelegramService,
  aiService: AiService,
  customer?: Customer
): Promise<void> {
  const needToLearnForRepeat = true;
  switch (true) {
    case dto.text === '/start':
    case dto.text === '/mainMenu':
      await customerService.update({
        chatId: dto.chatId,
        state: CustomerState.MainMenu
      });
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'mainMenu',
        lang
      });
      break;
    case dto.text === '/learnWords':
      await customerService.update({
        chatId: dto.chatId,
        state: CustomerState.WaitingForWordInput
      });
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'waitingForWordInput',
        lang
      });
      break;
    case dto.text === '/repeatWords':
      await customerService.update({
        chatId: dto.chatId,
        state: CustomerState.RepeatWordsMain
      });
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'repeatWords',
        lang
      });
      break;

    case dto.text === '/myProgress':
      try {
        console.log(
          'Починаємо обробку команди /myProgress'
        );

        const paginationData =
          await wordService.getLearnedWordsWithPagination(
            customer.id
          );
        console.log(
          'Отримані дані пагінації:',
          JSON.stringify(paginationData)
        );

        if (
          !paginationData ||
          !paginationData.words
        ) {
          console.error(
            'Помилка: дані пагінації відсутні або неповні'
          );
          throw new Error(
            'Помилка отримання даних пагінації'
          );
        }

        const {
          words: learnedWords = [],
          total = 0,
          pages = 1
        } = paginationData;

        let fullMessageText =
          messageAttributes.learnedWordsText[
            lang
          ].replace(
            '{{learnedWordsCount}}',
            String(total)
          );

        if (
          Array.isArray(learnedWords) &&
          learnedWords.length > 0
        ) {
          const formattedWords = learnedWords
            .map(word => {
              if (
                !word ||
                !word.word ||
                !word.translation ||
                !word.updatedAt
              ) {
                console.error(
                  'Некоректні дані слова:',
                  word
                );
                return '';
              }

              const escapedWord =
                word.word.replace(
                  /[_*[\]()~`>#+\-=|{}.!]/g,
                  '\\$&'
                );
              const escapedTranslation =
                word.translation.replace(
                  /[_*[\]()~`>#+\-=|{}.!]/g,
                  '\\$&'
                );

              return `${escapedWord} \- ${escapedTranslation}\n${
                messageAttributes.learnedAt[lang]
              }${format(
                new Date(word.updatedAt),
                'dd.MM.yyyy HH:mm'
              )}`;
            })
            .filter(word => word !== '')
            .join('\n\n');

          fullMessageText = `${fullMessageText}\n\n${formattedWords}`;
        }

        // Формуємо масив кнопок
        const buttonsArray = [];

        // Додаємо кнопки для кожного слова
        learnedWords.forEach(word => {
          const escapedWord = word.word.replace(
            /["\\]/g,
            '\\$&'
          );
          buttonsArray.push([
            {
              text: `${messageAttributes.returnToLearnButton[lang]} "${escapedWord}"`,
              callback_data: `/iNeedToLearn_${word.id}`
            }
          ]);
        });

        // Додаємо кнопки пагінації, якщо потрібно
        if (pages > 1) {
          buttonsArray.push([
            {
              text: messageAttributes
                .previousPageButton[lang],
              callback_data: '/previousPage_1'
            },
            {
              text: messageAttributes.currentPageText[
                lang
              ]
                .replace('{{currentPage}}', '1')
                .replace(
                  '{{totalPages}}',
                  String(pages)
                ),
              callback_data: 'currentPage'
            },
            {
              text: messageAttributes
                .nextPageButton[lang],
              callback_data: '/nextPage_1'
            }
          ]);
        }

        // Додаємо кнопку головного меню
        buttonsArray.push([
          {
            text: messageAttributes
              .mainMenuButton[lang],
            callback_data: '/mainMenu'
          }
        ]);

        const messageData = {
          chatId: dto.chatId,
          templateName:
            pages > 1
              ? 'learnedWordsListWithPagination'
              : 'learnedWordsListSimple',
          lang,
          dynamicVariables: {
            learnedWordsText: fullMessageText,
            buttonsArray:
              JSON.stringify(buttonsArray)
          }
        };

        console.log(
          'Підготовлені дані для відправки:',
          {
            ...messageData,
            dynamicVariables: {
              ...messageData.dynamicVariables,
              buttonsArray: JSON.stringify(
                buttonsArray,
                null,
                2
              )
            }
          }
        );

        await messageService.TelegramSendMessage(
          messageData
        );
      } catch (error) {
        console.error(
          'Помилка при обробці команди /myProgress:',
          error
        );

        try {
          await messageService.TelegramSendMessage(
            {
              chatId: dto.chatId,
              templateName: 'errorMessage',
              lang,
              dynamicVariables: {
                errorMessage:
                  'На жаль, сталася помилка при отриманні вашого прогресу. Спробуйте пізніше.'
              }
            }
          );
        } catch (sendError) {
          console.error(
            'Помилка при відправці повідомлення про помилку:',
            sendError
          );
        }
      }
      break;

    case dto.text === '/repeatWordsNow':
      await customerService.update({
        chatId: dto.chatId,
        state: CustomerState.RepeatWordsNow
      });
      const words =
        await wordService.getWordsByCustomerId(
          customer.id,
          needToLearnForRepeat
        );
      if (words.length > 0) {
        const firstWord = words[0];
        if (firstWord.videoExample) {
          await messageService.TelegramSendMessage(
            {
              messageType: 'sendVideo',
              chatId: dto.chatId,
              templateName: 'repeatWordsNow',
              lang,
              dynamicVariables: {
                word: firstWord.word,
                translation: firstWord.translation
              },
              wordId: firstWord.id + '',
              videoUrl: firstWord.videoExample
            }
          );
        } else if (firstWord.imageExample) {
          await messageService.TelegramSendMessage(
            {
              messageType: 'sendPhoto',
              chatId: dto.chatId,
              templateName: 'repeatWordsNowPhoto',
              lang,
              dynamicVariables: {
                word: firstWord.word,
                translation: firstWord.translation
              },
              wordId: firstWord.id + '',
              videoUrl: firstWord.videoExample
            }
          );
        } else {
          await messageService.TelegramSendMessage(
            {
              chatId: dto.chatId,
              templateName: 'repeatWordsNowText',
              lang,
              dynamicVariables: {
                word: firstWord.word,
                translation: firstWord.translation
              },
              wordId: firstWord.id + ''
            }
          );
        }
      } else {
        await messageService.TelegramSendMessage({
          chatId: dto.chatId,
          templateName: 'notFoundWords',
          lang
        });
      }
      break;
    case dto.text.startsWith('/nextWord_'):
    case dto.text.startsWith('/previousWord_'):
      const wordId = dto.text.split('_')[1];
      const isNext =
        dto.text.startsWith('/nextWord_');
      const needToLearn = true;
      const allWords =
        await wordService.getWordsByCustomerId(
          customer.id,
          needToLearn
        );

      const currentIndex = allWords.findIndex(
        word => word.id == Number(wordId)
      );
      const currentWord = allWords[currentIndex];

      const wordsToRepeat = allWords.filter(
        word => word.needToLearn
      );

      if (wordsToRepeat.length > 0) {
        let newWord;

        if (currentWord.needToLearn) {
          const newIndex = isNext
            ? (currentIndex + 1) %
              wordsToRepeat.length
            : (currentIndex -
                1 +
                wordsToRepeat.length) %
              wordsToRepeat.length;

          newWord = wordsToRepeat[newIndex];
        } else {
          const newIndex = isNext
            ? currentIndex % wordsToRepeat.length
            : (currentIndex -
                1 +
                wordsToRepeat.length) %
              wordsToRepeat.length;

          newWord = wordsToRepeat[newIndex];
        }

        await messageService.TelegramSendMessage({
          messageType: 'deleteMessage',
          chatId: dto.chatId,
          templateName: 'deleteMessage',
          lang,
          messageId:
            dto.originalWebhook.callback_query
              .message.message_id + ''
        });

        await messageService.TelegramSendMessage({
          //messageType: 'editMessageMedia',
          chatId: dto.chatId,
          //templateName: 'repeatWordsNowEditMedia',
          messageType: 'sendVideo',
          templateName: 'repeatWordsNow',
          lang,
          dynamicVariables: {
            word: newWord.word,
            translation: newWord.translation
          },
          // messageId:
          //   dto.originalWebhook.callback_query
          //     .message.message_id + '',
          wordId: newWord.id + '',
          videoUrl: newWord.videoExample
        });
      } else {
        await messageService.TelegramSendMessage({
          chatId: dto.chatId,
          templateName: 'notFoundWords',
          lang
        });
        await messageService.TelegramSendMessage({
          chatId: dto.chatId,
          templateName: 'mainMenu',
          lang
        });
      }

      break;
    case dto.text.startsWith(
      '/iHaveLearnedButton_'
    ):
      const learnedWordId = Number(
        dto.text.split('_')[1]
      );

      // Перевіряємо, чи успішно відбулася конвертація
      if (isNaN(learnedWordId)) {
        throw new Error('Невалідний ID слова');
      }
      await wordService.updateWord(
        Number(learnedWordId),
        { needToLearn: false }
      );
      // Тепер всю логіку опрацювання повторення передаємо до WordRepetitionJob
      // await wordRepetitionJob.updateWordRepetitionStatus(
      //   learnedWordId,
      //   false // Користувач позначив слово як вивчене
      // );
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'okay',
        lang
      });
      break;

    case dto.text.startsWith('/iNeedToLearn_'):
      const needToLearnWordId = Number(
        dto.text.split('_')[1]
      );

      // Перевіряємо, чи успішно відбулася конвертація
      if (isNaN(learnedWordId)) {
        throw new Error('Невалідний ID слова');
      }
      await wordService.updateWord(
        Number(needToLearnWordId),
        { needToLearn: true }
      );
      // Тепер всю логіку опрацювання повторення передаємо до WordRepetitionJob
      // await wordRepetitionJob.updateWordRepetitionStatus(
      //   needToLearnWordId,
      //   false // Користувач позначив слово як таке що треба вчити
      // );
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'okay',
        lang
      });
      break;
    default:
      console.warn(
        `Невідома команда: ${dto.text}`
      );
      await customerService.update({
        chatId: dto.chatId,
        state: CustomerState.MainMenu
      });
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'notFoundCommand',
        lang
      });
  }
}

export async function handleExistingCustomer(
  dto: WebhookResponseDto,
  customer: Customer,
  lang: string,
  customerService: any,
  messageService: any,
  redisService: any,
  wordService: any,
  telegramService: TelegramService,
  aiService: AiService
): Promise<void> {
  switch (customer.state) {
    case CustomerState.WelcomeMessage:
      await customerService.update({
        chatId: dto.chatId,
        state: CustomerState.MainMenu
      });
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'mainMenu',
        lang
      });
      break;
    case CustomerState.MainMenu:
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'mainMenu',
        lang
      });
      break;
    case CustomerState.WaitingForWord:
      await redisService.set(
        `word:${dto.chatId}`,
        dto.text,
        3600
      );
      await customerService.update({
        chatId: dto.chatId,
        state: CustomerState.WaitingForTranslation
      });
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'waitingForTranslation',
        lang
      });
    case CustomerState.WaitingForTranslation:
      await redisService.set(
        `translation:${dto.chatId}`,
        dto.text,
        3600
      );
      await saveWordToDatabase(
        dto.chatId,
        redisService,
        wordService,
        customer
      );
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'savedWord',
        lang
      });
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'mainMenu',
        lang
      });
      await customerService.update({
        chatId: dto.chatId,
        state: CustomerState.MainMenu
      });
    case CustomerState.WaitingForWordInput:
      if (dto.originalWebhook.message?.photo) {
        const photos =
          dto.originalWebhook.message.photo;
        try {
          const bestQualityPhoto =
            photos[photos.length - 1];

          const fileInfo =
            await telegramService.getFile(
              bestQualityPhoto.file_id
            );

          const imageBuffer =
            await telegramService.downloadFile(
              fileInfo.file_path
            );

          const aiResponse =
            await aiService.processImage(
              imageBuffer
            );

          const translation =
            aiResponse.translation;
          const examples = aiResponse.examples;
          const extractedText =
            aiResponse.extractedText;
          // if (!extractedText.trim()) {
          //   await messageService.TelegramSendMessage(
          //     {
          //       chatId: dto.chatId,
          //       templateName: 'noTextExtracted',
          //       lang
          //     }
          //   );
          //   break;
          // }

          // const { translation, examples } =
          //   await aiService.processText(
          //     extractedText
          //   );

          logger.log('aiResponse: ', aiResponse);

          await wordService.createWord({
            word: extractedText,
            translation,
            examples: JSON.stringify(examples),
            customerId: customer.id,
            needToLearn: true,
            videoExample: null,
            imageExample: bestQualityPhoto.file_id
          });

          await messageService.TelegramSendMessage(
            {
              chatId: dto.chatId,
              templateName: 'savedWord',
              lang,
              dynamicVariables: {
                word: extractedText,
                translation,
                examples:
                  JSON.stringify(examples) ||
                  'No examples provided'
              }
            }
          );
        } catch (error) {
          logger.error(
            'Error processing image:',
            error
          );

          let templateName = 'savedWordError';
          if (
            error.message.includes('size exceeds')
          ) {
            templateName = 'imageSizeError';
          } else if (
            error.message.includes(
              'format not supported'
            )
          ) {
            templateName = 'imageFormatError';
          }

          await messageService.TelegramSendMessage(
            {
              chatId: dto.chatId,
              templateName,
              lang
            }
          );
        }
      } else if (
        dto.originalWebhook.message?.text
      ) {
        try {
          const text =
            dto.originalWebhook.message.text;
          const { translation, examples } =
            await aiService.processText(text);

          await wordService.createWord({
            word: text,
            translation,
            examples,
            customerId: customer.id,
            needToLearn: true
          });

          await messageService.TelegramSendMessage(
            {
              chatId: dto.chatId,
              templateName: 'savedWord',
              lang,
              dynamicVariables: {
                word: text,
                translation,
                examples:
                  JSON.stringify(examples) ||
                  'No examples provided'
              }
            }
          );
        } catch (error) {
          logger.error(
            'Error processing text:',
            error
          );
          await messageService.TelegramSendMessage(
            {
              chatId: dto.chatId,
              templateName: 'textProcessingError',
              lang
            }
          );
        }
      }
    default:
      console.warn(
        `Невідомий стан користувача: ${customer.state}`
      );
      await customerService.update({
        chatId: dto.chatId,
        state: CustomerState.MainMenu
      });
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'mainMenu',
        lang
      });
  }
}

export async function handleNewCustomer(
  dto: WebhookResponseDto,
  lang: string,
  customerService: any,
  messageService: any
): Promise<void> {
  console.log(
    `Створення нового користувача для chatId: ${dto.chatId}`
  );
  await customerService.create({
    chatId: dto.chatId,
    firstName: dto.firstName,
    lastName: dto.lastName,
    channel: ChannelEnum.telegram,
    state: CustomerState.WelcomeMessage
  });
  await messageService.TelegramSendMessage({
    chatId: dto.chatId,
    templateName: 'welcomeMessage',
    lang,
    dynamicVariables: {
      word: dto.firstName,
      translation: dto.lastName
    }
  });
}

async function saveWordToDatabase(
  chatId: string,
  redisService: any,
  wordService: any,
  customer: Customer
): Promise<void> {
  const word = await redisService.get(
    `word:${chatId}`
  );
  const translation = await redisService.get(
    `translation:${chatId}`
  );
  if (word && translation) {
    await wordService.createWord({
      word,
      translation,
      customerId: customer.id,
      needToLearn: true
    });
    await redisService.del(`word:${chatId}`);
    await redisService.del(
      `translation:${chatId}`
    );
  }
}
