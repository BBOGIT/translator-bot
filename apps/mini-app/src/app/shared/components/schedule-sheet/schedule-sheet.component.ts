import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../../core/services/customer.service';
import { TelegramService } from '../../../core/services/telegram.service';
import { IconsComponent } from '../icons/icons.component';

type Frequency = 'Daily' | 'Weekly';

@Component({
  selector: 'app-schedule-sheet',
  standalone: true,
  imports: [CommonModule, IconsComponent],
  template: `
    <div class="backdrop" *ngIf="_open" (click)="close()"></div>

    <div class="sheet" [class.open]="_open">
      <div class="handle"></div>

      <div class="sheet-header">
        <h3 class="sheet-title">Repetition Schedule</h3>
        <div class="summary-pill">
          <app-icon name="clock" [size]="14" style="color:var(--primary)"></app-icon>
          <span>{{ padH(selectedHour()) }}:{{ padM(selectedMin()) }} · {{ frequency() }}</span>
        </div>
      </div>

      <div class="preset-grid">
        <div class="preset-chip" *ngFor="let p of presets"
             [class.active]="selectedHour() === p && selectedMin() === 0"
             (click)="selectPreset(p)">
          {{ p }}:00
          <span class="check" *ngIf="selectedHour() === p && selectedMin() === 0">✓</span>
        </div>
      </div>

      <div class="freq-row">
        <button *ngFor="let f of frequencies"
                class="freq-btn"
                [class.active]="frequency() === f"
                (click)="frequency.set(f)">{{ f }}</button>
      </div>

      <div class="custom-row">
        <span class="custom-label">Custom time</span>
        <input type="time" class="time-input"
               [value]="timeValue()"
               (change)="onTimeChange($event)">
      </div>

      <button class="btn btn-primary btn-full save-btn"
              [class.pulse]="saved()"
              (click)="save()">
        {{ saved() ? 'Saved ✓' : 'Save Schedule' }}
      </button>
    </div>
  `,
  styles: [`
    .backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.45);
      z-index: 200; animation: fadeIn 0.2s ease;
    }
    .sheet {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 201;
      background: var(--surface); border-radius: 22px 22px 0 0;
      padding: 10px 18px max(28px, env(safe-area-inset-bottom, 28px));
      display: flex; flex-direction: column; gap: 12px;
      transform: translateY(100%);
      transition: transform 0.36s cubic-bezier(0.32, 0.72, 0, 1);
      pointer-events: none;
    }
    .sheet.open { transform: translateY(0); pointer-events: all; }

    .handle {
      width: 38px; height: 4px; border-radius: 2px;
      background: var(--border); margin: 0 auto 6px; flex-shrink: 0;
    }
    .sheet-header { display: flex; align-items: center; justify-content: space-between; }
    .sheet-title { font-size: 16px; font-weight: 700; margin: 0; }
    .summary-pill {
      display: flex; align-items: center; gap: 5px;
      background: var(--primary-light); border-radius: 20px;
      padding: 5px 10px; font-size: 13px; font-weight: 600; color: var(--primary);
    }

    .preset-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .preset-chip {
      background: var(--bg); border-radius: 10px;
      padding: 14px; font-size: 16px; font-weight: 700;
      border: 2px solid transparent; cursor: pointer;
      display: flex; align-items: center; justify-content: space-between;
      transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
    }
    .preset-chip.active {
      border-color: var(--primary); background: var(--primary-light); color: var(--primary);
    }
    .check { font-size: 13px; }

    .freq-row {
      background: var(--bg); border-radius: 10px;
      display: flex; padding: 4px; gap: 4px;
    }
    .freq-btn {
      flex: 1; border: none; background: none; padding: 10px;
      border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
      font-family: inherit; color: var(--text-2); transition: all 0.2s ease;
    }
    .freq-btn.active { background: var(--primary); color: #fff; }

    .custom-row {
      display: flex; align-items: center; justify-content: space-between;
      background: var(--bg); border-radius: 10px; padding: 13px 14px;
    }
    .custom-label { font-size: 14px; font-weight: 500; color: var(--text-2); }
    .time-input {
      background: none; border: none; font-size: 16px; font-weight: 700;
      color: var(--primary); font-family: inherit; cursor: pointer; outline: none;
    }

    .save-btn { margin-top: 2px; }
    .btn.pulse { animation: checkPulse 0.4s ease both; }
  `]
})
export class ScheduleSheetComponent {
  private customer = inject(CustomerService);
  private telegram = inject(TelegramService);

  @Output() closed = new EventEmitter<void>();

  _open = false;

  @Input() set open(value: boolean) {
    this._open = value;
    if (value) {
      const c = this.customer.customer();
      if (c?.repetitionTime) {
        const [h, m] = c.repetitionTime.split(':').map(Number);
        this.selectedHour.set(h);
        this.selectedMin.set(m ?? 0);
      }
    }
  }

  presets = [7, 9, 19, 21];
  frequencies: Frequency[] = ['Daily', 'Weekly'];

  selectedHour = signal(20);
  selectedMin  = signal(0);
  frequency    = signal<Frequency>('Daily');
  saved        = signal(false);

  timeValue = () => `${this.padH(this.selectedHour())}:${this.padM(this.selectedMin())}`;

  selectPreset(h: number) {
    this.selectedHour.set(h);
    this.selectedMin.set(0);
    this.telegram.hapticImpact('light');
  }

  onTimeChange(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    if (!val) return;
    const [h, m] = val.split(':').map(Number);
    this.selectedHour.set(h);
    this.selectedMin.set(m);
    this.telegram.hapticImpact('light');
  }

  save() {
    const time = `${this.padH(this.selectedHour())}:${this.padM(this.selectedMin())}`;
    this.customer.update({ repetitionTime: time }).subscribe(() => {
      this.saved.set(true);
      this.telegram.hapticNotification('success');
      setTimeout(() => {
        this.saved.set(false);
        this.closed.emit();
      }, 1200);
    });
  }

  close() { this.closed.emit(); }

  padH(n: number) { return String(n).padStart(2, '0'); }
  padM(n: number) { return String(n).padStart(2, '0'); }
}
