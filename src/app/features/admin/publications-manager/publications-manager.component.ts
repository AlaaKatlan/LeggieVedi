import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Publication } from '../../../core/models/publication';



@Component({
  selector: 'app-publications-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="manager-container">
      <div class="page-header">
        <h1>إدارة المنشورات والأبحاث</h1>
        <button (click)="openCreateModal()" class="btn-primary">
          <i class="fas fa-plus"></i>
          منشور جديد
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>جاري تحميل المنشورات...</p>
        </div>
      } @else {
        <div class="table-container">
          @if (publications().length === 0) {
            <div class="empty-state">
              <i class="fas fa-book-open"></i>
              <p>لا يوجد منشورات حالياً</p>
            </div>
          } @else {
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 80px">الغلاف</th>
                  <th>العنوان المنشور</th>
                  <th>المؤلف</th>
                  <th>الناشر</th>
                  <th>رابط القراءة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                @for (pub of publications(); track pub.id) {
                  <tr>
                    <td>
                      @if (pub.cover_image_url) {
                        <img [src]="pub.cover_image_url" class="book-thumb" alt="cover">
                      } @else {
                        <div class="no-thumb"><i class="fas fa-book"></i></div>
                      }
                    </td>
                    <td class="font-bold">
                      {{ pub.published_title }}
                      @if (pub.original_title) {
                        <div class="sub-text text-sm text-gray-500">({{ pub.original_title }})</div>
                      }
                    </td>
                    <td>{{ pub.author }}</td>
                    <td>{{ pub.publisher || '-' }}</td>
                    <td>
                      @if (pub.read_url) {
                        <a [href]="pub.read_url" target="_blank" class="link-item">
                          <i class="fas fa-external-link-alt"></i> عرض
                        </a>
                      } @else {
                        <span class="text-gray-400">-</span>
                      }
                    </td>
                    <td>
                      <div class="action-buttons">
                        <button (click)="openEditModal(pub)" class="btn-icon" title="تعديل">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button (click)="confirmDelete(pub)" class="btn-icon btn-danger" title="حذف">
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

      @if (showFormModal()) {
        <div class="modal-backdrop" (click)="closeFormModal()"></div>
        <div class="modal form-modal">
          <div class="modal-header">
            <h3>{{ isEditing() ? 'تعديل المنشور' : 'إضافة منشور جديد' }}</h3>
            <button class="close-btn" (click)="closeFormModal()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="form" (ngSubmit)="save()">

              <div class="image-upload-section">
                <div class="preview-box book-preview">
                  @if (form.get('cover_image_url')?.value) {
                    <img [src]="form.get('cover_image_url')?.value" class="preview-img">
                  } @else {
                    <div class="placeholder">
                      <i class="fas fa-image"></i>
                      <span>صورة الغلاف</span>
                    </div>
                  }
                  @if (isUploading()) {
                    <div class="upload-overlay"><span class="spinner-sm"></span></div>
                  }
                </div>
                <div class="upload-controls">
                  <input type="file" (change)="onFileSelected($event)" accept="image/*" id="pubCoverInput" class="hidden-input">
                  <label for="pubCoverInput" class="btn-secondary upload-btn">
                    <i class="fas fa-upload"></i> رفع غلاف
                  </label>
                  <input type="hidden" formControlName="cover_image_url">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>العنوان المنشور <span class="text-red-500">*</span></label>
                  <input type="text" formControlName="published_title" class="form-input" placeholder="عنوان الكتاب أو المقال">
                </div>
                <div class="form-group">
                  <label>العنوان الأصلي</label>
                  <input type="text" formControlName="original_title" class="form-input" placeholder="إذا كان مترجماً">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>المؤلف <span class="text-red-500">*</span></label>
                  <input type="text" formControlName="author" class="form-input">
                </div>
                <div class="form-group">
                  <label>الناشر</label>
                  <input type="text" formControlName="publisher" class="form-input">
                </div>
              </div>

              <div class="form-group">
                <label>رابط القراءة (URL)</label>
                <input type="url" formControlName="read_url" class="form-input" placeholder="https://...">
              </div>

              <div class="form-group">
                <label>ملاحظات</label>
                <textarea formControlName="notes" class="form-textarea" rows="3"></textarea>
              </div>

              <div class="modal-footer">
                <button type="button" (click)="closeFormModal()" class="btn-secondary">إلغاء</button>
                <button type="submit" class="btn-primary" [disabled]="form.invalid || isSaving() || isUploading()">
                  @if (isSaving()) { <span class="spinner-sm"></span> }
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      @if (itemToDelete()) {
        <div class="modal-backdrop" (click)="cancelDelete()"></div>
        <div class="modal delete-modal">
          <div class="modal-header">
            <h3>تأكيد الحذف</h3>
            <button class="close-btn" (click)="cancelDelete()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <p>هل أنت متأكد من حذف: <strong>{{ itemToDelete()?.published_title }}</strong>؟</p>
            <p class="warning">⚠️ لا يمكن التراجع عن هذا الإجراء.</p>
          </div>
          <div class="modal-footer">
            <button (click)="cancelDelete()" class="btn-secondary">إلغاء</button>
            <button (click)="deleteItem()" class="btn-danger" [disabled]="isDeleting()">
              @if (isDeleting()) { <span class="spinner-sm"></span> }
              حذف
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* Core Layout Styles */
    .manager-container { max-width: 1400px; margin: 0 auto; padding: 1rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .page-header h1 { font-size: 2rem; color: #0f172a; margin: 0; }

    /* Buttons */
    .btn-primary {
      display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, #01579b, #00897b); color: white; border: none;
      border-radius: 0.5rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease;
    }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

    /* Table */
    .table-container { background: white; border-radius: 1rem; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { padding: 1rem; text-align: right; font-weight: 700; color: #475569; background: #f8fafc; border-bottom: 2px solid #e2e8f0; }
    .data-table td { padding: 1rem; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    .data-table tr:hover { background: #f8fafc; }

    /* Thumbnails */
    .book-thumb { width: 40px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #e2e8f0; }
    .no-thumb { width: 40px; height: 60px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; color: #cbd5e1; border-radius: 4px; font-size: 1.2rem; }

    /* Links & Actions */
    .link-item { color: #01579b; text-decoration: none; display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.9rem; }
    .link-item:hover { text-decoration: underline; }
    .action-buttons { display: flex; gap: 0.5rem; }
    .btn-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: none; background: #e2e8f0; color: #475569; border-radius: 0.5rem; cursor: pointer; transition: all 0.3s ease; }
    .btn-icon:hover { background: #01579b; color: white; }
    .btn-danger:hover { background: #ef4444; }

    /* Loading & Empty States */
    .loading-state, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem; color: #94a3b8; gap: 1rem; }
    .spinner { width: 50px; height: 50px; border: 4px solid #e2e8f0; border-top-color: #01579b; border-radius: 50%; animation: spin 0.8s linear infinite; }
    .spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px); z-index: 9998; }
    .modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 1rem; width: 90%; z-index: 9999; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); }
    .form-modal { max-width: 600px; }
    .delete-modal { max-width: 400px; }
    .modal-header, .modal-body, .modal-footer { padding: 1.5rem; }
    .modal-header { display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid #e2e8f0; }
    .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b; }

    /* Form Elements */
    .form-group { margin-bottom: 1rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #475569; font-size: 0.9rem; }
    .form-input, .form-textarea { width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 0.5rem; font-size: 1rem; }
    .form-input:focus, .form-textarea:focus { outline: none; border-color: #01579b; }
    .btn-secondary { padding: 0.75rem 1.5rem; background: #e2e8f0; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600; color: #475569; }
    .warning { color: #f59e0b; font-weight: 600; margin-top: 0.5rem; }

    /* Image Upload in Modal */
    .image-upload-section { display: flex; gap: 1.5rem; margin-bottom: 1.5rem; align-items: center; }
    .preview-box { width: 80px; height: 110px; border: 2px dashed #cbd5e1; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; background: #f8fafc; }
    .preview-img { width: 100%; height: 100%; object-fit: cover; }
    .placeholder { text-align: center; color: #94a3b8; font-size: 0.8rem; display: flex; flex-direction: column; gap: 0.3rem; }
    .hidden-input { display: none; }
    .upload-btn { display: inline-flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.9rem; }
    .upload-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.8); display: flex; align-items: center; justify-content: center; }
  `]
})
export class PublicationsManagerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private supabaseService = inject(SupabaseService);

  publications = signal<Publication[]>([]);
  loading = signal(true);

  // Modal States
  showFormModal = signal(false);
  itemToDelete = signal<Publication | null>(null);

  // Processing States
  isSaving = signal(false);
  isDeleting = signal(false);
  isUploading = signal(false);
  isEditing = signal(false);
  currentId = signal<number | null>(null);

  // تحديث الفورم ليتطابق مع الـ Interface
  form: FormGroup = this.fb.group({
    author: ['', [Validators.required]],
    published_title: ['', [Validators.required]],
    original_title: [''],
    publisher: [''],
    read_url: [''],
    cover_image_url: [''],
    notes: ['']
  });

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const data = await this.supabaseService.getAllPublications();
      // Supabase returns 'any[]', we cast it to Publication[]
      this.publications.set(data as Publication[]);
    } catch (error) {
      console.error('Error fetching publications:', error);
    } finally {
      this.loading.set(false);
    }
  }

  // --- Image Upload ---
  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.isUploading.set(true);
    try {
      // نستخدم نفس دالة الرفع الموجودة في السيرفس
      const url = await this.adminService.uploadImage(file, 'publications'); // تأكد من وجود bucket باسم publications أو استخدم images
      this.form.patchValue({ cover_image_url: url });
    } catch (error) {
      console.error('Upload failed:', error);
      alert('فشل رفع الصورة');
    } finally {
      this.isUploading.set(false);
    }
  }

  // --- Modal Logic ---
  openCreateModal() {
    this.isEditing.set(false);
    this.currentId.set(null);
    this.form.reset({
      author: 'نبيل المهايني' // قيمة افتراضية اختيارية
    });
    this.showFormModal.set(true);
  }

  openEditModal(pub: Publication) {
    this.isEditing.set(true);
    this.currentId.set(pub.id);
    this.form.patchValue({
      author: pub.author,
      published_title: pub.published_title,
      original_title: pub.original_title,
      publisher: pub.publisher,
      read_url: pub.read_url,
      cover_image_url: pub.cover_image_url,
      notes: pub.notes
    });
    this.showFormModal.set(true);
  }

  closeFormModal() {
    this.showFormModal.set(false);
  }

  // --- CRUD Operations ---
  async save() {
    if (this.form.invalid) return;
    this.isSaving.set(true);
    const formData = this.form.value;

    try {
      if (this.isEditing() && this.currentId()) {
        await this.adminService.updatePublication(this.currentId()!, formData);
      } else {
        await this.adminService.createPublication(formData);
      }
      await this.loadData();
      this.closeFormModal();
    } catch (error) {
      console.error('Save failed:', error);
      alert('حدث خطأ أثناء الحفظ. تأكد من تطابق الحقول مع قاعدة البيانات.');
    } finally {
      this.isSaving.set(false);
    }
  }

  confirmDelete(pub: Publication) {
    this.itemToDelete.set(pub);
  }

  cancelDelete() {
    this.itemToDelete.set(null);
  }

  async deleteItem() {
    const pub = this.itemToDelete();
    if (!pub) return;
    this.isDeleting.set(true);
    try {
      await this.adminService.deletePublication(pub.id);
      this.itemToDelete.set(null);
      await this.loadData();
    } catch (error) {
      alert('فشل الحذف');
    } finally {
      this.isDeleting.set(false);
    }
  }
}
