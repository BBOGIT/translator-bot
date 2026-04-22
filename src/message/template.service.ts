import {
  Injectable,
  Logger
} from '@nestjs/common';
import {
  AttributesData,
  MessageTemplate,
  ValueType
} from './interfaces/message.interfaces';
import templates from './message-templates.json';
import attributes from './attributes.json';
import { TemplateProcessorService } from './template-processor.service';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(
    TemplateService.name
  );

  constructor(
    private readonly templateProcessor: TemplateProcessorService
  ) {}

  public findTemplateByNameAndChannel(
    name: string,
    channel: string
  ): MessageTemplate | undefined {
    return templates.find(
      template =>
        template.name === name &&
        template.channel === channel
    );
  }

  public mergeAndReplaceAttributes(
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
    return this.templateProcessor.mergeAndReplaceAttributes(
      attributes,
      dynamicVariables,
      restAttributes,
      lang,
      chatId,
      messageId
    );
  }

  public fillTemplateAttributes(
    templateBody: string,
    attributesData: AttributesData,
    lang: string
  ): string {
    return this.templateProcessor.fillTemplateAttributes(
      templateBody,
      attributesData,
      lang
    );
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
      'url',
      'video',
      'photo',
      'document',
      'audio',
      'animation',
      'sticker',
      'voice',
      'file_id'
    ]
  ): string {
    return this.templateProcessor.escapeMarkdownV2(
      jsonString,
      fieldsToEscape,
      fieldsToIgnore
    );
  }
}
