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
      {
        path: 'blog/:slug',
        loadComponent: () => import('./features/blog/article-detail/article-detail.component').then(c => c.ArticleDetailComponent),
      },
      // --- NEW ROUTE FOR ARTWORK DETAIL ---
      {
        path: 'artwork/:id',
        title: 'Artwork Details',
        // You can create this component later
        loadComponent: () => import('./features/gallery/artwork-detail/artwork-detail.component').then(c => c.ArtworkDetailComponent),
      }
    ]
  },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
