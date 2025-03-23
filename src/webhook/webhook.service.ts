import {
  Injectable,
  Logger
} from '@nestjs/common';
import {
  TelegramWebhookBodyDto,
  WebhookResponseDto
} from './dto';
import {
  WebhookTypeEnum,
  ChannelEnum
} from './enum';
import { BotService } from 'src/bot/bot.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(
    WebhookService.name
  );

  constructor(private botService: BotService) {}

  async getTelegramWebhook(
    dto: TelegramWebhookBodyDto
  ): Promise<string> {
    const responseDto = this.parseWebhook(dto);
    this.logger.log(
      `Received Telegram webhook: ${JSON.stringify(
        responseDto
      )}`
    );
    this.botService.checkState(responseDto);

    return 'ok';
  }

  private parseWebhook(
    dto: TelegramWebhookBodyDto
  ): WebhookResponseDto & {
    originalWebhook: TelegramWebhookBodyDto;
  } {
    const { source, webhookType } =
      this.getSourceAndType(dto);
    const { from } = source;

    return {
      chatId: String(from.id),
      lang: from.language_code,
      webhookType,
      text: this.extractText(source, webhookType),
      firstName: from.first_name ?? null,
      lastName: from.last_name ?? null,
      channel: ChannelEnum.telegram,
      originalWebhook: dto
    };
  }

  private getSourceAndType(
    dto: TelegramWebhookBodyDto
  ): {
    source: any;
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
      const source = dto.edited_message;
      return {
        source,
        webhookType: WebhookTypeEnum.editedMessage
      };
    }
    throw new Error('Unsupported webhook type');
  }

  private getMessageType(
    message: any
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
    source: any,
    type: WebhookTypeEnum
  ): string | null {
    const extractors: Record<
      WebhookTypeEnum,
      () => string | null
    > = {
      [WebhookTypeEnum.location]: () =>
        `${source.location.latitude},${source.location.longitude}`,
      [WebhookTypeEnum.document]: () =>
        `${source.document.file_name}${
          source.caption
            ? ` ${source.caption}`
            : ''
        }`,
      [WebhookTypeEnum.sticker]: () =>
        source.sticker.emoji,
      [WebhookTypeEnum.photo]: () =>
        source.caption ?? null,
      [WebhookTypeEnum.video]: () =>
        source.caption ?? null,
      [WebhookTypeEnum.audio]: () =>
        `${source.audio.title}${
          source.audio.performer
            ? ` ${source.audio.performer}`
            : ''
        }${
          source.caption
            ? ` ${source.caption}`
            : ''
        }`,
      [WebhookTypeEnum.voice]: () => null,
      [WebhookTypeEnum.animation]: () =>
        source.animation.file_name,
      [WebhookTypeEnum.contact]: () =>
        source.contact.phone_number,
      [WebhookTypeEnum.callbackQuery]: () =>
        source.data,
      [WebhookTypeEnum.text]: () => source.text,
      [WebhookTypeEnum.editedMessage]: () =>
        source.text ?? source.caption ?? null
    };

    return extractors[type]?.() ?? null;
  }
}
