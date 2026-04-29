import {
  Component, Input, Output, EventEmitter, inject,
  signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CustomerService } from '../../../core/services/customer.service';
import { TelegramService } from '../../../core/services/telegram.service';
import { IconsComponent } from '../icons/icons.component';

const ITEM_H = 56;
const VISIBLE = 5;
const VP_H   = ITEM_H * VISIBLE; // 280
const VP_CY  = VP_H / 2;         // 140

@Component({
  selector: 'app-schedule-sheet',
  standalone: true,
  imports: [CommonModule, IconsComponent, TranslateModule],
  template: `
    <div class="backdrop" *ngIf="_open" (click)="close()"></div>

    <div class="sheet" [class.open]="_open">
      <div class="handle"></div>

      <div class="sheet-header">
        <div>
          <h3 class="sheet-title">{{ 'schedule.header' | translate }}</h3>
          <p class="sheet-sub">{{ 'schedule.sub' | translate }}</p>
        </div>
        <div class="summary-pill">
          <app-icon name="clock" [size]="14" style="color:var(--primary)"></app-icon>
          <span>{{ padH(selectedHour()) }}:00</span>
        </div>
      </div>

      <div class="drum-wrap">
        <div class="drum-vp"
             (touchstart)="onTouchStart($event)"
             (touchmove)="onTouchMove($event)"
             (touchend)="onTouchEnd($event)"
             (wheel)="onWheel($event)">

          <div class="drum-track"
               [class.snap]="!isDragging()"
               [style.transform]="'translateY(' + drumY() + 'px)'">
            <div class="drum-item"
                 *ngFor="let h of hours"
                 [class.active]="selectedHour() === h">
              {{ padH(h) }}
            </div>
          </div>

          <div class="drum-fade top"></div>
          <div class="drum-fade bottom"></div>
          <div class="drum-hl"></div>
        </div>
        <span class="drum-suffix">:00</span>
      </div>

      <button class="btn btn-primary btn-full save-btn"
              [class.pulse]="saved()"
              (click)="save()">
        {{ saved() ? ('schedule.saved' | translate) : ('schedule.save' | translate) }}
      </button>
    </div>
  `,
  styles: [`
    .backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,.45);
      z-index: 200; animation: fadeIn .2s ease;
    }
    .sheet {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 201;
      background: var(--surface); border-radius: 22px 22px 0 0;
      padding: 10px 20px max(32px, env(safe-area-inset-bottom, 32px));
      display: flex; flex-direction: column; gap: 16px;
      transform: translateY(100%);
      transition: transform .36s cubic-bezier(.32,.72,0,1);
      pointer-events: none;
    }
    .sheet.open { transform: translateY(0); pointer-events: all; }

    .handle {
      width: 38px; height: 4px; border-radius: 2px;
      background: var(--border); margin: 0 auto 4px; flex-shrink: 0;
    }

    .sheet-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .sheet-title  { font-size: 17px; font-weight: 700; margin: 0 0 2px; }
    .sheet-sub    { font-size: 12px; color: var(--text-2); margin: 0; opacity: .7; }
    .summary-pill {
      display: flex; align-items: center; gap: 5px; flex-shrink: 0;
      background: var(--primary-light); border-radius: 20px;
      padding: 6px 12px; font-size: 14px; font-weight: 700; color: var(--primary);
    }

    /* ─── Drum ─── */
    .drum-wrap {
      display: flex; align-items: center;
      background: var(--bg); border-radius: 16px; overflow: hidden;
    }

    .drum-vp {
      flex: 1; height: 280px; overflow: hidden; position: relative;
      cursor: ns-resize; user-select: none; touch-action: none;
    }

    .drum-track { position: absolute; width: 100%; z-index: 2; }
    .drum-track.snap { transition: transform .3s cubic-bezier(.32,.72,0,1); }
    .drum-track.snap .drum-item { transition: opacity .15s, font-size .15s, color .15s; }

    .drum-item {
      height: 56px;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; font-weight: 600; color: var(--text-2); opacity: .25;
    }
    .drum-item.active {
      font-size: 38px; font-weight: 800; color: var(--primary); opacity: 1;
    }

    .drum-fade {
      position: absolute; left: 0; right: 0; height: 80px;
      pointer-events: none; z-index: 3;
    }
    .drum-fade.top    { top: 0;    background: linear-gradient(to bottom, var(--bg) 5%, transparent); }
    .drum-fade.bottom { bottom: 0; background: linear-gradient(to top,    var(--bg) 5%, transparent); }

    .drum-hl {
      position: absolute;
      top: 112px; /* VP_CY - ITEM_H/2 = 140 - 28 = 112 */
      left: 10px; right: 10px; height: 56px;
      background: var(--primary-light); border-radius: 12px;
      pointer-events: none; z-index: 1;
    }

    .drum-suffix {
      font-size: 32px; font-weight: 800; color: var(--primary);
      padding: 0 20px 0 4px; flex-shrink: 0;
    }

    .save-btn { margin-top: 0; }
    .btn.pulse { animation: checkPulse .4s ease both; }
  `]
})
export class ScheduleSheetComponent {
  private customer = inject(CustomerService);
  private telegram = inject(TelegramService);

