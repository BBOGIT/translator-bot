import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { WordsApiService } from '../../core/api/words.api';
import { CustomerService } from '../../core/services/customer.service';
import { TelegramService } from '../../core/services/telegram.service';
import { WordsActions } from '../../store/words/words.actions';
import { Word } from '../../store/models';
import { IconsComponent } from '../../shared/components/icons/icons.component';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { ScreenHdrComponent } from '../../shared/components/screen-hdr/screen-hdr.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-practice',
  standalone: true,
  imports: [CommonModule, FormsModule, IconsComponent, BottomNavComponent, ScreenHdrComponent, SkeletonComponent],
  template: `
    <div class="screen">

      <!-- LIST MODE -->
      <ng-container *ngIf="mode() === 'list'">
        <app-screen-hdr title="Practice Words" [showBack]="true" (back)="goBack()">
          <span class="count-badge" *ngIf="!loading()">{{ filtered().length }}</span>
        </app-screen-hdr>

        <!-- Search -->
        <div class="search-wrap">
          <app-icon name="search" [size]="16" class="search-icon"></app-icon>
          <input class="search-input" type="text" placeholder="Search..."
            [(ngModel)]="query" (ngModelChange)="onSearch($event)">
          <button class="clear-btn" *ngIf="query" (click)="clearSearch()">
            <app-icon name="x" [size]="14"></app-icon>
          </button>
        </div>

        <!-- Skeleton -->
        <div class="word-list" *ngIf="loading()">
          <div class="skeleton-row" *ngFor="let i of [1,2,3,4,5]">
            <app-skeleton [height]="52" [radius]="12"></app-skeleton>
          </div>
        </div>

        <!-- Empty state -->
        <div class="empty-state" *ngIf="!loading() && allWords().length === 0">
          <span class="empty-emoji">🎯</span>
          <h3>No words to practice</h3>
          <p>All your words are learned. Add new ones to keep practicing.</p>
          <button class="btn btn-primary" (click)="navigate('/learn')">Add Words</button>
        </div>

        <!-- No results -->
        <div class="empty-state" *ngIf="!loading() && allWords().length > 0 && filtered().length === 0">
          <span class="empty-emoji">🔍</span>
          <h3>No results</h3>
          <p>Try a different search term.</p>
        </div>

        <!-- Word list -->
        <div class="word-list" *ngIf="!loading() && filtered().length > 0">
          <div class="word-row card" *ngFor="let w of filtered()"
               (click)="toggleExpand(w.id)" [class.expanded]="expanded[w.id]">
            <div class="word-row-main">
              <div class="word-col">
                <span class="word-text">{{ w.word }}</span>
                <span class="word-trans">{{ w.translation }}</span>
              </div>
              <app-icon [name]="expanded[w.id] ? 'chev-u' : 'chev-d'" [size]="16" style="color:var(--text-3);flex-shrink:0"></app-icon>
            </div>
            <div class="examples-block" *ngIf="expanded[w.id] && w.examples?.length">
              <div class="ex-item" *ngFor="let ex of w.examples">{{ ex }}</div>
            </div>
          </div>
        </div>

        <!-- Sticky Start Session button -->
        <div class="start-wrap" *ngIf="!loading() && filtered().length > 0">
          <button class="btn btn-primary btn-full start-btn" (click)="startSession()">
            <app-icon name="repeat" [size]="18" style="color:#fff"></app-icon>
            Start Session ({{ filtered().length }} words)
          </button>
        </div>
      </ng-container>

      <!-- SESSION MODE -->
      <ng-container *ngIf="mode() === 'session'">
        <app-screen-hdr title="Practice" [showBack]="true" (back)="backToList()">
          <span class="counter" *ngIf="!sessionDone()">{{ currentIndex() + 1 }}/{{ sessionWords().length }}</span>
        </app-screen-hdr>

        <!-- Session complete -->
        <div class="session-done anim-scale-in" *ngIf="sessionDone()">
          <div class="done-circle">
            <app-icon name="check" [size]="40" style="color:#fff"></app-icon>
          </div>
          <h2>Session Complete!</h2>
          <p>You reviewed {{ sessionWords().length }} words</p>
          <div class="done-stats">
            <div class="done-stat">
              <span class="done-num success">{{ learnedCount() }}</span>
              <span class="done-label">Got it</span>
            </div>
            <div class="done-stat">
              <span class="done-num warning">{{ practiceCount() }}</span>
              <span class="done-label">Need Practice</span>
            </div>
          </div>
          <div class="done-actions">
            <button class="btn btn-primary btn-full" (click)="restartSession()">Practice Again</button>
            <button class="btn btn-secondary btn-full" (click)="backToList()">Back to List</button>
          </div>
        </div>

        <!-- Flashcard -->
        <div class="flashcard-area" *ngIf="!sessionDone()">
          <div class="progress-bar-track" style="margin:0 16px 16px">
            <div class="progress-bar-fill" [style.width.%]="progressPercent()"></div>
          </div>

          <div class="progress-dots">
            <span class="dot" *ngFor="let w of sessionWords(); let i = index"
              [class.active]="i === currentIndex()"
              [class.learned]="results[i] === 'learned'"
              [class.practice]="results[i] === 'practice'">
            </span>
          </div>

          <div class="card-wrapper"
               (touchstart)="onTouchStart($event)"
               (touchend)="onTouchEnd($event)">
            <div class="flashcard" [class.flipped]="flipped()" [class.has-media]="hasMedia()" (click)="flip()">
              <div class="card-face front">
                <span class="lang-tag">English</span>
                <span class="word-big" [style.font-size]="wordFontSize()">{{ currentWord()!.word }}</span>
                <span class="tap-hint">Tap to reveal</span>
              </div>
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
                <div class="examples-block-card" *ngIf="currentWord()?.examples?.length">
                  <div class="ex-item-card" *ngFor="let ex of currentWord()!.examples!.slice(0,2)">{{ ex }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card-actions" *ngIf="flipped()">
            <button class="btn btn-warn" (click)="markResult('practice')">Need Practice</button>
            <button class="btn btn-success" (click)="markResult('learned')">Got it ✓</button>
          </div>
        </div>
      </ng-container>

    </div>
    <app-bottom-nav></app-bottom-nav>
  `,
  styles: [`
    .screen { padding-bottom: calc(var(--nav-h) + 80px); min-height: 100dvh; }
    .count-badge { background: var(--warning); color: #fff; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
    .search-wrap { margin: 8px 16px 4px; position: relative; display: flex; align-items: center; }
    .search-icon { position: absolute; left: 12px; color: var(--text-3); pointer-events: none; }
    .search-input {
      width: 100%; padding: 10px 36px; background: var(--surface);
      border: 1px solid var(--border); border-radius: var(--radius-sm);
      font-size: 14px; color: var(--text); outline: none;
      &:focus { border-color: var(--primary); }
    }
    .clear-btn { position: absolute; right: 10px; background: none; border: none; cursor: pointer; color: var(--text-3); display: flex; align-items: center; }
    .word-list { padding: 8px 16px; display: flex; flex-direction: column; gap: 8px; }
    .word-row { padding: 14px 16px; cursor: pointer; }
    .word-row-main { display: flex; align-items: center; gap: 12px; }
    .word-col { flex: 1; min-width: 0; }
    .word-text  { font-size: 15px; font-weight: 700; color: var(--text); display: block; }
    .word-trans { font-size: 13px; color: var(--text-2); margin-top: 2px; display: block; }
    .examples-block { margin-top: 8px; display: flex; flex-direction: column; gap: 8px; }
    .ex-item {
      font-size: 13px; color: var(--text-2); line-height: 1.5;
      border-left: 3px solid var(--primary); padding: 8px 10px;
      background: var(--bg); border-radius: 0 9px 9px 0;
    }
    .start-wrap { position: fixed; bottom: calc(var(--nav-h) + 12px); left: 0; right: 0; padding: 0 16px; }
    .start-btn { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .empty-state {
      text-align: center; padding: 60px 24px;
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      .empty-emoji { font-size: 56px; }
      h3 { font-size: 20px; font-weight: 700; }
      p { color: var(--text-2); }
    }
    .counter { font-size: 14px; font-weight: 600; color: var(--text-2); }
    .flashcard-area { padding: 16px; }
    .progress-dots { display: flex; justify-content: center; gap: 6px; margin-bottom: 20px; }
    .dot {
      width: 8px; height: 8px; border-radius: 4px; background: var(--border); transition: all 0.3s var(--spring);
      &.active { width: 22px; background: var(--warning); }
      &.learned { background: var(--success); }
      &.practice { background: var(--warning); }
    }
    .card-wrapper { perspective: 1100px; margin-bottom: 20px; touch-action: pan-y; }
    .flashcard {
      width: 100%; min-height: clamp(300px, 52dvh, 480px); border-radius: var(--radius); position: relative;
      transform-style: preserve-3d; transition: transform 0.52s cubic-bezier(0.4,0,0.2,1); cursor: pointer;
      &.flipped { transform: rotateY(180deg); }
      &.has-media { min-height: clamp(380px, 62dvh, 520px); }
    }
    .card-face {
      position: absolute; inset: 0; border-radius: var(--radius); backface-visibility: hidden;
      display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 28px 24px;
      overflow-y: auto;
    }
    .front { background: var(--surface); box-shadow: var(--shadow); gap: 16px; }
    .back { background: linear-gradient(145deg,#F59E0B,#D97706); transform: rotateY(180deg); gap: 12px; justify-content: flex-start; padding-top: 28px; }
    .media-preview { width: 100%; max-height: 200px; object-fit: cover; border-radius: 12px; flex-shrink: 0; }
    video.media-preview { max-height: 180px; object-fit: contain; background: rgba(0,0,0,0.3); border: 2px solid rgba(255,255,255,0.25); box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
    .lang-tag { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: var(--warning); background: #FEF3C7; padding: 4px 12px; border-radius: 20px; }
    .word-big { font-size: 44px; font-weight: 800; color: var(--text); text-align: center; line-height: 1.2; transition: font-size 0.2s ease; }
    .tap-hint { font-size: 13px; color: var(--text-3); }
    .translation-big { font-size: 40px; font-weight: 700; color: #fff; text-align: center; line-height: 1.2; transition: font-size 0.2s ease; overflow: hidden; }
    .examples-block-card { background: rgba(255,255,255,.2); border-radius: 12px; padding: 12px 16px; width: 100%; display: flex; flex-direction: column; gap: 8px; }
    .ex-item-card { font-size: 13px; color: rgba(255,255,255,.9); line-height: 1.5; }
    .card-actions { display: flex; gap: 12px; .btn { flex: 1; } }
    .session-done { display: flex; flex-direction: column; align-items: center; padding: 40px 24px; gap: 16px; text-align: center; }
    .done-circle { width: 88px; height: 88px; border-radius: 50%; background: linear-gradient(135deg,#F59E0B,#D97706); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(245,158,11,.35); }
    .done-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; }
    .done-stat { background: var(--surface); border-radius: var(--radius-sm); padding: 16px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .done-num { font-size: 28px; font-weight: 800; }
    .done-num.success { color: var(--success); }
    .done-num.warning { color: var(--warning); }
    .done-label { font-size: 12px; color: var(--text-2); }
    .done-actions { width: 100%; display: flex; flex-direction: column; gap: 10px; }
  `]
})
export class PracticeComponent implements OnInit {
  private router   = inject(Router);
  private store    = inject(Store);
  private wordsApi = inject(WordsApiService);
  private customer = inject(CustomerService);
  private telegram = inject(TelegramService);

