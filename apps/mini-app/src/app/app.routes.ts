import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'learn',
    loadComponent: () => import('./features/learn/learn.component').then(m => m.LearnComponent)
  },
  {
    path: 'repeat',
    loadComponent: () => import('./features/repeat/repeat.component').then(m => m.RepeatComponent)
  },
  {
    path: 'schedule',
    loadComponent: () => import('./features/schedule/schedule.component').then(m => m.ScheduleComponent)
  },
  {
    path: 'progress',
    loadComponent: () => import('./features/progress/progress.component').then(m => m.ProgressComponent)
  },
  {
    path: 'words',
    loadComponent: () => import('./features/words/words.component').then(m => m.WordsComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
  },
  {
    path: 'practice',
    loadComponent: () => import('./features/practice/practice.component').then(m => m.PracticeComponent)
  },
  { path: '**', redirectTo: 'home' }
];
