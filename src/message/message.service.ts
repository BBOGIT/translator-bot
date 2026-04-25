import {
  Injectable,
  Logger,
  HttpException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChannelEnum } from './enum/channel.enum';
import {
  TelegramApiError,
  ServiceError
} from '../common/errors/domain-errors';
import {
  TelegramSuccessResponse,
  ValueType
} from './interfaces/message.interfaces';
import { TelegramSendMessageDto } from './dto/telegram-send-message.dto';
import { TemplateService } from './template.service';
import { TelegramApiClient } from '../telegram/telegram-api.client';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(
    MessageService.name
  );

  constructor(
    private readonly templateService: TemplateService,
    private readonly telegramApiClient: TelegramApiClient,
    private readonly configService: ConfigService
  ) {}

  public async TelegramSendMessage(
    dto: TelegramSendMessageDto
  ): Promise<TelegramSuccessResponse> {
    try {
      this.logger.log(
        `Підготовка до відправлення повідомлення Telegram. chatId: ${
          dto.chatId
        }, templateName: ${dto.templateName}, lang: ${dto.lang}, messageType: ${
          dto.messageType || 'sendMessage'
        }`
      );

      if (dto.dynamicVariables) {
        this.logger.debug(
          `dynamicVariables: ${JSON.stringify(dto.dynamicVariables)}`
        );
      }

      if (!dto.chatId) {
        this.logger.error(
          'TelegramSendMessage: відсутній chatId'
        );
        throw new ServiceError(
          'chatId is required',
          {
            errorCode:
              'MESSAGE_SERVICE_CHAT_ID_REQUIRED',
            reportable: false
          }
        );
      }

      if (!dto.templateName) {
        this.logger.error(
          'TelegramSendMessage: відсутній templateName'
        );
        throw new ServiceError(
          'templateName is required',
          {
            errorCode:
              'MESSAGE_SERVICE_TEMPLATE_NAME_REQUIRED',
            reportable: false
          }
        );
      }

      if (
        dto.messageType === 'sendVideo' &&
        !dto.videoUrl
      ) {
        this.logger.warn(
          'TelegramSendMessage: для sendVideo відсутній videoUrl'
        );
      }

      if (
        dto.messageType === 'deleteMessage' &&
        !dto.messageId
      ) {
        this.logger.error(
          'TelegramSendMessage: для deleteMessage відсутній messageId'
        );
      }

      if (dto.messageType === 'sendVideo') {
        this.logger.log(
          `Відправка відео для слова: ${
            dto.dynamicVariables?.word ||
            'невідомо'
          }`
        );
        this.logger.log(
          `videoUrl = "${dto.videoUrl}", тип: ${typeof dto.videoUrl}, довжина: ${
            dto.videoUrl ? dto.videoUrl.length : 0
          }`
        );

        if (
          !dto.videoUrl ||
          dto.videoUrl === 'null' ||
          dto.videoUrl.trim() === ''
        ) {
          this.logger.error(
            'Невалідний videoUrl! Змінюємо тип повідомлення на текстове'
          );
          dto.messageType = undefined;
          delete dto.videoUrl;
        }
      }

      const {
        chatId,
        lang,
        templateName,
        messageType,
        dynamicVariables,
        messageId,
        ...restAttributes
      } = dto;
      const channel = ChannelEnum.telegram;

      const template =
        this.templateService.findTemplateByNameAndChannel(
          templateName,
          channel
        );
      if (!template) {
        this.logger.error(
          `Шаблон не знайдено для name: ${templateName}, channel: ${channel}`
        );
        throw new ServiceError(
          `Template not found for name: ${templateName}, channel: ${channel}`,
          {
            errorCode:
              'MESSAGE_SERVICE_TEMPLATE_NOT_FOUND',
            reportable: false
          }
        );
      }

      const miniAppUrl = this.configService.get<string>('MINI_APP_URL', '');

      const mergedAttributes =
        this.templateService.mergeAndReplaceAttributes(
          { miniAppUrl, ...dynamicVariables },
          restAttributes,
          lang,
          chatId,
          messageId
        );

      let filledTemplate =
        this.templateService.fillTemplateAttributes(
          template.body,
          mergedAttributes,
          lang
        );

      if (
        template.body.includes(
          '"parse_mode":"MarkdownV2"'
        )
      ) {
        this.logger.debug(
          'Застосовуємо escapeMarkdownV2'
        );
        filledTemplate =
          this.templateService.escapeMarkdownV2(
            filledTemplate
          );
      }

      const body = JSON.parse(filledTemplate);
      const method = messageType || 'sendMessage';

      if (
        (method === 'editMessageText' ||
          method === 'deleteMessage') &&
        messageId
      ) {
        body.message_id = messageId;
      }

      return this.telegramApiClient.sendMessage(
        method,
        body
      );
    } catch (error) {
      this.logger.error(
        `Критична помилка в TelegramSendMessage: ${error.message}`,
        error.stack
      );
      if (
        error instanceof ServiceError ||
        error instanceof HttpException ||
        error instanceof TelegramApiError
      ) {
        throw error;
      }
      throw new ServiceError(
        `Critical error in TelegramSendMessage: ${error.message}`,
        {
          cause: error,
          errorCode:
            'MESSAGE_SERVICE_CRITICAL_ERROR',
          reportable: true
        }
      );
    }
  }

  public async TelegramEditMessage(
    chatId: string,
    messageId: string,
    templateName: string,
    lang: string,
    dynamicVariables: Record<string, ValueType>
  ): Promise<TelegramSuccessResponse> {
    const dto = {
      chatId,
      messageId,
      templateName,
      lang,
      dynamicVariables,
      messageType: 'editMessageText'
    };
    return this.TelegramSendMessage(dto);
  }
}
