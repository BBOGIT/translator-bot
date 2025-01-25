import { Injectable } from '@nestjs/common';

@Injectable()
export class BotConfig {
  readonly supportedLanguages = ['uk'];
  readonly defaultLanguage = 'uk';
  readonly redisKeyExpiration = 3600;
}
