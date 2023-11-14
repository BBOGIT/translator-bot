import {
  IsEnum,
  IsNotEmpty,
  IsString
} from 'class-validator';
import { ChannelEnum } from '../enum';

export class CustomerDto {
  @IsString()
  state?: string;

  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsString()
  firstName?: string;

  @IsString()
  lastName?: string;

  @IsEnum(ChannelEnum)
  channel: ChannelEnum;
}

export class CustomerUpdateDto {
  @IsString()
  state?: string;

  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsString()
  firstName?: string;

  @IsString()
  lastName?: string;
}

export class CustomerFindDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;
}
