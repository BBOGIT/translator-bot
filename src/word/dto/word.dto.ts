import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsDate,
  IsUrl
} from 'class-validator';

export class TranslateWordDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class TranslateWordResponseDto {
  word: string;
  translation: string;
  examples: string[];
}

export class CreateWordDto {
  @IsString()
  @IsNotEmpty()
  word: string;

  @IsString()
  @IsNotEmpty()
  translation: string;

  @IsNotEmpty()
  @IsNumber()
  customerId: number;

  @IsString()
  @IsOptional() // Робимо необов'язковим, оскільки не всі слова матимуть відео
  @IsUrl() // Додаємо валідацію URL
  videoExample?: string;

  @IsString()
  @IsOptional() // Робимо необов'язковим, оскільки не всі слова матимуть відео
  @IsUrl() // Додаємо валідацію URL
  imageExample?: string;

  @IsBoolean()
  @IsOptional() // За замовчуванням буде true
  needToLearn?: boolean;

  @IsOptional()
  @IsNotEmpty()
  examples?: string | string[];

  // Додаємо нові поля для системи повторень
  @IsNumber()
  @IsOptional()
  repeatCount?: number;

  @IsDate()
  @IsOptional()
  lastRepeatAt?: Date;

  @IsDate()
  @IsOptional()
  lastNotificationAt?: Date;
}

export class GetWordDto {
  @IsNotEmpty()
  @IsString()
  word: string;

  @IsNotEmpty()
  @IsNumber()
  customerId: number;
}

// Додаємо новий DTO для оновлення статусу повторення
export class UpdateWordRepetitionDto {
  @IsOptional()
  @IsNumber()
  wordId?: number;

  @IsNotEmpty()
  @IsBoolean()
  success: boolean;
}

// Додаємо WordResponseDto для відповідей API
import {
  ApiProperty,
  ApiPropertyOptional
} from '@nestjs/swagger';

export class WordResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  word: string;

  @ApiProperty()
  translation: string;

  @ApiPropertyOptional({ type: [String] }) // Припускаємо, що examples - це масив рядків
  examples?: string[];

  @ApiProperty()
  needToLearn: boolean;

  @ApiProperty({
    description:
      'Number of times the word has been repeated'
  })
  repeatCount: number;

  @ApiPropertyOptional({
    description: 'Date of the last repetition'
  })
  lastRepeatAt?: Date | null;

  @ApiPropertyOptional({
    description:
      'Date of the next scheduled repetition'
  })
  nextRepeatDate?: Date | null;

  @ApiPropertyOptional()
  @IsUrl()
  imageExample?: string | null;

  @ApiPropertyOptional()
  @IsUrl()
  videoExample?: string | null;

  @ApiProperty()
  customerId: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedWordsResponseDto {
  @ApiProperty({ type: [WordResponseDto] })
  words: WordResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty({
    description: 'Total number of pages'
  })
  pages: number;
}

// DTO для оновлення слова
export class UpdateWordDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  word?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  translation?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  examples?: string[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  needToLearn?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  repeatCount?: number;

  @ApiPropertyOptional()
  @IsDate()
  @IsOptional()
  lastRepeatAt?: Date | null;

  @ApiPropertyOptional()
  @IsDate()
  @IsOptional()
  nextRepeatDate?: Date | null;

  @ApiPropertyOptional()
  @IsUrl()
  @IsOptional()
  imageExample?: string | null;

  @ApiPropertyOptional()
  @IsUrl()
  @IsOptional()
  videoExample?: string | null;
}
