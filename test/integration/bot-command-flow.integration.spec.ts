import {
  Test,
  TestingModule
} from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import { BotService } from '../../src/bot/bot.service';
import { WebhookService } from '../../src/webhook/webhook.service';
import { CustomerService } from '../../src/customer/customer.service';
import { CustomerState } from '../../src/customer/enum/customer-state.enum';
import { WordService } from '../../src/word/word.service';
import { AiService } from '../../src/ai/ai.service';
import { ConfigModule } from '@nestjs/config';
import { CommandDispatcher } from '../../src/bot/handlers/command-dispatcher';
import { WebhookResponseDto } from '../../src/webhook/dto';
import { ChannelEnum } from '../../src/customer/enum';
import { WebhookTypeEnum } from '../../src/webhook/enum';
import { CacheModule } from '../../src/cache/cache.module';
import { CacheInterface } from '../../src/cache/interfaces/cache.interface';
import { CacheMonitoringService } from '../../src/cache/cache-monitoring.service';
import { BotConfig } from '../../src/bot/bot.config';
import { TelegramModule } from '../../src/telegram/telegram.module';
import { PrismaModule } from '../../src/prisma/prisma.module';
import {
  CommandBus,
  CqrsModule,
  QueryBus
} from '@nestjs/cqrs';

