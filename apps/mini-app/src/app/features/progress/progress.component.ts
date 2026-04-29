import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { ScreenHdrComponent } from '../../shared/components/screen-hdr/screen-hdr.component';
import { IconsComponent } from '../../shared/components/icons/icons.component';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { WordsApiService, WordStats, RepeatLevel } from '../../core/api/words.api';
import { CustomerService } from '../../core/services/customer.service';
import { animateCount } from '../../shared/utils/count-up';

interface Stats extends WordStats {
  streak: number;
}

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, TranslateModule, ScreenHdrComponent, IconsComponent, BottomNavComponent],
  template: `
    <div class="screen">
      <app-screen-hdr [title]="'progress.header' | translate" [showBack]="true" (back)="navigate('/home')"></app-screen-hdr>

      <div class="screen-content">

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
            <span class="ring-pct">{{ displayPct() }}%</span>
            <span class="ring-label">{{ 'progress.completed' | translate }}</span>
          </div>
        </div>

        <!-- 4-metric grid -->
        <div class="metrics-grid anim-slide-up d2">
          <div class="metric-card card">
            <div class="metric-header">
              <app-icon name="book" [size]="15" class="icon-blue"></app-icon>
              <span class="metric-label">{{ 'progress.learned' | translate }}</span>
            </div>
            <span class="metric-num blue">{{ displayLearned() }}</span>
          </div>
          <div class="metric-card card">
            <div class="metric-header">
              <app-icon name="repeat" [size]="15" class="icon-purple"></app-icon>
              <span class="metric-label">{{ 'progress.in_progress' | translate }}</span>
            </div>
            <span class="metric-num purple">{{ displayInProgress() }}</span>
          </div>
          <div class="metric-card card">
            <div class="metric-header">
              <app-icon name="clock" [size]="15" class="icon-orange"></app-icon>
              <span class="metric-label">{{ 'progress.due_today' | translate }}</span>
            </div>
            <span class="metric-num orange">{{ displayDueToday() }}</span>
          </div>
          <div class="metric-card card">
            <div class="metric-header">
              <app-icon name="flame" [size]="15" class="icon-amber"></app-icon>
              <span class="metric-label">{{ 'progress.streak' | translate }}</span>
            </div>
            <span class="metric-num amber">{{ displayStreak() }}</span>
          </div>
        </div>

        <!-- Activity -->
        <div class="activity-card card anim-slide-up d3">
          <h4 class="section-title">{{ 'progress.words_added' | translate }}</h4>
          <div class="activity-row">
            <div class="activity-col">
              <span class="activity-num">{{ displayAddedToday() }}</span>
              <span class="activity-label">{{ 'progress.today' | translate }}</span>
            </div>
            <div class="act-divider"></div>
            <div class="activity-col">
              <span class="activity-num">{{ displayAddedWeek() }}</span>
              <span class="activity-label">{{ 'progress.this_week' | translate }}</span>
            </div>
            <div class="act-divider"></div>
            <div class="activity-col">
              <span class="activity-num">{{ displayAddedMonth() }}</span>
              <span class="activity-label">{{ 'progress.this_month' | translate }}</span>
            </div>
          </div>
        </div>

        <!-- Repetition Journey -->
        <div class="journey-card card anim-slide-up d3" *ngIf="visibleLevels().length > 0">
          <h4 class="section-title">{{ 'progress.repetition_journey' | translate }}</h4>
          <div class="journey-levels">
            <div class="level-row" *ngFor="let lvl of visibleLevels()">
              <div class="level-meta">
                <span class="level-name">{{ levelLabels[lvl.level] | translate }}</span>
                <span class="level-count" [class.zero]="lvl.count === 0">
                  {{ lvl.count }} {{ (lvl.count === 1 ? 'progress.word' : 'progress.words') | translate }}
                </span>
              </div>
              <div class="level-track">
                <div class="level-fill"
                     [style.width.%]="journeyReady() ? levelBarPct(lvl.count) : 0"
                     [class.empty]="lvl.count === 0"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Meta row -->
        <div class="meta-row anim-slide-up d4" *ngIf="stats.joinedDate">
          <span class="meta-item">
            <app-icon name="clock" [size]="12" style="color:var(--text-3)"></app-icon>
            {{ 'progress.learning_for' | translate }} {{ learningDays() }}
          </span>
          <span class="meta-dot">·</span>
          <span class="meta-item">{{ 'progress.last_active' | translate }} {{ relativeDate(stats.lastActivity) }}</span>
        </div>

        <!-- CTAs -->
        <div class="ctas anim-slide-up d4">
          <button class="btn btn-primary btn-full" (click)="navigate('/repeat')">{{ 'progress.repeat_now' | translate }}</button>
          <button class="btn btn-secondary btn-full" (click)="navigate('/words')">{{ 'progress.browse_learned' | translate }}</button>
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
    .screen-content { padding: 16px; display: flex; flex-direction: column; gap: 12px; padding-top: 20px; }

    /* Ring */
    .ring-card {
      display: flex; flex-direction: column; align-items: center;
      padding: 28px; position: relative; gap: 0;
    }
    .ring-center {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      text-align: center; pointer-events: none;
    }
    .ring-pct   { font-size: 34px; font-weight: 800; color: var(--text); display: block; }
    .ring-label { font-size: 12px; color: var(--text-2); }

    /* 4-metric grid */
    .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .metric-card  { padding: 14px 16px; display: flex; flex-direction: column; gap: 7px; }
    .metric-header { display: flex; align-items: center; gap: 5px; }
    .metric-label { font-size: 12px; color: var(--text-2); font-weight: 500; }
    .metric-num   { font-size: 30px; font-weight: 800; line-height: 1; }
    .metric-num.blue   { color: #2AABEE; }
    .metric-num.purple { color: #8B5CF6; }
    .metric-num.orange { color: #F59E0B; }
    .metric-num.amber  { color: #D97706; }
    .icon-blue   { color: #2AABEE; }
    .icon-purple { color: #8B5CF6; }
    .icon-orange { color: #F59E0B; }
    .icon-amber  { color: #D97706; }

    /* Activity */
    .activity-card { padding: 16px 18px; }
    .section-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 14px; }
    .activity-row { display: flex; align-items: stretch; }
    .activity-col { flex: 1; text-align: center; padding: 4px 0; }
    .activity-num   { font-size: 26px; font-weight: 800; color: var(--text); display: block; }
    .activity-label { font-size: 11px; color: var(--text-2); font-weight: 500; margin-top: 2px; display: block; }
    .act-divider { width: 1px; background: var(--border); margin: 2px 0; }

    /* Repetition Journey */
    .journey-card { padding: 16px 18px; }
    .journey-levels { display: flex; flex-direction: column; gap: 11px; }
    .level-row { display: flex; flex-direction: column; gap: 5px; }
    .level-meta { display: flex; justify-content: space-between; align-items: center; }
    .level-name  { font-size: 12px; color: var(--text-2); font-weight: 600; }
    .level-count { font-size: 12px; color: var(--text); font-weight: 700; }
    .level-count.zero { color: var(--text-3); }
    .level-track { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
    .level-fill {
      height: 100%; border-radius: 3px;
      background: linear-gradient(90deg, #2AABEE, #10B981);
      transition: width 0.9s cubic-bezier(0.34, 1.1, 0.64, 1);
    }
    .level-fill.empty { background: var(--border); }

    /* Meta row */
    .meta-row {
      display: flex; align-items: center; justify-content: center; gap: 8px; padding: 2px 0;
    }
    .meta-item { font-size: 12px; color: var(--text-3); display: flex; align-items: center; gap: 4px; }
    .meta-dot  { color: var(--border); font-size: 14px; }

    /* CTAs */
    .ctas { display: flex; flex-direction: column; gap: 10px; }
  `]
})
export class ProgressComponent implements OnInit {
  private router    = inject(Router);
  private wordsApi  = inject(WordsApiService);
  private customer  = inject(CustomerService);
  private translate = inject(TranslateService);

