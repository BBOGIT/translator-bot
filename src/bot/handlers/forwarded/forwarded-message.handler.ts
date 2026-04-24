import {
  Injectable,
  Logger
} from '@nestjs/common';
import {
  CommandHandler,
  CommandContext
} from '../core/interfaces';
import { ChannelExtractionService } from '../../../channel/channel-extraction.service';
import { WebhookTypeEnum } from '../../../webhook/enum';
import { ChannelInfo } from '../../../channel/interfaces';
import { TelegramWebhookBodyDto } from '../../../webhook/dto';

@Injectable()
export class ForwardedMessageHandler
  implements CommandHandler
{
  private readonly logger = new Logger(
    ForwardedMessageHandler.name
  );

  constructor(
    private readonly channelExtractionService: ChannelExtractionService
  ) {}

  canHandle(
    command?: string,
    state?: string
  ): boolean {
    return false;
  }

  async execute(
    context: CommandContext
  ): Promise<void> {
    const { dto, lang, services } = context;
    const { messageService, wordService } =
      services;

    try {
      this.logger.log(
        `Processing forwarded message from chat ${dto.chatId}`
      );

      const channelInfo = this.extractChannelInfo(
        dto.originalWebhook
      );

      if (!channelInfo) {
        this.logger.warn(
          'Could not extract channel info from forwarded message'
        );
        return;
      }

      this.logger.log(
        `Forwarded message from channel: ${channelInfo.title || channelInfo.id}`
      );

      const content = dto.text || '';
      if (!content.trim()) {
        this.logger.warn(
          'Forwarded message has no text content'
        );
        return;
      }

      const extractionResult =
        await this.channelExtractionService.extractFromChannelMessage(
          content,
          channelInfo
        );

      if (extractionResult.error) {
        this.logger.error(
          `Extraction failed: ${extractionResult.error}`
        );

        await messageService.TelegramSendMessage({
          chatId: dto.chatId,
          lang,
          templateName: 'channelExtractionError'
        });
        return;
      }

      const { extractedContent, configCreated } =
        extractionResult;

      if (
        !extractedContent?.success ||
        !extractedContent.word ||
        !extractedContent.translation
      ) {
        this.logger.warn(
          'Failed to extract word and translation from forwarded message'
        );

        await messageService.TelegramSendMessage({
          chatId: dto.chatId,
          lang,
          templateName:
            'channelExtractionIncomplete'
        });
        return;
      }

      let customer = context.customer;
      if (!customer) {
        customer =
          await services.customerService.create({
            chatId: dto.chatId,
            firstName: dto.firstName,
            lastName: dto.lastName,
            channel: dto.channel
          });
      }

      const message = dto.originalWebhook?.message;
      const videoFileId =
        message?.video?.file_id ?? null;
      const imageFileId =
        message?.photo?.at(-1)?.file_id ?? null;

      try {
        await wordService.createWord({
          word: extractedContent.word,
          translation:
            extractedContent.translation,
          examples: extractedContent.examples,
          customerId: customer.id,
          needToLearn: true,
          videoExample: videoFileId,
          imageExample: imageFileId
        });

        this.logger.log(
          `Successfully saved word "${extractedContent.word}" from channel "${channelInfo.title}"`
        );

        // Отправляем подтверждение
        let templateName = 'savedWordFromChannel';

        if (configCreated) {
          templateName =
            'savedWordFromNewChannel';
          this.logger.log(
            `Created new extraction config for channel: ${channelInfo.title || channelInfo.id}`
          );
        }

        await messageService.TelegramSendMessage({
          chatId: dto.chatId,
          lang,
          templateName,
          dynamicVariables: {
            word: extractedContent.word,
            translation:
              extractedContent.translation,
            channelName:
              channelInfo.title ||
              channelInfo.username ||
              'Unknown Channel',
            examples: extractedContent.examples.join('\n\n')
          }
        });
      } catch (error) {
        this.logger.error(
          `Failed to save word: ${error.message}`,
          error.stack
        );

        if (
          error.message.includes(
            'Unique constraint'
          )
        ) {
          await messageService.TelegramSendMessage(
            {
              chatId: dto.chatId,
              lang,
              templateName: 'wordAlreadyExists',
              dynamicVariables: {
                word: extractedContent.word
              }
            }
          );
        } else {
          await messageService.TelegramSendMessage(
            {
              chatId: dto.chatId,
              lang,
              templateName: 'savedWordError'
            }
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error processing forwarded message: ${error.message}`,
        error.stack
      );

      await messageService.TelegramSendMessage({
        chatId: dto.chatId,
        lang,
        templateName: 'generalError'
      });
    }
  }


  private extractChannelInfo(
    originalWebhook: TelegramWebhookBodyDto
  ): ChannelInfo | null {
    const message = originalWebhook?.message;
    if (!message) return null;

    if (
      message.forward_origin?.type === 'channel'
    ) {
      const chat = message.forward_origin.chat;
      return {
        id: String(chat.id),
        title: chat.title,
        username: chat.username
      };
    }

    if (message.forward_from_chat) {
      return {
        id: String(message.forward_from_chat.id),
        title: message.forward_from_chat.title,
        username:
          message.forward_from_chat.username
      };
    }

    return null;
  }

  static isForwardedFromChannel(
    originalWebhook: TelegramWebhookBodyDto
  ): boolean {
    const message = originalWebhook?.message;
    if (!message) return false;

    if (
      message.forward_origin?.type === 'channel'
    ) {
      return true;
    }

    if (
      message.forward_from_chat?.type ===
      'channel'
    ) {
      return true;
    }

    return false;
  }


  static isWordLearningMessage(
    content: string
  ): boolean {
    return (
      content.includes(' - ') &&
      content.match(/[a-zA-Z]+/) !== null &&
      (content.includes('️⃣') ||
        content.match(/\d+\./) !== null)
    );
  }
}