  @Output() closed = new EventEmitter<void>();

  _open = false;

  @Input() set open(v: boolean) {
    this._open = v;
    if (v) {
      const c = this.customer.customer();
      if (c?.repetitionTime) {
        const h = parseInt(c.repetitionTime.split(':')[0], 10);
        this.selectedHour.set(isNaN(h) ? 20 : h);
      }
    }
  }

  readonly hours: number[] = Array.from({ length: 24 }, (_, i) => i);

  selectedHour = signal(20);
  saved        = signal(false);
  isDragging   = signal(false);
  drumOffset   = signal(0);

  private touchStartY    = 0;
  private touchStartHour = 0;
  private prevHapticH    = 20;

  drumY = computed(() =>
    VP_CY - ITEM_H / 2 - this.selectedHour() * ITEM_H + this.drumOffset()
  );

  onTouchStart(e: TouchEvent) {
    e.preventDefault();
    this.isDragging.set(true);
    this.touchStartY    = e.touches[0].clientY;
    this.touchStartHour = this.selectedHour();
    this.prevHapticH    = this.selectedHour();
  }

  onTouchMove(e: TouchEvent) {
    e.preventDefault();
    const dy    = this.touchStartY - e.touches[0].clientY;
    const steps = Math.round(dy / ITEM_H);
    const frac  = dy - steps * ITEM_H;
    const h     = Math.max(0, Math.min(23, this.touchStartHour + steps));
    this.selectedHour.set(h);
    this.drumOffset.set(-frac);
    if (h !== this.prevHapticH) {
      this.prevHapticH = h;
      this.telegram.hapticImpact('light');
    }
  }

  onTouchEnd(e: TouchEvent) {
    const dy = Math.abs(this.touchStartY - e.changedTouches[0].clientY);
    this.isDragging.set(false);
    this.drumOffset.set(0);
    if (dy < 6) {
      const vp    = e.currentTarget as HTMLElement;
      const rect  = vp.getBoundingClientRect();
      const tapY  = e.changedTouches[0].clientY - rect.top;
      const delta = Math.round((tapY - VP_CY + ITEM_H / 2) / ITEM_H);
      const h     = Math.max(0, Math.min(23, this.selectedHour() + delta));
      this.selectedHour.set(h);
      this.telegram.hapticImpact('light');
    }
  }

  onWheel(e: WheelEvent) {
    e.preventDefault();
    const h = Math.max(0, Math.min(23, this.selectedHour() + (e.deltaY > 0 ? 1 : -1)));
    if (h !== this.selectedHour()) {
      this.selectedHour.set(h);
      this.telegram.hapticImpact('light');
    }
  }

  save() {
    const time = `${this.padH(this.selectedHour())}:00`;
    this.customer.update({ repetitionTime: time }).subscribe(() => {
      this.saved.set(true);
      this.telegram.hapticNotification('success');
      setTimeout(() => { this.saved.set(false); this.closed.emit(); }, 1200);
    });
  }

  close() { this.closed.emit(); }
  padH(n: number) { return String(n).padStart(2, '0'); }
}
