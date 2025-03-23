import {
  Injectable,
  Logger
} from '@nestjs/common';
import { ChannelEnum } from './enum/channel.enum';
import attributes from './attributes.json';
import templates from './message-templates.json';

interface MessageTemplate {
  name: string;
  channel: string;
  description: string;
  body: string;
}

type AttributesData = Record<
  string,
  string | Record<string, string>
>;

interface TelegramSendMessageDto {
  chatId: string;
  lang: string;
  templateName: string;
  messageType?: string;
  messageId?: string;
  dynamicVariables?: Record<string, string>;
  [key: string]:
    | string
    | Record<string, string>
    | undefined;
}

@Injectable()
export class MessageService {
  private readonly logger = new Logger(
    MessageService.name
  );

  public async TelegramSendMessage(
    dto: TelegramSendMessageDto
  ): Promise<any> {
    try {
      this.logger.log(
        `Підготовка до відправлення повідомлення Telegram. chatId: ${
          dto.chatId
        }, templateName: ${
          dto.templateName
        }, lang: ${dto.lang}, dynamicVariables: ${
          JSON.stringify(dto.dynamicVariables) || {}
        }`
      );

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
        this.findTemplateByNameAndChannel(
          templates,
          templateName,
          channel
        );
      if (!template) {
        throw new Error(
          `Шаблон не знайдено для name: ${templateName}, channel: ${channel}`
        );
      }

      const mergedAttributes =
        this.mergeAndReplaceAttributes(
          attributes,
          dynamicVariables,
          restAttributes,
          lang,
          chatId,
          messageId
        );

      let filledTemplate =
        this.fillTemplateAttributes(
          template.body,
          mergedAttributes,
          lang
        );

      if (
        template.body.includes(
          '"parse_mode":"MarkdownV2"'
        )
      ) {
        filledTemplate = this.escapeMarkdownV2(
          filledTemplate
        );
      }

      const url = `https://api.telegram.org/bot${
        process.env.TELEGRAM_BOT_TOKEN
      }/${messageType || 'sendMessage'}`;

      this.logger.debug(
        `Запит Telegram API: ${filledTemplate}`
      );

      const res = await fetch(url, {
        method: 'POST',
        body: filledTemplate,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const json = await res.json();
      this.logger.log(
        `Відповідь Telegram API: ${JSON.stringify(
          json
        )}`
      );

      return json;
    } catch (err) {
      this.logger.error(
        `Помилка при відправленні повідомлення Telegram: ${err.message}`,
        err.stack
      );
      throw err;
    }
  }

  private findTemplateByNameAndChannel(
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

  private mergeAndReplaceAttributes(
    staticAttributes: AttributesData,
    dynamicVariables: Record<string, string> = {},
    restAttributes: Record<
      string,
      string | Record<string, string>
    > = {},
    lang: string,
    chatId: string,
    messageId?: string
  ): AttributesData {
    const mergedAttributes: AttributesData = {
      ...staticAttributes,
      ...dynamicVariables,
      chatId: { [lang]: chatId },
      ...(messageId && {
        messageId: { [lang]: messageId }
      }),
      ...restAttributes
    };

    const replaceAttributesRecursive = (
      attributes: AttributesData
    ): AttributesData => {
      const replaced: AttributesData = {};
      for (const [key, value] of Object.entries(
        attributes
      )) {
        if (typeof value === 'string') {
          replaced[key] = this.replaceAttribute(
            value,
            attributes,
            lang
          );
        } else if (typeof value === 'object') {
          replaced[key] = Object.fromEntries(
            Object.entries(value).map(
              ([langKey, langValue]) => [
                langKey,
                typeof langValue === 'string'
                  ? this.replaceAttribute(
                      langValue,
                      attributes,
                      lang
                    )
                  : langValue
              ]
            )
          );
        } else {
          replaced[key] = value;
        }
      }
      return replaced;
    };

    return replaceAttributesRecursive(
      replaceAttributesRecursive(mergedAttributes)
    );
  }

  private fillTemplateAttributes(
    templateBody: string,
    attributesData: AttributesData,
    lang: string
  ): string {
    try {
      //перевірка для коректного форматування клавіатури
      if (attributesData.buttonsArray) {
        const formattedButtons = Array.isArray(
          attributesData.buttonsArray
        )
          ? attributesData.buttonsArray
          : Object.values(
              attributesData.buttonsArray
            );

        templateBody = templateBody.replace(
          '"inline_keyboard":{{buttonsArray}}',
          `"inline_keyboard":${JSON.stringify(
            formattedButtons
          )}`
        );
      }

      const jsonTemplate =
        JSON.parse(templateBody);
      const replaceAttributes = (
        obj: any
      ): any => {
        if (typeof obj === 'string') {
          return this.replaceAttribute(
            obj,
            attributesData,
            lang
          );
        }
        if (Array.isArray(obj)) {
          return obj.map(item =>
            replaceAttributes(item)
          );
        }
        if (
          typeof obj === 'object' &&
          obj !== null
        ) {
          return Object.fromEntries(
            Object.entries(obj).map(
              ([key, value]) => [
                key,
                replaceAttributes(value)
              ]
            )
          );
        }
        return obj;
      };
      return JSON.stringify(
        replaceAttributes(jsonTemplate)
      );
    } catch (error) {
      this.logger.error(
        `Помилка парсингу JSON шаблону: ${error.message}`
      );
      return templateBody;
    }
  }

  private replaceAttribute(
    text: string,
    attributesData: AttributesData,
    lang: string
  ): string {
    return text.replace(
      /\{\{(\w+)\}\}/g,
      (match, key) => {
        const value = attributesData[key];
        if (
          value !== undefined &&
          (typeof value === 'string' ||
            typeof value === 'number')
        ) {
          return value.toString();
        }
        if (
          typeof value === 'object' &&
          value[lang]
        ) {
          return value[lang];
        }
        return match;
      }
    );
  }

  private escapeMarkdownV2(
    jsonString: string
  ): string {
    const jsonObj = JSON.parse(jsonString);

    const escapeMarkdown = (
      text: string
    ): string => {
      return text.replace(
        /[_*[\]()~`>#+=.!-]/g,
        '\\$&'
      );
    };

    const processObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj;
      }
      if (Array.isArray(obj)) {
        return obj.map(item =>
          processObject(item)
        );
      }
      if (
        typeof obj === 'object' &&
        obj !== null
      ) {
        const newObj: any = {};
        for (const [key, value] of Object.entries(
          obj
        )) {
          if (
            key === 'text' ||
            key === 'caption'
          ) {
            newObj[key] = escapeMarkdown(
              value as string
            );
          } else {
            newObj[key] = processObject(value);
          }
        }
        return newObj;
      }
      return obj;
    };

    return JSON.stringify(processObject(jsonObj));
  }
}
