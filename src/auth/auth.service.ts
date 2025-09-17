import {
  ForbiddenException,
  Injectable
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { AuthDto } from './dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  private async getTokens(
    userId: number,
    email: string
  ): Promise<Tokens> {
    const accessTokenPayload = {
      sub: userId,
      email
    };
    const refreshTokenPayload = {
      sub: userId,
      email
    }; // Можна додати більше даних або інший тип

    const [accessToken, refreshToken] =
      await Promise.all([
        this.jwtService.signAsync(
          accessTokenPayload,
          {
            secret:
              this.configService.get<string>(
                'JWT_ACCESS_SECRET'
              ),
            expiresIn:
              this.configService.get<string>(
                'JWT_ACCESS_EXPIRATION_TIME'
              )
          }
        ),
        this.jwtService.signAsync(
          refreshTokenPayload,
          {
            secret:
              this.configService.get<string>(
                'JWT_REFRESH_SECRET'
              ),
            expiresIn:
              this.configService.get<string>(
                'JWT_REFRESH_EXPIRATION_TIME'
              )
          }
        )
      ]);

    return {
      accessToken,
      refreshToken
    };
  }

  // Поки що не реалізовано, але знадобиться для оновлення refresh token в БД
  private async updateRefreshTokenHash(
    userId: number,
    refreshToken: string
  ): Promise<void> {
    const hash = await bcrypt.hash(
      refreshToken,
      10
    );
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRt: hash }
    });
  }

  async signin(args: AuthDto): Promise<Tokens> {
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

    const valid = await bcrypt.compare(
      args.password,
      user.hash
    );

    if (!valid) {
      throw new ForbiddenException(
        'Credentials are not valid'
      );
    }

    const tokens = await this.getTokens(
      user.id,
      user.email
    );
    await this.updateRefreshTokenHash(
      user.id,
      tokens.refreshToken
    );
    return tokens;
  }

  async signup(args: AuthDto): Promise<Tokens> {
    const existingUser =
      await this.prisma.user.findUnique({
        where: {
          email: args.email
        }
      });

    if (existingUser) {
      throw new ForbiddenException(
        'User with this email already exists'
      ); // Виправлена логіка
    }

    const saltRounds = 10;
    const hash = await bcrypt.hash(
      args.password,
      saltRounds
    );

    let newUser: User;
    try {
      newUser = await this.prisma.user.create({
        data: {
          email: args.email,
          hash
        }
      });
    } catch (error) {
      // Логування помилки може бути корисним тут
      throw new ForbiddenException(
        'User creation error'
      );
    }

    const tokens = await this.getTokens(
      newUser.id,
      newUser.email
    );
    await this.updateRefreshTokenHash(
      newUser.id,
      tokens.refreshToken
    );
    return tokens;
  }

  // Додати метод для logout, якщо потрібно
  async logout(userId: number): Promise<void> {
    // Оновлюємо тільки якщо hashedRt не null, щоб уникнути зайвих операцій
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        hashedRt: { not: null }
      },
      data: { hashedRt: null }
    });
  }

  // Додати метод для refresh tokens
  async refreshTokens(
    userId: number,
    rt: string
  ): Promise<Tokens> {
    const user =
      await this.prisma.user.findUnique({
        where: { id: userId }
      });
    // Перевіряємо, чи існує користувач і чи є у нього хешований RT
    if (!user || !user.hashedRt)
      throw new ForbiddenException(
        'Access Denied'
      );

    const rtMatches = await bcrypt.compare(
      rt,
      user.hashedRt
    );
    if (!rtMatches)
      throw new ForbiddenException(
        'Access Denied'
      ); // Використовуємо ForbiddenException для консистентності

    const tokens = await this.getTokens(
      user.id,
      user.email
    );
    await this.updateRefreshTokenHash(
      user.id,
      tokens.refreshToken
    );
    return tokens;
  }
}
