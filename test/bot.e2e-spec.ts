import {
  Test,
  TestingModule
} from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ChannelEnum } from '../src/webhook/enum/channel.enum';
import { WebhookTypeEnum } from '../src/webhook/enum/webhook-type.enum';

const TELEGRAM_CHAT_ID = '557177763'; // реальний ID

describe('Bot Controller Tests', () => {
  let app: INestApplication;
  let testCustomerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule]
      }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    // Створюємо тестового користувача перед усіма тестами
    const createCustomerResponse = await request(
      app.getHttpServer()
    )
      .post('/api/bot-test/customer')
      .send({ chatId: TELEGRAM_CHAT_ID })
      .expect(201);

    expect(
      createCustomerResponse.body.success
    ).toBe(true);
    testCustomerId =
      createCustomerResponse.body.customer.chatId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Bot API Tests', () => {
    it('should get webhook template for /start command', async () => {
      const response = await request(
        app.getHttpServer()
      )
        .get(
          `/api/bot-test/template/start?chatId=${TELEGRAM_CHAT_ID}`
        )
        .expect(200);

      expect(response.body).toHaveProperty(
        'chatId',
        TELEGRAM_CHAT_ID
      );
      expect(response.body).toHaveProperty(
        'text',
        '/start'
      );
      expect(response.body).toHaveProperty(
        'webhookType',
        WebhookTypeEnum.text
      );
      expect(response.body).toHaveProperty(
        'channel',
        ChannelEnum.telegram
      );
    });

    it('should process /start command', async () => {
      // Отримуємо шаблон для команди start
      const templateResponse = await request(
        app.getHttpServer()
      )
        .get(
          `/api/bot-test/template/start?chatId=${TELEGRAM_CHAT_ID}`
        )
        .expect(200);

      // Надсилаємо вебхук з командою start
      const webhookResponse = await request(
        app.getHttpServer()
      )
        .post('/api/bot-test/webhook')
        .send(templateResponse.body)
        .expect(201);

      expect(webhookResponse.body).toHaveProperty(
        'success',
        true
      );
      expect(webhookResponse.body).toHaveProperty(
        'message',
        'Command processed'
      );
    });

    it('should process /mainMenu command', async () => {
      const templateResponse = await request(
        app.getHttpServer()
      )
        .get(
          `/api/bot-test/template/mainMenu?chatId=${TELEGRAM_CHAT_ID}`
        )
        .expect(200);

      const webhookResponse = await request(
        app.getHttpServer()
      )
        .post('/api/bot-test/webhook')
        .send(templateResponse.body)
        .expect(201);

      expect(webhookResponse.body.success).toBe(
        true
      );
    });

    it('should process /learnWords command', async () => {
      const templateResponse = await request(
        app.getHttpServer()
      )
        .get(
          `/api/bot-test/template/learnWords?chatId=${TELEGRAM_CHAT_ID}`
        )
        .expect(200);

      const webhookResponse = await request(
        app.getHttpServer()
      )
        .post('/api/bot-test/webhook')
        .send(templateResponse.body)
        .expect(201);

      expect(webhookResponse.body.success).toBe(
        true
      );
    });

    it('should process custom message', async () => {
      // Отримуємо шаблон для кастомного повідомлення
      const templateResponse = await request(
        app.getHttpServer()
      )
        .get(
          `/api/bot-test/template/hello?chatId=${TELEGRAM_CHAT_ID}`
        )
        .expect(200);

      // Змінюємо текст повідомлення
      templateResponse.body.text = 'hello';

      // Надсилаємо вебхук з кастомним повідомленням
      const webhookResponse = await request(
        app.getHttpServer()
      )
        .post('/api/bot-test/webhook')
        .send(templateResponse.body)
        .expect(201);

      expect(webhookResponse.body.success).toBe(
        true
      );
    });
  });
});
