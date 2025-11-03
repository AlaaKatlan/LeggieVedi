// src/app/features/admin/articles-manager/articles-manager.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AdminService } from '../../../core/services/admin.service';
import { Article } from '../../../core/models/article.model';

@Component({
  selector: 'app-articles-manager',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="articles-manager">
      <!-- Header -->
      <div class="page-header">
        <h1>إدارة المقالات</h1>
        <a routerLink="/admin/articles/new" class="btn-primary">
          <i class="fas fa-plus"></i>
          مقال جديد
        </a>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <input
          type="search"
          placeholder="بحث في المقالات..."
          [(ngModel)]="searchTerm"
          (input)="filterArticles()"
          class="search-input"
        />
        <select [(ngModel)]="selectedCategory" (change)="filterArticles()" class="filter-select">
          <option value="">كل الفئات</option>
          <option value="نصوص">نصوص</option>
          <option value="مقالات">مقالات</option>
          <option value="وجدانيات">وجدانيات</option>
        </select>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>جاري تحميل المقالات...</p>
        </div>
      } @else {
        <!-- Articles Table -->
        <div class="table-container">
          @if (filteredArticles().length === 0) {
            <div class="empty-state">
              <i class="fas fa-inbox"></i>
              <p>لا توجد مقالات</p>
            </div>
          } @else {
            <table class="data-table">
              <thead>
                <tr>
                  <th>العنوان</th>
                  <th>الفئة</th>
                  <th>تاريخ النشر</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                @for (article of filteredArticles(); track article.id) {
                  <tr>
                    <td>
                      <div class="article-cell">
                        @if (article.cover_image_url) {
                          <img [src]="article.cover_image_url" alt="" class="article-thumb" />
                        }
                        <span>{{ article.title }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="badge">{{ article.category }}</span>
                    </td>
                    <td>{{ article.published_at | date: 'short' }}</td>
                    <td>
                      <div class="action-buttons">
                        <a [routerLink]="['/blog', article.slug]" target="_blank" class="btn-icon" title="معاينة">
                          <i class="fas fa-eye"></i>
                        </a>
                        <a [routerLink]="['/admin/articles/edit', article.id]" class="btn-icon" title="تعديل">
                          <i class="fas fa-edit"></i>
                        </a>
                        <button (click)="deleteArticle(article)" class="btn-icon btn-danger" title="حذف">
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
    </div>

    <!-- Delete Confirmation Modal -->
    @if (articleToDelete()) {
      <div class="modal-backdrop" (click)="cancelDelete()"></div>
      <div class="modal">
        <div class="modal-header">
          <h3>تأكيد الحذف</h3>
          <button class="close-btn" (click)="cancelDelete()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>هل أنت متأكد من حذف المقال: <strong>{{ articleToDelete()?.title }}</strong>؟</p>
          <p class="warning">⚠️ هذا الإجراء لا يمكن التراجع عنه!</p>
        </div>
        <div class="modal-footer">
          <button (click)="cancelDelete()" class="btn-secondary">إلغاء</button>
          <button (click)="confirmDelete()" class="btn-danger" [disabled]="deleting()">
            @if (deleting()) {
              <span class="spinner-sm"></span>
              جاري الحذف...
            } @else {
              حذف
            }
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .articles-manager {
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;

      h1 {
        font-size: 2rem;
        color: #0f172a;
        margin: 0;
      }
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, #01579b, #00897b);
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(1, 87, 155, 0.3);
      }
    }

    .filters-bar {
      background: white;
      padding: 1.5rem;
      border-radius: 1rem;
      margin-bottom: 2rem;
      display: flex;
      gap: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .search-input {
      flex: 1;
      padding: 0.75rem 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 1rem;
      transition: all 0.3s ease;

      &:focus {
        outline: none;
        border-color: #01579b;
        box-shadow: 0 0 0 3px rgba(1, 87, 155, 0.1);
      }
    }

    .filter-select {
      padding: 0.75rem 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;

      &:focus {
        outline: none;
        border-color: #01579b;
      }
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

    .table-container {
      background: white;
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;

      thead {
        background: #f8fafc;

        th {
          padding: 1rem;
          text-align: right;
          font-weight: 700;
          color: #475569;
          border-bottom: 2px solid #e2e8f0;
        }
      }

      tbody {
        tr {
          border-bottom: 1px solid #e2e8f0;
          transition: background 0.2s ease;

          &:hover {
            background: #f8fafc;
          }

          td {
            padding: 1rem;
          }
        }
      }
    }

    .article-cell {
      display: flex;
      align-items: center;
      gap: 1rem;

      .article-thumb {
        width: 50px;
        height: 50px;
        object-fit: cover;
        border-radius: 0.5rem;
      }
    }

    .badge {
      display: inline-block;
      padding: 0.375rem 0.75rem;
      background: linear-gradient(135deg, #01579b, #00897b);
      color: white;
      border-radius: 1rem;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: #e2e8f0;
      color: #475569;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;

      &:hover {
        background: #01579b;
        color: white;
        transform: translateY(-2px);
      }

      &.btn-danger:hover {
        background: #ef4444;
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      color: #94a3b8;

      i {
        font-size: 4rem;
        margin-bottom: 1rem;
      }

      p {
        font-size: 1.25rem;
      }
    }

    /* Modal Styles */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 9998;
      animation: fadeIn 0.2s ease;
    }

    .modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 1rem;
      width: 90%;
      max-width: 500px;
      z-index: 9999;
      animation: slideUp 0.3s ease;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translate(-50%, -40%);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%);
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e2e8f0;

      h3 {
        margin: 0;
        color: #0f172a;
        font-size: 1.25rem;
      }

      .close-btn {
        background: none;
        border: none;
        color: #64748b;
        font-size: 1.5rem;
        cursor: pointer;
        transition: color 0.3s ease;

        &:hover {
          color: #0f172a;
        }
      }
    }

    .modal-body {
      padding: 1.5rem;

      p {
        margin: 0 0 1rem 0;
        color: #475569;
        line-height: 1.6;
      }

      .warning {
        color: #f59e0b;
        font-weight: 600;
      }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #e2e8f0;
    }

    .btn-secondary {
      padding: 0.75rem 1.5rem;
      background: #e2e8f0;
      color: #475569;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: #cbd5e1;
      }
    }

    .btn-danger {
      padding: 0.75rem 1.5rem;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      &:hover:not(:disabled) {
        background: #dc2626;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .spinner-sm {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .filters-bar {
        flex-direction: column;
      }

      .table-container {
        overflow-x: auto;
      }
    }
  `]
})
export class ArticlesManagerComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private adminService = inject(AdminService);

  allArticles = signal<Article[]>([]);
  filteredArticles = signal<Article[]>([]);
  loading = signal(true);

  searchTerm = '';
  selectedCategory = '';

  articleToDelete = signal<Article | null>(null);
  deleting = signal(false);

  async ngOnInit() {
    await this.loadArticles();
  }

  async loadArticles() {
    try {
      const articles = await this.supabaseService.getAllArticles();
      this.allArticles.set(articles);
      this.filteredArticles.set(articles);
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      this.loading.set(false);
    }
  }

  filterArticles() {
    let filtered = this.allArticles();

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(term) ||
        a.content?.toLowerCase().includes(term)
      );
    }

    // Filter by category
    if (this.selectedCategory) {
      filtered = filtered.filter(a => a.category === this.selectedCategory);
    }

    this.filteredArticles.set(filtered);
  }

  deleteArticle(article: Article) {
    this.articleToDelete.set(article);
  }

  cancelDelete() {
    this.articleToDelete.set(null);
  }

  async confirmDelete() {
    const article = this.articleToDelete();
    if (!article) return;

    this.deleting.set(true);

    try {
      await this.adminService.deleteArticle(article.id);

      // Remove from local state
      this.allArticles.update(articles =>
        articles.filter(a => a.id !== article.id)
      );
      this.filterArticles();

      this.articleToDelete.set(null);
    } catch (error) {
      console.error('Failed to delete article:', error);
      alert('فشل حذف المقال. حاول مرة أخرى.');
    } finally {
      this.deleting.set(false);
    }
  }
}
