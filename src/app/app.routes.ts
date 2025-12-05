import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/tutor',
    pathMatch: 'full'
  },
  {
    path: 'tutor',
    loadComponent: () => import('./features/note-tutor/note-tutor/note-tutor').then(m => m.NoteTutor)
  },
  {
    path: '**',
    redirectTo: '/tutor'
  }
];
