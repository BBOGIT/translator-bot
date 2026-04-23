import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ScreenHdrComponent } from '../../shared/components/screen-hdr/screen-hdr.component';
import { IconsComponent } from '../../shared/components/icons/icons.component';
import { ToggleComponent } from '../../shared/components/toggle/toggle.component';
import { CustomerService } from '../../core/services/customer.service';
import { TelegramService } from '../../core/services/telegram.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ScreenHdrComponent, IconsComponent, ToggleComponent],
  template: `
    <div class="screen no-bottom-nav">
      <app-screen-hdr title="Settings" [showBack]="true" (back)="goBack()"></app-screen-hdr>

      <div class="screen-content" style="padding-top:16px">

        <!-- Time display card -->
        <div class="time-card card anim-slide-up">
          <span class="time-label">Daily Reminder</span>
          <span class="time-display">{{ reminderTime() }}</span>
        </div>

        <!-- Notifications toggle -->
        <div class="toggle-card card anim-slide-up d1">
          <div class="toggle-row">
            <div class="toggle-icon" [class.on]="notificationsOn()">
              <app-icon name="bell" [size]="20" [style.color]="notificationsOn() ? 'var(--primary)' : 'var(--text-3)'"></app-icon>
            </div>
            <div class="toggle-info">
              <span class="toggle-title">Notifications</span>
              <span class="toggle-sub">Get daily reminders</span>
            </div>
            <app-toggle [(value)]="notificationsOn" (valueChange)="onToggle($event)"></app-toggle>
          </div>
        </div>

        <!-- Quick links -->
        <div class="links-card card anim-slide-up d2">
          <div class="link-row" (click)="navigate('/schedule')">
            <div class="link-icon blue">
              <app-icon name="clock" [size]="18" style="color:#fff"></app-icon>
            </div>
            <span class="link-label">Repetition Schedule</span>
            <app-icon name="chev-r" [size]="16" style="color:var(--text-3)"></app-icon>
          </div>
          <div class="link-divider"></div>
          <div class="link-row" (click)="navigate('/words')">
            <div class="link-icon green">
              <app-icon name="book-open" [size]="18" style="color:#fff"></app-icon>
            </div>
            <span class="link-label">Learned Words</span>
            <app-icon name="chev-r" [size]="16" style="color:var(--text-3)"></app-icon>
          </div>
        </div>

        <button class="btn btn-primary btn-full anim-slide-up d3"
                [class.pulse]="saved()" (click)="save()">
          {{ saved() ? 'Saved ✓' : 'Save Settings' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .no-bottom-nav { padding-bottom: 24px; }
    .screen-content { padding: 16px; display: flex; flex-direction: column; gap: 12px; }

    .time-card { padding: 24px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .time-label { font-size: 12px; font-weight: 700; color: var(--text-2); text-transform: uppercase; letter-spacing: 0.5px; }
    .time-display { font-size: 58px; font-weight: 800; color: var(--primary); letter-spacing: -1px; line-height: 1; }

    .toggle-card { padding: 0; }
    .toggle-row { display: flex; align-items: center; gap: 14px; padding: 16px; }
    .toggle-icon {
      width: 42px; height: 42px; border-radius: 12px;
      background: var(--bg); display: flex; align-items: center; justify-content: center;
      transition: background 0.25s ease;
      &.on { background: var(--primary-light); }
    }
    .toggle-info { flex: 1; }
    .toggle-title { font-size: 15px; font-weight: 600; color: var(--text); display: block; }
    .toggle-sub   { font-size: 12px; color: var(--text-2); }

    .links-card { padding: 0; overflow: hidden; }
    .link-row {
      display: flex; align-items: center; gap: 14px; padding: 16px;
      cursor: pointer; transition: background 0.15s ease;
      &:active { background: var(--bg); }
    }
    .link-divider { height: 1px; background: var(--border); margin: 0 16px; }
    .link-icon {
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .link-icon.blue  { background: linear-gradient(135deg, #2AABEE, #1A96D9); }
    .link-icon.green { background: linear-gradient(135deg, #10B981, #059669); }
    .link-label { flex: 1; font-size: 15px; font-weight: 600; color: var(--text); }

    .btn.pulse { animation: checkPulse 0.4s ease both; }
  `]
})
export class SettingsComponent implements OnInit {
  private router   = inject(Router);
  private customer = inject(CustomerService);
  private telegram = inject(TelegramService);

  reminderTime    = signal('20:00');
  notificationsOn = signal(true);
  saved           = signal(false);

  ngOnInit() {
    const c = this.customer.customer();
    if (c) {
      this.reminderTime.set(c.repetitionTime ?? '20:00');
      this.notificationsOn.set(c.notificationsEnabled ?? true);
    } else {
      this.customer.load().subscribe(c => {
        this.reminderTime.set(c.repetitionTime ?? '20:00');
        this.notificationsOn.set(c.notificationsEnabled ?? true);
      });
    }
  }

  onToggle(value: boolean) {
    this.notificationsOn.set(value);
    this.telegram.hapticImpact('light');
  }

  save() {
    this.customer.update({
      repetitionTime: this.reminderTime(),
      notificationsEnabled: this.notificationsOn(),
    }).subscribe(() => {
      this.saved.set(true);
      this.telegram.hapticNotification('success');
      setTimeout(() => this.saved.set(false), 1500);
    });
  }

  navigate(path: string) { this.router.navigate([path]); }
  goBack() { this.router.navigate(['/progress']); }
}
