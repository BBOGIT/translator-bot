// dto/customer.dto.ts
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ChannelEnum,
  CustomerState
} from '../enum';
import {
  ApiProperty,
  ApiPropertyOptional
} from '@nestjs/swagger';
import { Word } from '@prisma/client'; // Припускаємо, що Word з Prisma використовується для відповіді

export class CustomerDto {
  @ApiPropertyOptional({ enum: CustomerState })
  @IsEnum(CustomerState)
  @IsOptional()
  state?: CustomerState;

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
  @ApiPropertyOptional({ enum: CustomerState })
  @IsEnum(CustomerState)
  @IsOptional()
  state?: CustomerState;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  chatId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  repetitionTime?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  notificationsEnabled?: boolean;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  streak?: number;

  @ApiPropertyOptional()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  lastActiveDate?: Date;
}

export class CustomerFindDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  chatId: string;
}

export class CustomerResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  chatId: string;

  @ApiProperty({ enum: CustomerState })
  state: CustomerState;

  @ApiPropertyOptional()
  firstName?: string | null;

  @ApiPropertyOptional()
  lastName?: string | null;

  @ApiPropertyOptional({ enum: ChannelEnum })
  channel?: ChannelEnum | null;

  @ApiPropertyOptional()
  repetitionTime?: string | null;

  @ApiPropertyOptional()
  streak?: number;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'object' }
  })
  words?: Word[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
