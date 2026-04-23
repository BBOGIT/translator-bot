import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { from, map, switchMap } from 'rxjs';
import { TelegramService } from '../services/telegram.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const telegram = inject(TelegramService);

  if (auth.hasToken()) return true;

  if (telegram.isTelegramEnv || !telegram.isTelegramEnv) {
    return from(auth.loginWithTelegram()).pipe(
      map(() => true),
      switchMap(() => [true]),
      map(() => true)
    );
  }

  router.navigate(['/home']);
  return false;
};
