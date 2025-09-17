import {
  IsNumber,
  IsString,
  IsArray,
  IsObject,
  IsOptional,
  IsEnum
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ChannelEnum,
  WebhookTypeEnum
} from '../enum';
import {
  ApiProperty,
  ApiPropertyOptional
} from '@nestjs/swagger';

class FromDto {
  @ApiProperty({
    description: 'User or bot identifier'
  })
  @IsNumber()
  id: number;

  @ApiPropertyOptional({
    description: "User's or bot's first name"
  })
  @IsOptional()
  @IsString()
  first_name?: string | null;

  @ApiPropertyOptional({
    description: "User's or bot's last name"
  })
  @IsOptional()
  @IsString()
  last_name?: string | null;

  @ApiProperty({
    description:
      "IETF language tag of the user's language"
  })
  @IsString()
  language_code: string;
}

class LocationDto {
  @ApiProperty({
    description: 'Latitude as defined by sender'
  })
  @IsNumber()
  latitude: number;

  @ApiProperty({
    description: 'Longitude as defined by sender'
  })
  @IsNumber()
  longitude: number;
}

class PhotoSizeDto {
  @ApiProperty({
    description:
      'Identifier for this file, which can be used to download or reuse the file'
  })
  @IsString()
  file_id: string;

  @ApiProperty({
    description:
      "Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file."
  })
  @IsString()
  file_unique_id: string;

  @ApiProperty({ description: 'Photo width' })
  @IsNumber()
  width: number;

  @ApiProperty({ description: 'Photo height' })
  @IsNumber()
  height: number;

  @ApiPropertyOptional({
    description: 'Optional. File size in bytes'
  })
  @IsOptional()
  @IsNumber()
  file_size?: number;
}

class DocumentDto {
  @ApiPropertyOptional({
    description:
      'Original filename as defined by sender'
  })
  @IsOptional()
  @IsString()
  file_name?: string;

  @ApiPropertyOptional({
    description:
      'MIME type of the file as defined by sender'
  })
  @IsOptional()
  @IsString()
  mime_type?: string;

  @ApiPropertyOptional({
    description:
      'Document thumbnail as defined by sender'
  })
  @IsOptional()
  @Type(() => PhotoSizeDto)
  thumbnail?: PhotoSizeDto;

  @ApiProperty({
    description:
      'Identifier for this file, which can be used to download or reuse the file'
  })
  @IsString()
  file_id: string;

  @ApiProperty({
    description: 'Unique identifier for this file'
  })
  @IsString()
  file_unique_id: string;

  @ApiPropertyOptional({
    description: 'File size in bytes'
  })
  @IsOptional()
  @IsNumber()
  file_size?: number;
}

class StickerDto {
  @ApiPropertyOptional({
    description:
      'Emoji associated with the sticker'
  })
  @IsOptional()
  @IsString()
  emoji?: string;

  @ApiProperty({
    description:
      'Identifier for this file, which can be used to download or reuse the file'
  })
  @IsString()
  file_id: string;

  @ApiProperty({
    description: 'Unique identifier for this file'
  })
  @IsString()
  file_unique_id: string;

  @ApiProperty({
    description: 'Type of the sticker'
  })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Sticker width' })
  @IsNumber()
  width: number;

  @ApiProperty({ description: 'Sticker height' })
  @IsNumber()
  height: number;

  @ApiPropertyOptional({
    description:
      'True, if the sticker is animated'
  })
  @IsOptional()
  @Type(() => Boolean) // For boolean from payload
  is_animated: boolean;

  @ApiPropertyOptional({
    description:
      'True, if the sticker is a video sticker'
  })
  @IsOptional()
  @Type(() => Boolean)
  is_video: boolean;

  @ApiPropertyOptional({
    description:
      'Sticker thumbnail in .WEBP or .JPG format'
  })
  @IsOptional()
  @Type(() => PhotoSizeDto)
  thumbnail?: PhotoSizeDto;

  @ApiPropertyOptional({
    description: 'Optional. Sticker set name'
  })
  @IsOptional()
  @IsString()
  set_name?: string;

  @ApiPropertyOptional({
    description:
      'Optional. For premium regular stickers, premium animation for the sticker'
  })
  @IsOptional()
  @Type(() => Object) // Placeholder for File DTO
  premium_animation?: Record<string, any>;

