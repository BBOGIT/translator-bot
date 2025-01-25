import { WebhookResponseDto } from '../webhook/dto';
import {
  CustomerState,
  Customer
} from './bot.types';
import { ChannelEnum } from '../webhook/enum';

export async function handleLearnWordsCommand(
  dto: WebhookResponseDto,
  lang: string,
  customerService: any,
  messageService: any,
  wordService?: any,
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
    // case dto.text === '/learnWords':
    //   await customerService.update({
    //     chatId: dto.chatId,
    //     state: CustomerState.WaitingForWord
    //   });
    //   await messageService.TelegramSendMessage({
    //     chatId: dto.chatId,
    //     templateName: 'waitingForWord',
    //     lang
    //   });
    //   break;
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
      const learnedWords =
        await wordService.getWordsByCustomerId(
          customer.id,
          false
        );

      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'learnedWords',
        lang,
        dynamicVariables: {
          learnedWordsCount: learnedWords.length
        }
      });
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

      const allWords =
        await wordService.getWordsByCustomerId(
          customer.id
        );

      const currentIndex = allWords.findIndex(
        word => word.id == wordId
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
      const learnedWordId =
        dto.text.split('_')[1];
      await wordService.updateWord(
        Number(learnedWordId),
        { needToLearn: false }
      );
      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        templateName: 'okay',
        lang
      });
      break;

    case dto.text.startsWith('/iNeedToLearn_'):
      const needToLearnWordId =
        dto.text.split('_')[1];
      await wordService.updateWord(
        Number(needToLearnWordId),
        { needToLearn: true }
      );
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
  wordService: any
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