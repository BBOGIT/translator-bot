import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-toggle',
  standalone: true,
  template: `
    <button type="button" class="toggle" [class.on]="value" (click)="toggle()" role="switch" [attr.aria-checked]="value">
      <span class="thumb"></span>
    </button>
  `,
  styles: [`
    .toggle {
      width: 50px;
      height: 28px;
      border-radius: 14px;
      background: #D1D5DB;
      border: none;
      cursor: pointer;
      position: relative;
      transition: background 0.25s ease;
      flex-shrink: 0;
    }
    .toggle.on {
      background: var(--primary);
    }
    .thumb {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.18);
      transition: left 0.3s var(--spring);
    }
    .toggle.on .thumb {
      left: 25px;
    }
  `],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => ToggleComponent),
    multi: true
  }]
})
export class ToggleComponent implements ControlValueAccessor {
  @Input() value = false;
  @Output() valueChange = new EventEmitter<boolean>();

  private onChange = (_: boolean) => {};
  private onTouched = () => {};

  toggle() {
    this.value = !this.value;
    this.valueChange.emit(this.value);
    this.onChange(this.value);
    this.onTouched();
  }

  writeValue(val: boolean) { this.value = val; }
  registerOnChange(fn: (v: boolean) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
}