  readonly circumference = 2 * Math.PI * 72;

  readonly levelLabels: Record<number, string> = {
    1: 'progress.level_1',
    2: 'progress.level_2',
    3: 'progress.level_3',
    4: 'progress.level_4',
    5: 'progress.level_5',
    6: 'progress.level_6',
  };

  stats: Stats = {
    total: 0, learned: 0, inProgress: 0, dueToday: 0, streak: 0,
    addedToday: 0, addedThisWeek: 0, addedThisMonth: 0,
    avgRepeatCount: 0, repeatLevels: [],
    lastActivity: null, joinedDate: null,
  };

  completedPct    = signal(0);
  dashOffset      = signal(this.circumference);
  displayPct      = signal(0);
  displayLearned  = signal(0);
  displayInProgress = signal(0);
  displayStreak   = signal(0);
  displayDueToday = signal(0);
  displayAddedToday  = signal(0);
  displayAddedWeek   = signal(0);
  displayAddedMonth  = signal(0);
  journeyReady    = signal(false);

  ngOnInit() {
    this.customer.load().subscribe(c => {
      this.stats.streak = c.streak ?? 0;
      this.wordsApi.getWordCount(c.id).subscribe(s => {
        this.stats = { ...s, streak: this.stats.streak };
        const pct = s.total > 0 ? Math.round((s.learned / s.total) * 100) : 0;
        setTimeout(() => {
          this.completedPct.set(pct);
          this.dashOffset.set(this.circumference * (1 - pct / 100));
          animateCount(pct,              1300, v => this.displayPct.set(v));
          animateCount(s.learned,         900, v => this.displayLearned.set(v));
          animateCount(s.inProgress,      900, v => this.displayInProgress.set(v));
          animateCount(this.stats.streak, 900, v => this.displayStreak.set(v));
          animateCount(s.dueToday,        900, v => this.displayDueToday.set(v));
          animateCount(s.addedToday,      700, v => this.displayAddedToday.set(v));
          animateCount(s.addedThisWeek,   800, v => this.displayAddedWeek.set(v));
          animateCount(s.addedThisMonth,  900, v => this.displayAddedMonth.set(v));
        }, 200);
        setTimeout(() => this.journeyReady.set(true), 400);
      });
    });
  }

