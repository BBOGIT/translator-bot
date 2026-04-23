import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { TelegramService } from './telegram.service';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const ACCESS_KEY = 'tg_access_token';
const REFRESH_KEY = 'tg_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private telegram = inject(TelegramService);

  private _authenticated$ = new BehaviorSubject<boolean>(this.hasToken());

  get authenticated$(): Observable<boolean> {
    return this._authenticated$.asObservable();
  }

  get accessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  hasToken(): boolean {
    return !!localStorage.getItem(ACCESS_KEY);
  }

  loginWithTelegram(): Observable<AuthTokens> {
    const initData = this.telegram.initData || 'dev_mode';
    return this.http.post<AuthTokens>('/api/auth/telegram', { initData }).pipe(
      tap(tokens => this.storeTokens(tokens))
    );
  }

  refresh(): Observable<AuthTokens> {
    return this.http.post<AuthTokens>('/api/auth/refresh', {}, {
      headers: { Authorization: `Bearer ${this.refreshToken}` }
    }).pipe(
      tap(tokens => this.storeTokens(tokens))
    );
  }

  logout() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this._authenticated$.next(false);
  }

  private storeTokens(tokens: AuthTokens) {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    this._authenticated$.next(true);
  }
}
