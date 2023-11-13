import { Injectable } from '@nestjs/common';
import { ChannelEnum } from './enum/channel.enum';
import attributes from './attributes.json';
import templates from './message-templates.json';

interface MessageTemplate {
  name: string;
  channel: string;
  description: string;
  body: string;
}

function findTemplateByNameAndChannel(
  templates: MessageTemplate[],
  name: string,
  channel: string
): MessageTemplate | undefined {
  return templates.find(
    template =>
      template.name === name &&
      template.channel === channel
  );
}

@Injectable()
export class MessageService {
  async TelegramSendMessage(dto: any) {
    try {
      const { chatId, templateName } = dto;
      const channel = ChannelEnum.telegram;

      const template =
        findTemplateByNameAndChannel(
          templates,
          templateName,
          channel
        );

      const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
      const body = filledTemplate;
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const json = await res.json();
      return json;
    } catch (err) {
      console.log(err);
    }
  }
}