  visibleLevels(): RepeatLevel[] {
    const lvls = this.stats.repeatLevels;
    if (!lvls?.length) return [];
    const lastIdx = lvls.reduceRight((acc: number, l, i) => acc === -1 && l.count > 0 ? i : acc, -1);
    if (lastIdx === -1) return lvls.slice(0, 1);
    return lvls.slice(0, Math.min(lastIdx + 2, lvls.length));
  }

  levelBarPct(count: number): number {
    const max = Math.max(...(this.stats.repeatLevels?.map(l => l.count) ?? []), 1);
    return Math.round((count / max) * 100);
  }

  learningDays(): string {
    if (!this.stats.joinedDate) return '';
    const days = Math.floor((Date.now() - new Date(this.stats.joinedDate).getTime()) / 86400000);
    const unit = days === 1
      ? this.translate.instant('progress.day')
      : this.translate.instant('progress.days');
    return `${days} ${unit}`;
  }

  relativeDate(iso: string | null): string {
    if (!iso) return '—';
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (diff === 0) return this.translate.instant('progress.today_label');
    if (diff === 1) return this.translate.instant('progress.yesterday_label');
    return `${diff} ${this.translate.instant('progress.days_ago')}`;
  }

  navigate(path: string) { this.router.navigate([path]); }
}
