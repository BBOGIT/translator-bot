import {
  IsNumber,
  IsString,
  IsArray,
  IsObject,
  IsOptional,
  IsEnum
} from 'class-validator';
import {
  ChannelEnum,
  WebhookTypeEnum
} from '../enum';

class FromDto {
  @IsNumber()
  id: number;

  @IsOptional()
  @IsString()
  first_name?: string | null;

  @IsOptional()
  @IsString()
  last_name?: string | null;

  @IsString()
  language_code: string;
}

class LocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}

class DocumentDto {
  @IsString()
  file_name: string;
}

class StickerDto {
  @IsString()
  emoji: string;
}

class AudioDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  performer?: string;
}

class ContactDto {
  @IsString()
  phone_number: string;
}

class AnimationDto {
  @IsString()
  file_name: string;
}

class MessageDto {
  @IsObject()
  from: FromDto;

  @IsOptional()
  @IsObject()
  location?: LocationDto;

  @IsOptional()
  @IsObject()
  document?: DocumentDto;

  @IsOptional()
  @IsObject()
  sticker?: StickerDto;

  @IsOptional()
  @IsArray()
  photo?: Array<any>;

  @IsOptional()
  @IsObject()
  audio?: AudioDto;

  @IsOptional()
  voice?: any;

  @IsOptional()
  @IsObject()
  animation?: AnimationDto;

  @IsOptional()
  video?: any;

  @IsOptional()
  @IsObject()
  contact?: ContactDto;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  caption?: string;
}

class CallbackQueryDto {
  @IsObject()
  from: FromDto;

  @IsString()
  data: string;
}

class EditedMessageDto {
  @IsObject()
  from: FromDto;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsObject()
  animation?: AnimationDto;
}

class TelegramWebhookBodyDto {
  @IsNumber()
  update_id: number;

  @IsOptional()
  @IsObject()
  message?: MessageDto;

  @IsOptional()
  @IsObject()
  callback_query?: CallbackQueryDto;

  @IsOptional()
  @IsObject()
  edited_message?: EditedMessageDto;
}

class TelegramWebhookResponseDto {
  @IsString()
  chatId: string;

  @IsString()
  lang: string;

  @IsEnum(WebhookTypeEnum)
  webhookType: WebhookTypeEnum;

  @IsOptional()
  @IsString()
  text?: string | null;

  @IsOptional()
  @IsString()
  firstName?: string | null;

  @IsOptional()
  @IsString()
  lastName?: string | null;

  @IsEnum(ChannelEnum)
  channel: ChannelEnum;
}

export {
  FromDto,
  LocationDto,
  DocumentDto,
  StickerDto,
  AudioDto,
  ContactDto,
  AnimationDto,
  MessageDto,
  CallbackQueryDto,
  EditedMessageDto,
  TelegramWebhookBodyDto,
  TelegramWebhookResponseDto
};