  @ApiPropertyOptional({
    description:
      'Optional. For custom emoji stickers, unique identifier of the custom emoji'
  })
  @IsOptional()
  @IsString()
  custom_emoji_id?: string;

  @ApiPropertyOptional({
    description:
      'Optional. True, if the sticker must be repainted'
  })
  @IsOptional()
  @Type(() => Boolean)
  needs_repainting?: boolean;

  @ApiPropertyOptional({
    description: 'Optional. File size in bytes'
  })
  @IsOptional()
  @IsNumber()
  file_size?: number;
}

class AudioDto {
  @ApiPropertyOptional({
    description:
      'Title of the audio as defined by sender or by audio tags'
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description:
      'Performer of the audio as defined by sender or by audio tags'
  })
  @IsOptional()
  @IsString()
  performer?: string;

  @ApiProperty({
    description:
      'Duration of the audio in seconds as defined by sender'
  })
  @IsNumber()
  duration: number;

  @ApiPropertyOptional({
    description:
      'MIME type of the file as defined by sender'
  })
  @IsOptional()
  @IsString()
  mime_type?: string;

  @ApiProperty({
    description:
      'Identifier for this file, which can be used to download or reuse the file'
  })
  @IsString()
  file_id: string;

  @ApiProperty({
    description: 'Unique identifier for this file'
  })
  @IsString()
  file_unique_id: string;

  @ApiPropertyOptional({
    description:
      'Audio thumbnail as defined by sender or by audio tags'
  })
  @IsOptional()
  @Type(() => PhotoSizeDto)
  thumbnail?: PhotoSizeDto;

  @ApiPropertyOptional({
    description:
      'Original filename as defined by sender'
  })
  @IsOptional()
  @IsString()
  file_name?: string;

  @ApiPropertyOptional({
    description: 'File size in bytes'
  })
  @IsOptional()
  @IsNumber()
  file_size?: number;
}

class VoiceDto {
  @ApiProperty({
    description:
      'Identifier for this file, which can be used to download or reuse the file'
  })
  @IsString()
  file_id: string;

  @ApiProperty({
    description:
      "Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file."
  })
  @IsString()
  file_unique_id: string;

  @ApiProperty({
    description:
      'Duration of the audio in seconds as defined by sender'
  })
  @IsNumber()
  duration: number;

  @ApiPropertyOptional({
    description:
      'Optional. MIME type of the file as defined by sender'
  })
  @IsOptional()
  @IsString()
  mime_type?: string;

  @ApiPropertyOptional({
    description: 'Optional. File size in bytes'
  })
  @IsOptional()
  @IsNumber()
  file_size?: number;
}

class VideoDto {
  @ApiProperty({
    description:
      'Identifier for this file, which can be used to download or reuse the file'
  })
  @IsString()
  file_id: string;

  @ApiProperty({
    description:
      "Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file."
  })
  @IsString()
  file_unique_id: string;

  @ApiProperty({
    description:
      'Video width as defined by sender'
  })
  @IsNumber()
  width: number;

  @ApiProperty({
    description:
      'Video height as defined by sender'
  })
  @IsNumber()
  height: number;

  @ApiProperty({
    description:
      'Duration of the video in seconds as defined by sender'
  })
  @IsNumber()
  duration: number;

  @ApiPropertyOptional({
    description: 'Optional. Video thumbnail'
  })
  @IsOptional()
  @Type(() => PhotoSizeDto)
  thumbnail?: PhotoSizeDto;

  @ApiPropertyOptional({
    description:
      'Optional. Original filename as defined by sender'
  })
  @IsOptional()
  @IsString()
  file_name?: string;

  @ApiPropertyOptional({
    description:
      'Optional. MIME type of a file as defined by sender'
  })
  @IsOptional()
  @IsString()
  mime_type?: string;

  @ApiPropertyOptional({
    description: 'Optional. File size in bytes'
  })
  @IsOptional()
  @IsNumber()
  file_size?: number;
}

class ContactDto {
  @ApiProperty({
    description: "Contact's phone number"
  })
  @IsString()
  phone_number: string;

  @ApiProperty({
    description: "Contact's first name"
  })
  @IsString()
  first_name: string;

  @ApiPropertyOptional({
    description: "Contact's last name"
  })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({
    description:
      "Contact's user identifier in Telegram"
  })
  @IsOptional()
  @IsNumber()
  user_id?: number;

