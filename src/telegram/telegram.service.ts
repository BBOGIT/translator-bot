// src/telegram/telegram.service.ts
import {
  Injectable,
  Logger
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(
    TelegramService.name
  );
  private readonly apiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    // Формуємо URL для Telegram API з токеном бота
    this.apiUrl = `https://api.telegram.org/bot${this.configService.get<string>(
      'TELEGRAM_BOT_TOKEN'
    )}`;
  }

  // Метод для отримання інформації про файл за його ID
  async getFile(
    fileId: string
  ): Promise<{ file_path: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.apiUrl}/getFile`,
          {
            params: { file_id: fileId }
          }
        )
      );

      if (
        !response.data.ok ||
        !response.data.result
      ) {
        throw new Error(
          'Failed to get file information from Telegram'
        );
      }

      return response.data.result;
    } catch (error) {
      this.logger.error(
        `Error getting file info for ID ${fileId}:`,
        error
      );
      throw new Error(
        'Failed to get file information from Telegram'
      );
    }
  }

  // Метод для завантаження файлу за його шляхом
  async downloadFile(
    filePath: string
  ): Promise<Buffer> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://api.telegram.org/file/bot${this.configService.get(
            'TELEGRAM_BOT_TOKEN'
          )}/${filePath}`,
          {
            responseType: 'arraybuffer'
          }
        )
      );

      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(
        `Error downloading file from path ${filePath}:`,
        error
      );
      throw new Error(
        'Failed to download file from Telegram'
      );
    }
  }
}
