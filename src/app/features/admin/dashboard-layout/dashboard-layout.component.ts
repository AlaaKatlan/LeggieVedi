// src/app/features/admin/dashboard-layout/dashboard-layout.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="isSidebarCollapsed()">
        <div class="sidebar-header">
          <h2 *ngIf="!isSidebarCollapsed()">Admin Panel</h2>
          <button class="toggle-btn" (click)="toggleSidebar()">
            <i class="fas" [class.fa-bars]="isSidebarCollapsed()" [class.fa-times]="!isSidebarCollapsed()"></i>
          </button>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/admin/overview" routerLinkActive="active" class="nav-item">
            <i class="fas fa-chart-line"></i>
            <span *ngIf="!isSidebarCollapsed()">نظرة عامة</span>
          </a>
          <a routerLink="/admin/articles" routerLinkActive="active" class="nav-item">
            <i class="fas fa-newspaper"></i>
            <span *ngIf="!isSidebarCollapsed()">المقالات</span>
          </a>
          <a routerLink="/admin/artworks" routerLinkActive="active" class="nav-item">
            <i class="fas fa-palette"></i>
            <span *ngIf="!isSidebarCollapsed()">الأعمال الفنية</span>
          </a>
          <a routerLink="/admin/videos" routerLinkActive="active" class="nav-item">
            <i class="fas fa-video"></i>
            <span *ngIf="!isSidebarCollapsed()">الفيديوهات</span>
          </a>
          <a routerLink="/admin/publications" routerLinkActive="active" class="nav-item">
            <i class="fas fa-book"></i>
            <span *ngIf="!isSidebarCollapsed()">المنشورات</span>
          </a>
          <a routerLink="/admin/quran" routerLinkActive="active" class="nav-item">
            <i class="fas fa-quran"></i>
            <span *ngIf="!isSidebarCollapsed()">القرآن الكريم</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <button class="logout-btn" (click)="logout()">
            <i class="fas fa-sign-out-alt"></i>
            <span *ngIf="!isSidebarCollapsed()">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Top Bar -->
        <header class="top-bar">
          <div class="breadcrumb">
            <i class="fas fa-home"></i>
            Dashboard
          </div>
          <div class="user-info">
            <span class="user-email">{{ authService.currentUser()?.email }}</span>
            <span class="user-role">{{ authService.currentUser()?.role }}</span>
          </div>
        </header>

        <!-- Content Area -->
        <div class="content-area">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-layout {
      display: flex;
      height: 100vh;
      background: #f1f5f9;
    }

    .sidebar {
      width: 260px;
      background: linear-gradient(180deg, #01579b, #004d7a);
      color: white;
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      box-shadow: 4px 0 15px rgba(0, 0, 0, 0.1);

      &.collapsed {
        width: 80px;
      }
    }

    .sidebar-header {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      h2 {
        margin: 0;
        font-size: 1.5rem;
      }

      .toggle-btn {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      }
    }

    .sidebar-nav {
      flex: 1;
      padding: 1rem 0;
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
      }
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      transition: all 0.3s ease;
      font-weight: 500;

      i {
        font-size: 1.2rem;
        width: 24px;
        text-align: center;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }

      &.active {
        background: rgba(255, 255, 255, 0.15);
        color: white;
        border-right: 4px solid #00897b;
      }
    }

    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: white;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 0, 0, 0.3);
      }
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .top-bar {
      background: white;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      z-index: 10;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #64748b;
      font-weight: 600;

      i {
        color: #01579b;
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;

      .user-email {
        color: #334155;
        font-weight: 600;
      }

      .user-role {
        background: linear-gradient(135deg, #01579b, #00897b);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 700;
        text-transform: uppercase;
      }
    }

    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
    }

    @media (max-width: 768px) {
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        z-index: 1000;
        transform: translateX(-100%);

        &:not(.collapsed) {
          transform: translateX(0);
        }
      }
    }
  `]
})
export class DashboardLayoutComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  isSidebarCollapsed = signal(false);

  toggleSidebar() {
    this.isSidebarCollapsed.update(v => !v);
  }

  async logout() {
    await this.authService.logout();
  }
}
