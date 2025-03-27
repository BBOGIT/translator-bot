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
  async getLearnedWordsWithPagination(
    customerId: number,
    page = 1,
    limit = 10
  ) {
    const words = await this.prisma.word.findMany(
      {
        where: {
          customerId,
          needToLearn: false
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: limit,
        skip: (page - 1) * limit,
        select: {
          id: true,
          word: true,
          translation: true,
          updatedAt: true
        }
      }
    );

    const total = await this.prisma.word.count({
      where: {
        customerId,
        needToLearn: false
      }
    });

    return {
      words,
      total,
      pages: Math.ceil(total / limit)
    };
  }
  async getWord(dto: GetWordDto) {
    const word =
      await this.prisma.word.findUnique({
        where: {
          customerId_word: {
            customerId: dto.customerId,
            word: dto.word
          }
        }
      });

    if (!word) {
      throw new NotFoundException(
        'Word not found'
      );
    }
    return word;
  }

  public async createWord(dto: CreateWordDto) {
    try {
      // Make sure examples is a string before saving
      if (
        dto.examples &&
        Array.isArray(dto.examples)
      ) {
        dto.examples = JSON.stringify(
          dto.examples
        );
      }

      // Перевірка та логування videoExample
      console.log(
        `[WordService] Створення слова "${dto.word}" з videoExample="${dto.videoExample}"`
      );

      // Перевірка на валідність videoExample
      if (
        dto.videoExample === 'null' ||
        dto.videoExample === '' ||
        (dto.videoExample &&
          dto.videoExample.trim() === '')
      ) {
        console.log(
          `[WordService] Виявлено невалідний videoExample. Встановлюємо null.`
        );
        dto.videoExample = null;
      }

      const word = await this.prisma.word.create({
        data: {
          word: dto.word,
          translation: dto.translation,
          customerId: dto.customerId,
          needToLearn: dto.needToLearn,
          videoExample: dto.videoExample,
          imageExample: dto.imageExample,
          examples: dto.examples as string
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

  public async updateWord(
    wordId: number,
    data: Prisma.WordUpdateInput
  ) {
    const word =
      await this.prisma.word.findUnique({
        where: {
          id: wordId
        }
      });
    if (!word) {
      throw new NotFoundException(
        'Word not found'
      );
    }
    return await this.prisma.word.update({
      where: {
        id: wordId
      },
      data
    });
  }

  public async getWordsByCustomerId(
    customerId: number,
    needToLearn: boolean,
    pageSize?: number,
    offset?: number
  ) {
    return await this.prisma.word.findMany({
      where: {
        customerId,
        needToLearn
      }
      // take: pageSize,
      // skip: offset,
      // orderBy: {
      //   createdAt: 'desc' // або інше поле, за яким ви хочете сортувати
      // }
    });
  }

  public async getWordCount(
    customerId: number,
    needToLearn: boolean
  ) {
    return await this.prisma.word.count({
      where: {
        customerId,
        needToLearn
      }
    });
  }
}
