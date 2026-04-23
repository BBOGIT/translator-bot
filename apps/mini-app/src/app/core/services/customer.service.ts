import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TelegramService } from './telegram.service';
import { tap } from 'rxjs';

export interface Customer {
  id: number;
  chatId: string;
  firstName: string | null;
  repetitionTime: string | null;
  streak?: number;
  notificationsEnabled?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private http = inject(HttpClient);
  private telegram = inject(TelegramService);

  customer = signal<Customer | null>(null);

  load() {
    const chatId = this.telegram.user?.id ?? 0;
    return this.http.get<Customer>(`/api/customers/${chatId}`).pipe(
      tap(c => this.customer.set(c))
    );
  }

  update(data: Partial<Pick<Customer, 'repetitionTime' | 'notificationsEnabled'>>) {
    const chatId = this.telegram.user?.id ?? 0;
    return this.http.put<Customer>(`/api/customers/${chatId}`, data).pipe(
      tap(c => this.customer.set(c))
    );
  }
}
