import { Component, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { WordsActions } from '../../store/words/words.actions';
import { selectTranslating, selectTranslation, selectWordsError } from '../../store/words/words.selectors';
import { IconsComponent } from '../../shared/components/icons/icons.component';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { ScreenHdrComponent } from '../../shared/components/screen-hdr/screen-hdr.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { TelegramService } from '../../core/services/telegram.service';
import { CustomerService } from '../../core/services/customer.service';

@Component({
  selector: 'app-learn',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, IconsComponent, BottomNavComponent, ScreenHdrComponent, SkeletonComponent],
  template: `
    <div class="screen">
      <app-screen-hdr [title]="'learn.header' | translate" [showBack]="true" (back)="goBack()"></app-screen-hdr>

      <div class="screen-content" style="padding-top:16px">
        <!-- Error -->
        <div class="error-banner anim-slide-up" *ngIf="error$ | async as err">
          <app-icon name="x" [size]="16"></app-icon>
          {{ err }}
        </div>

        <!-- Input Card -->
        <div class="input-card card" [class.shake]="shaking()">
          <label class="input-label">{{ 'learn.input_label' | translate }}</label>
          <textarea #textInput class="word-input" [(ngModel)]="inputText" [placeholder]="'learn.placeholder' | translate" rows="2" (input)="autoResize($event)"></textarea>
          <input #fileInput type="file" accept="image/*" style="display:none" (change)="onFileSelected($event)">
          <div class="input-actions">
            <button class="btn btn-outline btn-sm" (click)="fileInput.click()">
              <app-icon name="camera" [size]="16"></app-icon>
              {{ 'learn.photo_btn' | translate }}
            </button>
            <button class="btn btn-primary" style="flex:2.2" (click)="translate()">
              {{ 'learn.translate_btn' | translate }}
            </button>
          </div>
        </div>

        <!-- Skeleton Loader -->
        <div class="skeleton-card card" *ngIf="translating$ | async">
          <div style="padding:20px;display:flex;flex-direction:column;gap:12px">
            <app-skeleton [height]="18" width="60%"></app-skeleton>
            <app-skeleton [height]="36" width="80%"></app-skeleton>
            <app-skeleton [height]="28" width="70%"></app-skeleton>
            <app-skeleton [height]="14" width="90%"></app-skeleton>
            <app-skeleton [height]="14" width="75%"></app-skeleton>
          </div>
        </div>

        <!-- Result Card -->
        <div class="result-card" *ngIf="(translation$ | async) as word">
          <div class="result-header">
            <span class="lang-label">{{ 'learn.result_header' | translate }}</span>
            <span class="word-text">{{ word.word }}</span>
            <span class="translation-text">{{ word.translation }}</span>
          </div>
          <div class="result-body">
            <!-- Examples accordion -->
            <div class="examples-section" *ngIf="word.examples?.length">
              <button class="examples-toggle" (click)="examplesOpen.set(!examplesOpen())">
                <span>{{ (examplesOpen() ? 'learn.hide_examples' : 'learn.show_examples') | translate }}</span>
                <app-icon [name]="examplesOpen() ? 'chev-u' : 'chev-d'" [size]="16"></app-icon>
              </button>
              <div class="examples-list" *ngIf="examplesOpen()">
                <div class="example-item" *ngFor="let ex of word.examples">{{ ex }}</div>
              </div>
            </div>

            <div class="result-actions">
              <button class="btn btn-secondary btn-sm" (click)="clearTranslation()">{{ 'learn.learn_more' | translate }}</button>
              <button class="btn btn-success" [class.pulse]="saving()" (click)="saveWord(word)">
                {{ 'learn.got_it' | translate }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <app-bottom-nav></app-bottom-nav>
  `,
  styles: [`
    .screen { padding-bottom: calc(var(--nav-h) + 16px); }
    .screen-content { padding: 16px; display: flex; flex-direction: column; gap: 14px; }

    .input-card { padding: 18px; }
    .input-card.shake { animation: shake 0.45s ease both; }
    .input-label {
      font-size: 11px; font-weight: 700; color: var(--primary);
      letter-spacing: 0.6px; text-transform: uppercase; display: block; margin-bottom: 10px;
    }
    .word-input {
      width: 100%; border: none; background: transparent; font-size: 19px;
      color: var(--text); resize: none; min-height: 48px; line-height: 1.4;
      font-family: inherit; font-weight: 500;
      &::placeholder { color: var(--text-3); }
    }
    .input-actions { display: flex; gap: 10px; margin-top: 14px; }

    .result-card { background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow-sm); overflow: hidden; animation: scaleIn 0.36s var(--spring) both; }
    .result-header {
      background: linear-gradient(135deg, #2AABEE, #1A96D9);
      padding: 20px; display: flex; flex-direction: column; gap: 6px;
    }
    .lang-label  { font-size: 11px; color: rgba(255,255,255,0.75); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .word-text   { font-size: 30px; color: #fff; font-weight: 800; line-height: 1.1; }
    .translation-text { font-size: 22px; color: rgba(255,255,255,0.9); font-style: italic; }
    .result-body { padding: 16px; }

    .examples-toggle {
      display: flex; align-items: center; justify-content: space-between; width: 100%;
      background: none; border: none; cursor: pointer; font-size: 13.5px;
      color: var(--primary); font-weight: 600; padding: 8px 0; font-family: inherit;
    }
    .examples-list { display: flex; flex-direction: column; gap: 8px; margin: 8px 0; }
    .example-item {
      font-size: 13px; color: var(--text-2); line-height: 1.5;
      border-left: 3px solid var(--primary); padding-left: 10px;
      background: var(--bg); border-radius: 0 9px 9px 0; padding: 8px 10px;
    }
    .result-actions { display: flex; gap: 10px; margin-top: 14px; }
    .result-actions .btn-success { flex: 1; }
    .btn.pulse { animation: checkPulse 0.4s ease both; }
  `]
})
export class LearnComponent {
  private store    = inject(Store);
  private router   = inject(Router);
  private telegram = inject(TelegramService);
  private customer = inject(CustomerService);

  translating$ = this.store.select(selectTranslating);
  translation$ = this.store.select(selectTranslation);
  error$       = this.store.select(selectWordsError);

  inputText    = '';
  examplesOpen = signal(false);
  shaking      = signal(false);
  saving       = signal(false);

  translate() {
    if (!this.inputText.trim()) {
      this.triggerShake();
      return;
    }
    this.store.dispatch(WordsActions.translateWord({ text: this.inputText.trim() }));
  }

  saveWord(word: import('../../store/models').Word | null) {
    if (!word) return;
    this.saving.set(true);
    setTimeout(() => this.saving.set(false), 450);
    this.telegram.hapticNotification('success');

    const c = this.customer.customer();
    this.store.dispatch(WordsActions.saveWord({
      word: {
        word: word.word,
        translation: word.translation,
        examples: word.examples ?? [],
        needToLearn: true,
        customerId: c?.id,
      }
    }));
    this.inputText = '';
  }

  clearTranslation() {
    this.store.dispatch(WordsActions.clearTranslation());
    this.inputText = '';
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      this.store.dispatch(WordsActions.translateFromImage({ base64 }));
    };
    reader.readAsDataURL(file);
  }

  autoResize(event: Event) {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  goBack() { this.router.navigate(['/home']); }

  private triggerShake() {
    this.shaking.set(true);
    setTimeout(() => this.shaking.set(false), 500);
    this.telegram.hapticNotification('error');
  }
}