  mode = signal<'list' | 'session'>('list');

  loading  = signal(true);
  allWords = signal<Word[]>([]);
  filtered = signal<Word[]>([]);
  query    = '';
  expanded: Record<number, boolean> = {};

  sessionWords = signal<Word[]>([]);
  currentIndex = signal(0);
  flipped      = signal(false);
  sessionDone  = signal(false);
  results: Record<number, 'learned' | 'practice'> = {};

  currentWord = computed(() => this.sessionWords()[this.currentIndex()] ?? null);
  hasMedia    = computed(() => !!(this.currentWord()?.imageExample || this.currentWord()?.videoExample));
  progressPercent = computed(() => this.sessionWords().length
    ? (this.currentIndex() / this.sessionWords().length) * 100 : 0);
  learnedCount  = computed(() => Object.values(this.results).filter(r => r === 'learned').length);
  practiceCount = computed(() => Object.values(this.results).filter(r => r === 'practice').length);

  wordFontSize = computed(() => {
    const len = this.currentWord()?.word?.length ?? 0;
    if (len < 15) return '44px';
    if (len < 30) return '34px';
    if (len < 50) return '26px';
    return '20px';
  });

  translationFontSize = computed(() => {
    const len = this.currentWord()?.translation?.length ?? 0;
    if (len < 20) return '40px';
    if (len < 50) return '30px';
    if (len < 100) return '22px';
    return '16px';
  });

