import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
  imports: [CommonModule, IconsComponent, BottomNavComponent],
  template: `
    <div class="screen">
      <!-- Hero -->
      <div class="hero anim-slide-up">
        <div class="hero-top">
          <div class="greeting">
            <span class="hello">Good morning, {{ firstName }} 👋</span>
          </div>
          <div class="streak-badge">
            <app-icon name="flame" [size]="16" style="color:#FBBF24"></app-icon>
            <span class="streak-num">{{ displayStreak }}</span>
            <span class="streak-label">day streak</span>
          </div>
        </div>
        <div class="stats-bar">
          <div class="stat-col">
            <span class="stat-num">{{ displayTotal }}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="divider"></div>
          <div class="stat-col">
            <span class="stat-num">{{ displayLearned }}</span>
            <span class="stat-label">Learned</span>
          </div>
          <div class="divider"></div>
          <div class="stat-col">
            <span class="stat-num">{{ displayDueToday }}</span>
            <span class="stat-label">Due Today</span>
          </div>
        </div>
      </div>

      <div class="screen-content">
        <!-- Main CTA — shown after data loads -->
        <ng-container *ngIf="loaded">
          <div class="cta-card card anim-slide-up d2" *ngIf="stats.dueToday > 0">
            <div class="cta-body">
              <span class="cta-title">Words waiting for review</span>
              <span class="cta-sub">{{ stats.dueToday }} due today</span>
            </div>
            <button class="btn btn-primary" (click)="navigate('/repeat')">Repeat Now</button>
          </div>

          <div class="cta-card card anim-slide-up d2" *ngIf="stats.dueToday === 0 && stats.total === 0">
            <div class="cta-body">
              <span class="cta-title">Start your journey</span>
              <span class="cta-sub">Add your first word</span>
            </div>
            <button class="btn btn-primary" (click)="navigate('/learn')">Add Word</button>
          </div>

          <div class="cta-card card anim-slide-up d2" *ngIf="stats.dueToday === 0 && stats.total > 0">
            <div class="cta-body">
              <span class="cta-title">All caught up! 🎉</span>
              <span class="cta-sub">Keep learning new words</span>
            </div>
            <button class="btn btn-primary" (click)="navigate('/learn')">Learn More</button>
          </div>
        </ng-container>

        <div class="cta-skeleton card anim-fade-in" *ngIf="!loaded"></div>

        <!-- Secondary quick links -->
        <div class="quick-links anim-slide-up d3">
          <button class="quick-link" (click)="navigate('/practice')">
            <app-icon name="flame" [size]="18" style="color:var(--warning)"></app-icon>
            <span>Practice All</span>
          </button>
          <button class="quick-link" (click)="navigate('/words')">
            <app-icon name="book-open" [size]="18" style="color:var(--primary)"></app-icon>
            <span>Browse Words</span>
          </button>
        </div>
      </div>
    </div>

    <app-bottom-nav></app-bottom-nav>
  `,
  styles: [`
    .screen { padding-bottom: calc(var(--nav-h) + 16px); }

    .hero {
      background: linear-gradient(160deg, #2AABEE 0%, #1A96D9 55%, #1578A8 100%);
      padding: 20px 20px 24px;
    }
    .hero-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
    .hello { color: #fff; font-size: 27px; font-weight: 800; line-height: 1.2; display: block; }
    .streak-badge {
      display: flex; align-items: center; gap: 5px;
      background: rgba(255,255,255,0.16); border-radius: 20px;
      padding: 6px 12px; flex-shrink: 0;
    }
    .streak-num   { color: #fff; font-size: 15px; font-weight: 800; }
    .streak-label { color: rgba(255,255,255,0.8); font-size: 12px; }
    .stats-bar {
      background: rgba(255,255,255,0.15); border-radius: 14px;
      display: flex; padding: 12px 0;
    }
    .stat-col   { flex: 1; text-align: center; }
    .stat-num   { color: #fff; font-size: 24px; font-weight: 800; display: block; }
    .stat-label { color: rgba(255,255,255,0.75); font-size: 12px; }
    .divider    { width: 1px; background: rgba(255,255,255,0.28); align-self: stretch; }

    .screen-content { padding: 16px; display: flex; flex-direction: column; gap: 12px; }

    .cta-card {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 16px; gap: 12px;
    }
    .cta-body   { flex: 1; }
    .cta-title  { font-size: 15px; font-weight: 700; color: var(--text); display: block; }
    .cta-sub    { font-size: 13px; color: var(--text-2); margin-top: 3px; display: block; }

    .cta-skeleton {
      height: 76px; border-radius: var(--radius);
      background: linear-gradient(90deg, var(--border) 25%, var(--bg) 50%, var(--border) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }

    .quick-links {
      display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
    }
    .quick-link {
      background: var(--surface); border: none; border-radius: var(--radius-sm);
      box-shadow: var(--shadow-sm); padding: 14px 12px;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      font-size: 14px; font-weight: 600; color: var(--text); cursor: pointer;
      font-family: inherit; transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .quick-link:active { transform: scale(0.97); box-shadow: none; }
  `]
})
export class HomeComponent implements OnInit {
  private router   = inject(Router);
  private telegram = inject(TelegramService);
  private customer = inject(CustomerService);
  private wordsApi = inject(WordsApiService);

  firstName = this.telegram.user?.first_name ?? 'there';
  streak = 0;
  stats: Stats = { total: 0, learned: 0, dueToday: 0 };
  loaded = false;

  displayTotal    = 0;
  displayLearned  = 0;
  displayDueToday = 0;
  displayStreak   = 0;

  ngOnInit() {
    this.customer.load().subscribe(c => {
      this.streak = c.streak ?? 0;
      this.wordsApi.getWordCount(c.id).subscribe(s => {
        this.stats = s;
        this.loaded = true;
        animateCount(c.streak ?? 0, 800,  v => this.displayStreak   = v);
        animateCount(s.total,       900,  v => this.displayTotal    = v);
        animateCount(s.learned,     900,  v => this.displayLearned  = v);
        animateCount(s.dueToday,    900,  v => this.displayDueToday = v);
      });
    });
  }

  navigate(path: string) { this.router.navigate([path]); }
}
