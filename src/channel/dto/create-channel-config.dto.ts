import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNotEmpty
} from 'class-validator';
import {
  ApiProperty,
  ApiPropertyOptional
} from '@nestjs/swagger';

export class CreateChannelConfigDto {
  @ApiProperty({
    description: 'Channel ID from Telegram'
  })
  @IsString()
  @IsNotEmpty()
  channelId: string;

  @ApiPropertyOptional({
    description: 'Channel title'
  })
  @IsOptional()
  @IsString()
  channelTitle?: string;

  @ApiPropertyOptional({
    description: 'Channel username'
  })
  @IsOptional()
  @IsString()
  channelUsername?: string;

  @ApiProperty({
    description: 'Regex pattern to extract word'
  })
  @IsString()
  @IsNotEmpty()
  wordRegex: string;

  @ApiProperty({
    description:
      'Regex pattern to extract translation'
  })
  @IsString()
  @IsNotEmpty()
  translationRegex: string;

  @ApiProperty({
    description:
      'Regex pattern to extract examples'
  })
  @IsString()
  @IsNotEmpty()
  examplesRegex: string;

  @ApiPropertyOptional({
    description: 'Whether config is active',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description:
      'Whether config was created by AI',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  createdByAI?: boolean;
}