  private touchStartX = 0;
  private customerId  = 0;

  ngOnInit() {
    this.customer.load().subscribe(c => {
      this.customerId = c.id;
      this.loadWords();
    });
  }

  private loadWords() {
    this.loading.set(true);
    this.wordsApi.getWords(this.customerId, true).subscribe(words => {
      this.allWords.set(words);
      this.filtered.set(words);
      this.loading.set(false);
    });
  }

  onSearch(q: string) {
    const term = q.toLowerCase().trim();
    this.filtered.set(term
      ? this.allWords().filter(w =>
          w.word.toLowerCase().includes(term) || w.translation.toLowerCase().includes(term))
      : this.allWords()
    );
  }

  clearSearch() {
    this.query = '';
    this.filtered.set(this.allWords());
  }

  toggleExpand(id: number) {
    this.expanded[id] = !this.expanded[id];
  }

  startSession() {
    this.sessionWords.set([...this.filtered()]);
    this.currentIndex.set(0);
    this.flipped.set(false);
    this.sessionDone.set(false);
    this.results = {};
    this.mode.set('session');
  }

  backToList() {
    this.mode.set('list');
    this.loadWords();
  }

  flip() {
    if (!this.flipped()) {
      this.flipped.set(true);
      this.telegram.hapticImpact('light');
    }
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
      if (idx + 1 < this.sessionWords().length) {
        this.currentIndex.set(idx + 1);
      } else {
        this.sessionDone.set(true);
      }
    }, 200);
  }

  restartSession() {
    this.currentIndex.set(0);
    this.flipped.set(false);
    this.sessionDone.set(false);
    this.results = {};
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

  mediaUrl(fileId: string): string {
    return `/api/words/telegram-file/${fileId}`;
  }

  navigate(path: string) { this.router.navigate([path]); }
  goBack()               { this.router.navigate(['/home']); }
}
