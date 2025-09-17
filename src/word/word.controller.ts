import {
  Body,
  Query,
  Controller,
  Post,
  Get,
  Param,
  Patch,
  Put,
  HttpStatus,
  ParseIntPipe,
  ValidationPipe,
  BadRequestException,
  ParseBoolPipe,
  UseGuards
} from '@nestjs/common';
import { WordService } from './word.service';
import {
  CreateWordDto,
  GetWordDto,
  UpdateWordRepetitionDto,
  WordResponseDto,
  PaginatedWordsResponseDto,
  UpdateWordDto
} from './dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { Word } from '@prisma/client';
import { PaginatedWordsResult } from './cqrs/queries/get-learned-words.query';
import { WordWithCustomer } from './cqrs/queries/get-words-for-repetition.query';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Words')
@Controller('words')
@UseGuards(JwtAuthGuard)
export class WordController {
  constructor(private wordService: WordService) {}

  private mapToResponseDto(
    word: Partial<Word | WordWithCustomer>
  ): WordResponseDto {
    if (!word) {
      return null;
    }
    const wordData = { ...word };
    if ('customer' in wordData) {
      delete wordData.customer;
    }

    return {
      id: wordData.id,
      word: wordData.word,
      translation: wordData.translation,
      examples:
        typeof wordData.examples === 'string'
          ? [wordData.examples]
          : (wordData.examples as string[]) ||
            undefined,
      needToLearn: wordData.needToLearn,
      repeatCount: (wordData as any).repeatCount,
      lastRepeatAt: (wordData as any)
        .lastRepeatAt,
      nextRepeatDate: (wordData as any)
        .nextRepeatDate,
      imageExample: wordData.imageExample,
      videoExample: wordData.videoExample,
      customerId: wordData.customerId,
      createdAt: wordData.createdAt,
      updatedAt: wordData.updatedAt
    };
  }

  private mapToPaginatedResponseDto(
    paginatedResult: PaginatedWordsResult
  ): PaginatedWordsResponseDto {
    return {
      words: paginatedResult.words.map(pWord =>
        this.mapToResponseDto(
          pWord as Partial<Word>
        )
      ),
      total: paginatedResult.total,
      pages: paginatedResult.pages
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new word' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'The word has been successfully created.',
    type: WordResponseDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad Request.'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden.'
  })
  async createWord(
    @Body() dto: CreateWordDto
  ): Promise<WordResponseDto> {
    const word =
      await this.wordService.createWord(dto);
    return this.mapToResponseDto(word);
  }

  @Get('find')
  @ApiOperation({
    summary: 'Find a word by text and customerId'
  })
  @ApiQuery({
    name: 'word',
    type: String,
    description: 'Text of the word'
  })
  @ApiQuery({
    name: 'customerId',
    type: Number,
    description: 'Customer ID'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Word found.',
    type: WordResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Word not found.'
  })
  async getWord(
    @Query() dto: GetWordDto
  ): Promise<WordResponseDto> {
    const word =
      await this.wordService.getWord(dto);
    return this.mapToResponseDto(word);
  }

