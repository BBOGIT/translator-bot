import { Injectable } from '@angular/core';

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: { user?: TelegramUser; [key: string]: unknown };
  colorScheme: 'light' | 'dark';
  ready(): void;
  expand(): void;
  close(): void;
  MainButton: {
    text: string;
    setText(text: string): void;
    onClick(callback: () => void): void;
    show(): void;
    hide(): void;
  };
  BackButton: {
    onClick(callback: () => void): void;
    show(): void;
    hide(): void;
  };
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
  };
  showAlert(message: string): void;
  setHeaderColor(color: string): void;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

@Injectable({ providedIn: 'root' })
export class TelegramService {
  private tg = window.Telegram?.WebApp;

  get isTelegramEnv(): boolean {
    return !!window.Telegram?.WebApp;
  }

  get user(): TelegramUser | undefined {
    return this.tg?.initDataUnsafe?.user;
  }

  get initData(): string {
    return this.tg?.initData ?? '';
  }

  get colorScheme(): 'light' | 'dark' {
    return this.tg?.colorScheme ?? 'light';
  }

  get languageCode(): string {
    return this.tg?.initDataUnsafe?.user?.language_code ?? 'uk';
  }

  ready() { this.tg?.ready(); }
  expand() { this.tg?.expand(); }
  close() { this.tg?.close(); }

  showMainButton(text: string, callback: () => void) {
    if (!this.tg) return;
    this.tg.MainButton.setText(text);
    this.tg.MainButton.onClick(callback);
    this.tg.MainButton.show();
  }

  hideMainButton() { this.tg?.MainButton.hide(); }

  showBackButton(callback: () => void) {
    if (!this.tg) return;
    this.tg.BackButton.onClick(callback);
    this.tg.BackButton.show();
  }

  hideBackButton() { this.tg?.BackButton.hide(); }

  hapticImpact(style: 'light' | 'medium' | 'heavy') {
    this.tg?.HapticFeedback.impactOccurred(style);
  }

  hapticNotification(type: 'error' | 'success' | 'warning') {
    this.tg?.HapticFeedback.notificationOccurred(type);
  }

  showAlert(message: string) { this.tg?.showAlert(message); }

  setHeaderColor(color: string) { this.tg?.setHeaderColor(color); }
}