  @ApiPropertyOptional({
    description:
      'Additional data about the contact in the form of a vCard'
  })
  @IsOptional()
  @IsString()
  vcard?: string;
}

class AnimationDto {
  @ApiProperty({
    description:
      'Identifier for this file, which can be used to download or reuse the file'
  })
  @IsString()
  file_id: string;

  @ApiProperty({
    description: 'Unique identifier for this file'
  })
  @IsString()
  file_unique_id: string;

  @ApiProperty({ description: 'Animation width' })
  @IsNumber()
  width: number;

  @ApiProperty({
    description: 'Animation height'
  })
  @IsNumber()
  height: number;

  @ApiProperty({
    description:
      'Duration of the animation in seconds'
  })
  @IsNumber()
  duration: number;

  @ApiPropertyOptional({
    description:
      'Animation thumbnail as defined by sender'
  })
  @IsOptional()
  @Type(() => PhotoSizeDto)
  thumbnail?: PhotoSizeDto;

  @ApiPropertyOptional({
    description:
      'Original animation filename as defined by sender'
  })
  @IsOptional()
  @IsString()
  file_name?: string;

  @ApiPropertyOptional({
    description:
      'MIME type of the file as defined by sender'
  })
  @IsOptional()
  @IsString()
  mime_type?: string;

  @ApiPropertyOptional({
    description: 'File size in bytes'
  })
  @IsOptional()
  @IsNumber()
  file_size?: number;
}

class MessageDto {
  @ApiProperty({
    description:
      'Unique message identifier inside this chat'
  })
  @IsNumber()
  message_id: number;

  @ApiPropertyOptional({
    description:
      'Sender of the message; empty for messages sent to channels'
  }) // Зробив from опціональним, бо воно може бути відсутнє для channel_post
  @IsOptional()
  @Type(() => FromDto)
  from?: FromDto;

  @ApiPropertyOptional({
    description:
      'Optional. For text messages, the actual UTF-8 text of the message'
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    description:
      'Optional. Message is a photo, available sizes of the photo'
  })
  @IsOptional()
  @IsArray()
  @Type(() => PhotoSizeDto)
  photo?: PhotoSizeDto[];

  @ApiPropertyOptional({
    description:
      'Optional. Message is an audio file'
  })
  @IsOptional()
  @Type(() => AudioDto)
  audio?: AudioDto;

  @ApiPropertyOptional({
    description:
      'Optional. Message is a general file'
  })
  @IsOptional()
  @Type(() => DocumentDto)
  document?: DocumentDto;

  @ApiPropertyOptional({
    description: 'Optional. Message is a sticker'
  })
  @IsOptional()
  @Type(() => StickerDto)
  sticker?: StickerDto;

  @ApiPropertyOptional({
    description: 'Optional. Message is a video'
  })
  @IsOptional()
  @Type(() => VideoDto)
  video?: VideoDto;

  @ApiPropertyOptional({
    description:
      'Optional. Message is a voice message'
  })
  @IsOptional()
  @Type(() => VoiceDto)
  voice?: VoiceDto;

  @ApiPropertyOptional({
    description:
      'Optional. Message is an animation'
  })
  @IsOptional()
  @Type(() => AnimationDto)
  animation?: AnimationDto;

  @ApiPropertyOptional({
    description:
      'Optional. Message is a shared contact'
  })
  @IsOptional()
  @Type(() => ContactDto)
  contact?: ContactDto;

  @ApiPropertyOptional({
    description:
      'Optional. Message is a shared location'
  })
  @IsOptional()
  @Type(() => LocationDto)
  location?: LocationDto;

  @ApiPropertyOptional({
    description:
      'Optional. For forwarded messages, sender of the original message'
  })
  @IsOptional()
  @Type(() => FromDto)
  forward_from?: FromDto;

  @ApiPropertyOptional({
    description:
      'Optional. For messages forwarded from channels or from anonymous administrators, information about the original sender chat'
  })
  @IsOptional()
  @Type(() => Object) // Placeholder for ChatDto
  forward_from_chat?: Record<string, any>;

  @ApiPropertyOptional({
    description:
      'Optional. For messages forwarded from channels, identifier of the original message in the channel'
  })
  @IsOptional()
  @IsNumber()
  forward_from_message_id?: number;

  @ApiPropertyOptional({
    description:
      'Optional. For messages with caption, the actual UTF-8 caption of the message'
  })
  @IsOptional()
  @IsString()
  caption?: string;
  // Потрібно додати всі інші поля Message з документації Telegram
}

