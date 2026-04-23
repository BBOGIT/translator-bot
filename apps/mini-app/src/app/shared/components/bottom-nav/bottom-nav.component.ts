import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IconsComponent } from '../icons/icons.component';

interface NavItem {
  label: string;
  icon: 'home' | 'book' | 'repeat' | 'bar-chart';
  route: string;
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, IconsComponent],
  template: `
    <nav class="bottom-nav">
      <a *ngFor="let item of items"
         [routerLink]="item.route"
         class="nav-item"
         [class.active]="isActive(item.route)">
        <span class="indicator"></span>
        <app-icon [name]="item.icon" [size]="22"></app-icon>
        <span class="label">{{ item.label }}</span>
      </a>
    </nav>
  `,
  styles: [`
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: var(--nav-h);
      background: var(--surface);
      box-shadow: 0 -4px 20px rgba(0,0,0,0.05);
      display: flex;
      align-items: center;
      z-index: 100;
      padding-bottom: env(safe-area-inset-bottom, 0);
    }
    .nav-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      padding-top: 6px;
      color: var(--text-3);
      cursor: pointer;
      transition: color 0.2s ease;
      position: relative;
      text-decoration: none;
    }
    .indicator {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 36px;
      height: 3px;
      border-radius: 0 0 3px 3px;
      background: var(--primary);
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .nav-item.active {
      color: var(--primary);
    }
    .nav-item.active .indicator {
      opacity: 1;
    }
    .nav-item.active app-icon {
      transform: scale(1.18) translateY(-1px);
      display: inline-flex;
    }
    app-icon {
      transition: transform 0.2s var(--spring);
    }
    .label {
      font-size: 10.5px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
  `]
})
export class BottomNavComponent {
  private router = inject(Router);

  items: NavItem[] = [
    { label: 'Home',     icon: 'home',      route: '/home' },
    { label: 'Learn',    icon: 'book',      route: '/learn' },
    { label: 'Repeat',   icon: 'repeat',    route: '/repeat' },
    { label: 'Progress', icon: 'bar-chart', route: '/progress' },
  ];

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }
}
