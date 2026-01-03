import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Artwork } from '../../../core/models/artwork.model';

@Component({
  selector: 'app-artworks-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="manager-container">
      <div class="page-header">
        <h1>إدارة الأعمال الفنية</h1>
        <button (click)="openCreateModal()" class="btn-primary">
          <i class="fas fa-plus"></i>
          عمل فني جديد
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>جاري تحميل الأعمال الفنية...</p>
        </div>
      } @else {
        <div class="table-container">
          @if (filteredArtworks().length === 0) {
            <div class="empty-state">
              <i class="fas fa-palette"></i>
              <p>لا توجد أعمال فنية مطابقة</p>
            </div>
          } @else {
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 100px">المعاينة</th>
                  <th>عنوان العمل</th>
                  <th>التصنيف</th>
                  <th>تاريخ الإنجاز</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                @for (art of filteredArtworks(); track art.id) {
                  <tr>
                    <td>
                      <div class="img-wrapper" (click)="openImagePreview(art.image_url)">
                        <img [src]="art.image_url" class="art-thumb" alt="artwork">
                        <div class="zoom-overlay"><i class="fas fa-search-plus"></i></div>
                      </div>
                    </td>
                    <td class="font-bold">{{ art.title }}</td>
                    <td>
                      @if (art.category) {
                        <span class="badge">{{ art.category }}</span>
                      } @else {
                        <span class="text-gray-400">-</span>
                      }
                    </td>
                    <td>{{ art.creation_date ? (art.creation_date | date:'yyyy/MM/dd') : '-' }}</td>
                    <td>
                      <div class="action-buttons">
                        <button (click)="openEditModal(art)" class="btn-icon" title="تعديل">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button (click)="confirmDelete(art)" class="btn-icon btn-danger" title="حذف">
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
        <div class="custom-backdrop" (click)="closeFormModal()"></div>
        <div class="custom-modal form-modal">
          <div class="modal-header">
            <h3>{{ isEditing() ? 'تعديل العمل الفني' : 'إضافة عمل جديد' }}</h3>
            <button class="close-btn" (click)="closeFormModal()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="form" (ngSubmit)="save()">

              <div class="image-upload-section">
                <div class="preview-box art-preview">
                  @if (form.get('image_url')?.value) {
                    <img [src]="form.get('image_url')?.value" class="preview-img">
                  } @else {
                    <div class="placeholder">
                      <i class="fas fa-image"></i>
                      <span>صورة العمل</span>
                    </div>
                  }
                  @if (isUploading()) {
                    <div class="upload-overlay"><span class="spinner-sm"></span></div>
                  }
                </div>
                <div class="upload-controls">
                  <input type="file" (change)="onFileSelected($event)" accept="image/*" id="artFileInput" class="hidden-input">
                  <label for="artFileInput" class="btn-secondary upload-btn">
                    <i class="fas fa-upload"></i>
                    {{ form.get('image_url')?.value ? 'تغيير الصورة' : 'رفع صورة' }}
                  </label>
                  <input type="hidden" formControlName="image_url">
                  @if (form.get('image_url')?.invalid && form.get('image_url')?.touched) {
                    <span class="error-text">الصورة مطلوبة</span>
                  }
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>عنوان العمل <span class="text-red-500">*</span></label>
                  <input type="text" formControlName="title" class="form-input" placeholder="اسم اللوحة أو العمل">
                </div>
                <div class="form-group">
                  <label>التصنيف</label>
                  <select formControlName="category" class="form-input">
                    <option value="خط عربي">خط عربي</option>
                    <option value="زخرفة">زخرفة</option>
                    <option value="رسم">رسم</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>تاريخ الإنجاز</label>
                <input type="date" formControlName="creation_date" class="form-input">
              </div>

              <div class="form-group">
                <label>وصف العمل</label>
                <textarea formControlName="description" class="form-textarea" rows="4" placeholder="تفاصيل عن العمل الفني..."></textarea>
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
        <div class="custom-backdrop" (click)="cancelDelete()"></div>
        <div class="custom-modal delete-modal">
          <div class="modal-header">
            <h3>تأكيد الحذف</h3>
            <button class="close-btn" (click)="cancelDelete()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <p>هل أنت متأكد من حذف العمل الفني: <strong>{{ itemToDelete()?.title }}</strong>؟</p>
            <p class="warning">⚠️ سيتم حذف العمل نهائياً من المعرض.</p>
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

      @if (previewImage()) {
        <div class="custom-backdrop" (click)="closeImagePreview()">
          <div class="image-preview-modal">
            <img [src]="previewImage()" alt="Full Preview">
            <button class="close-preview-btn" (click)="closeImagePreview()"><i class="fas fa-times"></i></button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* Core Layout */
    .manager-container { max-width: 1400px; margin: 0 auto; padding: 1rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .page-header h1 { font-size: 2rem; color: #0f172a; margin: 0; }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, #01579b, #00897b); color: white; border: none;
      border-radius: 0.5rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease;
    }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

    /* Table Styles */
    .table-container { background: white; border-radius: 1rem; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { padding: 1rem; text-align: right; background: #f8fafc; color: #475569; border-bottom: 2px solid #e2e8f0; font-weight: 700; }
    .data-table td { padding: 1rem; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    .data-table tr:hover { background: #f8fafc; }

    /* Image Thumbnail */
    .img-wrapper {
      width: 80px; height: 80px; border-radius: 0.5rem; overflow: hidden; position: relative; cursor: zoom-in; border: 1px solid #e2e8f0;
    }
    .art-thumb { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
    .zoom-overlay {
      position: absolute; inset: 0; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.2s; color: white;
    }
    .img-wrapper:hover .zoom-overlay { opacity: 1; }
    .img-wrapper:hover .art-thumb { transform: scale(1.1); }

    /* Badges */
    .badge {
      padding: 0.375rem 0.75rem; background: #e0f2fe; color: #0284c7;
      border-radius: 1rem; font-size: 0.85rem; font-weight: 600; border: 1px solid #bae6fd;
    }

    /* Actions */
    .action-buttons { display: flex; gap: 0.5rem; }
    .btn-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: none; background: #e2e8f0; color: #475569; border-radius: 0.5rem; cursor: pointer; transition: all 0.3s ease; }
    .btn-icon:hover { background: #01579b; color: white; }
    .btn-danger:hover { background: #ef4444; }

    /* ========== تم تحديث أسماء كلاسات المودال لمنع التضارب ========== */
    .custom-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 9998; display: flex; align-items: center; justify-content: center; }

    .custom-modal {
      background: white; border-radius: 1rem; width: 90%; z-index: 9999;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      max-height: 90vh; overflow-y: auto;
    }

    .form-modal { max-width: 700px; }
    .delete-modal { max-width: 450px; }

    .modal-header { padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: white; z-index: 10; }
    .modal-body { padding: 1.5rem; }
    .modal-footer { padding: 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 1rem; position: sticky; bottom: 0; background: white; z-index: 10; }
    .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #94a3b8; }

    /* Form Inputs */
    .form-group { margin-bottom: 1.25rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #334155; font-size: 0.95rem; }
    .form-input, .form-textarea { width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 0.5rem; font-size: 1rem; transition: border-color 0.2s; }
    .form-input:focus, .form-textarea:focus { outline: none; border-color: #01579b; }
    .btn-secondary { padding: 0.75rem 1.5rem; background: #f1f5f9; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600; color: #475569; }

    /* Image Upload Area */
    .image-upload-section { display: flex; gap: 2rem; margin-bottom: 2rem; align-items: center; background: #f8fafc; padding: 1rem; border-radius: 0.75rem; border: 1px border #e2e8f0; }
    .preview-box {
      width: 150px; height: 150px; border: 2px dashed #cbd5e1; border-radius: 0.5rem;
      display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; background: white;
    }
    .preview-img { width: 100%; height: 100%; object-fit: contain; }
    .placeholder { text-align: center; color: #94a3b8; font-size: 0.9rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .upload-controls { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start; }
    .error-text { color: #ef4444; font-size: 0.85rem; }
    .hidden-input { display: none; }
    .upload-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.8); display: flex; align-items: center; justify-content: center; }

    /* Full Image Preview Modal */
    .image-preview-modal { position: relative; max-width: 90vw; max-height: 90vh; }
    .image-preview-modal img { max-width: 100%; max-height: 85vh; border-radius: 0.5rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
    .close-preview-btn {
      position: absolute; top: -40px; right: 0; background: none; border: none; color: white; font-size: 2rem; cursor: pointer;
    }

    /* States */
    .loading-state, .empty-state { padding: 4rem; text-align: center; color: #94a3b8; }
    .spinner { width: 50px; height: 50px; border: 4px solid #e2e8f0; border-top-color: #01579b; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
    .spinner-sm { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ArtworksManagerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private supabaseService = inject(SupabaseService);
  private cdr = inject(ChangeDetectorRef);

  allArtworks = signal<Artwork[]>([]);
  filteredArtworks = signal<Artwork[]>([]);
  loading = signal(true);

  showFormModal = signal(false);
  itemToDelete = signal<Artwork | null>(null);
  previewImage = signal<string | null>(null);
  selectedCategory = signal('');

  isSaving = signal(false);
  isDeleting = signal(false);
  isUploading = signal(false);
  isEditing = signal(false);
  currentId = signal<number | null>(null);

  form: FormGroup = this.fb.group({
    title: ['', [Validators.required]],
    category: ['خط عربي'],
    description: [''],
    image_url: ['', [Validators.required]],
    creation_date: ['']
  });

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const data = await this.supabaseService.getArtworks();
      this.allArtworks.set(data as Artwork[]);
      this.filterArtworks();
    } catch (error) {
      console.error('Error fetching artworks:', error);
    } finally {
      this.loading.set(false);
    }
  }

  filterArtworks() {
    const category = this.selectedCategory();
    if (!category) {
      this.filteredArtworks.set(this.allArtworks());
    } else {
      this.filteredArtworks.set(
        this.allArtworks().filter(a => a.category === category)
      );
    }
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.isUploading.set(true);
    try {
      const url = await this.adminService.uploadImage(file, 'artworks');
      this.form.patchValue({ image_url: url });
      this.form.get('image_url')?.markAsTouched();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('فشل رفع الصورة. تأكد من إعدادات Supabase Storage.');
    } finally {
      this.isUploading.set(false);
    }
  }

  openImagePreview(url: string) {
    this.previewImage.set(url);
  }

  closeImagePreview() {
    this.previewImage.set(null);
  }

  openCreateModal() {
    this.isEditing.set(false);
    this.currentId.set(null);
    this.form.reset({
      category: 'خط عربي',
      creation_date: new Date().toISOString().split('T')[0]
    });

    setTimeout(() => {
      this.showFormModal.set(true);
      this.cdr.detectChanges();
    }, 10);
  }

  openEditModal(art: Artwork) {
    this.isEditing.set(true);
    this.currentId.set(art.id);
    this.form.reset();

    let formattedDate = '';
    if (art.creation_date) {
      formattedDate = art.creation_date.toString().split('T')[0];
    }

    this.form.patchValue({
      title: art.title,
      description: art.description,
      category: art.category,
      image_url: art.image_url,
      creation_date: formattedDate
    });

    setTimeout(() => {
      this.showFormModal.set(true);
      this.cdr.detectChanges();
    }, 10);
  }

  closeFormModal() {
    this.showFormModal.set(false);
  }

  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formData = this.form.value;

    try {
      if (this.isEditing() && this.currentId()) {
        await this.adminService.updateArtwork(this.currentId()!, formData);
      } else {
        await this.adminService.createArtwork(formData);
      }
      await this.loadData();
      this.closeFormModal();
    } catch (error) {
      console.error('Save failed:', error);
      alert('حدث خطأ أثناء الحفظ.');
    } finally {
      this.isSaving.set(false);
    }
  }

  confirmDelete(art: Artwork) {
    this.itemToDelete.set(art);
  }

  cancelDelete() {
    this.itemToDelete.set(null);
  }

  async deleteItem() {
    const art = this.itemToDelete();
    if (!art) return;
    this.isDeleting.set(true);
    try {
      await this.adminService.deleteArtwork(art.id);
      this.itemToDelete.set(null);
      await this.loadData();
    } catch (error) {
      alert('فشل الحذف');
    } finally {
      this.isDeleting.set(false);
    }
  }
}
