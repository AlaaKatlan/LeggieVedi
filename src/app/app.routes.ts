import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(c => c.MainLayoutComponent),
    children: [
      {
        path: '',
        title: 'Nabil Al-Muhaini - Home',
        loadComponent: () => import('./features/home/home.component').then(c => c.HomeComponent),
      },
      {
        path: 'quran',
        title: 'Qur\'an Reader',
        loadChildren: () => import('./features/quran/quran.routes').then(r => r.QURAN_ROUTES),
      },
      {
        path: 'gallery',
        title: 'Art Gallery',
        loadComponent: () => import('./features/gallery/gallery.component').then(c => c.GalleryComponent),
      },

      // --- ترتيب مسارات المدونة الصحيح ---
      {
        path: 'blog', // <-- المسار المحدد يأتي أولاً
        title: 'My Articles',
        loadComponent: () => import('./features/blog/blog.component').then(c => c.BlogComponent),
      },
      {
        path: 'blog/:slug', // <-- المسار الذي يحتوي على متغير يأتي ثانياً
        loadComponent: () => import('./features/blog/article-detail/article-detail.component').then(c => c.ArticleDetailComponent),
      },
      // ------------------------------------

      {
        path: 'artwork/:id',
        title: 'Artwork Details',
        loadComponent: () => import('./features/gallery/artwork-detail/artwork-detail.component').then(c => c.ArtworkDetailComponent),
      }
    ]
  },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
