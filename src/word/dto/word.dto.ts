import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsBoolean
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
  @IsNotEmpty()
  videoExample: string;

  @IsBoolean()
  needToLearn: boolean;
}

export class GetWordDto {
  @IsNotEmpty()
  @IsString()
  word: string;

  @IsNotEmpty()
  @IsNumber()
  customerId: number;
}
