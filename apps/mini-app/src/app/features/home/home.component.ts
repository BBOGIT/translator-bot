import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TelegramService } from '../../core/services/telegram.service';
import { CustomerService } from '../../core/services/customer.service';
import { WordsApiService } from '../../core/api/words.api';
import { IconsComponent } from '../../shared/components/icons/icons.component';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

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
            <span class="streak-num">{{ streak }}</span>
            <span class="streak-label">day streak</span>
          </div>
        </div>
        <div class="stats-bar">
          <div class="stat-col">
            <span class="stat-num">{{ stats.total }}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="divider"></div>
          <div class="stat-col">
            <span class="stat-num">{{ stats.learned }}</span>
            <span class="stat-label">Learned</span>
          </div>
          <div class="divider"></div>
          <div class="stat-col">
            <span class="stat-num">{{ stats.dueToday }}</span>
            <span class="stat-label">Due Today</span>
          </div>
        </div>
      </div>

      <!-- Action Cards -->
      <div class="screen-content">
        <div class="action-cards">
          <div class="action-card anim-slide-up d2" (click)="navigate('/learn')" [class.pressed]="pressed === 'learn'" (touchstart)="pressed='learn'" (touchend)="pressed=''">
            <div class="card-icon blue">
              <app-icon name="book" [size]="22" style="color:#fff"></app-icon>
            </div>
            <div class="card-body">
              <span class="card-title">Learn Words</span>
              <span class="card-sub">Add & translate new words</span>
            </div>
            <app-icon name="chev-r" [size]="18" style="color:var(--text-3)"></app-icon>
          </div>

          <div class="action-card anim-slide-up d3" (click)="navigate('/repeat')" [class.pressed]="pressed === 'repeat'" (touchstart)="pressed='repeat'" (touchend)="pressed=''">
            <div class="card-icon purple">
              <app-icon name="repeat" [size]="22" style="color:#fff"></app-icon>
            </div>
            <div class="card-body">
              <span class="card-title">Repeat Words</span>
              <span class="card-sub">Spaced repetition practice</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <span class="badge badge-primary" *ngIf="stats.dueToday > 0">{{ stats.dueToday }}</span>
              <app-icon name="chev-r" [size]="18" style="color:var(--text-3)"></app-icon>
            </div>
          </div>

          <div class="action-card anim-slide-up d4" (click)="navigate('/progress')" [class.pressed]="pressed === 'progress'" (touchstart)="pressed='progress'" (touchend)="pressed=''">
            <div class="card-icon green">
              <app-icon name="bar-chart" [size]="22" style="color:#fff"></app-icon>
            </div>
            <div class="card-body">
              <span class="card-title">My Progress</span>
              <span class="card-sub">Stats & achievements</span>
            </div>
            <app-icon name="chev-r" [size]="18" style="color:var(--text-3)"></app-icon>
          </div>

          <div class="action-card anim-slide-up d5" (click)="navigate('/practice')" [class.pressed]="pressed === 'practice'" (touchstart)="pressed='practice'" (touchend)="pressed=''">
            <div class="card-icon orange">
              <app-icon name="flame" [size]="22" style="color:#fff"></app-icon>
            </div>
            <div class="card-body">
              <span class="card-title">Practice Words</span>
              <span class="card-sub">All words in your learning queue</span>
            </div>
            <app-icon name="chev-r" [size]="18" style="color:var(--text-3)"></app-icon>
          </div>
        </div>

        <button class="btn btn-outline btn-full anim-slide-up d5" (click)="navigate('/words')">
          <app-icon name="book-open" [size]="18"></app-icon>
          Browse Learned Words
        </button>
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
    .streak-num  { color: #fff; font-size: 15px; font-weight: 800; }
    .streak-label { color: rgba(255,255,255,0.8); font-size: 12px; }
    .stats-bar {
      background: rgba(255,255,255,0.15); border-radius: 14px;
      display: flex; padding: 12px 0;
    }
    .stat-col { flex: 1; text-align: center; }
    .stat-num { color: #fff; font-size: 24px; font-weight: 800; display: block; }
    .stat-label { color: rgba(255,255,255,0.75); font-size: 12px; }
    .divider { width: 1px; background: rgba(255,255,255,0.28); align-self: stretch; }

    .screen-content { padding: 16px; }
    .action-cards { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
    .action-card {
      background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow-sm);
      padding: 16px; display: flex; align-items: center; gap: 14px;
      cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .action-card.pressed { transform: scale(0.975); box-shadow: none; }
    .card-icon {
      width: 46px; height: 46px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .card-icon.blue   { background: linear-gradient(135deg, #2AABEE, #1A96D9); }
    .card-icon.purple { background: linear-gradient(135deg, #8B5CF6, #6D28D9); }
    .card-icon.green  { background: linear-gradient(135deg, #10B981, #059669); }
    .card-icon.orange { background: linear-gradient(135deg, #F59E0B, #D97706); }
    .card-body { flex: 1; }
    .card-title { font-size: 15px; font-weight: 700; color: var(--text); display: block; }
    .card-sub   { font-size: 12.5px; color: var(--text-2); margin-top: 2px; display: block; }
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
  pressed = '';

  ngOnInit() {
    this.customer.load().subscribe(c => {
      this.streak = c.streak ?? 0;
      const id = c.id;
      this.wordsApi.getWordCount(id).subscribe(s => {
        this.stats = s;
      });
    });
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }
}
