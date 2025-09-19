import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'surah/:id', // مسار لعرض سورة معينة
        loadComponent: () =>
            import('./features/reader/reader.component').then(c => c.ReaderComponent)
      },
      {
        path: '', // الصفحة الرئيسية
        redirectTo: 'surah/1', // افتراضيًا يفتح سورة الفاتحة
        pathMatch: 'full'
      }
    ]
  },
  { path: '**', redirectTo: '' } // لأي مسار آخر، العودة للصفحة الرئيسية
];
