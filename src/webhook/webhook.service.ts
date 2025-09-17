import {
  Injectable,
  Logger
} from '@nestjs/common';
import {
  TelegramWebhookBodyDto,
  WebhookResponseDto,
  MessageDto,
  CallbackQueryDto,
  EditedMessageDto
} from './dto';
import {
  WebhookTypeEnum,
  ChannelEnum
} from './enum';
import { BotService } from '../bot/bot.service';

type WebhookSource =
  | MessageDto
  | CallbackQueryDto
  | EditedMessageDto;

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(
    WebhookService.name
  );

  constructor(private botService: BotService) {}

  async getTelegramWebhook(
    dto: TelegramWebhookBodyDto
  ): Promise<string> {
    try {
      const responseDto = this.parseWebhook(dto);
      this.logger.log(
        `Received Telegram webhook: ${JSON.stringify(
          responseDto
        )}`
      );

      try {
        await this.botService.handleWebhookResponse(
          responseDto
        );
      } catch (error) {
        this.logger.error(
          `Error processing webhook: ${error.message}`,
          error.stack
        );
      }

      return 'ok';
    } catch (error) {
      this.logger.error(
        `Critical error processing webhook: ${error.message}`,
        error.stack
      );
      return 'ok';
    }
  }

  private parseWebhook(
    dto: TelegramWebhookBodyDto
  ): WebhookResponseDto & {
    originalWebhook: TelegramWebhookBodyDto;
  } {
    const { source, webhookType } =
      this.getSourceAndType(dto);
    const { from } = source;

    let messageId: string | undefined;
    if ('message' in source && source.message) {
      messageId = String(
        source.message.message_id
      );
    } else if ('message_id' in source) {
      messageId = String(source.message_id);
    }

    return {
      chatId: String(from.id),
      lang: from.language_code,
      webhookType,
      text: this.extractText(source, webhookType),
      firstName: from.first_name ?? null,
      lastName: from.last_name ?? null,
      channel: ChannelEnum.telegram,
      messageId,
      originalWebhook: dto
    };
  }

  private getSourceAndType(
    dto: TelegramWebhookBodyDto
  ): {
    source: WebhookSource;
    webhookType: WebhookTypeEnum;
  } {
    if (dto.message) {
      return {
        source: dto.message,
        webhookType: this.getMessageType(
          dto.message
        )
      };
    }
    if (dto.callback_query) {
      return {
        source: dto.callback_query,
        webhookType: WebhookTypeEnum.callbackQuery
      };
    }
    if (dto.edited_message) {
      return {
        source: dto.edited_message,
        webhookType: WebhookTypeEnum.editedMessage
      };
    }
    throw new Error('Unsupported webhook type');
  }

  private getMessageType(
    message: MessageDto
  ): WebhookTypeEnum {
    const typeMap: Record<
      string,
      WebhookTypeEnum
    > = {
      location: WebhookTypeEnum.location,
      document: WebhookTypeEnum.document,
      sticker: WebhookTypeEnum.sticker,
      photo: WebhookTypeEnum.photo,
      audio: WebhookTypeEnum.audio,
      voice: WebhookTypeEnum.voice,
      animation: WebhookTypeEnum.animation,
      video: WebhookTypeEnum.video,
      contact: WebhookTypeEnum.contact
    };

    return (
      Object.entries(typeMap).find(
        ([key]) => message[key]
      )?.[1] ?? WebhookTypeEnum.text
    );
  }

  private extractText(
    source: WebhookSource,
    type: WebhookTypeEnum
  ): string | null {
    const extractors: Partial<
      Record<WebhookTypeEnum, () => string | null>
    > = {
      [WebhookTypeEnum.location]: () => {
        const msg = source as MessageDto;
        return msg.location
          ? `${msg.location.latitude},${msg.location.longitude}`
          : null;
      },
      [WebhookTypeEnum.document]: () => {
        const msg = source as MessageDto;
        return msg.document
          ? `${msg.document.file_name}${
              msg.caption ? ` ${msg.caption}` : ''
            }`
          : null;
      },
      [WebhookTypeEnum.sticker]: () => {
        const msg = source as MessageDto;
        return msg.sticker?.emoji ?? null;
      },
      [WebhookTypeEnum.photo]: () => {
        const msg = source as MessageDto;
        return msg.caption ?? null;
      },
      [WebhookTypeEnum.video]: () => {
        const msg = source as MessageDto;
        return msg.caption ?? null;
      },
      [WebhookTypeEnum.audio]: () => {
        const msg = source as MessageDto;
        return msg.audio
          ? `${msg.audio.title}${
              msg.audio.performer
                ? ` ${msg.audio.performer}`
                : ''
            }${
              msg.caption ? ` ${msg.caption}` : ''
            }`
          : null;
      },
      [WebhookTypeEnum.voice]: () => null,
      [WebhookTypeEnum.animation]: () => {
        const msg = source as MessageDto;
        return msg.animation?.file_name ?? null;
      },
      [WebhookTypeEnum.contact]: () => {
        const msg = source as MessageDto;
        return msg.contact?.phone_number ?? null;
      },
      [WebhookTypeEnum.callbackQuery]: () => {
        const cbq = source as CallbackQueryDto;
        return cbq.data;
      },
      [WebhookTypeEnum.text]: () => {
        const msg = source as MessageDto;
        return msg.text;
      },
      [WebhookTypeEnum.editedMessage]: () => {
        const editedMsg =
          source as EditedMessageDto;
        return (
          editedMsg.text ??
          editedMsg.caption ??
          null
        );
      }
    };

    const extractor = extractors[type];
    return extractor ? extractor() : null;
  }
}
