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

// Оголошуємо тип ValueType, який може бути різними значеннями
type ValueType =
  | string
  | any[]
  | Record<string, any>;

// Використовуємо ValueType для AttributesData
type AttributesData = Record<string, ValueType>;

// Використовуємо ValueType для TelegramSendMessageDto
interface TelegramSendMessageDto {
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
        }, lang: ${dto.lang}, messageType: ${
          dto.messageType || 'sendMessage'
        }`
      );

      if (dto.dynamicVariables) {
        this.logger.debug(
          `dynamicVariables: ${JSON.stringify(
            dto.dynamicVariables
          )}`
        );
      }

      // Перевіряємо наявність критичних полів
      if (!dto.chatId) {
        this.logger.error(
          'TelegramSendMessage: відсутній chatId'
        );
        return {
          ok: false,
          error: 'chatId is required'
        };
      }

      if (!dto.templateName) {
        this.logger.error(
          'TelegramSendMessage: відсутній templateName'
        );
        return {
          ok: false,
          error: 'templateName is required'
        };
      }

      // Перевіряємо додаткові параметри для різних типів повідомлень
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
        return {
          ok: false,
          error:
            'messageId is required for deleteMessage'
        };
      }

      // Додаткова перевірка та логування для videoUrl
      if (dto.messageType === 'sendVideo') {
        this.logger.log(
          `Відправка відео для слова: ${dto.dynamicVariables?.word || 'невідомо'}`
        );
        this.logger.log(
          `videoUrl = "${dto.videoUrl}", тип: ${typeof dto.videoUrl}, довжина: ${
            dto.videoUrl ? dto.videoUrl.length : 0
          }`
        );
        
        // Перевірка на валідність URL
        if (
          !dto.videoUrl || 
          dto.videoUrl === 'null' || 
          dto.videoUrl.trim() === ''
        ) {
          this.logger.error('Невалідний videoUrl! Змінюємо тип повідомлення на текстове');
          dto.messageType = undefined; // За замовчуванням буде 'sendMessage'
          // Видаляємо videoUrl, щоб не було спроби відправити невалідне відео
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

      this.logger.debug(
        `Пошук шаблону для name: ${templateName}, channel: ${channel}`
      );

      const template =
        this.findTemplateByNameAndChannel(
          templates,
          templateName,
          channel
        );
      if (!template) {
        this.logger.error(
          `Шаблон не знайдено для name: ${templateName}, channel: ${channel}`
        );
        return {
          ok: false,
          error: 'Template not found'
        };
      }

      this.logger.debug(
        `Шаблон знайдено: ${JSON.stringify(
          template
        )}`
      );

      this.logger.debug(
        `Розпочинаємо mergeAndReplaceAttributes для chatId: ${chatId}, templateName: ${templateName}`
      );

      const mergedAttributes =
        this.mergeAndReplaceAttributes(
          attributes,
          dynamicVariables,
          restAttributes,
          lang,
          chatId,
          messageId
        );

      this.logger.debug(
        `mergedAttributes завершено, отримано ${
          Object.keys(mergedAttributes).length
        } атрибутів`
      );

      this.logger.debug(
        `Розпочинаємо fillTemplateAttributes для templateName: ${templateName}`
      );

      let filledTemplate =
        this.fillTemplateAttributes(
          template.body,
          mergedAttributes,
          lang
        );

      this.logger.debug(
        `fillTemplateAttributes завершено, розмір шаблону: ${filledTemplate.length}`
      );

      if (
        template.body.includes(
          '"parse_mode":"MarkdownV2"'
        )
      ) {
        this.logger.debug(
          'Застосовуємо escapeMarkdownV2'
        );
        filledTemplate = this.escapeMarkdownV2(
          filledTemplate
        );
      }

      const url = `https://api.telegram.org/bot${
        process.env.TELEGRAM_BOT_TOKEN
      }/${messageType || 'sendMessage'}`;

      this.logger.debug(
        `Запит Telegram API: URL=${url}, request body size: ${filledTemplate.length}`
      );

      try {
        this.logger.debug(
          'Виконуємо запит до Telegram API'
        );

        const res = await fetch(url, {
          method: 'POST',
          body: filledTemplate,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        this.logger.debug(
          `Отримано відповідь від Telegram API: статус ${res.status}`
        );

        const json = await res.json();

        if (!json.ok) {
          this.logger.error(
            `Помилка Telegram API: ${JSON.stringify(
              json
            )}. Запит: ${filledTemplate}`
          );
          return json;
        }

        this.logger.log(
          `Відповідь Telegram API: ${JSON.stringify(
            json
          )}`
        );

        return json;
      } catch (apiError) {
        this.logger.error(
          `Помилка при виклику Telegram API: ${apiError.message}. URL: ${url}, Body size: ${filledTemplate.length}`,
          apiError.stack
        );
        return {
          ok: false,
          error: apiError.message
        };
      }
    } catch (err) {
      this.logger.error(
        `Помилка при підготовці повідомлення Telegram: ${err.message}`,
        err.stack
      );
      return { ok: false, error: err.message };
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
    dynamicVariables: Record<
      string,
      ValueType
    > = {},
    restAttributes: Record<
      string,
      ValueType
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
      attributes: AttributesData,
      localLang: string
    ): AttributesData => {
      const replaced: AttributesData = {};

      this.logger.debug(
        `replaceAttributesRecursive: вхідні атрибути: ${JSON.stringify(
          attributes
        )}`
      );

      // Захист від undefined або null
      if (!attributes) {
        this.logger.error(
          `replaceAttributesRecursive: отримано null або undefined замість об'єкта атрибутів`
        );
        return {};
      }

      try {
        for (const [key, value] of Object.entries(
          attributes
        )) {
          if (typeof value === 'string') {
            replaced[key] = this.replaceAttribute(
              value,
              attributes,
              localLang
            );
          } else if (
            typeof value === 'object' &&
            value !== null
          ) {
            replaced[key] = Object.fromEntries(
              Object.entries(value).map(
                ([langKey, langValue]) => [
                  langKey,
                  typeof langValue === 'string'
                    ? this.replaceAttribute(
                        langValue,
                        attributes,
                        localLang
                      )
                    : langValue
                ]
              )
            );
          } else {
            replaced[key] = value;
          }
        }
      } catch (error) {
        this.logger.error(
          `Помилка в replaceAttributesRecursive: ${
            error.message
          }, атрибути: ${JSON.stringify(
            attributes
          )}`,
          error.stack
        );
        return {};
      }

      return replaced;
    };

    return replaceAttributesRecursive(
      replaceAttributesRecursive(
        mergedAttributes,
        lang
      ),
      lang
    );
  }

  private fillTemplateAttributes(
    templateBody: string,
    attributesData: AttributesData,
    lang: string
  ): string {
    try {
      this.logger.debug(
        `fillTemplateAttributes: вхідний шаблон: ${templateBody.substring(
          0,
          100
        )}...`
      );

      // Захист від null або undefined в attributesData
      if (!attributesData) {
        this.logger.error(
          'fillTemplateAttributes: attributesData є null або undefined'
        );
        attributesData = {};
      }

      this.logger.debug(
        `fillTemplateAttributes: attributesData: ${JSON.stringify(
          attributesData
        )}`
      );

      // Обробка умовних блоків для examples
      const conditionalRegex =
        /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
      templateBody = templateBody.replace(
        conditionalRegex,
        (match, key, content) => {
          const value = attributesData[key];

          if (
            value &&
            value !== '' &&
            value !== '[]' &&
            value !== 'null' &&
            value !== 'undefined'
          ) {
            // Перевіряємо та замінюємо {{key}} на значення, щоб уникнути необроблених тегів
            return content.replace(
              new RegExp(
                `\\{\\{${key}\\}\\}`,
                'g'
              ),
              String(value)
            );
          }

          return '';
        }
      );

      //перевірка для коректного форматування клавіатури
      if (attributesData.buttonsArray) {
        this.logger.debug(
          `buttonsArray до форматування: ${JSON.stringify(
            attributesData.buttonsArray
          )}`
        );
        this.logger.debug(
          `тип buttonsArray: ${typeof attributesData.buttonsArray}`
        );

        let formattedButtons;

        try {
          if (
            Array.isArray(
              attributesData.buttonsArray
            )
          ) {
            this.logger.debug(
              'buttonsArray є масивом, використовуємо як є'
            );
            formattedButtons =
              attributesData.buttonsArray;
          } else if (
            typeof attributesData.buttonsArray ===
            'string'
          ) {
            this.logger.debug(
              'buttonsArray є рядком, намагаємось обробити як JSON'
            );
            formattedButtons = JSON.parse(
              attributesData.buttonsArray
            );
          } else if (
            typeof attributesData.buttonsArray ===
              'object' &&
            attributesData.buttonsArray !== null
          ) {
            this.logger.debug(
              "buttonsArray є об'єктом, використовуємо Object.values"
            );
            formattedButtons = Object.values(
              attributesData.buttonsArray
            );
          } else {
            this.logger.error(
              `Непідтримуваний тип для buttonsArray: ${typeof attributesData.buttonsArray}`
            );
            formattedButtons = [];
          }
        } catch (buttonsError) {
          this.logger.error(
            `Помилка при форматуванні кнопок: ${buttonsError.message}`
          );
          formattedButtons = [];
        }

        this.logger.debug(
          `formattedButtons: ${JSON.stringify(
            formattedButtons
          )}`
        );

        templateBody = templateBody.replace(
          '"inline_keyboard":{{buttonsArray}}',
          `"inline_keyboard":${JSON.stringify(
            formattedButtons
          )}`
        );

        this.logger.debug(
          `templateBody після заміни кнопок: ${templateBody.substring(
            0,
            100
          )}...`
        );
      }

      // Форматування прикладів, якщо вони є
      if (attributesData.examples) {
        const examples = attributesData.examples;
        // Обробка прикладів
        try {
          // Якщо приклади в рядку
          if (typeof examples === 'string') {
            // Якщо це JSON-рядок, спробуємо розпарсити
            if (
              examples.startsWith('[') &&
              examples.endsWith(']')
            ) {
              try {
                const parsedExamples =
                  JSON.parse(examples);
                if (
                  Array.isArray(parsedExamples)
                ) {
                  attributesData.examples =
                    parsedExamples.join('\n');
                }
              } catch (parseError) {
                // Якщо розпарсити не вдалося, видаляємо дужки та лапки
                attributesData.examples = examples
                  .replace(/[[\]"]/g, '')
                  .replace(/,/g, '\n');
              }
            }
            // Якщо не JSON, залишаємо як є
          } else if (Array.isArray(examples)) {
            // Якщо приклади вже у масиві
            attributesData.examples =
              examples.join('\n');
          } else if (
            examples &&
            typeof examples === 'object'
          ) {
            // Якщо об'єкт, конвертуємо в рядок
            attributesData.examples =
              JSON.stringify(examples);
          }
        } catch (error) {
          this.logger.error(
            `Помилка при форматуванні прикладів: ${error.message}`
          );
          // Намагаємося повернути хоч якийсь результат
          if (examples) {
            attributesData.examples = String(
              examples
            )
              .replace(/[[\]"]/g, '')
              .replace(/,/g, '\n');
          }
        }
      }

      // Заповнюємо умовні блоки
      if (attributesData) {
        const conditionalRegex =
          /\{\{if:([^}]+)\}\}(.*?)\{\{endif\}\}/g;
        let conditionalMatch;
        while (
          (conditionalMatch =
            conditionalRegex.exec(
              templateBody
            )) !== null
        ) {
          const [fullMatch, condition, content] =
            conditionalMatch;
          const conditionMet =
            attributesData[condition] &&
            attributesData[condition] !== '' &&
            attributesData[condition] !== '[]' &&
            attributesData[condition] !==
              'null' &&
            attributesData[condition] !==
              'undefined';

          templateBody = templateBody.replace(
            fullMatch,
            conditionMet ? content : ''
          );
        }
      }

      const jsonTemplate =
        JSON.parse(templateBody);
      const replaceAttributes = (
        obj: any
      ): any => {
        if (obj === null || obj === undefined) {
          return obj;
        }
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

      const resultJson =
        replaceAttributes(jsonTemplate);
      const resultString =
        JSON.stringify(resultJson);

      return resultString;
    } catch (error) {
      this.logger.error(
        `Помилка парсингу JSON шаблону: ${error.message}, шаблон: ${templateBody}`
      );
      return templateBody;
    }
  }

  private replaceAttribute(
    text: string,
    attributesData: AttributesData,
    lang: string
  ): string {
    // Перевірка вхідних параметрів
    if (!text) {
      this.logger.warn(
        'replaceAttribute: text є пустим або undefined'
      );
      return text || '';
    }

    if (!attributesData) {
      this.logger.warn(
        'replaceAttribute: attributesData є null або undefined'
      );
      return text;
    }

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
          value !== null &&
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
        /[_*[\]()~`>#+=.!{}-]/g,
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
