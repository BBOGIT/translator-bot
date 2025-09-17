import {
  Injectable,
  Logger
} from '@nestjs/common';
import {
  AttributesData,
  ValueType
} from './interfaces/message.interfaces';

@Injectable()
export class TemplateProcessorService {
  private readonly logger = new Logger(
    TemplateProcessorService.name
  );

  public mergeAndReplaceAttributes(
    initialAttributes: AttributesData,
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
    const rawAttributes: AttributesData = {
      ...initialAttributes,
      ...dynamicVariables,
      chatId: { [lang]: chatId },
      ...(messageId && {
        messageId: { [lang]: messageId }
      }),
      ...restAttributes
    };

    const resolvedCache = new Map<
      string,
      ValueType
    >();
    const finalAttributes: AttributesData = {};

    for (const key of Object.keys(
      rawAttributes
    )) {
      finalAttributes[key] =
        this._resolveAttributeRecursive(
          key,
          lang,
          rawAttributes,
          resolvedCache,
          new Set<string>()
        );
    }

    return finalAttributes;
  }

  private _resolveAttributeRecursive(
    key: string,
    lang: string,
    allAttributes: AttributesData,
    cache: Map<string, ValueType>,
    visited: Set<string>
  ): ValueType {
    if (visited.has(key)) {
      const path = [...visited, key].join(' -> ');
      throw new Error(
        `Circular attribute dependency detected: ${path}`
      );
    }

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const rawValue = allAttributes[key];

    visited.add(key);

    let resolvedValue: ValueType;

    const resolver = (text: string) =>
      text.replace(
        /\{\{(\w+)\}\}/g,
        (match, innerKey) => {
          if (
            !allAttributes.hasOwnProperty(
              innerKey
            )
          ) {
            return match;
          }

          const resolvedInnerValue =
            this._resolveAttributeRecursive(
              innerKey,
              lang,
              allAttributes,
              cache,
              new Set(visited)
            );

          if (
            typeof resolvedInnerValue ===
              'string' ||
            typeof resolvedInnerValue === 'number'
          ) {
            return resolvedInnerValue.toString();
          }
          if (
            typeof resolvedInnerValue ===
              'object' &&
            resolvedInnerValue !== null &&
            resolvedInnerValue[lang] !== undefined
          ) {
            return String(
              resolvedInnerValue[lang]
            );
          }
          return match;
        }
      );

    if (typeof rawValue === 'string') {
      resolvedValue = resolver(rawValue);
    } else if (
      typeof rawValue === 'object' &&
      rawValue !== null &&
      !Array.isArray(rawValue)
    ) {
      const newObject: Record<
        string,
        string | number | boolean
      > = {};
      for (const [
        langKey,
        langValue
      ] of Object.entries(rawValue)) {
        if (typeof langValue === 'string') {
          newObject[langKey] =
            resolver(langValue);
        } else {
          newObject[langKey] = langValue as
            | number
            | boolean;
        }
      }
      resolvedValue = newObject;
    } else {
      resolvedValue = rawValue;
    }

    cache.set(key, resolvedValue);

    return resolvedValue;
  }

  private _replacePlaceholdersInString(
    text: string,
    attributesData: AttributesData,
    lang: string
  ): string {
    if (!text || typeof text !== 'string') {
      return text || '';
    }

    return text.replace(
      /\{\{(\w+)\}\}/g,
      (match, key) => {
        const value = attributesData[key];

        if (value !== undefined) {
          if (
            typeof value === 'string' ||
            typeof value === 'number'
          ) {
            return value.toString();
          }
          if (
            typeof value === 'object' &&
            value !== null &&
            value[lang] !== undefined
          ) {
            return String(value[lang]);
          }
        }
        return match;
      }
    );
  }

  public fillTemplateAttributes(
    templateBody: string,
    attributesData: AttributesData,
    lang: string
  ): string {
    if (!attributesData) {
      this.logger.error(
        'fillTemplateAttributes: attributesData is null or undefined'
      );
      attributesData = {};
    }

    let processedBody = templateBody;

    processedBody =
      this._processConditionalBlocks(
        processedBody,
        attributesData
      );
    processedBody = this._formatButtons(
      processedBody,
      attributesData
    );
    processedBody = this._formatExamples(
      processedBody,
      attributesData
    );

    let templateJson: unknown;
    try {
      templateJson = JSON.parse(processedBody);
    } catch (error) {
      this.logger.error(
        `Error parsing template JSON: ${error.message}, template: ${processedBody}`
      );
      throw new Error(
        `Invalid JSON format in template body: ${error.message}`
      );
    }

    const resultJson =
      this._replacePlaceholdersInObject(
        templateJson,
        attributesData,
        lang
      );

    return JSON.stringify(resultJson);
  }

