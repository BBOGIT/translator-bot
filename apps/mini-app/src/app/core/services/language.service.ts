import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { TelegramService } from './telegram.service';

const SUPPORTED = ['uk', 'en'] as const;
const FALLBACK = 'uk';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  constructor(
    private translate: TranslateService,
    private telegram: TelegramService
  ) {}

  init(): Observable<unknown> {
    const code = this.telegram.languageCode;
    const lang = (SUPPORTED as readonly string[]).includes(code) ? code : FALLBACK;
    this.translate.setDefaultLang(FALLBACK);
    return this.translate.use(lang);
  }
}
