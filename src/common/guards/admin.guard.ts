import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException
  // InternalServerErrorException, // Якщо вирішите додати перевірку конфігурації
  // Logger // Якщо вирішите додати логер
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const BEARER_PREFIX = 'Bearer ';
const MISSING_AUTH_KEY_MESSAGE =
  'Відсутній ключ авторизації';
const INVALID_AUTH_KEY_MESSAGE =
  'Недійсний ключ авторизації';
// const ADMIN_KEY_CONFIG_ERROR_MESSAGE = 'Admin access is misconfigured.';

/**
 * Guard to protect routes requiring admin privileges.
 * Validates an admin API key provided in the Authorization header.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  // private readonly logger = new Logger(AdminGuard.name); // Якщо потрібен логер

  constructor(
    private configService: ConfigService
  ) {}

  /**
   * Determines if the current request is authorized for admin access.
   * @param context The execution context.
   * @returns True if authorized, otherwise throws UnauthorizedException.
   */
  canActivate(
    context: ExecutionContext
  ): boolean {
    const request = context
      .switchToHttp()
      .getRequest();

    const adminKey =
      this.configService.get<string>(
        'ADMIN_API_KEY'
      );

    // Опціональна перевірка наявності ключа в конфігурації
    // if (!adminKey) {
    //   this.logger.error('ADMIN_API_KEY is not configured. Admin access is disabled.');
    //   throw new InternalServerErrorException(ADMIN_KEY_CONFIG_ERROR_MESSAGE);
    // }

    const authHeader =
      request.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith(BEARER_PREFIX)
    ) {
      throw new UnauthorizedException(
        MISSING_AUTH_KEY_MESSAGE
      );
    }

    const providedKey = authHeader.split(' ')[1];

    if (providedKey !== adminKey) {
      throw new UnauthorizedException(
        INVALID_AUTH_KEY_MESSAGE
      );
    }

    return true;
  }
}
