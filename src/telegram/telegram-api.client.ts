import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  TelegramApiError,
  ServiceError
} from '../common/errors/domain-errors';
import {
  TelegramErrorResponse,
  TelegramSuccessResponse
} from '../message/interfaces/message.interfaces';

@Injectable()
export class TelegramApiClient {
  private readonly logger = new Logger(
    TelegramApiClient.name
  );
  private readonly telegramBotToken: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.telegramBotToken =
      this.configService.get<string>(
        'TELEGRAM_BOT_TOKEN'
      );
    if (!this.telegramBotToken) {
      this.logger.error(
        'TELEGRAM_BOT_TOKEN is not configured.'
      );
      throw new ServiceError(
        'Telegram bot token is not configured.',
        {
          errorCode:
            'TELEGRAM_API_CLIENT_BOT_TOKEN_MISSING',
          reportable: true
        }
      );
    }
  }

  public async sendMessage(
    method: string,
    body: Record<string, unknown>
  ): Promise<TelegramSuccessResponse> {
    const url = `https://api.telegram.org/bot${this.telegramBotToken}/${method}`;

    this.logger.debug(
      `Запит Telegram API: URL=${url}, request body size: ${
        JSON.stringify(body).length
      }`
    );

    try {
      this.logger.debug(
        `Request body: ${
          JSON.stringify(body).length > 500
            ? JSON.stringify(body).substring(
                0,
                500
              ) + '...'
            : JSON.stringify(body)
        }`
      );

      const response = await firstValueFrom(
        this.httpService.post<
          | TelegramSuccessResponse
          | TelegramErrorResponse
        >(url, body, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      this.logger.debug(
        `Відповідь від Telegram API: ${JSON.stringify(response.data)}`
      );

      if (!response.data.ok) {
        const errorData =
          response.data as TelegramErrorResponse;
        this.logger.error(
          `Помилка Telegram API: ${errorData.error_code} - ${errorData.description}`
        );
        throw new TelegramApiError(
          `Telegram API Error: ${errorData.description || errorData.error}`,
          {
            statusCode:
              response.status ||
              HttpStatus.INTERNAL_SERVER_ERROR,
            errorCode: `TELEGRAM_API_${errorData.error_code || 'UNKNOWN'}`,
            context: {
              telegramError: errorData
            },
            reportable: true
          }
        );
      }

      return response.data as TelegramSuccessResponse;
    } catch (error) {
      this.logger.error(
        `Помилка під час запиту до Telegram API: ${error.message}`,
        error.stack
      );
      if (
        error instanceof HttpException ||
        error instanceof TelegramApiError ||
        error instanceof ServiceError
      ) {
        throw error;
      }
      throw new TelegramApiError(
        `Failed to send Telegram message: ${error.message}`,
        {
          cause: error,
          errorCode:
            'TELEGRAM_API_REQUEST_FAILED',
          reportable: true
        }
      );
    }
  }
}
