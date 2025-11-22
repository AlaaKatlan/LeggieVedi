// src/app/features/admin/quran-manager/quran-admin.routes.ts
import { Routes } from '@angular/router';

export const QURAN_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./quran-manager.component')
      .then(c => c.QuranManagerComponent)
  },
  {
    path: 'surahs',
    loadComponent: () =>
      import('./surah-manager/surah-manager.component')
      .then(c => c.SurahsManagerComponent)
  },
  {
    path: 'ayahs',
    loadComponent: () =>
      import('./ayahs-manager/ayahs-manager.component')
      .then(c => c.AyahsManagerComponent)
  },
  {
    path: 'tafsirs',
    loadComponent: () =>
      import('./tafsirs-manager/tafsirs-manager.component')
      .then(c => c.TafsirsManagerComponent)
  },
  {
    path: 'footnotes',
    loadComponent: () =>
      import('./footnotes-manager/footnotes-manager.component')
      .then(c => c.FootnotesManagerComponent)
  },
  {
    path: 'interpreters',
    loadComponent: () =>
      import('./interpreters-manager/interpreters-manager.component')
      .then(c => c.InterpretersManagerComponent)
  }
];
