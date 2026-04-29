import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TelegramService } from '../../core/services/telegram.service';
import { CustomerService } from '../../core/services/customer.service';
import { WordsApiService } from '../../core/api/words.api';
import { IconsComponent } from '../../shared/components/icons/icons.component';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { animateCount } from '../../shared/utils/count-up';

interface Stats {
  total: number;
  learned: number;
  dueToday: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TranslateModule, IconsComponent, BottomNavComponent],
  template: `
    <div class="screen">
      <!-- Hero -->
      <div class="hero anim-slide-up">
        <div class="hero-inner">
          <div class="hero-top">
            <div class="greeting">
              <span class="greeting-time">{{ greeting | translate }},</span>
              <span class="greeting-name">{{ firstName }} 👋</span>
            </div>
            <div class="streak-badge">
              <app-icon name="flame" [size]="16" style="color:#FBBF24"></app-icon>
              <span class="streak-num">{{ displayStreak }}</span>
              <span class="streak-label">{{ 'home.streak' | translate }}</span>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-tile">
              <div class="stat-icon-wrap stat-icon-blue">
                <app-icon name="book" [size]="14" style="color:#fff"></app-icon>
              </div>
              <span class="stat-num">{{ displayTotal }}</span>
              <span class="stat-label">{{ 'home.total' | translate }}</span>
            </div>
            <div class="stat-tile">
              <div class="stat-icon-wrap stat-icon-green">
                <app-icon name="check" [size]="14" style="color:#fff"></app-icon>
              </div>
              <span class="stat-num">{{ displayLearned }}</span>
              <span class="stat-label">{{ 'home.learned' | translate }}</span>
            </div>
            <div class="stat-tile" [class.stat-tile-warn]="stats.dueToday > 0">
              <div class="stat-icon-wrap"
                   [class.stat-icon-orange]="stats.dueToday > 0"
                   [class.stat-icon-blue]="stats.dueToday === 0">
                <app-icon name="clock" [size]="14" style="color:#fff"></app-icon>
              </div>
              <span class="stat-num">{{ displayDueToday }}</span>
              <span class="stat-label">{{ 'home.due_today' | translate }}</span>
            </div>
          </div>

          <div class="progress-row" *ngIf="loaded && stats.total > 0">
            <div class="progress-track">
              <div class="progress-fill" [style.width.%]="displayProgressPct"></div>
            </div>
            <span class="progress-label">{{ displayProgressPct }}{{ 'home.learned_pct' | translate }}</span>
          </div>
        </div>

      </div>

      <div class="screen-content">
        <!-- Main CTA -->
        <ng-container *ngIf="loaded">
          <div class="cta-card card anim-slide-up d2" *ngIf="stats.dueToday > 0"
               style="border-left-color: var(--warning)">
            <div class="cta-body">
              <span class="cta-title">{{ 'home.repeat_cta' | translate }}</span>
              <span class="cta-sub">{{ stats.dueToday }} {{ 'home.due_today' | translate }}</span>
            </div>
            <div class="cta-deco">🔁</div>
            <button class="btn btn-primary" (click)="navigate('/repeat')">{{ 'home.repeat_btn' | translate }}</button>
          </div>

          <div class="cta-card card anim-slide-up d2" *ngIf="stats.dueToday === 0 && stats.total === 0"
               style="border-left-color: var(--primary)">
            <div class="cta-body">
              <span class="cta-title">{{ 'home.empty_cta' | translate }}</span>
              <span class="cta-sub">{{ 'home.empty_sub' | translate }}</span>
            </div>
            <div class="cta-deco">✨</div>
            <button class="btn btn-primary" (click)="navigate('/learn')">{{ 'home.add_btn' | translate }}</button>
          </div>

          <div class="cta-card card anim-slide-up d2" *ngIf="stats.dueToday === 0 && stats.total > 0"
               style="border-left-color: var(--success)">
            <div class="cta-body">
              <span class="cta-title">{{ 'home.caught_up' | translate }}</span>
              <span class="cta-sub">{{ 'home.caught_up_sub' | translate }}</span>
            </div>
            <div class="cta-deco">🎯</div>
            <button class="btn btn-primary" (click)="navigate('/learn')">{{ 'home.learn_more_btn' | translate }}</button>
          </div>
        </ng-container>

        <div class="cta-skeleton card anim-fade-in" *ngIf="!loaded"></div>

        <!-- Quick links -->
        <div class="quick-links anim-slide-up d3">
          <button class="quick-link" (click)="navigate('/practice')">
            <div class="ql-icon-wrap ql-icon-orange">
              <app-icon name="flame" [size]="20" style="color:#fff"></app-icon>
            </div>
            <span>{{ 'home.practice_all' | translate }}</span>
          </button>
          <button class="quick-link" (click)="navigate('/words')">
            <div class="ql-icon-wrap ql-icon-blue">
              <app-icon name="book-open" [size]="20" style="color:#fff"></app-icon>
            </div>
            <span>{{ 'home.browse' | translate }}</span>
          </button>
        </div>
      </div>
    </div>

    <app-bottom-nav></app-bottom-nav>
  `,
  styles: [`
    .screen { padding-bottom: calc(var(--nav-h) + 16px); }

    /* ── Hero ─────────────────────────────── */
    .hero {
      background: linear-gradient(160deg, #2AABEE 0%, #1A96D9 55%, #1578A8 100%);
      padding: max(20px, env(safe-area-inset-top)) 20px 28px;
      border-bottom-left-radius: 28px;
      border-bottom-right-radius: 28px;
      box-shadow: 0 8px 24px rgba(26,150,217,0.28);
    }
    .hero-inner { }
    .hero-top {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 20px;
    }
    .greeting-time { color: rgba(255,255,255,0.72); font-size: 15px; font-weight: 500; display: block; }
    .greeting-name { color: #fff; font-size: 30px; font-weight: 800; line-height: 1.15; display: block; }

    .streak-badge {
      display: flex; align-items: center; gap: 5px;
      background: rgba(255,255,255,0.18);
      border: 1px solid rgba(255,255,255,0.3);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border-radius: 20px; padding: 6px 12px; flex-shrink: 0;
    }
    .streak-num   { color: #fff; font-size: 15px; font-weight: 800; }
    .streak-label { color: rgba(255,255,255,0.8); font-size: 12px; }

    /* Stats grid */
    .stats-grid {
      display: grid; grid-template-columns: 1fr 1fr 1fr;
      gap: 10px; margin-bottom: 16px;
    }
    .stat-tile {
      background: rgba(255,255,255,0.15);
      border-radius: 14px; padding: 12px 10px 10px;
      display: flex; flex-direction: column; align-items: center; gap: 5px;
      transition: background 0.2s;
    }
    .stat-tile-warn { background: rgba(245,158,11,0.28); }
    .stat-icon-wrap {
      width: 28px; height: 28px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
    }
    .stat-icon-blue   { background: rgba(255,255,255,0.28); }
    .stat-icon-green  { background: #22C55E; }
    .stat-icon-orange { background: #F59E0B; }
    .stat-num   { color: #fff; font-size: 22px; font-weight: 800; line-height: 1; }
    .stat-label { color: rgba(255,255,255,0.72); font-size: 11px; }

    /* Progress bar */
    .progress-row { display: flex; align-items: center; gap: 10px; }
    .progress-track {
      flex: 1; height: 5px; background: rgba(255,255,255,0.25);
      border-radius: 10px; overflow: hidden;
    }
    .progress-fill {
      height: 100%; background: #fff; border-radius: 10px;
      transition: width 0.9s cubic-bezier(0.34, 1.36, 0.64, 1);
    }
    .progress-label { color: rgba(255,255,255,0.8); font-size: 11px; white-space: nowrap; }

    /* ── Content ──────────────────────────── */
    .screen-content { padding: 16px; display: flex; flex-direction: column; gap: 12px; }

    .cta-card {
      display: flex; align-items: center; padding: 18px 16px; gap: 12px;
      border-left: 4px solid var(--primary);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .cta-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
    .cta-body  { flex: 1; }
    .cta-title { font-size: 16px; font-weight: 700; color: var(--text); display: block; }
    .cta-sub   { font-size: 13px; color: var(--text-2); margin-top: 4px; display: block; }
    .cta-deco  { font-size: 28px; line-height: 1; flex-shrink: 0; }

    .cta-skeleton {
      height: 80px; border-radius: var(--radius);
      background: linear-gradient(90deg, var(--border) 25%, var(--bg) 50%, var(--border) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }

    /* ── Quick links ──────────────────────── */
    .quick-links { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .quick-link {
      background: var(--surface); border: none; border-radius: var(--radius-sm);
      box-shadow: var(--shadow-sm); padding: 16px 12px; min-height: 88px;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
      font-size: 13px; font-weight: 600; color: var(--text); cursor: pointer;
      font-family: inherit; transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .quick-link:hover  { transform: translateY(-2px); box-shadow: var(--shadow); }
    .quick-link:active { transform: scale(0.97); box-shadow: none; }
    .ql-icon-wrap {
      width: 42px; height: 42px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .ql-icon-orange { background: var(--warning); }
    .ql-icon-blue   { background: var(--primary); }
  `]
})
export class HomeComponent implements OnInit {
  private router   = inject(Router);
  private telegram = inject(TelegramService);
  private customer = inject(CustomerService);
  private wordsApi = inject(WordsApiService);

