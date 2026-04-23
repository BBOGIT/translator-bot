import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ScreenHdrComponent } from '../../shared/components/screen-hdr/screen-hdr.component';
import { IconsComponent } from '../../shared/components/icons/icons.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { WordsApiService } from '../../core/api/words.api';
import { CustomerService } from '../../core/services/customer.service';
import { Word } from '../../store/models';

const PAGE_SIZE = 9;

@Component({
  selector: 'app-words',
  standalone: true,
  imports: [CommonModule, FormsModule, ScreenHdrComponent, IconsComponent, SkeletonComponent],
  template: `
    <div class="screen no-bottom-nav">
      <app-screen-hdr title="Learned Words" [showBack]="true" (back)="goBack()"></app-screen-hdr>

      <!-- Sticky search -->
      <div class="search-bar">
        <app-icon name="search" [size]="18" style="color:var(--text-3)"></app-icon>
        <input type="text" [(ngModel)]="query" (ngModelChange)="onSearch($event)" placeholder="Search words...">
        <button *ngIf="query" (click)="clearSearch()" class="clear-btn">
          <app-icon name="x" [size]="16"></app-icon>
        </button>
      </div>

      <div class="screen-content" style="padding-top:12px">
        <!-- Word count -->
        <p class="word-count" *ngIf="!loading()">{{ filtered().length }} words</p>

        <!-- Skeleton -->
        <div *ngIf="loading()" style="display:flex;flex-direction:column;gap:8px">
          <app-skeleton [height]="60" *ngFor="let i of [1,2,3,4,5]"></app-skeleton>
        </div>

        <!-- Empty state -->
        <div class="empty-state" *ngIf="!loading() && filtered().length === 0">
          <span>📚</span>
          <p>No words found</p>
        </div>

        <!-- List -->
        <div class="word-list" *ngIf="!loading()">
          <div class="word-item card" *ngFor="let word of filtered(); let i = index"
               [style.animation-delay.ms]="i * 35"
               [class.expanded]="expanded[word.id]">
            <div class="word-row" (click)="toggle(word.id)">
              <div class="word-main">
                <span class="word-text">{{ word.word }}</span>
                <span class="word-trans">{{ word.translation }}</span>
              </div>
              <app-icon [name]="expanded[word.id] ? 'chev-u' : 'chev-d'" [size]="16" style="color:var(--text-3)"></app-icon>
            </div>
            <div class="word-examples" *ngIf="expanded[word.id] && word.examples?.length">
              <div class="example-item" *ngFor="let ex of word.examples">{{ ex }}</div>
            </div>
          </div>
        </div>

        <!-- Load more -->
        <button class="btn btn-outline btn-full"
                *ngIf="hasMore() && !loading()"
                (click)="loadMore()">
          Load More ({{ remaining() }} remaining)
        </button>
      </div>
    </div>
  `,
  styles: [`
    .no-bottom-nav { padding-bottom: 24px; }
    .search-bar {
      position: sticky; top: var(--header-h); z-index: 55;
      background: var(--surface); border-bottom: 1px solid var(--border);
      display: flex; align-items: center; gap: 10px; padding: 10px 16px;
      input {
        flex: 1; border: none; background: transparent; font-size: 15px;
        color: var(--text); font-family: inherit;
        &::placeholder { color: var(--text-3); }
      }
    }
    .clear-btn { background: none; border: none; cursor: pointer; color: var(--text-3); display: flex; }
    .screen-content { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .word-count { font-size: 12.5px; color: var(--text-2); font-weight: 600; }

    .empty-state { text-align: center; padding: 40px 0; color: var(--text-2); font-size: 24px; }

    .word-list { display: flex; flex-direction: column; gap: 8px; }
    .word-item {
      overflow: hidden; animation: slideUp 0.38s var(--spring) both;
    }
    .word-row {
      display: flex; align-items: center; gap: 10px; padding: 14px 16px; cursor: pointer;
    }
    .word-main { flex: 1; }
    .word-text  { font-size: 16.5px; font-weight: 700; color: var(--text); display: block; }
    .word-trans { font-size: 13px; color: var(--text-2); margin-top: 2px; display: block; }
    .word-examples { padding: 0 16px 14px; display: flex; flex-direction: column; gap: 8px; }
    .example-item {
      font-size: 13px; color: var(--text-2); line-height: 1.5;
      border-left: 3px solid var(--primary); padding: 8px 10px;
      background: var(--bg); border-radius: 0 9px 9px 0;
    }
  `]
})
export class WordsComponent implements OnInit {
  private router   = inject(Router);
  private wordsApi = inject(WordsApiService);
  private customer = inject(CustomerService);

  allWords  = signal<Word[]>([]);
  filtered  = signal<Word[]>([]);
  loading   = signal(true);
  hasMore   = signal(false);
  remaining = signal(0);
  query     = '';
  page      = 1;
  total     = 0;
  expanded: Record<number, boolean> = {};

  ngOnInit() {
    this.customer.load().subscribe(c => this.loadPage(c.id));
  }

  loadPage(customerId: number) {
    this.loading.set(true);
    this.wordsApi.getLearnedWords(customerId, this.page, PAGE_SIZE).subscribe(res => {
      const all = [...this.allWords(), ...res.words];
      this.total = res.total;
      this.allWords.set(all);
      this.filtered.set(this.applyFilter(all));
      this.hasMore.set(all.length < res.total);
      this.remaining.set(res.total - all.length);
      this.loading.set(false);
    });
  }

  loadMore() {
    this.page++;
    const c = this.customer.customer();
    if (c) this.loadPage(c.id);
  }

  toggle(id: number) {
    this.expanded[id] = !this.expanded[id];
  }

  onSearch(q: string) {
    this.filtered.set(this.applyFilter(this.allWords()));
  }

  clearSearch() {
    this.query = '';
    this.filtered.set(this.allWords());
  }

  private applyFilter(words: Word[]): Word[] {
    if (!this.query.trim()) return words;
    const q = this.query.toLowerCase();
    return words.filter(w =>
      w.word.toLowerCase().includes(q) || w.translation.toLowerCase().includes(q)
    );
  }

  goBack() { this.router.navigate(['/home']); }
}
