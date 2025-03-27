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
            buttonsArray: buttonsArray
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

        const result =
          await messageService.TelegramSendMessage(
            messageData
          );

        if (!result.ok) {
          console.error(
            'Помилка при відправці повідомлення /myProgress:',
            JSON.stringify(result)
          );

          // Спроба відправити простіше повідомлення про помилку
          const errorMsgResult =
            await messageService.TelegramSendMessage(
              {
                chatId: dto.chatId,
                templateName: 'errorMessage',
                lang,
                dynamicVariables: {
                  errorMessage:
                    'На жаль, сталася помилка при відображенні вашого прогресу. Спробуйте пізніше.'
                }
              }
            );

          if (!errorMsgResult.ok) {
            console.error(
              'Помилка при відправці повідомлення про помилку:',
              JSON.stringify(errorMsgResult)
            );
          }
        }
      } catch (error) {
        console.error(
          'Помилка при обробці команди /myProgress:',
          error
        );

        try {
          const errorResult =
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

          if (!errorResult.ok) {
            console.error(
              'Помилка при відправці повідомлення про помилку:',
              JSON.stringify(errorResult)
            );
          }
        } catch (sendError) {
          console.error(
            'Критична помилка при відправці повідомлення про помилку:',
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

        // Обробка examples для відображення
        let formattedExamples = '';
        if (firstWord.examples) {
          try {
            // Якщо приклади в рядку
            if (
              typeof firstWord.examples ===
              'string'
            ) {
              // Якщо це JSON-рядок, спробуємо розпарсити
              if (
                firstWord.examples.startsWith(
                  '['
                ) &&
                firstWord.examples.endsWith(']')
              ) {
                try {
                  const parsedExamples =
                    JSON.parse(
                      firstWord.examples
                    );
                  if (
                    Array.isArray(parsedExamples)
                  ) {
                    formattedExamples =
                      parsedExamples.join('\n');
                  }
                } catch (parseError) {
                  // Якщо розпарсити не вдалося, просто видаляємо дужки та лапки
                  formattedExamples =
                    firstWord.examples
                      .replace(/[\[\]"]/g, '')
                      .replace(/,/g, '\n');
                }
              } else {
                // Якщо не JSON, використовуємо як є
                formattedExamples =
                  firstWord.examples;
              }
            } else if (
              Array.isArray(firstWord.examples)
            ) {
              // Якщо приклади вже у масиві
              formattedExamples = (
                firstWord.examples as string[]
              ).join('\n');
            } else {
              // Для інших типів
              formattedExamples = String(
                firstWord.examples
              );
            }
          } catch (error) {
            console.error(
              'Помилка при форматуванні прикладів:',
              error
            );
            formattedExamples = String(
              firstWord.examples
            )
              .replace(/[\[\]"]/g, '')
              .replace(/,/g, '\n');
          }
        }

        // Додаткове логування даних про відео
        console.log(
          `Перевірка video для слова "${firstWord.word}": videoExample = "${firstWord.videoExample}"`
        );
        console.log(
          `Тип videoExample: ${typeof firstWord.videoExample}, довжина: ${
            firstWord.videoExample
              ? firstWord.videoExample.length
              : 0
          }`
        );

        if (
          firstWord.videoExample &&
          firstWord.videoExample !== 'null' &&
          firstWord.videoExample.trim() !== ''
        ) {
          await messageService.TelegramSendMessage(
            {
              messageType: 'sendVideo',
              chatId: dto.chatId,
              templateName: 'repeatWordsNow',
              lang,
              dynamicVariables: {
                word: firstWord.word,
                translation:
                  firstWord.translation,
                examples: formattedExamples
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
                translation:
                  firstWord.translation,
                examples: formattedExamples
              },
              wordId: firstWord.id + '',
              imageUrl: firstWord.imageExample
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
                translation:
                  firstWord.translation,
                examples: formattedExamples
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

      console.log(
        `Обробка команди ${dto.text}, wordId: ${wordId}, isNext: ${isNext}`
      );

      const allWords =
        await wordService.getWordsByCustomerId(
          customer.id,
          needToLearn
        );

      console.log(
        `Знайдено слів для користувача: ${allWords.length}`
      );

      const currentIndex = allWords.findIndex(
        word => word.id == Number(wordId)
      );

      console.log(
        `currentIndex: ${currentIndex}`
      );

      if (currentIndex === -1) {
        console.error(
          `Слово з ID ${wordId} не знайдено у списку слів користувача`
        );
        await messageService.TelegramSendMessage({
          chatId: dto.chatId,
          templateName: 'errorMessage',
          lang,
          dynamicVariables: {
            errorMessage:
              'На жаль, сталася помилка при пошуку наступного слова. Спробуйте пізніше.'
          }
        });
        break;
      }

      const currentWord = allWords[currentIndex];

      console.log(
        `Поточне слово: ${JSON.stringify(
          currentWord
        )}`
      );

      const wordsToRepeat = allWords.filter(
        word => word.needToLearn
      );

      console.log(
        `Слів для повторення: ${wordsToRepeat.length}`
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

        console.log(
          `Нове слово для показу: ${JSON.stringify(
            newWord
          )}`
        );

        console.log(
          `Дані message_id для видалення: ${dto.originalWebhook.callback_query?.message?.message_id}`
        );

        // Перевіряємо чи існує callback_query та message_id
        if (
          !dto.originalWebhook.callback_query
            ?.message?.message_id
        ) {
          console.error(
            'Відсутній message_id для видалення повідомлення'
          );
          // Пропускаємо видалення, якщо немає message_id
        } else {
          try {
            const deleteResult =
              await messageService.TelegramSendMessage(
                {
                  messageType: 'deleteMessage',
                  chatId: dto.chatId,
                  templateName: 'deleteMessage',
                  lang,
                  messageId:
                    dto.originalWebhook
                      .callback_query.message
                      .message_id + ''
                }
              );

            if (!deleteResult.ok) {
              console.error(
                `Помилка при видаленні повідомлення: ${JSON.stringify(
                  deleteResult
                )}`
              );
            }
          } catch (deleteError) {
            console.error(
              'Помилка при спробі видалення повідомлення:',
              deleteError
            );
          }
        }

        // Функція для форматування examples
        const formatExamples = examples => {
          if (!examples) return '';

          try {
            // Якщо приклади вже є рядком
            if (typeof examples === 'string') {
              // Якщо це JSON-рядок, спробуємо розпарсити
              if (
                examples.startsWith('[') &&
                examples.endsWith(']')
              ) {
                try {
                  const parsedExamples =
                    JSON.parse(examples);
                  if (
                    Array.isArray(parsedExamples)
                  ) {
                    return parsedExamples.join(
                      '\n'
                    );
                  }
                } catch (parseError) {
                  // Якщо розпарсити не вдалося, просто видаляємо дужки та лапки
                  return examples
                    .replace(/[\[\]"]/g, '')
                    .replace(/,/g, '\n');
                }
              }
              // Якщо не JSON і вже рядок, повертаємо як є
              return examples;
            }

            // Якщо приклади є масивом
            if (Array.isArray(examples)) {
              return (examples as string[]).join(
                '\n'
              );
            }

            // Для інших типів конвертуємо в рядок
            return String(examples);
          } catch (error) {
            console.error(
              'Помилка при форматуванні прикладів:',
              error
            );
            // Намагаємося повернути хоч якийсь результат
            if (examples) {
              return String(examples)
                .replace(/[\[\]"]/g, '')
                .replace(/,/g, '\n');
            }
            return '';
          }
        };

        console.log(
          `Підготовка запиту на відправку відео з новим словом`
        );
        console.log(
          `Відео URL: ${
            newWord.videoExample ?? 'відсутній'
          }`
        );

        // Детальна діагностика videoExample
        console.log(
          `Детальна перевірка videoExample для слова "${newWord.word}":`
        );
        console.log(
          `- Тип: ${typeof newWord.videoExample}`
        );
        console.log(
          `- Довжина: ${
            newWord.videoExample
              ? newWord.videoExample.length
              : 0
          }`
        );
        console.log(
          `- Значення: "${newWord.videoExample}"`
        );
        console.log(
          `- videoExample === null: ${
            newWord.videoExample === null
          }`
        );
        console.log(
          `- videoExample === "null": ${
            newWord.videoExample === 'null'
          }`
        );
        console.log(
          `- videoExample.trim() === "": ${
            newWord.videoExample
              ? newWord.videoExample.trim() === ''
              : 'N/A'
          }`
        );

        // Форматуємо приклади
        const formattedExamples = formatExamples(
          newWord.examples
        );

        console.log(`Дані для відправки відео:`, {
          messageType: 'sendVideo',
          chatId: dto.chatId,
          templateName: 'repeatWordsNow',
          lang,
          dynamicVariables: {
            word: newWord.word,
            translation: newWord.translation,
            examples: formattedExamples
          },
          wordId: newWord.id + '',
          videoUrl: newWord.videoExample
        });

        // Перевіряємо videoExample і вибираємо правильний шаблон для відправки
        if (
          newWord.videoExample &&
          newWord.videoExample !== 'null' &&
          newWord.videoExample.trim() !== ''
        ) {
          console.log(
            'Відправляємо повідомлення з відео'
          );
          try {
            const sendResult =
              await messageService.TelegramSendMessage(
                {
                  messageType: 'sendVideo',
                  chatId: dto.chatId,
                  templateName: 'repeatWordsNow',
                  lang,
                  dynamicVariables: {
                    word: newWord.word,
                    translation:
                      newWord.translation,
                    examples: formattedExamples
                  },
                  wordId: newWord.id + '',
                  videoUrl: newWord.videoExample
                }
              );

            if (!sendResult.ok) {
              console.error(
                `Помилка при відправці відео: ${JSON.stringify(
                  sendResult
                )}`
              );

              // Якщо не вдалося відправити відео, спробуємо відправити текстове повідомлення
              await messageService.TelegramSendMessage(
                {
                  chatId: dto.chatId,
                  templateName:
                    'repeatWordsNowText',
                  lang,
                  dynamicVariables: {
                    word: newWord.word,
                    translation:
                      newWord.translation,
                    examples: formattedExamples
                  },
                  wordId: newWord.id + ''
                }
              );
            }
          } catch (sendError) {
            console.error(
              'Критична помилка при відправці відео:',
              sendError
            );

            // При критичній помилці відправляємо текстове повідомлення
            try {
              await messageService.TelegramSendMessage(
                {
                  chatId: dto.chatId,
                  templateName:
                    'repeatWordsNowText',
                  lang,
                  dynamicVariables: {
                    word: newWord.word,
                    translation:
                      newWord.translation,
                    examples: formattedExamples
                  },
                  wordId: newWord.id + ''
                }
              );
            } catch (textError) {
              console.error(
                'Помилка при відправці текстового повідомлення:',
                textError
              );
            }
          }
        } else if (newWord.imageExample) {
          console.log(
            'Відправляємо повідомлення з фото'
          );
          try {
            await messageService.TelegramSendMessage(
              {
                messageType: 'sendPhoto',
                chatId: dto.chatId,
                templateName:
                  'repeatWordsNowPhoto',
                lang,
                dynamicVariables: {
                  word: newWord.word,
                  translation:
                    newWord.translation,
                  examples: formattedExamples
                },
                wordId: newWord.id + '',
                imageUrl: newWord.imageExample
              }
            );
          } catch (photoError) {
            console.error(
              'Помилка при відправці фото:',
              photoError
            );
            // Якщо не вдалося відправити фото, відправляємо текстове повідомлення
            await messageService.TelegramSendMessage(
              {
                chatId: dto.chatId,
                templateName:
                  'repeatWordsNowText',
                lang,
                dynamicVariables: {
                  word: newWord.word,
                  translation:
                    newWord.translation,
                  examples: formattedExamples
                },
                wordId: newWord.id + ''
              }
            );
          }
        } else {
          console.log(
            'Відправляємо текстове повідомлення'
          );
          await messageService.TelegramSendMessage(
            {
              chatId: dto.chatId,
              templateName: 'repeatWordsNowText',
              lang,
              dynamicVariables: {
                word: newWord.word,
                translation: newWord.translation,
                examples: formattedExamples
              },
              wordId: newWord.id + ''
            }
          );
        }
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
      if (isNaN(needToLearnWordId)) {
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
            examples: Array.isArray(examples)
              ? JSON.stringify(examples)
              : examples,
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

          // Check if the input is a valid JSON with all required fields
          let jsonData;
          try {
            jsonData = JSON.parse(text);
            const hasRequiredFields =
              jsonData.word &&
              jsonData.translation &&
              jsonData.examples !== undefined;

            if (hasRequiredFields) {
              // Use direct JSON data without calling AI service
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
              return;
            }
          } catch (e) {
            // Not a valid JSON, continue with normal processing
          }

          // Regular word processing with AI
          const { translation, examples } =
            await aiService.processText(text);

          await wordService.createWord({
            word: text,
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