  firstName = this.telegram.user?.first_name ?? 'there';
  greeting = this.getGreeting();
  stats: Stats = { total: 0, learned: 0, dueToday: 0 };
  loaded = false;

  displayTotal       = 0;
  displayLearned     = 0;
  displayDueToday    = 0;
  displayStreak      = 0;
  displayProgressPct = 0;

  ngOnInit() {
    this.customer.load().subscribe(c => {
      this.wordsApi.getWordCount(c.id).subscribe(s => {
        this.stats = s;
        this.loaded = true;
        const pct = s.total > 0 ? Math.round((s.learned / s.total) * 100) : 0;
        animateCount(c.streak ?? 0, 800, v => this.displayStreak      = v);
        animateCount(s.total,       900, v => this.displayTotal       = v);
        animateCount(s.learned,     900, v => this.displayLearned     = v);
        animateCount(s.dueToday,    900, v => this.displayDueToday    = v);
        animateCount(pct,           900, v => this.displayProgressPct = v);
      });
    });
  }

  navigate(path: string) { this.router.navigate([path]); }

  private getGreeting(): string {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'home.greeting_morning';
    if (h >= 12 && h < 17) return 'home.greeting_afternoon';
    if (h >= 17 && h < 22) return 'home.greeting_evening';
    return 'home.greeting_night';
  }
}
