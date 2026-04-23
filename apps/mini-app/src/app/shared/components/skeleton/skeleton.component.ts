import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `<div class="skeleton" [style.height.px]="height" [style.width]="width" [style.border-radius.px]="radius"></div>`,
  styles: [`
    .skeleton {
      background: linear-gradient(90deg, #EAECEF 0%, #DDE0E4 50%, #EAECEF 100%);
      background-size: 200%;
      animation: shimmer 1.4s linear infinite;
    }
    @keyframes shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position:  200% 0; }
    }
  `]
})
export class SkeletonComponent {
  @Input() height = 16;
  @Input() width = '100%';
  @Input() radius = 8;
}
