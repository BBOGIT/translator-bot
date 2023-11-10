import {
  Body,
  Query,
  Controller,
  Post,
  Get
} from '@nestjs/common';
import { WordService } from './word.service';
import { CreateWordDto, GetWordDto } from './dto';

@Controller('words')
export class WordController {
  constructor(private wordService: WordService) {}

  @Get('by-word')
  getWord(@Query() dto: GetWordDto) {
    return this.wordService.getWord(dto);
  }

  @Post('word')
  createWord(@Body() dto: CreateWordDto) {
    return this.wordService.createWord(dto);
  }
}