  private _processConditionalBlocks(
    templateBody: string,
    attributesData: AttributesData
  ): string {
    const conditionalRegex =
      /\{\{#if\s*(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

    return templateBody.replace(
      conditionalRegex,
      (match, key, content) => {
        const value = attributesData[key];
        const conditionMet =
          value &&
          value !== '' &&
          value !== '[]' &&
          value !== 'null' &&
          value !== 'undefined';
        return conditionMet ? content : '';
      }
    );
  }

  private _formatButtons(
    templateBody: string,
    attributesData: AttributesData
  ): string {
    if (!attributesData.buttonsArray) {
      return templateBody;
    }

    let formattedButtons = [];
    const buttons = attributesData.buttonsArray;

    try {
      if (Array.isArray(buttons)) {
        formattedButtons = buttons;
      } else if (typeof buttons === 'string') {
        formattedButtons = JSON.parse(buttons);
      } else if (
        typeof buttons === 'object' &&
        buttons !== null
      ) {
        formattedButtons = Object.values(buttons);
      } else {
        this.logger.error(
          `Unsupported type for buttonsArray: ${typeof buttons}`
        );
      }
    } catch (error) {
      this.logger.error(
        `Error formatting buttons: ${error.message}`
      );
    }

    return templateBody.replace(
      /"inline_keyboard"\s*:\s*\{\{buttonsArray\}\}/,
      `"inline_keyboard":${JSON.stringify(formattedButtons)}`
    );
  }

  private _formatExamples(
    templateBody: string,
    attributesData: AttributesData
  ): string {
    if (!attributesData.examples) {
      return templateBody;
    }

    const examples = attributesData.examples;
    let formattedExamples = '';

    try {
      if (Array.isArray(examples)) {
        formattedExamples = examples.join('\n');
      } else if (typeof examples === 'string') {
        if (
          examples.startsWith('[') &&
          examples.endsWith(']')
        ) {
          try {
            const parsed = JSON.parse(examples);
            formattedExamples = Array.isArray(
              parsed
            )
              ? parsed.join('\n')
              : examples;
          } catch {
            formattedExamples = examples
              .replace(/[[\]"]/g, '')
              .replace(/,/g, '\n');
          }
        } else {
          formattedExamples = examples;
        }
      } else if (
        examples &&
        typeof examples === 'object'
      ) {
        formattedExamples =
          JSON.stringify(examples);
      }

      attributesData.examples = formattedExamples;
    } catch (error) {
      this.logger.error(
        `Error formatting examples: ${error.message}`
      );
      attributesData.examples = String(examples)
        .replace(/[[\]"]/g, '')
        .replace(/,/g, '\n');
    }

    return templateBody;
  }

  private _replacePlaceholdersInObject(
    obj: unknown,
    attributesData: AttributesData,
    lang: string
  ): unknown {
    if (obj === null || obj === undefined) {
      return obj;
    }
    if (typeof obj === 'string') {
      return this._replacePlaceholdersInString(
        obj,
        attributesData,
        lang
      );
    }
    if (Array.isArray(obj)) {
      return obj.map(item =>
        this._replacePlaceholdersInObject(
          item,
          attributesData,
          lang
        )
      );
    }
    if (typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj).map(
          ([key, value]) => [
            key,
            this._replacePlaceholdersInObject(
              value,
              attributesData,
              lang
            )
          ]
        )
      );
    }
    return obj;
  }

  public escapeMarkdownV2(
    jsonString: string,
    fieldsToEscape: string[] = [
      'text',
      'caption'
    ],
    fieldsToIgnore: string[] = [
      'callback_data',
      'data',
      'url'
    ]
  ): string {
    if (!jsonString) return jsonString;

    const escapeMarkdown = (
      text: string
    ): string => {
      if (typeof text !== 'string') return text;

      const specialChars =
        /[_*[\]()~`>#+\-={}.!]/g;
      return text.replace(specialChars, '\\$&');
    };

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(jsonString);
    } catch (error) {
      this.logger.warn(
        `Failed to parse JSON for MarkdownV2 escaping: ${error.message}. Returning original string.`
      );
      return jsonString;
    }

    const processObject = (
      obj: unknown
    ): unknown => {
      if (
        typeof obj !== 'object' ||
        obj === null
      ) {
        if (typeof obj === 'string') {
          return escapeMarkdown(obj);
        }
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(processObject);
      }

      const newObj: Record<string, unknown> = {};
      for (const key in obj) {
        if (
          Object.prototype.hasOwnProperty.call(
            obj,
            key
          )
        ) {
          if (fieldsToIgnore.includes(key)) {
            newObj[key] = obj[key];
          } else if (
            fieldsToEscape.includes(key) &&
            typeof obj[key] === 'string'
          ) {
            newObj[key] = escapeMarkdown(
              obj[key] as string
            );
          } else {
            newObj[key] = processObject(obj[key]);
          }
        }
      }
      return newObj;
    };

    const escapedJson = processObject(parsedJson);
    return JSON.stringify(escapedJson);
  }
}
