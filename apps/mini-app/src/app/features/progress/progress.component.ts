import { Component, OnInit, inject, signal, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ScreenHdrComponent } from '../../shared/components/screen-hdr/screen-hdr.component';
import { IconsComponent } from '../../shared/components/icons/icons.component';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { WordsApiService } from '../../core/api/words.api';
import { CustomerService } from '../../core/services/customer.service';

interface Stats {
  total: number;
  learned: number;
  dueToday: number;
  streak: number;
  weeklyActivity: number[];
}

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, ScreenHdrComponent, IconsComponent, BottomNavComponent],
  template: `
    <div class="screen">
      <app-screen-hdr title="My Progress" [showBack]="true" (back)="navigate('/home')">
        <button class="hdr-btn" (click)="navigate('/settings')">
          <app-icon name="settings" [size]="20"></app-icon>
        </button>
      </app-screen-hdr>

      <div class="screen-content" style="padding-top:20px">
        <!-- Ring -->
        <div class="ring-card card anim-scale-in">
          <svg width="172" height="172" viewBox="0 0 172 172">
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#2AABEE"/>
                <stop offset="100%" stop-color="#10B981"/>
              </linearGradient>
            </defs>
            <circle cx="86" cy="86" r="72" fill="none" stroke="var(--border)" stroke-width="14"/>
            <circle cx="86" cy="86" r="72" fill="none" stroke="url(#ringGrad)" stroke-width="14"
              stroke-linecap="round"
              [attr.stroke-dasharray]="circumference"
              [attr.stroke-dashoffset]="dashOffset()"
              transform="rotate(-90 86 86)"
              style="transition: stroke-dashoffset 1.4s ease"/>
          </svg>
          <div class="ring-center">
            <span class="ring-pct">{{ completedPct() }}%</span>
            <span class="ring-label">completed</span>
          </div>
        </div>

        <!-- Metrics -->
        <div class="metrics-grid anim-slide-up d2">
          <div class="metric-card card">
            <div class="metric-header">
              <app-icon name="book" [size]="16" class="icon-blue"></app-icon>
              <span class="metric-label">Words Learned</span>
            </div>
            <span class="metric-num blue">{{ stats.learned }}</span>
          </div>
          <div class="metric-card card">
            <div class="metric-header">
              <app-icon name="flame" [size]="16" class="icon-orange"></app-icon>
              <span class="metric-label">Streak Days</span>
            </div>
            <span class="metric-num orange">{{ stats.streak }}</span>
          </div>
          <div class="metric-card card" style="grid-column: span 2">
            <div class="metric-header">
              <app-icon name="clock" [size]="16" class="icon-yellow"></app-icon>
              <span class="metric-label">Due Today</span>
            </div>
            <span class="metric-num yellow">{{ stats.dueToday }}</span>
          </div>
        </div>

        <!-- Weekly bar chart -->
        <div class="weekly-card card anim-slide-up d3">
          <h4 class="weekly-title">This Week</h4>
          <div class="bars">
            <div class="bar-col" *ngFor="let day of weekDays; let i = index">
              <div class="bar-wrap">
                <div class="bar" [class.weekend]="i === 0 || i === 6"
                     [style.height.px]="barHeight(i)"></div>
              </div>
              <span class="bar-label">{{ day }}</span>
            </div>
          </div>
        </div>

        <!-- CTAs -->
        <div class="ctas anim-slide-up d4">
          <button class="btn btn-primary btn-full" (click)="navigate('/repeat')">Repeat Now</button>
          <button class="btn btn-secondary btn-full" (click)="navigate('/words')">Browse Learned Words</button>
        </div>
      </div>
    </div>

    <app-bottom-nav></app-bottom-nav>
  `,
  styles: [`
    .screen { padding-bottom: calc(var(--nav-h) + 16px); }
    .hdr-btn {
      width: 36px; height: 36px; border-radius: 50%; background: var(--bg);
      border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: var(--text-2);
    }
    .screen-content { padding: 16px; display: flex; flex-direction: column; gap: 14px; }

    .ring-card {
      display: flex; flex-direction: column; align-items: center;
      padding: 28px; position: relative; gap: 0;
    }
    .ring-center {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      text-align: center; pointer-events: none;
    }
    .ring-pct { font-size: 34px; font-weight: 800; color: var(--text); display: block; }
    .ring-label { font-size: 12px; color: var(--text-2); }

    .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .metric-card { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
    .metric-header { display: flex; align-items: center; gap: 6px; }
    .metric-label { font-size: 13px; color: var(--text-2); font-weight: 500; }
    .metric-num   { font-size: 32px; font-weight: 800; line-height: 1; }
    .metric-num.blue   { color: #2AABEE; }
    .metric-num.orange { color: #F59E0B; }
    .metric-num.yellow { color: #D97706; }
    .icon-blue   { color: #2AABEE; }
    .icon-orange { color: #F59E0B; }
    .icon-yellow { color: #D97706; }

    .weekly-card { padding: 18px; }
    .weekly-title { font-size: 14px; font-weight: 700; margin-bottom: 16px; }
    .bars { display: flex; gap: 6px; height: 80px; align-items: flex-end; }
    .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .bar-wrap { flex: 1; display: flex; align-items: flex-end; width: 100%; }
    .bar {
      width: 100%; border-radius: 4px 4px 0 0;
      background: linear-gradient(135deg, #2AABEE, #1A96D9);
      min-height: 4px; transition: height 0.5s ease;
    }
    .bar.weekend { background: #E5E7EB; }
    .bar-label { font-size: 11px; color: var(--text-3); font-weight: 600; }

    .ctas { display: flex; flex-direction: column; gap: 10px; }
  `]
})
export class ProgressComponent implements OnInit {
  private router   = inject(Router);
  private wordsApi = inject(WordsApiService);
  private customer = inject(CustomerService);

  readonly circumference = 2 * Math.PI * 72;

  weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  stats: Stats = { total: 0, learned: 0, dueToday: 0, streak: 0, weeklyActivity: [0,0,0,0,0,0,0] };

  completedPct = signal(0);
  dashOffset   = signal(this.circumference);

  ngOnInit() {
    this.customer.load().subscribe(c => {
      this.stats.streak = c.streak ?? 0;
      this.wordsApi.getWordCount(c.id).subscribe(s => {
        this.stats = { ...this.stats, ...s, weeklyActivity: this.stats.weeklyActivity };
        const pct = s.total > 0 ? Math.round((s.learned / s.total) * 100) : 0;
        setTimeout(() => {
          this.completedPct.set(pct);
          this.dashOffset.set(this.circumference * (1 - pct / 100));
        }, 200);
      });
    });
  }

  barHeight(i: number): number {
    const activity = this.stats.weeklyActivity ?? [];
    const max = Math.max(...activity, 1);
    return Math.round(((activity[i] ?? 0) / max) * 72);
  }

  navigate(path: string) { this.router.navigate([path]); }
}
