import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { AdminService } from '../../../core/services/admin.service';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-article-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, EditorComponent],
  template: `
    <div class="editor-container">
      <div class="page-header">
        <h1>{{ isEditMode() ? 'تعديل المقال' : 'مقال جديد' }}</h1>
        <div class="actions">
          <button (click)="cancel()" class="btn-secondary">إلغاء</button>
          <button (click)="save()" class="btn-primary" [disabled]="form.invalid || isSaving() || isUploading()">
            {{ isSaving() ? 'جاري الحفظ...' : 'حفظ المقال' }}
          </button>
        </div>
      </div>

      <form [formGroup]="form" class="editor-form">
        <div class="main-content">
          <div class="form-group">
            <label>عنوان المقال <span class="required">*</span></label>
            <input type="text" formControlName="title" class="form-input" placeholder="أدخل عنوان المقال" />
          </div>

          <div class="form-group checkbox-group link-toggle">
            <label>
              <input type="checkbox" formControlName="is_link">
              <span>هذا مقال خارجي (رابط PDF أو Google Doc)</span>
            </label>
          </div>

          @if (form.get('is_link')?.value) {
            <div class="form-group animate-fade">
              <label>رابط المقال <span class="required">*</span></label>
              <input type="url" formControlName="article_link" class="form-input" placeholder="https://docs.google.com/..." />
              <small>ألصق هنا رابط الملف أو المستند الخارجي.</small>
            </div>
          } @else {
            <div class="form-group animate-fade">
              <label>محتوى المقال (انسخ من Word والصق هنا)</label>
              <editor
                [init]="editorConfig"
                formControlName="content"
                apiKey="nij901wj4g71fc8k99s86id8ul3ubwlbql4k64ky0tm09g5b"
              ></editor>
            </div>
          }
        </div>

        <div class="sidebar">
          <div class="card">
            <h3>إعدادات النشر</h3>

            <div class="form-group">
              <label>التصنيف</label>
              <select formControlName="category" class="form-select">
                <option value="نصوص">نصوص</option>
                <option value="مقالات">مقالات</option>
                <option value="وجدانيات">وجدانيات</option>
              </select>
            </div>

            <div class="form-group">
              <label>صورة الغلاف</label>
              <div class="image-upload-area">
                @if (form.get('cover_image_url')?.value) {
                  <div class="img-preview-wrapper">
                    <img [src]="form.get('cover_image_url')?.value" alt="Cover Preview" class="cover-preview" />
                    <button type="button" class="remove-img-btn" (click)="removeImage()">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                } @else {
                  <div class="upload-box">
                    <input
                      type="file"
                      id="coverUpload"
                      (change)="onFileSelected($event)"
                      accept="image/*"
                      class="hidden-input"
                    />
                    <label for="coverUpload" class="upload-label">
                      @if (isUploading()) {
                        <span class="spinner-sm"></span>
                        <span>جاري الرفع...</span>
                      } @else {
                        <i class="fas fa-cloud-upload-alt"></i>
                        <span>اختر صورة</span>
                      }
                    </label>
                  </div>
                }
                <input type="hidden" formControlName="cover_image_url">
              </div>
            </div>

            <div class="form-group">
              <label>Slug (الرابط)</label>
              <input type="text" formControlName="slug" class="form-input" placeholder="رابط-المقال-بالانجليزي" />
              <small>يترك فارغاً للتوليد التلقائي</small>
            </div>

            <div class="form-group checkbox-group">
               <label>
                 <input type="checkbox" formControlName="is_published">
                 نشر المقال فوراً
               </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .editor-container { max-width: 1400px; margin: 0 auto; padding: 2rem 1rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .page-header h1 { font-size: 2rem; color: #0f172a; margin: 0; }
    .actions { display: flex; gap: 1rem; }

    .editor-form { display: grid; grid-template-columns: 1fr 300px; gap: 2rem; }

    .form-group { margin-bottom: 1.5rem; }
    .form-group label { display: block; font-weight: 600; margin-bottom: 0.5rem; color: #334155; }
    .required { color: #ef4444; }

    .form-input, .form-select { width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 0.5rem; font-size: 1rem; }
    .form-input:focus { outline: none; border-color: #01579b; }

    .card { background: white; padding: 1.5rem; border-radius: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .card h3 { margin-top: 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 1rem; }

    /* Upload Styles */
    .hidden-input { display: none; }
    .upload-box { border: 2px dashed #cbd5e1; border-radius: 0.5rem; text-align: center; transition: all 0.3s; }
    .upload-box:hover { border-color: #01579b; background: #f8fafc; }
    .upload-label { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 2rem; cursor: pointer; color: #64748b; }
    .upload-label i { font-size: 1.5rem; }

    .img-preview-wrapper { position: relative; border-radius: 0.5rem; overflow: hidden; border: 1px solid #e2e8f0; }
    .cover-preview { width: 100%; height: auto; display: block; }
    .remove-img-btn {
      position: absolute; top: 0.5rem; right: 0.5rem;
      background: rgba(239, 68, 68, 0.9); color: white; border: none;
      width: 30px; height: 30px; border-radius: 50%; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }

    .btn-primary { padding: 0.75rem 1.5rem; background: #01579b; color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
    .btn-secondary { padding: 0.75rem 1.5rem; background: #e2e8f0; color: #475569; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; }

    .checkbox-group label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none; }
    .checkbox-group input { width: 18px; height: 18px; accent-color: #01579b; }

    .link-toggle { background: #f1f5f9; padding: 1rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; }
    .animate-fade { animation: fadeIn 0.3s ease-in-out; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .spinner-sm { width: 16px; height: 16px; border: 2px solid #cbd5e1; border-top-color: #01579b; border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 900px) {
      .editor-form { grid-template-columns: 1fr; }
    }
  `]
})
export class ArticleEditorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private supabaseService = inject(SupabaseService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEditMode = signal(false);
  isSaving = signal(false);
  isUploading = signal(false);
  articleId: number | null = null;

  // ✅✅ تمت إضافة is_link و article_link إلى الفورم ✅✅
  form: FormGroup = this.fb.group({
    title: ['', Validators.required],
    content: [''],
    category: ['نصوص'],
    cover_image_url: [''],
    slug: [''],
    is_published: [true],
    is_link: [false],      // هل هو رابط خارجي؟
    article_link: ['']     // الرابط الخارجي
  });

  editorConfig = {
    height: 600,
    menubar: true,
    directionality: 'rtl' as const,
    language: 'ar',
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount', 'directionality'
    ],
    toolbar: 'undo redo | blocks | ' +
      'bold italic backcolor forecolor | alignleft aligncenter ' +
      'alignright alignjustify | bullist numlist outdent indent | ' +
      'removeformat | image | table | ltr rtl | help',

    paste_data_images: true,
    paste_as_text: false,
    paste_retain_style_properties: 'all',
    paste_webkit_styles: 'all',
    paste_merge_formats: false,
    valid_elements: '*[*]',
    extended_valid_elements: '*[*]',
    browser_spellcheck: true,

    content_style: `
      body {
        font-family: 'Times New Roman', Helvetica, Arial, sans-serif;
        font-size: 14pt;
        direction: rtl;
        text-align: right;
        line-height: 1.6;
        color: #000;
      }
      table { border-collapse: collapse; width: 100%; }
      td, th { border: 1px solid #ccc; padding: 5px; }
      img { max-width: 100%; height: auto; }
    `
  };

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.articleId = +id;
      await this.loadArticle(+id);
    }
  }

  async loadArticle(id: number) {
    try {
      const articles = await this.supabaseService.getAllArticles();
      const article = articles.find(a => a.id === id);
      if (article) {
        this.form.patchValue({
          title: article.title,
          content: article.content,
          category: article.category,
          cover_image_url: article.cover_image_url,
          slug: article.slug,
          is_published: true,
          is_link: article.is_link,       // تحميل حالة الرابط
          article_link: article.article_link // تحميل الرابط
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.isUploading.set(true);
    try {
      const url = await this.adminService.uploadImage(file, 'images');
      this.form.patchValue({ cover_image_url: url });
      this.form.get('cover_image_url')?.markAsDirty();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('فشل رفع الصورة');
    } finally {
      this.isUploading.set(false);
    }
  }

  removeImage() {
    this.form.patchValue({ cover_image_url: '' });
    this.form.get('cover_image_url')?.markAsDirty();
  }

  async save() {
    if (this.form.invalid) return;

    this.isSaving.set(true);
    const formData = this.form.value;

    if (!formData.slug) {
      formData.slug = formData.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }

    try {
      if (this.isEditMode() && this.articleId) {
        await this.adminService.updateArticle(this.articleId, formData);
      } else {
        await this.adminService.createArticle(formData);
      }
      this.router.navigate(['/admin/articles']);
    } catch (error) {
      console.error('Save failed', error);
      alert('فشل الحفظ: ' + (error as any).message);
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/admin/articles']);
  }
}
