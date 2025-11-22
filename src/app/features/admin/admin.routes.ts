// src/app/features/admin/admin.routes.ts
import { Routes } from '@angular/router';
import { AdminGuard } from '../../core/guards/admin.guard';

// إضافة في src/app/app.routes.ts
// import { ADMIN_ROUTES } from './features/admin/admin.routes';

// داخل routes:
// {
//   path: 'admin',
//   loadChildren: () => import('./features/admin/admin.routes').then(r => r.ADMIN_ROUTES)
// }

export const ADMIN_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(c => c.LoginComponent)
  },
  {
    path: '',
    canActivate: [AdminGuard],
    loadComponent: () => import('./dashboard-layout/dashboard-layout.component').then(c => c.DashboardLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full'
      },
      {
        path: 'overview',
        loadComponent: () => import('./dashboard/dashboard.component').then(c => c.DashboardComponent)
      },
      {
        path: 'articles',
        loadComponent: () => import('./articles-manager/articles-manager.component').then(c => c.ArticlesManagerComponent)
      },
      {
        path: 'articles/new',
        loadComponent: () => import('./article-editor/article-editor.component').then(c => c.ArticleEditorComponent)
      },
      {
        path: 'articles/edit/:id',
        loadComponent: () => import('./article-editor/article-editor.component').then(c => c.ArticleEditorComponent)
      },
      {
        path: 'artworks',
        loadComponent: () => import('./artworks-manager/artworks-manager.component').then(c => c.ArtworksManagerComponent)
      },
      {
        path: 'videos',
        loadComponent: () => import('./videos-manager/videos-manager.component').then(c => c.VideosManagerComponent)
      },
      {
        path: 'publications',
        loadComponent: () => import('./publications-manager/publications-manager.component').then(c => c.PublicationsManagerComponent)
      },
      // في admin.routes.ts
      {
        path: 'quran',
        loadChildren: () =>
          import('./quran-manager/quran-admin.routes')
            .then(r => r.QURAN_ADMIN_ROUTES)
      }
    ]
  }
];
