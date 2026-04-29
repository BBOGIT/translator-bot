import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { WordsActions } from '../../store/words/words.actions';
import { selectRepetitionWords, selectWordsLoading } from '../../store/words/words.selectors';
import { CustomerService } from '../../core/services/customer.service';
import { TelegramService } from '../../core/services/telegram.service';
import { IconsComponent } from '../../shared/components/icons/icons.component';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { ScreenHdrComponent } from '../../shared/components/screen-hdr/screen-hdr.component';
import { ScheduleSheetComponent } from '../../shared/components/schedule-sheet/schedule-sheet.component';
import { Word } from '../../store/models';

@Component({
  selector: 'app-repeat',
  standalone: true,
  imports: [CommonModule, TranslateModule, IconsComponent, BottomNavComponent, ScreenHdrComponent, ScheduleSheetComponent],
  template: `
    <div class="screen">
      <app-screen-hdr [title]="'repeat.header' | translate" [showBack]="true" (back)="goHome()"></app-screen-hdr>

      <!-- Loading -->
      <div class="loading-state" *ngIf="loading$ | async">
        <div class="dots">
          <span></span><span></span><span></span>
        </div>
      </div>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="!(loading$ | async) && words().length === 0">
        <span class="empty-emoji">🎉</span>
        <h3>{{ 'repeat.caught_up' | translate }}</h3>
        <p>{{ 'repeat.no_due' | translate }}</p>
        <button class="btn btn-primary" (click)="goHome()">{{ 'repeat.back_home' | translate }}</button>
        <button class="btn btn-secondary" (click)="navigate('/practice')">{{ 'repeat.practice_all' | translate }}</button>
      </div>

      <!-- Session complete -->
      <div class="session-done anim-scale-in" *ngIf="sessionDone() && words().length > 0">
        <div class="done-circle">
          <app-icon name="check" [size]="40" style="color:#fff"></app-icon>
        </div>
        <h2>{{ 'repeat.session_complete' | translate }}</h2>
        <p>{{ 'repeat.reviewed' | translate:{ count: words().length } }}</p>
        <div class="done-stats">
          <div class="done-stat">
            <span class="done-num success">{{ learnedCount() }}</span>
            <span class="done-label">{{ 'repeat.learned' | translate }}</span>
          </div>
          <div class="done-stat">
            <span class="done-num warning">{{ practiceCount() }}</span>
            <span class="done-label">{{ 'repeat.practice' | translate }}</span>
          </div>
        </div>
        <div class="done-actions">
          <button class="btn btn-primary btn-full" (click)="restart()">{{ 'repeat.practice_again' | translate }}</button>
          <button class="btn btn-secondary btn-full" (click)="scheduleOpen.set(true)">{{ 'repeat.set_schedule' | translate }}</button>
        </div>
      </div>

      <!-- Flashcard -->
      <div class="flashcard-area" *ngIf="!(loading$ | async) && !sessionDone() && words().length > 0">
        <!-- Progress bar -->
        <div class="progress-bar-track" style="margin:0 16px 16px">
          <div class="progress-bar-fill" [style.width.%]="progressPercent()"></div>
        </div>

        <!-- Dots -->
        <div class="progress-dots">
          <span class="dot" *ngFor="let w of words(); let i = index"
            [class.active]="i === currentIndex()"
            [class.learned]="results[i] === 'learned'"
            [class.practice]="results[i] === 'practice'">
          </span>
        </div>

        <!-- Card -->
        <div class="card-wrapper"
             (touchstart)="onTouchStart($event)"
             (touchend)="onTouchEnd($event)">
          <div class="flashcard" [class.flipped]="flipped()" [class.has-media]="hasMedia()" (click)="flip()">
            <!-- Front -->
            <div class="card-face front">
              <span class="lang-tag">English</span>
              <span class="word-big" [style.font-size]="wordFontSize()">{{ currentWord()!.word }}</span>
              <span class="tap-hint">{{ 'repeat.tap_to_reveal' | translate }}</span>
            </div>
            <!-- Back -->
            <div class="card-face back">
              <span class="translation-big" [style.font-size]="translationFontSize()">{{ currentWord()!.translation }}</span>
              <img *ngIf="currentWord()?.imageExample"
                   [src]="mediaUrl(currentWord()!.imageExample!)"
                   class="media-preview"
                   alt="example"
                   (click)="$event.stopPropagation()" />
              <video *ngIf="currentWord()?.videoExample && !currentWord()?.imageExample"
                     [src]="mediaUrl(currentWord()!.videoExample!)"
                     class="media-preview"
                     controls
                     playsinline
                     preload="metadata"
                     (click)="$event.stopPropagation()">
              </video>
              <div class="examples-block" *ngIf="currentWord()?.examples?.length">
                <div class="ex-item" *ngFor="let ex of currentWord()!.examples!.slice(0,2)">
                  <span class="ex-bullet">·</span> {{ ex }}
                </div>
              </div>
              <span class="tap-hint tap-hint-back">{{ 'repeat.tap_to_flip' | translate }}</span>
            </div>
          </div>
        </div>

        <!-- Action buttons (after flip) -->
        <div class="card-actions" *ngIf="flipped()">
          <button class="btn btn-warn" (click)="markResult('practice')">
            {{ 'repeat.need_practice' | translate }}
          </button>
          <button class="btn btn-success" (click)="markResult('learned')">
            {{ 'repeat.learned_btn' | translate }}
          </button>
        </div>
      </div>
    </div>

    <app-bottom-nav></app-bottom-nav>
    <app-schedule-sheet [open]="scheduleOpen()" (closed)="scheduleOpen.set(false)"></app-schedule-sheet>
  `,
  styles: [`
    .screen { padding-bottom: calc(var(--nav-h) + 16px); min-height: 100dvh; }

    .loading-state {
      display: flex; justify-content: center; padding: 60px 0;
      .dots { display: flex; gap: 8px; }
      span {
        width: 10px; height: 10px; border-radius: 50%; background: var(--primary);
        animation: bounce 0.8s ease infinite;
        &:nth-child(2) { animation-delay: 0.15s; }
        &:nth-child(3) { animation-delay: 0.30s; }
      }
    }

    .empty-state {
      text-align: center; padding: 60px 24px; display: flex; flex-direction: column;
      align-items: center; gap: 12px;
      .empty-emoji { font-size: 56px; }
      h3 { font-size: 20px; font-weight: 700; }
      p { color: var(--text-2); }
      .btn { width: 100%; }
    }

    .flashcard-area { padding: 16px; }

    .progress-dots {
      display: flex; justify-content: center; gap: 6px;
      margin-bottom: 20px;
    }
    .dot {
      width: 8px; height: 8px; border-radius: 4px;
      background: var(--border); transition: all 0.3s var(--spring);
      &.active   { width: 22px; background: var(--primary); }
      &.learned  { background: var(--success); }
      &.practice { background: var(--warning); }
    }

    .card-wrapper {
      perspective: 1100px;
      margin-bottom: 20px;
      touch-action: pan-y;
    }
    .flashcard {
      width: 100%; min-height: clamp(300px, 52dvh, 480px); border-radius: var(--radius);
      position: relative; transform-style: preserve-3d;
      transition: transform 0.52s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      &.flipped { transform: rotateY(180deg); }
      &.has-media { min-height: clamp(380px, 62dvh, 520px); }
    }
    .card-face {
      position: absolute; inset: 0; border-radius: var(--radius);
      backface-visibility: hidden; display: flex; flex-direction: column;
      align-items: center; justify-content: center; padding: 24px 20px;
      overflow-y: auto;
    }
    .front {
      background: var(--surface); box-shadow: var(--shadow);
      gap: 16px;
    }
    .back {
      background: linear-gradient(145deg, #2AABEE, #1578A8);
      transform: rotateY(180deg); gap: 12px;
      justify-content: flex-start; padding-top: 28px;
    }
    .lang-tag {
      font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px;
      color: var(--primary); background: var(--primary-light); padding: 4px 12px; border-radius: 20px;
    }
    .word-big { font-size: 44px; font-weight: 800; color: var(--text); text-align: center; line-height: 1.2; transition: font-size 0.2s ease; }
    .tap-hint { font-size: 13px; color: var(--text-3); }
    .translation-big { font-size: 40px; font-weight: 700; color: #fff; text-align: center; line-height: 1.3; transition: font-size 0.2s ease; word-break: break-word; overflow-wrap: break-word; width: 100%; }
    .examples-block {
      background: rgba(255,255,255,0.15); border-radius: 12px; padding: 12px 16px;
      width: 100%; display: flex; flex-direction: column; gap: 8px;
    }
    .ex-item { font-size: 13px; color: rgba(255,255,255,0.9); line-height: 1.5; display: flex; gap: 6px; align-items: flex-start; }
    .ex-bullet { font-size: 16px; line-height: 1.3; opacity: 0.7; flex-shrink: 0; }
    .tap-hint-back { font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 4px; }
    .media-preview {
      width: 100%; max-height: 200px; object-fit: cover;
      border-radius: 12px; flex-shrink: 0;
    }
    video.media-preview {
      max-height: 180px; object-fit: contain; background: rgba(0,0,0,0.3);
      border: 2px solid rgba(255,255,255,0.25);
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    }

    .card-actions {
      display: flex; gap: 12px;
      animation: slideUp 0.3s ease both;
      .btn { flex: 1; }
    }

    .session-done {
      display: flex; flex-direction: column; align-items: center;
      padding: 40px 24px; gap: 16px; text-align: center;
    }
    .done-circle {
      width: 88px; height: 88px; border-radius: 50%;
      background: linear-gradient(135deg, #22C55E, #16A34A);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 24px rgba(34,197,94,0.35);
    }
    .done-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; }
    .done-stat {
      background: var(--surface); border-radius: var(--radius-sm); padding: 16px;
      box-shadow: var(--shadow-sm); display: flex; flex-direction: column; align-items: center; gap: 4px;
    }
    .done-num { font-size: 28px; font-weight: 800; }
    .done-num.success { color: var(--success); }
    .done-num.warning { color: var(--warning); }
    .done-label { font-size: 12px; color: var(--text-2); }
    .done-actions { width: 100%; display: flex; flex-direction: column; gap: 10px; }
  `]
})
export class RepeatComponent implements OnInit {
  private store    = inject(Store);
  private router   = inject(Router);
  private customer = inject(CustomerService);
  private telegram = inject(TelegramService);

