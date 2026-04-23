import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type IconName =
  | 'home' | 'book' | 'repeat' | 'bar-chart' | 'flame' | 'check' | 'x'
  | 'chev-r' | 'chev-l' | 'chev-d' | 'chev-u' | 'camera' | 'search'
  | 'settings' | 'clock' | 'bell' | 'book-open' | 'plus' | 'trash';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
      <ng-container [ngSwitch]="name">
        <ng-container *ngSwitchCase="'home'">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
          <polyline points="9 21 9 12 15 12 15 21"/>
        </ng-container>
        <ng-container *ngSwitchCase="'book'">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
        </ng-container>
        <ng-container *ngSwitchCase="'repeat'">
          <polyline points="17 1 21 5 17 9"/>
          <path d="M3 11V9a4 4 0 014-4h14"/>
          <polyline points="7 23 3 19 7 15"/>
          <path d="M21 13v2a4 4 0 01-4 4H3"/>
        </ng-container>
        <ng-container *ngSwitchCase="'bar-chart'">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6"  y1="20" x2="6"  y2="14"/>
        </ng-container>
        <ng-container *ngSwitchCase="'flame'">
          <path d="M8.5 14.5A4.5 4.5 0 0013 10c0-2-1-3.5-2.5-5C10 7 8.5 8.5 8.5 10a3 3 0 001 2.5"/>
          <path d="M12 22c4 0 7-3.6 7-8 0-3-1.5-5.5-4-7.5C14 9 13 11 13 12.5c0 1.5 1 2.5 1 2.5a4 4 0 01-5.5 5.5C7 21 9 22 12 22z"/>
        </ng-container>
        <ng-container *ngSwitchCase="'check'">
          <polyline points="20 6 9 17 4 12"/>
        </ng-container>
        <ng-container *ngSwitchCase="'x'">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </ng-container>
        <ng-container *ngSwitchCase="'chev-r'">
          <polyline points="9 18 15 12 9 6"/>
        </ng-container>
        <ng-container *ngSwitchCase="'chev-l'">
          <polyline points="15 18 9 12 15 6"/>
        </ng-container>
        <ng-container *ngSwitchCase="'chev-d'">
          <polyline points="6 9 12 15 18 9"/>
        </ng-container>
        <ng-container *ngSwitchCase="'chev-u'">
          <polyline points="18 15 12 9 6 15"/>
        </ng-container>
        <ng-container *ngSwitchCase="'camera'">
          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </ng-container>
        <ng-container *ngSwitchCase="'search'">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </ng-container>
        <ng-container *ngSwitchCase="'settings'">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
        </ng-container>
        <ng-container *ngSwitchCase="'clock'">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </ng-container>
        <ng-container *ngSwitchCase="'bell'">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </ng-container>
        <ng-container *ngSwitchCase="'book-open'">
          <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
        </ng-container>
        <ng-container *ngSwitchCase="'plus'">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </ng-container>
        <ng-container *ngSwitchCase="'trash'">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
        </ng-container>
      </ng-container>
    </svg>
  `,
  styles: [':host { display: inline-flex; align-items: center; }']
})
export class IconsComponent {
  @Input() name: IconName = 'home';
  @Input() size: number | string = 20;
}
