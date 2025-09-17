import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  ExtractJwt,
  Strategy
} from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
  'jwt'
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_ACCESS_SECRET'
      )
    });
  }

  async validate(payload: {
    sub: number;
    email: string;
  }) {
    // Тут можна додати логіку для перевірки, чи користувач все ще існує,
    // чи не заблокований тощо, якщо це потрібно.
    // const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    // if (!user) {
    //   throw new UnauthorizedException();
    // }
    // delete user.hash; // Не повертати хеш пароля
    // return user;

    // Або просто повертати розшифрований пейлоад, якщо цього достатньо
    // і дані користувача не потрібні на кожному запиті, захищеному JWT.
    return {
      userId: payload.sub,
      email: payload.email
    };
  }
}