  loading$ = this.store.select(selectWordsLoading);
  words    = signal<Word[]>([]);

  currentIndex  = signal(0);
  flipped       = signal(false);
  sessionDone   = signal(false);
  scheduleOpen  = signal(false);

  results: Record<number, 'learned' | 'practice'> = {};

  learnedCount  = computed(() => Object.values(this.results).filter(r => r === 'learned').length);
  practiceCount = computed(() => Object.values(this.results).filter(r => r === 'practice').length);
  progressPercent = computed(() => this.words().length
    ? (this.currentIndex() / this.words().length) * 100 : 0);

  currentWord = computed(() => this.words()[this.currentIndex()] ?? null);
  hasMedia    = computed(() => !!(this.currentWord()?.imageExample || this.currentWord()?.videoExample));

  wordFontSize = computed(() => {
    const len = this.currentWord()?.word?.length ?? 0;
    if (len < 15) return '44px';
    if (len < 30) return '34px';
    if (len < 50) return '26px';
    return '20px';
  });

  translationFontSize = computed(() => {
    const len = this.currentWord()?.translation?.length ?? 0;
    if (len < 20) return '34px';
    if (len < 40) return '26px';
    if (len < 70) return '20px';
    if (len < 120) return '16px';
    return '13px';
  });

  private touchStartX = 0;