  @Get('customer/:customerId/learned')
  @ApiOperation({
    summary:
      'Get learned words for a customer with pagination'
  })
  @ApiParam({ name: 'customerId', type: Number })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Paginated list of learned words.',
    type: PaginatedWordsResponseDto
  })
  async getLearnedWords(
    @Param('customerId', ParseIntPipe)
    customerId: number,
    @Query(
      'page',
      new ParseIntPipe({ optional: true })
    )
    page: number = 1,
    @Query(
      'limit',
      new ParseIntPipe({ optional: true })
    )
    limit: number = 10
  ): Promise<PaginatedWordsResponseDto> {
    const result =
      await this.wordService.getLearnedWordsWithPagination(
        customerId,
        page,
        limit
      );
    return this.mapToPaginatedResponseDto(result);
  }

  @Get('customer/:customerId')
  @ApiOperation({
    summary:
      'Get words for a customer by learning status with pagination'
  })
  @ApiParam({ name: 'customerId', type: Number })
  @ApiQuery({
    name: 'needToLearn',
    type: Boolean,
    description: 'Filter by needToLearn status',
    required: true
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Number of items per page'
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of items to skip'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'List of words for the customer.',
    type: [WordResponseDto]
  })
  async getWordsByCustomer(
    @Param('customerId', ParseIntPipe)
    customerId: number,
    @Query('needToLearn', ParseBoolPipe)
    needToLearn: boolean,
    @Query(
      'pageSize',
      new ParseIntPipe({ optional: true })
    )
    pageSize?: number,
    @Query(
      'offset',
      new ParseIntPipe({ optional: true })
    )
    offset?: number
  ): Promise<WordResponseDto[]> {
    const words =
      await this.wordService.getWordsByCustomerId(
        customerId,
        needToLearn,
        pageSize,
        offset
      );
    return words.map(word =>
      this.mapToResponseDto(word)
    );
  }

  @Get('customer/:customerId/count')
  @ApiOperation({
    summary:
      'Get word count for a customer by learning status'
  })
  @ApiParam({ name: 'customerId', type: Number })
  @ApiQuery({
    name: 'needToLearn',
    type: Boolean,
    description: 'Filter by needToLearn status',
    required: true
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Count of words for the customer.',
    type: Number
  })
  async getWordCount(
    @Param('customerId', ParseIntPipe)
    customerId: number,
    @Query('needToLearn', ParseBoolPipe)
    needToLearn: boolean
  ): Promise<number> {
    return this.wordService.getWordCount(
      customerId,
      needToLearn
    );
  }

  @Get('repetition')
  @ApiOperation({
    summary: 'Get words for repetition'
  })
  @ApiQuery({
    name: 'customerId',
    required: false,
    type: Number,
    description:
      'Optional customer ID to filter words for repetition'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of words for repetition.',
    type: [WordResponseDto]
  })
  async getWordsForRepetition(
    @Query(
      'customerId',
      new ParseIntPipe({ optional: true })
    )
    customerId?: number
  ): Promise<WordResponseDto[]> {
    const words =
      await this.wordService.getWordsForRepetition(
        customerId
      );
    return words.map(word =>
      this.mapToResponseDto(word)
    );
  }

  @Patch(':wordId/repetition')
  @ApiOperation({
    summary: 'Update word repetition status'
  })
  @ApiParam({ name: 'wordId', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Word repetition status updated.',
    type: WordResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Word not found.'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad Request.'
  })
  async updateWordRepetitionStatus(
    @Param('wordId', ParseIntPipe) wordId: number,
    @Body() dto: UpdateWordRepetitionDto
  ): Promise<WordResponseDto> {
    if (dto.wordId && dto.wordId !== wordId) {
      throw new BadRequestException(
        'wordId in DTO body must match wordId in path if provided, or be omitted.'
      );
    }
    const payload = {
      success: dto.success,
      wordId:
        dto.wordId !== undefined
          ? dto.wordId
          : wordId
    };
    const word =
      await this.wordService.updateWordRepetitionStatus(
        payload
      );
    return this.mapToResponseDto(word);
  }

  @Put(':wordId')
  @ApiOperation({ summary: 'Update a word' })
  @ApiParam({
    name: 'wordId',
    type: Number,
    description: 'ID of the word to update'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Word updated successfully',
    type: WordResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Word not found'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid data provided',
    type: UpdateWordDto
  })
  async updateWord(
    @Param('wordId', ParseIntPipe) wordId: number,
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true
      })
    )
    data: UpdateWordDto
  ): Promise<WordResponseDto> {
    const word =
      await this.wordService.updateWord(
        wordId,
        data as any
      );
    return this.mapToResponseDto(word);
  }
}
