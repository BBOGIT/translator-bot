import {
  ForbiddenException,
  Injectable
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { AuthDto } from './dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}
  async signin(args: AuthDto) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          email: args.email
        }
      });

    if (!user) {
      throw new ForbiddenException(
        'Credentials are not valid'
      );
    }

    const valid = await argon.verify(
      user.hash,
      args.password
    );

    if (!valid) {
      throw new ForbiddenException(
        'Credentials are not valid'
      );
    }

    delete user.hash;
    return user;
  }

  async signup(args: AuthDto) {
    //створюємо хеш паролю
    const user =
      await this.prisma.user.findUnique({
        where: {
          email: args.email
        }
      });

    if (!user) {
      throw new ForbiddenException(
        'User already exists'
      );
    }

    const hash = await argon.hash(args.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: args.email,
          hash
        }
      });
      delete user.hash;
      return user;
    } catch (error) {
      throw new ForbiddenException(
        'User creation error'
      );
      throw error;
    }
  }
}
