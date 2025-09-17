import { initializeOpenTelemetry } from './telemetry';

if (process.env.ENABLE_TELEMETRY === 'true') {
  initializeOpenTelemetry();
} else {
  console.log(
    'OpenTelemetry disabled. Set ENABLE_TELEMETRY=true to enable.'
  );
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import {
  ValidationPipe,
  HttpStatus,
  INestApplication
} from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerModule
} from '@nestjs/swagger';
import { Request, Response } from 'express';

async function bootstrap(): Promise<void> {
  const app: INestApplication =
    await NestFactory.create(AppModule);
  const configService: ConfigService = app.get(
    ConfigService
  );

  // Встановлення глобального префіксу API
  app.setGlobalPrefix('api');

  // Глобальні пайпи
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );

  // Налаштування Swagger
  const config = new DocumentBuilder()
    .setTitle('Translator Bot API')
    .setDescription(
      'API для перекладацького бота'
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(
    app,
    config
  );
  SwaggerModule.setup('api/docs', app, document);

  // Endpoint для перевірки здоров'я
  app
    .getHttpAdapter()
    .get(
      '/api/health',
      (req: Request, res: Response): void => {
        res.status(HttpStatus.OK).send('OK');
      }
    );

  app.enableCors();

  // Enable shutdown hooks for graceful termination
  app.enableShutdownHooks();

  const port = configService.get<number>(
    'PORT',
    3000
  );
  const host = configService.get<string>(
    'HOST',
    'localhost'
  );

  await app.listen(port, host, () => {
    console.log(
      `Application is running on: http://${host}:${port}`
    );
  });
}
bootstrap();
