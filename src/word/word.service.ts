import {
  NotFoundException,
  Injectable,
  ForbiddenException
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetWordDto, CreateWordDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class WordService {
  constructor(private prisma: PrismaService) {}
  async getWord(dto: GetWordDto) {
    const word =
      await this.prisma.word.findUnique({
        where: {
          word: dto.word
        }
      });
    if (!word) {
      throw new NotFoundException(
        'Word not found'
      );
    }
    return word;
  }

  async createWord(dto: CreateWordDto) {
    try {
      const word = await this.prisma.word.create({
        data: {
          word: dto.word,
          translation: dto.translation,
          customerId: dto.customerId
        }
      });
      return word;
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ForbiddenException(
          'Word already exists'
        );
      }
      throw error;
    }
  }
}
