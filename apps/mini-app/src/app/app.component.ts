import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TelegramService } from './core/services/telegram.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
  styles: [':host { display: block; height: 100%; }']
})
export class AppComponent implements OnInit {
  private telegram = inject(TelegramService);

  ngOnInit() {
    this.telegram.ready();
    this.telegram.expand();

    if (this.telegram.colorScheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }
}