  ngOnInit() {
    this.customer.load().subscribe(c => {
      this.store.dispatch(WordsActions.loadRepetitionWords({ customerId: c.id }));
    });
    this.store.select(selectRepetitionWords).subscribe(words => {
      this.words.set(words);
    });
  }

  flip() {
    this.flipped.update(v => !v);
    this.telegram.hapticImpact('light');
  }

  markResult(result: 'learned' | 'practice') {
    const idx  = this.currentIndex();
    const word = this.currentWord();
    if (!word) return;

    this.results[idx] = result;
    this.store.dispatch(WordsActions.updateRepetition({
      wordId: word.id,
      success: result === 'learned'
    }));
    this.telegram.hapticImpact(result === 'learned' ? 'medium' : 'light');

    this.flipped.set(false);
    setTimeout(() => {
      if (idx + 1 < this.words().length) {
        this.currentIndex.set(idx + 1);
      } else {
        this.sessionDone.set(true);
      }
    }, 200);
  }

  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.touches[0].clientX;
  }

  onTouchEnd(e: TouchEvent) {
    const diff = e.changedTouches[0].clientX - this.touchStartX;
    if (Math.abs(diff) > 52 && this.flipped()) {
      this.markResult(diff < 0 ? 'learned' : 'practice');
    }
  }

  restart() {
    this.currentIndex.set(0);
    this.flipped.set(false);
    this.sessionDone.set(false);
    this.results = {};
  }

  mediaUrl(fileId: string): string {
    return `/api/words/telegram-file/${fileId}`;
  }

  navigate(path: string) { this.router.navigate([path]); }
  goHome() { this.router.navigate(['/home']); }
}