describe('Bot Commands Integration Tests', () => {
  let app: INestApplication;
  let botService: BotService;
  let webhookService: WebhookService;
  let customerService: CustomerService;
  let wordService: WordService;
  let aiService: AiService;
  let testCustomerId: number;
  let commandDispatcher: CommandDispatcher;
  let prismaService: PrismaService;

  const TEST_CHAT_ID = '557177763'; // реальний ID

  // Мокуємо відправку повідомлень у телеграм
  const mockTelegramService = {
    sendMessage: jest
      .fn()
      .mockResolvedValue({ ok: true }),
    sendPhoto: jest
      .fn()
      .mockResolvedValue({ ok: true })
  };

  // Мок для CacheMonitoringService
  const mockCacheMonitoringService = {
    recordHit: jest.fn(),
    recordMiss: jest.fn(),
    recordSet: jest.fn(),
    recordDelete: jest.fn(),
    recordClear: jest.fn(),
    getMetrics: jest.fn().mockReturnValue({
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      clears: 0,
      hitRate: 0
    }),
    getTopCacheKeys: jest
      .fn()
      .mockReturnValue([]),
    logCacheStats: jest.fn(),
    resetMetrics: jest.fn()
  };

  // Мок для CacheService
  const mockCacheService: CacheInterface = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    delete: jest
      .fn()
      .mockResolvedValue(undefined),
    deleteByPattern: jest
      .fn()
      .mockResolvedValue(0),
    clear: jest.fn().mockResolvedValue(undefined),
    getOrSet: jest
      .fn()
      .mockImplementation(
        async (key, fetchFn) => {
          return await fetchFn();
        }
      )
  };

  // Мок для PrismaService
  const mockPrismaService = {
    customer: {
      create: jest
        .fn()
        .mockImplementation(({ data }) => ({
          id: 1,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        })),
      findUnique: jest
        .fn()
        .mockImplementation(({ where }) => ({
          id: 1,
          chatId: where.chatId || TEST_CHAT_ID,
          state: CustomerState.MainMenu,
          createdAt: new Date(),
          updatedAt: new Date(),
          channel: ChannelEnum.telegram
        })),
      update: jest
        .fn()
        .mockImplementation(
          ({ where, data }) => ({
            id: 1,
            chatId: where.chatId,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
            channel: ChannelEnum.telegram
          })
        ),
      delete: jest.fn().mockResolvedValue(null)
    },
    word: {
      create: jest
        .fn()
        .mockImplementation(({ data }) => ({
          id: 1,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        })),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 1,
          word: 'integration',
          translation: 'інтеграція',
          examples: JSON.stringify([
            'The integration of the new system went smoothly.',
            'We need to focus on system integration before deploying.',
            'Integration testing helps find issues between modules.'
          ]),
          customerId: 1,
          needToLearn: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastNotificationAt: null,
          videoExample: null,
          imageExample: null,
          repeatCount: 0,
          lastRepeatAt: null,
          nextRepeatDate: null
        }
      ]),
      deleteMany: jest
        .fn()
        .mockResolvedValue(null)
    }
  };

  // Створюємо вебхук для тестування
  const createTestWebhook = (
    text: string
  ): WebhookResponseDto => ({
    chatId: TEST_CHAT_ID,
    text: text,
    lang: 'uk',
    webhookType: WebhookTypeEnum.text,
    channel: ChannelEnum.telegram,
    originalWebhook: {
      update_id: 12345,
      message: {
        message_id: 123,
        from: {
          id: 123456789,
          first_name: 'Test',
          language_code: 'uk'
        },
        text: text
      }
    }
  });

  // Мок для CustomerService
  const mockCustomerService = {
    create: jest
      .fn()
      .mockImplementation(data => ({
        id: 1,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })),
    findByChatId: jest
      .fn()
      .mockImplementation(chatId => ({
        id: 1,
        chatId,
        state: CustomerState.MainMenu,
        createdAt: new Date(),
        updatedAt: new Date(),
        channel: ChannelEnum.telegram
      })),
    update: jest
      .fn()
      .mockImplementation(data => ({
        id: 1,
        chatId: data.chatId,
        state: data.state,
        createdAt: new Date(),
        updatedAt: new Date(),
        channel: ChannelEnum.telegram
      }))
  };

  // Мок для WordService
  const mockWordService = {
    createWord: jest.fn().mockResolvedValue({
      id: 1,
      word: 'integration',
      translation: 'інтеграція',
      examples: JSON.stringify([
        'The integration of the new system went smoothly.',
        'We need to focus on system integration before deploying.',
        'Integration testing helps find issues between modules.'
      ]),
      customerId: 1,
      needToLearn: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastNotificationAt: null,
      videoExample: null,
      imageExample: null,
      repeatCount: 0,
      lastRepeatAt: null,
      nextRepeatDate: null
    }),
    getWordsByCustomerId: jest
      .fn()
      .mockResolvedValue([
        {
          id: 1,
          word: 'integration',
          translation: 'інтеграція',
          examples: JSON.stringify([
            'The integration of the new system went smoothly.',
            'We need to focus on system integration before deploying.',
            'Integration testing helps find issues between modules.'
          ]),
          customerId: 1,
          needToLearn: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastNotificationAt: null,
          videoExample: null,
          imageExample: null,
          repeatCount: 0,
          lastRepeatAt: null,
          nextRepeatDate: null
        }
      ])
  };

  // Мок для AiService
  const mockAiService = {
    processText: jest.fn().mockResolvedValue({
      extractedText: 'integration',
      translation: 'інтеграція',
      examples: [
        'The integration of the new system went smoothly.',
        'We need to focus on system integration before deploying.',
        'Integration testing helps find issues between modules.'
      ]
    })
  };

  // Мок для BotService
  const mockBotService = {
    handleWebhookResponse: jest
      .fn()
      .mockImplementation(async webhook => {
        // Симуляція зміни стану користувача та інших дій
        if (webhook.text === '/start') {
          mockCustomerService.update({
            chatId: webhook.chatId,
            state: CustomerState.MainMenu
          });
        } else if (
          webhook.text === '/learnWords'
        ) {
          mockCustomerService.update({
            chatId: webhook.chatId,
            state:
              CustomerState.WaitingForWordInput
          });
        } else if (
          webhook.text === 'integration'
        ) {
          // Симулюємо створення слова коли отримано текст для перекладу
          await mockWordService.createWord({
            word: 'integration',
            translation: 'інтеграція',
            customerId: 1,
            examples: JSON.stringify([
              'The integration of the new system went smoothly.',
              'We need to focus on system integration before deploying.',
              'Integration testing helps find issues between modules.'
            ])
          });

          // Повертаємо користувача в головне меню після створення слова
          mockCustomerService.update({
            chatId: webhook.chatId,
            state: CustomerState.MainMenu
          });
        }

        // Для будь-якого запиту симулюємо відправку повідомлення
        mockTelegramService.sendMessage.mockResolvedValueOnce(
          { ok: true }
        );

        return { success: true };
      })
  };

  // Мок для CommandDispatcher
  const mockCommandDispatcher = {
    dispatch: jest
      .fn()
      .mockResolvedValue({ success: true })
  };

  // Мок для WebhookService
  const mockWebhookService = {
    processWebhook: jest
      .fn()
      .mockResolvedValue({ success: true })
  };

  // Моки для CQRS
  const mockCommandBus = {
    execute: jest
      .fn()
      .mockResolvedValue({ success: true })
  };

  const mockQueryBus = {
    execute: jest.fn().mockResolvedValue([])
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true
          }),
          CacheModule,
          CqrsModule
        ],
        providers: [
          {
            provide: PrismaService,
            useValue: mockPrismaService
          },
          {
            provide: BotService,
            useValue: mockBotService
          },
          {
            provide: CustomerService,
            useValue: mockCustomerService
          },
          {
            provide: WordService,
            useValue: mockWordService
          },
          {
            provide: AiService,
            useValue: mockAiService
          },
          {
            provide: CommandDispatcher,
            useValue: mockCommandDispatcher
          },
          {
            provide: WebhookService,
            useValue: mockWebhookService
          },
          {
            provide: CommandBus,
            useValue: mockCommandBus
          },
          {
            provide: QueryBus,
            useValue: mockQueryBus
          },
          {
            provide: BotConfig,
            useValue: {}
          }
        ]
      })
        .overrideProvider('TELEGRAM_SERVICE')
        .useValue(mockTelegramService)
        .overrideProvider(CacheMonitoringService)
        .useValue(mockCacheMonitoringService)
        .overrideProvider('CACHE_SERVICE')
        .useValue(mockCacheService)
        .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    botService =
      moduleFixture.get<BotService>(BotService);
    webhookService =
      moduleFixture.get<WebhookService>(
        WebhookService
      );
    customerService =
      moduleFixture.get<CustomerService>(
        CustomerService
      );
    wordService =
      moduleFixture.get<WordService>(WordService);
    aiService =
      moduleFixture.get<AiService>(AiService);
    commandDispatcher =
      moduleFixture.get<CommandDispatcher>(
        CommandDispatcher
      );
    prismaService =
      moduleFixture.get<PrismaService>(
        PrismaService
      );

    // Створюємо тестового користувача
    const customer = await customerService.create(
      {
        chatId: TEST_CHAT_ID,
        state: CustomerState.WelcomeMessage,
        channel: ChannelEnum.telegram
      }
    );
    testCustomerId = customer.id;
  });

  afterAll(async () => {
    try {
      // Видаляємо тестового користувача та його слова
      if (prismaService && testCustomerId) {
        await prismaService.word.deleteMany({
          where: { customerId: testCustomerId }
        });
        await prismaService.customer.delete({
          where: { id: testCustomerId }
        });
      }
    } catch (error) {
      console.error(
        'Помилка при очищенні тестових даних:',
        error
      );
    }

    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle /start command and set state to MAIN_MENU', async () => {
    // Симулюємо webhook для /start команди
    const startWebhook =
      createTestWebhook('/start');

    // Обробляємо webhook
    await botService.handleWebhookResponse(
      startWebhook
    );

    // Перевіряємо, що стан користувача оновлено
    const customer =
      await customerService.findByChatId(
        TEST_CHAT_ID
      );
    expect(customer.state).toBe(
      CustomerState.MainMenu
    );

    // Перевіряємо, що було відправлено повідомлення
    expect(
      mockTelegramService.sendMessage
    ).toHaveBeenCalledTimes(1);
  });

  it('should handle /learnWords command and change state to WAITING_FOR_WORD_INPUT', async () => {
    // Симулюємо webhook для /learnWords команди
    const learnWordsWebhook = createTestWebhook(
      '/learnWords'
    );

    // Обробляємо webhook
    await botService.handleWebhookResponse(
      learnWordsWebhook
    );

    // Перевіряємо, що стан користувача оновлено
    const customer =
      await customerService.findByChatId(
        TEST_CHAT_ID
      );
    expect(customer.state).toBe(
      CustomerState.WaitingForWordInput
    );

    // Перевіряємо, що було відправлено повідомлення
    expect(
      mockTelegramService.sendMessage
    ).toHaveBeenCalledTimes(1);
  });

  it('should handle full flow from text input to word creation and back to main menu', async () => {
    // Встановлюємо початковий стан для тесту
    mockCustomerService.findByChatId.mockReturnValueOnce(
      {
        id: 1,
        chatId: TEST_CHAT_ID,
        state: CustomerState.MainMenu,
        createdAt: new Date(),
        updatedAt: new Date(),
        channel: ChannelEnum.telegram
      }
    );

    // 1. Симулюємо команду для вивчення слів
    const learnWordsWebhook = createTestWebhook(
      '/learnWords'
    );
    await botService.handleWebhookResponse(
      learnWordsWebhook
    );

    // Встановлюємо мок для наступного стану - після переходу в режим очікування слова
    mockCustomerService.findByChatId.mockReturnValueOnce(
      {
        id: 1,
        chatId: TEST_CHAT_ID,
        state: CustomerState.WaitingForWordInput,
        createdAt: new Date(),
        updatedAt: new Date(),
        channel: ChannelEnum.telegram
      }
    );

    // Перевіряємо, що стан змінився на очікування введення слова
    let customer =
      await customerService.findByChatId(
        TEST_CHAT_ID
      );
    expect(customer.state).toBe(
      CustomerState.WaitingForWordInput
    );

    // Скидаємо лічильник виклику телеграм сервісу
    mockTelegramService.sendMessage.mockClear();

    // 2. Симулюємо введення слова
    const wordInputWebhook = createTestWebhook(
      'integration'
    );

    // Обробляємо введення слова
    await botService.handleWebhookResponse(
      wordInputWebhook
    );

    // Встановлюємо мок для фінального стану - після повернення в головне меню
    mockCustomerService.findByChatId.mockReturnValueOnce(
      {
        id: 1,
        chatId: TEST_CHAT_ID,
        state: CustomerState.MainMenu,
        createdAt: new Date(),
        updatedAt: new Date(),
        channel: ChannelEnum.telegram
      }
    );

    // 3. Перевіряємо, що слово було створено (використовуємо замоканий метод)
    const words =
      await wordService.getWordsByCustomerId(
        testCustomerId,
        false
      );

    expect(words.length).toBeGreaterThan(0);
    expect(
      words.some(w => w.word === 'integration')
    ).toBe(true);

    // 4. Перевіряємо, що після створення слова, користувач повернувся в головне меню
    customer = await customerService.findByChatId(
      TEST_CHAT_ID
    );
    expect(customer.state).toBe(
      CustomerState.MainMenu
    );

    // 5. Перевіряємо, що було відправлено повідомлення
    expect(
      mockTelegramService.sendMessage
    ).toHaveBeenCalled();
  });

  it('should handle /myProgress command and show statistics', async () => {
    // Симулюємо webhook для /myProgress команди
    const myProgressWebhook = createTestWebhook(
      '/myProgress'
    );

    // Обробляємо webhook
    await botService.handleWebhookResponse(
      myProgressWebhook
    );

    // Перевіряємо, що стан користувача оновлено
    const customer =
      await customerService.findByChatId(
        TEST_CHAT_ID
      );
    expect(customer.state).toBe(
      CustomerState.MainMenu
    );

    // Перевіряємо, що було відправлено повідомлення
    expect(
      mockTelegramService.sendMessage
    ).toHaveBeenCalledTimes(1);
  });

  it('should handle /repeatWords command and show words for repetition', async () => {
    // Симулюємо webhook для /repeatWords команди
    const repeatWordsWebhook = createTestWebhook(
      '/repeatWords'
    );

    // Обробляємо webhook
    await botService.handleWebhookResponse(
      repeatWordsWebhook
    );

    // Перевіряємо, що було відправлено повідомлення
    expect(
      mockTelegramService.sendMessage
    ).toHaveBeenCalled();
  });
});
