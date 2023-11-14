import { Injectable } from '@nestjs/common';
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
  constructor(private botService: BotService) {}

  async getTelegramWebhook(
    dto: TelegramWebhookBodyDto
  ) {
    let chatId: string,
      lang: string,
      text: string | null,
      webhookType: WebhookTypeEnum,
      firstName: string | null,
      lastName: string | null;
    const channel: ChannelEnum =
      ChannelEnum.telegram;

    if (dto.message) {
      const {
        from,
        location,
        document,
        sticker,
        photo,
        audio,
        voice,
        animation,
        video,
        contact
      } = dto.message;
      chatId = String(from.id);
      firstName = from.first_name || null;
      lastName = from.last_name || null;
      lang = from.language_code;

      if (location) {
        text = `${location.latitude},${location.longitude}`;
        webhookType = WebhookTypeEnum.location;
      } else if (document) {
        text = document.file_name;
        if (dto.message.caption) {
          text += ` ${dto.message.caption}`;
        }
        webhookType = WebhookTypeEnum.document;
      } else if (sticker) {
        text = sticker.emoji;
        webhookType = WebhookTypeEnum.sticker;
      } else if (photo) {
        text = dto.message.caption || null;
        webhookType = WebhookTypeEnum.photo;
      } else if (audio) {
        text = audio.title;
        if (audio.performer) {
          text += ` ${audio.performer}`;
        }
        if (dto.message.caption) {
          text += ` ${dto.message.caption}`;
        }
        webhookType = WebhookTypeEnum.audio;
      } else if (voice) {
        text = null;
        webhookType = WebhookTypeEnum.voice;
      } else if (animation) {
        text = animation.file_name;
        webhookType = WebhookTypeEnum.animation;
      } else if (video) {
        text = dto.message.caption || null;
        webhookType = WebhookTypeEnum.video;
      } else if (contact) {
        text = contact.phone_number;
        webhookType = WebhookTypeEnum.contact;
      } else {
        text = dto.message.text;
        webhookType = WebhookTypeEnum.text;
      }
    } else if (dto.callback_query) {
      const { from } = dto.callback_query;
      chatId = String(from.id);
      firstName = from.first_name || null;
      lastName = from.last_name || null;
      lang = from.language_code;
      text = dto.callback_query.data;
      webhookType = WebhookTypeEnum.callbackQuery;
    } else if (dto.edited_message) {
      const { from, animation } =
        dto.edited_message;
      chatId = String(from.id);
      firstName = from.first_name || null;
      lastName = from.last_name || null;
      lang = from.language_code;

      if (animation) {
        text = dto.edited_message.caption;
        webhookType = WebhookTypeEnum.animation;
      } else {
        text = dto.edited_message.text;
        webhookType = WebhookTypeEnum.text;
      }
    }

    const responseDto: WebhookResponseDto = {
      chatId,
      lang,
      webhookType,
      text,
      firstName,
      lastName,
      channel
    };

    await this.botService.checkState(responseDto);

    return 'ok';
  }
}
