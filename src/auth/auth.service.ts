import {
  ForbiddenException,
  Injectable
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { AuthDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}
  async signin(dto: AuthDto) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          email: dto.email
        }
      });
    if (!user) {
      throw new ForbiddenException(
        'Credentials are not valid'
      );
    }
    const valid = await argon.verify(
      user.hash,
      dto.password
    );
    if (!valid) {
      throw new ForbiddenException(
        'Credentials are not valid'
      );
    }
    delete user.hash;
    return user;
  }

  async signup(dto: AuthDto) {
    //створюємо хеш паролю
    const hash = await argon.hash(dto.password);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash
        }
      });
      delete user.hash;
      return user;
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ForbiddenException(
          'User already exists'
        );
      }
      throw error;
    }
  }
}
