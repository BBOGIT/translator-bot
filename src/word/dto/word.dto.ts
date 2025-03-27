import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsDate,
  IsUrl
} from 'class-validator';

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
  @IsNotEmpty()
  @IsNumber()
  wordId: number;

  @IsNotEmpty()
  @IsBoolean()
  success: boolean;
}
