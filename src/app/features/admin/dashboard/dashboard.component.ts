// src/app/features/admin/dashboard/dashboard.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';

interface Stats {
  articlesCount: number;
  artworksCount: number;
  videosCount: number;
  publicationsCount: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-overview">
      <h1 class="page-title">لوحة التحكم - Dashboard Overview</h1>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>جاري تحميل الإحصائيات...</p>
        </div>
      } @else {
        <!-- Statistics Cards -->
        <div class="stats-grid">
          <div class="stat-card articles">
            <div class="stat-icon">
              <i class="fas fa-newspaper"></i>
            </div>
            <div class="stat-info">
              <h3>المقالات</h3>
              <p class="stat-number">{{ stats().articlesCount }}</p>
              <a routerLink="/admin/articles" class="stat-link">
                إدارة المقالات →
              </a>
            </div>
          </div>

          <div class="stat-card artworks">
            <div class="stat-icon">
              <i class="fas fa-palette"></i>
            </div>
            <div class="stat-info">
              <h3>الأعمال الفنية</h3>
              <p class="stat-number">{{ stats().artworksCount }}</p>
              <a routerLink="/admin/artworks" class="stat-link">
                إدارة الأعمال →
              </a>
            </div>
          </div>

          <div class="stat-card videos">
            <div class="stat-icon">
              <i class="fas fa-video"></i>
            </div>
            <div class="stat-info">
              <h3>الفيديوهات</h3>
              <p class="stat-number">{{ stats().videosCount }}</p>
              <a routerLink="/admin/videos" class="stat-link">
                إدارة الفيديوهات →
              </a>
            </div>
          </div>

          <div class="stat-card publications">
            <div class="stat-icon">
              <i class="fas fa-book"></i>
            </div>
            <div class="stat-info">
              <h3>المنشورات</h3>
              <p class="stat-number">{{ stats().publicationsCount }}</p>
              <a routerLink="/admin/publications" class="stat-link">
                إدارة المنشورات →
              </a>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <h2>إجراءات سريعة</h2>
          <div class="actions-grid">
            <a routerLink="/admin/articles/new" class="action-card">
              <i class="fas fa-plus-circle"></i>
              <span>مقال جديد</span>
            </a>
            <a routerLink="/admin/artworks" class="action-card">
              <i class="fas fa-image"></i>
              <span>إضافة عمل فني</span>
            </a>
            <a routerLink="/admin/videos" class="action-card">
              <i class="fas fa-video-plus"></i>
              <span>إضافة فيديو</span>
            </a>
            <a routerLink="/admin/publications" class="action-card">
              <i class="fas fa-book-medical"></i>
              <span>إضافة منشور</span>
            </a>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="recent-activity">
          <h2>النشاط الأخير</h2>
          <div class="activity-list">
            <div class="activity-item">
              <i class="fas fa-check-circle"></i>
              <span>تم تحديث الصفحة الرئيسية بنجاح</span>
              <time>منذ ساعتين</time>
            </div>
            <div class="activity-item">
              <i class="fas fa-plus-circle"></i>
              <span>تمت إضافة مقال جديد</span>
              <time>منذ 5 ساعات</time>
            </div>
            <div class="activity-item">
              <i class="fas fa-edit"></i>
              <span>تم تعديل عمل فني</span>
              <time>أمس</time>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-overview {
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-title {
      font-size: 2rem;
      color: #0f172a;
      margin-bottom: 2rem;
      font-weight: 800;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: 1rem;
    }

    .spinner {
      width: 60px;
      height: 60px;
      border: 4px solid #e2e8f0;
      border-top-color: #01579b;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .stat-card {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      display: flex;
      align-items: center;
      gap: 1.5rem;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      }

      &.articles { border-left: 4px solid #3b82f6; }
      &.artworks { border-left: 4px solid #8b5cf6; }
      &.videos { border-left: 4px solid #ef4444; }
      &.publications { border-left: 4px solid #10b981; }
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;

      .articles & {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
      }

      .artworks & {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        color: white;
      }

      .videos & {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
      }

      .publications & {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
      }
    }

    .stat-info {
      flex: 1;

      h3 {
        margin: 0 0 0.5rem 0;
        color: #64748b;
        font-size: 0.95rem;
        font-weight: 600;
      }

      .stat-number {
        margin: 0;
        font-size: 2rem;
        font-weight: 800;
        color: #0f172a;
      }

      .stat-link {
        display: inline-block;
        margin-top: 0.5rem;
        color: #01579b;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.3s ease;

        &:hover {
          transform: translateX(-5px);
        }
      }
    }

    .quick-actions,
    .recent-activity {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);

      h2 {
        margin: 0 0 1.5rem 0;
        font-size: 1.5rem;
        color: #0f172a;
      }
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 2rem;
      background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
      border-radius: 1rem;
      text-decoration: none;
      color: #0f172a;
      transition: all 0.3s ease;

      i {
        font-size: 2rem;
        color: #01579b;
      }

      span {
        font-weight: 600;
        text-align: center;
      }

      &:hover {
        background: linear-gradient(135deg, #01579b, #00897b);
        color: white;
        transform: translateY(-5px);

        i {
          color: white;
        }
      }
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      border-left: 3px solid #01579b;

      i {
        color: #10b981;
        font-size: 1.2rem;
      }

      span {
        flex: 1;
        color: #334155;
        font-weight: 500;
      }

      time {
        color: #94a3b8;
        font-size: 0.85rem;
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .actions-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private adminService = inject(AdminService);

  stats = signal<Stats>({
    articlesCount: 0,
    artworksCount: 0,
    videosCount: 0,
    publicationsCount: 0
  });

  loading = signal(true);

  async ngOnInit() {
    try {
      const data = await this.adminService.getDashboardStats();
      this.stats.set(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      this.loading.set(false);
    }
  }
}
