import { Injectable } from '@nestjs/common';

@Injectable()
export class MessageService {
  async TelegramSendMessage(dto: any) {
    try {
      const { chatId, text } = dto;
      const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
      const body = {
        chat_id: chatId,
        text
      };
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
