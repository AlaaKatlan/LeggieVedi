// src/app/features/admin/article-editor/article-editor.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Article } from '../../../core/models/article.model';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';

@Component({
  selector: 'app-article-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, CKEditorModule],
  template: `
    <div class="article-editor">
      <div class="editor-header">
        <h1>{{ isEditMode() ? 'تعديل المقال' : 'مقال جديد' }}</h1>
        <button (click)="goBack()" class="btn-secondary">
          <i class="fas fa-arrow-right"></i>
          رجوع
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>جاري التحميل...</p>
        </div>
      } @else {
        <form (ngSubmit)="onSubmit()" class="editor-form">
          <!-- Title -->
          <div class="form-group">
            <label for="title" class="required">عنوان المقال</label>
            <input
              type="text"
              id="title"
              [(ngModel)]="formData.title"
              name="title"
              required
              placeholder="أدخل عنوان المقال"
            />
          </div>

          <!-- Slug -->
          <div class="form-group">
            <label for="slug" class="required">الرابط (Slug)</label>
            <input
              type="text"
              id="slug"
              [(ngModel)]="formData.slug"
              name="slug"
              required
              placeholder="article-slug"
            />
            <small>سيظهر في الرابط: /blog/{{ formData.slug || 'slug' }}</small>
          </div>

          <!-- Category -->
          <div class="form-group">
            <label for="category" class="required">الفئة</label>
            <select id="category" [(ngModel)]="formData.category" name="category" required>
              <option value="">اختر الفئة</option>
              <option value="نصوص">نصوص</option>
              <option value="مقالات">مقالات</option>
              <option value="وجدانيات">وجدانيات</option>
            </select>
          </div>

          <!-- Excerpt -->
          <div class="form-group">
            <label for="excerpt">مقتطف (اختياري)</label>
            <textarea
              id="excerpt"
              [(ngModel)]="formData.excerpt"
              name="excerpt"
              rows="3"
              placeholder="مقتطف قصير عن المقال"
            ></textarea>
          </div>

          <!-- Cover Image -->
          <div class="form-group">
            <label for="cover_image">صورة الغلاف (اختياري)</label>
            <div class="image-upload">
              @if (formData.cover_image_url) {
                <div class="image-preview">
                  <img [src]="formData.cover_image_url" alt="Cover" />
                  <button type="button" (click)="removeCoverImage()" class="remove-btn">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              } @else {
                <input
                  type="file"
                  id="cover_image"
                  (change)="onImageSelected($event)"
                  accept="image/*"
                />
                <label for="cover_image" class="file-label">
                  <i class="fas fa-cloud-upload-alt"></i>
                  اختر صورة
                </label>
              }
            </div>
          </div>

          <!-- Is Link (External Article) -->
          <div class="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                [(ngModel)]="formData.is_link"
                name="is_link"
              />
              <span>مقال خارجي (رابط لملف Google Docs أو PDF)</span>
            </label>
          </div>

          <!-- Article Link (if is_link is true) -->
          @if (formData.is_link) {
            <div class="form-group">
              <label for="article_link" class="required">رابط المقال</label>
              <input
                type="url"
                id="article_link"
                [(ngModel)]="formData.article_link"
                name="article_link"
                placeholder="https://docs.google.com/document/..."
              />
              <small>أدخل رابط Google Docs أو PDF</small>
            </div>
          } @else {
            <!-- Content (if is_link is false) -->
            <div class="form-group">
              <label for="content" class="required">محتوى المقال</label>
              <textarea
                id="content"
                [(ngModel)]="formData.content"
                name="content"
                rows="20"
                placeholder="اكتب محتوى المقال هنا (يدعم HTML)"
              ></textarea>
            </div>
          }

          <!-- Published Date -->
          <div class="form-group">
            <label for="published_at" class="required">تاريخ النشر</label>
            <input
              type="datetime-local"
              id="published_at"
              [(ngModel)]="formData.published_at"
              name="published_at"
              required
            />
          </div>
<!-- <ckeditor
  [editor]="Editor"
  [(ngModel)]="formData.content"
  name="content">
</ckeditor> -->
          <!-- Submit Buttons -->
          <div class="form-actions">
            <button type="button" (click)="goBack()" class="btn-secondary">
              إلغاء
            </button>
            <button type="submit" class="btn-primary" [disabled]="saving()">
              @if (saving()) {
                <span class="spinner-sm"></span>
                جاري الحفظ...
              } @else {
                <i class="fas fa-save"></i>
                حفظ المقال
              }
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .article-editor {
      max-width: 900px;
      margin: 0 auto;
    }

    .editor-header {
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

    .editor-form {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .form-group {
      margin-bottom: 1.5rem;

      label {
        display: block;
        font-weight: 600;
        color: #334155;
        margin-bottom: 0.5rem;

        &.required::after {
          content: ' *';
          color: #ef4444;
        }
      }

      input[type="text"],
      input[type="url"],
      input[type="datetime-local"],
      select,
      textarea {
        width: 100%;
        padding: 0.875rem 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 0.5rem;
        font-size: 1rem;
        font-family: inherit;
        transition: all 0.3s ease;

        &:focus {
          outline: none;
          border-color: #01579b;
          box-shadow: 0 0 0 3px rgba(1, 87, 155, 0.1);
        }
      }

      textarea {
        resize: vertical;
        font-family: 'Courier New', monospace;
      }

      small {
        display: block;
        margin-top: 0.5rem;
        color: #64748b;
        font-size: 0.875rem;
      }
    }

    .checkbox-group {
      label {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;

        input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        span {
          font-weight: 500;
        }
      }
    }

    .image-upload {
      input[type="file"] {
        display: none;
      }

      .file-label {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 2rem;
        background: #f1f5f9;
        border: 2px dashed #cbd5e1;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.3s ease;

        i {
          font-size: 1.5rem;
          color: #01579b;
        }

        &:hover {
          background: #e2e8f0;
          border-color: #01579b;
        }
      }

      .image-preview {
        position: relative;
        display: inline-block;

        img {
          max-width: 300px;
          border-radius: 0.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .remove-btn {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 32px;
          height: 32px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            background: #dc2626;
            transform: scale(1.1);
          }
        }
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #e2e8f0;
    }

    .btn-primary,
    .btn-secondary {
      padding: 0.875rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #01579b, #00897b);
      color: white;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(1, 87, 155, 0.3);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #475569;

      &:hover {
        background: #cbd5e1;
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
  `]
})
export class ArticleEditorComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private adminService = inject(AdminService);
  private supabaseService = inject(SupabaseService);
