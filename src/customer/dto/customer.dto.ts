// dto/customer.dto.ts
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString
} from 'class-validator';
import { ChannelEnum } from '../enum';
import {
  ApiProperty,
  ApiPropertyOptional
} from '@nestjs/swagger';

export class CustomerDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ enum: ChannelEnum })
  @IsEnum(ChannelEnum)
  channel: ChannelEnum;
}

export class CustomerUpdateDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lastName?: string;
}

export class CustomerFindDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  chatId: string;
}
