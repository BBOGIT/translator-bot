import {
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CustomerDto,
  CustomerUpdateDto,
  CustomerFindDto
} from './dto';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}
  async find(dto: CustomerFindDto) {
    const customer =
      await this.prisma.customer.findUnique({
        where: {
          chatId: dto.chatId
        }
      });
    // if (!customer) {
    //   throw new NotFoundException();
    // }
    return customer;
  }

  async create(dto: CustomerDto) {
    const customer =
      await this.prisma.customer.create({
        data: {
          ...dto
        }
      });
    return customer;
  }

  async update(dto: CustomerUpdateDto) {
    const customer =
      await this.prisma.customer.findUnique({
        where: {
          chatId: dto.chatId
        }
      });
    if (!customer) {
      throw new NotFoundException();
    }
    await this.prisma.customer.update({
      where: {
        chatId: dto.chatId
      },
      data: {
        ...dto
      }
    });
    return customer;
  }
}
