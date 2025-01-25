import {
  Body,
  Controller,
  Post
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signin')
  signin(@Body() args: AuthDto) {
    return this.authService.signin(args);
  }

  @Post('signup')
  signup(@Body() args: AuthDto) {
    return this.authService.signup(args);
  }
}
