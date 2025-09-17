import { PassportStrategy } from '@nestjs/passport';
import {
  ExtractJwt,
  Strategy
} from 'passport-jwt';
import { Request } from 'express';
import {
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh'
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService // Додаємо PrismaService для перевірки користувача
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>(
        'JWT_REFRESH_SECRET'
      ),
      passReqToCallback: true // Щоб отримати refreshToken з запиту
    });
  }

  async validate(
    req: Request,
    payload: { sub: number; email: string }
  ) {
    const refreshToken = req
      .get('authorization')
      ?.replace('Bearer', '')
      .trim();
    if (!refreshToken) {
      throw new UnauthorizedException(
        'Refresh token not found'
      );
    }

    // Тут можна додати перевірку, чи refreshToken співпадає з тим, що в базі (hashedRt)
    // Це вже робиться в AuthService.refreshTokens, тому тут може бути достатньо перевірити payload
    // і що користувач існує

    const user =
      await this.prisma.user.findUnique({
        where: { id: payload.sub }
      });

    if (!user || !user.hashedRt) {
      // Користувач не існує або не має активного refresh token
      throw new UnauthorizedException(
        'Access Denied'
      );
    }

    // Додаткова перевірка, чи переданий токен співпадає з тим, що в БД
    // Важливо: bcrypt.compare потрібно для порівняння хешів, а не просто рядків
    // const rtMatches = await bcrypt.compare(refreshToken, user.hashedRt); // Потрібен bcrypt
    // if (!rtMatches) {
    //   throw new UnauthorizedException('Access Denied - refresh token mismatch');
    // }

    // Повертаємо payload та сам refreshToken, щоб його можна було використати в AuthService
    return { ...payload, refreshToken };
  }
}
