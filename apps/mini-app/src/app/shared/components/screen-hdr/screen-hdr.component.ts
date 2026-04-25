import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconsComponent } from '../icons/icons.component';

@Component({
  selector: 'app-screen-hdr',
  standalone: true,
  imports: [CommonModule, RouterLink, IconsComponent],
  template: `
    <header class="screen-hdr">
      <button *ngIf="showBack" class="back-btn" (click)="back.emit()">
        <app-icon name="chev-l" [size]="20"></app-icon>
      </button>
      <span class="title">{{ title }}</span>
      <div class="right-slot">
        <ng-content></ng-content>
        <a *ngIf="!hideSettings" routerLink="/settings" class="settings-btn">
          <app-icon name="settings" [size]="20"></app-icon>
        </a>
      </div>
    </header>
  `,
  styles: [`
    .screen-hdr {
      position: sticky;
      top: 0;
      height: var(--header-h);
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 12px;
      z-index: 50;
    }
    .back-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--bg);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text);
      flex-shrink: 0;
      transition: opacity 0.15s ease;
      &:active { opacity: 0.7; }
    }
    .title {
      font-size: 18px;
      font-weight: 700;
      color: var(--text);
      flex: 1;
    }
    .right-slot {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .settings-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--bg);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-2);
      flex-shrink: 0;
      transition: color 0.15s ease, opacity 0.15s ease;
      text-decoration: none;
      &:active { opacity: 0.7; }
    }
  `]
})
export class ScreenHdrComponent {
  @Input() title = '';
  @Input() showBack = false;
  @Input() hideSettings = false;
  @Output() back = new EventEmitter<void>();
}
