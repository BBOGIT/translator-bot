import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ScreenHdrComponent } from '../../shared/components/screen-hdr/screen-hdr.component';
import { IconsComponent } from '../../shared/components/icons/icons.component';
import { CustomerService } from '../../core/services/customer.service';
import { TelegramService } from '../../core/services/telegram.service';

type Frequency = 'Daily' | 'Weekly' | 'Monthly';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, ScreenHdrComponent, IconsComponent],
  template: `
    <div class="screen no-bottom-nav">
      <app-screen-hdr title="Repetition Schedule" [showBack]="true" (back)="goBack()"></app-screen-hdr>

      <div class="screen-content" style="padding-top:16px">

        <!-- Summary badge -->
        <div class="summary-card card anim-slide-up">
          <div class="summary-icon">
            <app-icon name="clock" [size]="20" style="color:var(--primary)"></app-icon>
          </div>
          <div>
            <span class="summary-time">{{ selectedHour() }}:00</span>
            <span class="summary-freq">{{ frequency() }}</span>
          </div>
        </div>

        <!-- Preset chips -->
        <h4 class="section-label anim-slide-up d1">Quick Presets</h4>
        <div class="preset-grid anim-slide-up d2">
          <div class="preset-chip" *ngFor="let preset of presets"
               [class.active]="selectedHour() === preset"
               (click)="selectPreset(preset)">
            <span>{{ preset }}:00</span>
            <span class="preset-check" *ngIf="selectedHour() === preset">✓</span>
          </div>
        </div>

        <!-- Frequency -->
        <h4 class="section-label anim-slide-up d2">Frequency</h4>
        <div class="freq-control anim-slide-up d3">
          <button *ngFor="let f of frequencies"
                  [class.active]="frequency() === f"
                  (click)="frequency.set(f)">{{ f }}</button>
        </div>

        <!-- Custom time -->
        <div class="custom-section card anim-slide-up d3">
          <button class="custom-toggle" (click)="customOpen.set(!customOpen())">
            <app-icon name="clock" [size]="18"></app-icon>
            <span>Custom time</span>
            <app-icon [name]="customOpen() ? 'chev-u' : 'chev-d'" [size]="16" style="margin-left:auto"></app-icon>
          </button>
          <div class="custom-body" *ngIf="customOpen()">
            <div class="spinners">
              <div class="spinner">
                <button (click)="changeHour(-1)">−</button>
                <span class="spinner-val">{{ selectedHour() }}</span>
                <button (click)="changeHour(1)">+</button>
              </div>
              <span class="colon">:</span>
              <div class="spinner">
                <button (click)="changeMin(-5)">−</button>
                <span class="spinner-val">{{ pad(selectedMin()) }}</span>
                <button (click)="changeMin(5)">+</button>
              </div>
            </div>
            <button class="btn btn-secondary btn-full" (click)="useCustomTime()">Use This Time</button>
          </div>
        </div>

        <button class="btn btn-primary btn-full anim-slide-up d4" [class.pulse]="saved()" (click)="save()">
          {{ saved() ? 'Saved ✓' : 'Confirm Schedule' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .no-bottom-nav { padding-bottom: 24px; }
    .screen-content { padding: 16px; display: flex; flex-direction: column; gap: 14px; }

    .summary-card {
      display: flex; align-items: center; gap: 14px; padding: 16px;
    }
    .summary-icon {
      width: 42px; height: 42px; border-radius: 12px;
      background: var(--primary-light); display: flex; align-items: center; justify-content: center;
    }
    .summary-time { font-size: 22px; font-weight: 800; color: var(--primary); display: block; }
    .summary-freq { font-size: 12px; color: var(--text-2); }

    .section-label { font-size: 13px; font-weight: 700; color: var(--text-2); text-transform: uppercase; letter-spacing: 0.5px; }

    .preset-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .preset-chip {
      background: var(--surface); border-radius: var(--radius-sm); box-shadow: var(--shadow-sm);
      padding: 16px; display: flex; align-items: center; justify-content: space-between;
      font-size: 16px; font-weight: 700; cursor: pointer;
      border: 2px solid transparent; transition: all 0.25s var(--spring);
    }
    .preset-chip.active {
      border-color: var(--primary); background: var(--primary-light); color: var(--primary);
    }
    .preset-check { font-size: 12px; font-weight: 800; color: var(--primary); }

    .freq-control {
      background: var(--surface); border-radius: var(--radius-sm);
      display: flex; padding: 4px; gap: 4px; box-shadow: var(--shadow-sm);
      button {
        flex: 1; border: none; background: none; padding: 10px;
        border-radius: 9px; font-size: 14px; font-weight: 600; cursor: pointer;
        font-family: inherit; color: var(--text-2); transition: all 0.2s ease;
        &.active { background: var(--primary); color: #fff; }
      }
    }

    .custom-section { padding: 4px 0; overflow: hidden; }
    .custom-toggle {
      display: flex; align-items: center; gap: 10px; width: 100%;
      background: none; border: none; padding: 14px 16px; font-size: 14.5px;
      font-weight: 600; cursor: pointer; color: var(--text); font-family: inherit;
    }
    .custom-body { padding: 0 16px 16px; display: flex; flex-direction: column; gap: 16px; }
    .spinners { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .spinner {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      button {
        width: 40px; height: 40px; border-radius: 50%; border: 1.5px solid var(--border);
        background: var(--bg); font-size: 20px; cursor: pointer; display: flex;
        align-items: center; justify-content: center; font-family: inherit;
      }
    }
    .spinner-val { font-size: 40px; font-weight: 800; color: var(--text); min-width: 56px; text-align: center; }
    .colon { font-size: 32px; font-weight: 800; color: var(--text-2); padding-bottom: 8px; }

    .btn.pulse { animation: checkPulse 0.4s ease both; }
  `]
})
export class ScheduleComponent implements OnInit {
  private router   = inject(Router);
  private customer = inject(CustomerService);
  private telegram = inject(TelegramService);

  presets: number[] = [7, 9, 19, 21];
  frequencies: Frequency[] = ['Daily', 'Weekly', 'Monthly'];

  selectedHour = signal(20);
  selectedMin  = signal(0);
  frequency    = signal<Frequency>('Daily');
  customOpen   = signal(false);
  saved        = signal(false);

  ngOnInit() {
    const c = this.customer.customer();
    if (c?.repetitionTime) {
      const [h] = c.repetitionTime.split(':').map(Number);
      this.selectedHour.set(h);
    }
  }

  selectPreset(h: number) {
    this.selectedHour.set(h);
    this.selectedMin.set(0);
    this.telegram.hapticImpact('light');
  }

  changeHour(d: number) {
    this.selectedHour.set((this.selectedHour() + d + 24) % 24);
  }

  changeMin(d: number) {
    this.selectedMin.set((this.selectedMin() + d + 60) % 60);
  }

  useCustomTime() {
    this.customOpen.set(false);
  }

  save() {
    const time = `${String(this.selectedHour()).padStart(2,'0')}:${this.pad(this.selectedMin())}`;
    this.customer.update({ repetitionTime: time }).subscribe(() => {
      this.saved.set(true);
      this.telegram.hapticNotification('success');
      setTimeout(() => { this.saved.set(false); this.goBack(); }, 1200);
    });
  }

  goBack() { this.router.navigate(['/home']); }

  pad(n: number) { return String(n).padStart(2, '0'); }
}