public Editor = ClassicEditor;

  loading = signal(true);
  saving = signal(false);
  isEditMode = signal(false);

  formData: Partial<Article> = {
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    category: '',
    published_at: new Date().toISOString().slice(0, 16),
    cover_image_url: '',
    is_link: false,
    article_link: ''
  };

  private articleId: number | null = null;

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isEditMode.set(true);
      this.articleId = parseInt(id);
      await this.loadArticle(this.articleId);
    }

    this.loading.set(false);
  }

  async loadArticle(id: number) {
    try {
      const article = await this.supabaseService.getArticleBySlug(''); // Need to get by ID
      // Temporary: load all and find by ID
      const articles = await this.supabaseService.getAllArticles();
      const found = articles.find(a => a.id === id);

      if (found) {
        this.formData = { ...found };
      }
    } catch (error) {
      console.error('Failed to load article:', error);
    }
  }

  async onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    try {
      const url = await this.adminService.uploadImage(file, 'articles');
      this.formData.cover_image_url = url;
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('فشل رفع الصورة');
    }
  }

  removeCoverImage() {
    this.formData.cover_image_url = '';
  }

  async onSubmit() {
    this.saving.set(true);

    try {
      if (this.isEditMode() && this.articleId) {
        await this.adminService.updateArticle(this.articleId, this.formData);
      } else {
        await this.adminService.createArticle(this.formData);
      }

      this.router.navigate(['/admin/articles']);
    } catch (error) {
      console.error('Failed to save article:', error);
      alert('فشل حفظ المقال');
    } finally {
      this.saving.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/admin/articles']);
  }
}
