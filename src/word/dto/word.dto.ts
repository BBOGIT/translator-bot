import {
  IsNotEmpty,
  IsString,
  IsNumber
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
}

export class GetWordDto {
  @IsNotEmpty()
  @IsString()
  word: string;
}
