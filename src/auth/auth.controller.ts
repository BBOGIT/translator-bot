import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Req
} from '@nestjs/common';
import {
  AuthService,
  Tokens
} from './auth.service';
import { AuthDto, TelegramAuthDto } from './dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    sub?: number;
    email?: string;
    refreshToken?: string;
    userId?: number;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('telegram')
  @HttpCode(HttpStatus.OK)
  async loginWithTelegram(
    @Body() dto: TelegramAuthDto
  ): Promise<Tokens> {
    return this.authService.loginWithTelegram(dto.initData);
  }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(
    @Body() args: AuthDto
  ): Promise<Tokens> {
    return this.authService.signup(args);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(
    @Body() args: AuthDto
  ): Promise<Tokens> {
    return this.authService.signin(args);
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Req() req: AuthenticatedRequest
  ): Promise<Tokens> {
    const userId = req.user?.sub;
    const refreshToken = req.user?.refreshToken;
    if (!userId || !refreshToken) {
      throw new Error(
        'User ID or refresh token missing from request'
      );
    }
    return this.authService.refreshTokens(
      userId,
      refreshToken
    );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: AuthenticatedRequest
  ): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error(
        'User ID missing from request'
      );
    }
    return this.authService.logout(userId);
  }
}
