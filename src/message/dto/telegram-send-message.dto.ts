import { ValueType } from '../interfaces/message.interfaces';

export interface TelegramSendMessageDto {
  chatId: string;
  lang: string;
  templateName: string;
  messageType?: string;
  messageId?: string;
  dynamicVariables?: Record<string, ValueType>;
  videoUrl?: string;
  [key: string]:
    | string
    | Record<string, ValueType>
    | undefined;
}
