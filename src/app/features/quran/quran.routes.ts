import { Routes } from '@angular/router';
import { QuranLayoutComponent } from './quran-layout/quran-layout.component';

export const QURAN_ROUTES: Routes = [
  {
    // عند الدخول إلى /quran، يتم تحميل التخطيط الجديد
    path: '',
    component: QuranLayoutComponent,
    children: [
      {
        // المسار الفارغ داخل قسم القرآن يوجه إلى سورة الفاتحة
        path: '',
        redirectTo: 'surah/1',
        pathMatch: 'full',
      },
      {
        // هذا المسار يعرض السورة داخل <router-outlet> الخاص بـ QuranLayoutComponent
        path: 'surah/:id',
        loadComponent: () => import('./reader/reader.component').then(c => c.ReaderComponent)
      }
    ]
  }
];
