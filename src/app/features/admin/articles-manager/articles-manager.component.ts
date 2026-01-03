import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Article } from '../../../core/models/article.model';

@Component({
  selector: 'app-articles-manager',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="manager-container">
      <div class="page-header">
        <h1>إدارة المقالات</h1>
        <a routerLink="/admin/articles/new" class="btn-primary">
          <i class="fas fa-plus"></i>
          مقال جديد
        </a>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>جاري تحميل المقالات...</p>
        </div>
      } @else {
        <div class="table-container">
          @if (articles().length === 0) {
            <div class="empty-state">
              <i class="fas fa-newspaper"></i>
              <p>لا توجد مقالات حالياً</p>
            </div>
          } @else {
            <table class="data-table">
              <thead>
                <tr>
                  <th>العنوان</th>
                  <th>التصنيف</th>
                  <th>تاريخ النشر</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                @for (article of articles(); track article.id) {
                  <tr>
                    <td class="font-bold">{{ article.title }}</td>
                    <td><span class="badge">{{ article.category }}</span></td>
                    <td>{{ article.published_at | date:'yyyy/MM/dd' }}</td>
                    <td>
                      <span class="status-active">منشور</span>
                    </td>
                    <td>
                      <div class="action-buttons">
                        <a [routerLink]="['/admin/articles/edit', article.id]" class="btn-icon" title="تعديل">
                          <i class="fas fa-edit"></i>
                        </a>
                        <button (click)="confirmDelete(article)" class="btn-icon btn-danger" title="حذف">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }

      @if (articleToDelete()) {
        <div class="custom-backdrop" (click)="cancelDelete()"></div>
        <div class="custom-modal confirm-modal">
          <div class="modal-header">
            <h3>تأكيد الحذف</h3>
            <button class="close-btn" (click)="cancelDelete()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <p>هل أنت متأكد من حذف المقال: <strong>{{ articleToDelete()?.title }}</strong>؟</p>
            <p class="warning">⚠️ لا يمكن التراجع عن هذا الإجراء.</p>
          </div>
          <div class="modal-footer">
            <button (click)="cancelDelete()" class="btn-secondary">إلغاء</button>
            <button (click)="deleteArticle()" class="btn-danger" [disabled]="deleting()">
              @if (deleting()) { <span class="spinner-sm"></span> }
              حذف
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .manager-container { max-width: 1400px; margin: 0 auto; padding: 1rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .page-header h1 { font-size: 2rem; color: #0f172a; margin: 0; }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, #01579b, #00897b); color: white; border: none;
      border-radius: 0.5rem; font-weight: 600; cursor: pointer; text-decoration: none;
      transition: all 0.3s ease;
    }

    .table-container { background: white; border-radius: 1rem; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { padding: 1rem; text-align: right; background: #f8fafc; color: #475569; border-bottom: 2px solid #e2e8f0; font-weight: 700; }
    .data-table td { padding: 1rem; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    .data-table tr:hover { background: #f8fafc; }

    .badge { padding: 0.35rem 0.75rem; background: #e0f2fe; color: #0284c7; border-radius: 1rem; font-size: 0.85rem; font-weight: 600; }
    .status-active { color: #16a34a; font-weight: 600; font-size: 0.9rem; }

    .action-buttons { display: flex; gap: 0.5rem; }
    .btn-icon {
      width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
      border: none; background: #f1f5f9; color: #475569; border-radius: 0.5rem; cursor: pointer; text-decoration: none;
    }
    .btn-icon:hover { background: #01579b; color: white; }
    .btn-danger:hover { background: #ef4444; }

    /* Modal Styles */
    .custom-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 9998; }
    .custom-modal {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: white; border-radius: 1rem; width: 90%; z-index: 9999;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3); padding: 0;
    }
    .confirm-modal { max-width: 450px; }

    .modal-header { padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .modal-body { padding: 1.5rem; }
    .modal-footer { padding: 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 1rem; }
    .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #94a3b8; }

    .btn-secondary { padding: 0.75rem 1.5rem; background: #f1f5f9; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; color: #475569; }
    .btn-danger { padding: 0.75rem 1.5rem; background: #ef4444; color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; }

    .loading-state, .empty-state { padding: 4rem; text-align: center; color: #94a3b8; }
    .spinner { width: 50px; height: 50px; border: 4px solid #e2e8f0; border-top-color: #01579b; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
    .spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ArticlesManagerComponent implements OnInit {
  private adminService = inject(AdminService);
  private supabaseService = inject(SupabaseService);

  articles = signal<Article[]>([]);
  loading = signal(true);

  articleToDelete = signal<Article | null>(null);
  deleting = signal(false);

  async ngOnInit() {
    await this.loadArticles();
  }

  async loadArticles() {
    this.loading.set(true);
    try {
      const data = await this.supabaseService.getAllArticles();
      this.articles.set(data);
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      this.loading.set(false);
    }
  }

  confirmDelete(article: Article) {
    this.articleToDelete.set(article);
  }

  cancelDelete() {
    this.articleToDelete.set(null);
  }

  async deleteArticle() {
    const article = this.articleToDelete();
    if (!article) return;

    this.deleting.set(true);
    try {
      await this.adminService.deleteArticle(article.id);
      this.articles.update(list => list.filter(a => a.id !== article.id));
      this.articleToDelete.set(null);
    } catch (error) {
      console.error('Failed to delete article:', error);
      alert('فشل حذف المقال');
    } finally {
      this.deleting.set(false);
    }
  }
}