class CallbackQueryDto {
  @ApiProperty({
    description:
      'Unique identifier for this query'
  })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Sender' })
  @IsObject()
  @Type(() => FromDto)
  from: FromDto;

  @ApiPropertyOptional({
    description:
      'Optional. Message with the callback button that originated the query.'
  })
  @IsOptional()
  @Type(() => MessageDto)
  message?: MessageDto;

  @ApiPropertyOptional({
    description:
      'Optional. Data associated with the callback button.'
  })
  @IsOptional()
  @IsString()
  data?: string;
}

class EditedMessageDto {
  // Поля для EditedMessageDto мають бути схожі на MessageDto, але всі опціональні
  // і без деяких специфічних для нового повідомлення полів.
  // Я додам основні, але їх треба буде доповнити згідно з документацією.
  @ApiProperty({
    description:
      'Unique message identifier inside this chat'
  })
  @IsNumber()
  message_id: number;

  @ApiPropertyOptional({
    description:
      'Sender of the message; empty for messages sent to channels'
  })
  @IsOptional()
  @Type(() => FromDto)
  from?: FromDto;

  @ApiPropertyOptional({
    description:
      'Optional. Date the message was last edited in Unix time'
  })
  @IsOptional()
  @IsNumber()
  edit_date?: number;

  @ApiPropertyOptional({
    description:
      'Optional. For text messages, the actual UTF-8 text of the message'
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    description:
      'Optional. For messages with caption, the actual UTF-8 caption of the message'
  })
  @IsOptional()
  @IsString()
  caption?: string;

  // Додайте інші можливі поля, такі як photo, audio, document etc. з @Type і @IsOptional
}

class TelegramWebhookBodyDto {
  @ApiProperty({
    description: "The update's unique identifier."
  })
  @IsNumber()
  update_id: number;

  @ApiPropertyOptional({
    description:
      'Optional. New incoming message of any kind.'
  })
  @IsOptional()
  @Type(() => MessageDto)
  message?: MessageDto;

  @ApiPropertyOptional({
    description:
      'Optional. New version of a message that is known to the bot and was edited.'
  })
  @IsOptional()
  @Type(() => EditedMessageDto)
  edited_message?: EditedMessageDto;

  @ApiPropertyOptional({
    description:
      'Optional. New incoming callback query.'
  })
  @IsOptional()
  @Type(() => CallbackQueryDto)
  callback_query?: CallbackQueryDto;

  // Додайте інші типи оновлень згідно документації: channel_post, edited_channel_post, inline_query, etc.
}

class WebhookResponseDto {
  @ApiProperty({
    description: 'Chat ID for the webhook event'
  })
  @IsString()
  chatId: string;

  @ApiProperty({
    description: 'Language code of the user'
  })
  @IsString()
  lang: string;

  @ApiProperty({
    enum: WebhookTypeEnum,
    description: 'Type of the webhook event'
  })
  @IsEnum(WebhookTypeEnum)
  webhookType: WebhookTypeEnum;

  @ApiPropertyOptional({
    description: 'Text content from the webhook'
  })
  @IsOptional()
  @IsString()
  text?: string | null;

  @ApiPropertyOptional({
    description: "User's first name"
  })
  @IsOptional()
  @IsString()
  firstName?: string | null;

  @ApiPropertyOptional({
    description: "User's last name"
  })
  @IsOptional()
  @IsString()
  lastName?: string | null;

  @ApiProperty({
    enum: ChannelEnum,
    description:
      'Channel from which the webhook originated'
  })
  @IsEnum(ChannelEnum)
  channel: ChannelEnum;

  @ApiPropertyOptional({
    description: 'Identifier of the message'
  })
  @IsOptional()
  @IsString()
  messageId?: string;

  @ApiProperty({
    description:
      'The original webhook payload from Telegram'
  })
  @IsObject()
  @Type(() => TelegramWebhookBodyDto)
  originalWebhook: TelegramWebhookBodyDto;
}

export {
  FromDto,
  LocationDto,
  PhotoSizeDto,
  DocumentDto,
  StickerDto,
  AudioDto,
  VoiceDto,
  VideoDto,
  ContactDto,
  AnimationDto,
  MessageDto,
  CallbackQueryDto,
  EditedMessageDto,
  TelegramWebhookBodyDto,
  WebhookResponseDto
};
