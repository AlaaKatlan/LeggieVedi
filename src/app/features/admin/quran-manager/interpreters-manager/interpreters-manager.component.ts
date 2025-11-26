// src/app/features/admin/quran-manager/interpreters-manager/interpreters-manager.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Interpreter } from '../../../../core/models/interpreter.model';

@Component({
  selector: 'app-interpreters-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="interpreters-manager">
      <!-- Header -->
      <div class="page-header">
        <h1>إدارة المفسرين</h1>
        <div class="header-actions">
          <button (click)="openAddModal()" class="btn-primary">
            <i class="fas fa-plus"></i>
            مفسر جديد
          </button>
          <button (click)="router.navigate(['/admin/quran'])" class="btn-secondary">
            <i class="fas fa-arrow-right"></i>
            رجوع
          </button>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="search-bar">
        <input
          type="search"
          placeholder="بحث في المفسرين..."
          [(ngModel)]="searchTerm"
          (input)="filterInterpreters()"
          class="search-input"
        />
        <span class="results-count">{{ filteredInterpreters().length }} مفسر</span>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>جاري تحميل المفسرين...</p>
        </div>
      } @else {
        <!-- Interpreters Grid -->
        @if (filteredInterpreters().length === 0) {
          <div class="empty-state">
            <i class="fas fa-user-graduate"></i>
            <p>لا يوجد مفسرين</p>
          </div>
        } @else {
          <div class="interpreters-grid">
            @for (interpreter of filteredInterpreters(); track interpreter.id) {
              <div class="interpreter-card">
                <div class="interpreter-header">
                  <div class="interpreter-avatar">
                    <i class="fas fa-user-graduate"></i>
                  </div>
                  <div class="actions">
                    <button (click)="editInterpreter(interpreter)" class="btn-icon" title="تعديل">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button (click)="deleteInterpreter(interpreter)" class="btn-icon btn-danger" title="حذف">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>

                <div class="interpreter-info">
                  <h3>{{ interpreter.display_name_it || interpreter.short_name }}</h3>

                  <div class="names-list">
                    @if (interpreter.display_name_ar) {
                      <span class="name-badge ar">{{ interpreter.display_name_ar }}</span>
                    }
                    @if (interpreter.display_name_en) {
                      <span class="name-badge en">{{ interpreter.display_name_en }}</span>
                    }
                  </div>

                  <div class="meta-info">
                    <span class="meta-item">
                      <i class="fas fa-code"></i>
                      {{ interpreter.short_name }}
                    </span>
                    <span class="meta-item">
                      <i class="fas fa-language"></i>
                      {{ getLangName(interpreter.language_code) }}
                    </span>
                  </div>

                  @if (interpreter.bio_text) {
                    <div class="bio-text">
                      {{ interpreter.bio_text | slice:0:120 }}...
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      }
    </div>

    <!-- Add/Edit Modal -->
    @if (showModal()) {
      <div class="modal-backdrop" (click)="closeModal()"></div>
      <div class="modal">
        <div class="modal-header">
          <h3>{{ isEditMode() ? 'تعديل المفسر' : 'مفسر جديد' }}</h3>
          <button class="close-btn" (click)="closeModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form (ngSubmit)="onSubmit()" class="modal-body">
          <!-- Short Name (Code) -->
          <div class="form-group">
            <label class="required">الاسم المختصر (Code)</label>
            <input
              type="text"
              [(ngModel)]="formData.short_name"
              name="short_name"
              required
              placeholder="مثال: piccardo، hamza"
              [disabled]="isEditMode()"
            />
            <small>يستخدم كمعرف فريد - بالإنجليزية فقط</small>
          </div>

          <!-- Display Names -->
          <div class="form-section">
            <h4>أسماء العرض</h4>

            <div class="form-group">
              <label class="required">الاسم بالإيطالية</label>
              <input
                type="text"
                [(ngModel)]="formData.display_name_it"
                name="display_name_it"
                required
                placeholder="Hamza Roberto Piccardo"
              />
            </div>

            <div class="form-group">
              <label>الاسم بالعربية</label>
              <input
                type="text"
                [(ngModel)]="formData.display_name_ar"
                name="display_name_ar"
                placeholder="حمزة روبرتو بيكاردو"
                class="arabic-input"
              />
            </div>

            <div class="form-group">
              <label>الاسم بالإنجليزية</label>
              <input
                type="text"
                [(ngModel)]="formData.display_name_en"
                name="display_name_en"
                placeholder="Hamza Roberto Piccardo"
              />
            </div>
          </div>

          <!-- Language -->
          <div class="form-group">
            <label class="required">لغة التفسير</label>
            <select [(ngModel)]="formData.language_code" name="language_code" required>
              <option value="">-- اختر اللغة --</option>
              <option value="ar">العربية</option>
              <option value="it">الإيطالية</option>
              <option value="en">الإنجليزية</option>
            </select>
          </div>

          <!-- Biography -->
          <div class="form-group">
            <label>السيرة الذاتية</label>
            <textarea
              [(ngModel)]="formData.bio_text"
              name="bio_text"
              rows="6"
              placeholder="نبذة مختصرة عن المفسر..."
            ></textarea>
          </div>

          <!-- Submit Buttons -->
          <div class="modal-footer">
            <button type="button" (click)="closeModal()" class="btn-secondary">
              إلغاء
            </button>
            <button type="submit" class="btn-primary" [disabled]="saving()">
              @if (saving()) {
                <span class="spinner-sm"></span>
                جاري الحفظ...
              } @else {
                <i class="fas fa-save"></i>
                حفظ
              }
            </button>
          </div>
        </form>
      </div>
    }

    <!-- Delete Confirmation -->
    @if (interpreterToDelete()) {
      <div class="modal-backdrop" (click)="cancelDelete()"></div>
      <div class="modal confirm-modal">
        <div class="modal-header">
          <h3>تأكيد الحذف</h3>
          <button class="close-btn" (click)="cancelDelete()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>هل أنت متأكد من حذف المفسر: <strong>{{ interpreterToDelete()?.display_name_it }}</strong>؟</p>
          <p class="warning">⚠️ سيتم حذف ارتباطه بجميع التفاسير!</p>
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
    .interpreters-manager {
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

      .header-actions {
        display: flex;
        gap: 1rem;
      }
    }

    .btn-primary, .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
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

    .search-bar {
      background: white;
      padding: 1.5rem;
      border-radius: 1rem;
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
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
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
    }

    .results-count {
      color: #64748b;
      font-weight: 600;
      white-space: nowrap;
    }

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: 1rem;
      background: white;
      border-radius: 1rem;
      padding: 3rem;

      i {
        font-size: 4rem;
        color: #cbd5e1;
      }

      p {
        font-size: 1.25rem;
        color: #64748b;
      }
    }

    .spinner {
      width: 60px;
      height: 60px;
      border: 4px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .interpreters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .interpreter-card {
      background: white;
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      }
    }

    .interpreter-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .interpreter-avatar {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.75rem;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1f5f9;
      border: none;
      border-radius: 0.5rem;
      color: #475569;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: #3b82f6;
        color: white;
      }

      &.btn-danger:hover {
        background: #ef4444;
      }
    }

    .interpreter-info {
      h3 {
        margin: 0 0 0.75rem 0;
        font-size: 1.25rem;
        color: #0f172a;
      }

      .names-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      }

      .name-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.85rem;
        font-weight: 600;

        &.ar {
          background: #dcfce7;
          color: #166534;
          font-family: 'Amiri Quran', serif;
        }

        &.en {
          background: #dbeafe;
          color: #1e40af;
        }
      }

      .meta-info {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 0.75rem;
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #64748b;
        font-size: 0.875rem;

        i {
          color: #3b82f6;
        }
      }

      .bio-text {
        padding: 0.75rem;
        background: #f8fafc;
        border-radius: 0.5rem;
        color: #475569;
        font-size: 0.9rem;
        line-height: 1.6;
        border-left: 3px solid #3b82f6;
      }
    }

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
      max-width: 700px;
      max-height: 90vh;
      overflow-y: auto;
      z-index: 9999;
      animation: slideUp 0.3s ease;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

      &.confirm-modal {
        max-width: 500px;
      }
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
        font-size: 1.5rem;
      }

      .close-btn {
        background: none;
        border: none;
        color: #64748b;
        font-size: 1.5rem;
        cursor: pointer;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.5rem;
        transition: all 0.3s ease;

        &:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
      }
    }

    .modal-body {
      padding: 1.5rem;
    }

    .form-section {
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #e2e8f0;

      h4 {
        margin: 0 0 1rem 0;
        color: #0f172a;
        font-size: 1.1rem;
      }
    }

    .form-group {
      margin-bottom: 1.5rem;

      label {
        display: block;
        font-weight: 600;
        color: #334155;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;

        &.required::after {
          content: ' *';
          color: #ef4444;
        }
      }

      input, textarea, select {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 0.5rem;
        font-size: 1rem;
        font-family: inherit;
        transition: all 0.3s ease;

        &:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        &:disabled {
          background: #f1f5f9;
          cursor: not-allowed;
        }
      }

      input.arabic-input {
        font-family: 'Amiri Quran', serif;
        font-size: 1.25rem;
        text-align: right;
        direction: rtl;
      }

      textarea {
        resize: vertical;
        line-height: 1.6;
      }

      small {
        display: block;
        margin-top: 0.5rem;
        color: #64748b;
        font-size: 0.85rem;
      }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #e2e8f0;
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

    .warning {
      color: #f59e0b;
      font-weight: 600;
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
      .interpreters-grid {
        grid-template-columns: 1fr;
      }

      .modal {
        width: 95%;
        max-height: 95vh;
      }
    }
  `]
})
export class InterpretersManagerComponent implements OnInit {
  router = inject(Router);
  private supabaseService = inject(SupabaseService);
  private notificationService = inject(NotificationService);

  loading = signal(true);
  saving = signal(false);
  deleting = signal(false);

  allInterpreters = signal<Interpreter[]>([]);
  filteredInterpreters = signal<Interpreter[]>([]);

  searchTerm = '';

  showModal = signal(false);
  isEditMode = signal(false);
  interpreterToDelete = signal<Interpreter | null>(null);

  private editingId: number | null = null;

  formData: Partial<Interpreter> = {
    short_name: '',
    display_name_ar: '',
    display_name_en: '',
    display_name_it: '',
    bio_text: '',
    language_code: 'it'
  };

  async ngOnInit() {
    await this.loadInterpreters();
  }

  async loadInterpreters() {
    try {
      const { data } = await (this.supabaseService as any).supabase
        .from('interpreters')
        .select('*')
        .order('short_name');

      this.allInterpreters.set(data || []);
      this.filteredInterpreters.set(data || []);
    } catch (error) {
      console.error('Failed to load interpreters:', error);
      this.notificationService.error('فشل تحميل المفسرين');
    } finally {
      this.loading.set(false);
    }
  }

  filterInterpreters() {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredInterpreters.set(this.allInterpreters());
      return;
    }

    const filtered = this.allInterpreters().filter(i =>
      i.short_name.toLowerCase().includes(term) ||
      i.display_name_ar?.includes(term) ||
      i.display_name_en?.toLowerCase().includes(term) ||
      i.display_name_it?.toLowerCase().includes(term) ||
      i.bio_text?.toLowerCase().includes(term)
    );

    this.filteredInterpreters.set(filtered);
  }

  getLangName(code: string): string {
    const map: any = { ar: 'عربي', it: 'إيطالي', en: 'إنجليزي' };
    return map[code] || code;
  }

  openAddModal() {
    this.isEditMode.set(false);
    this.editingId = null;
    this.formData = {
      short_name: '',
      display_name_ar: '',
      display_name_en: '',
      display_name_it: '',
      bio_text: '',
      language_code: 'it'
    };
    this.showModal.set(true);
  }

  editInterpreter(interpreter: Interpreter) {
    this.isEditMode.set(true);
    this.editingId = interpreter.id;
    this.formData = { ...interpreter };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  async onSubmit() {
    this.saving.set(true);

    try {
      if (this.isEditMode() && this.editingId) {
        const { error } = await (this.supabaseService as any).supabase
          .from('interpreters')
          .update(this.formData)
          .eq('id', this.editingId);

        if (error) throw error;
        this.notificationService.success('تم تحديث المفسر بنجاح');
      } else {
        const { error } = await (this.supabaseService as any).supabase
          .from('interpreters')
          .insert([this.formData]);

        if (error) throw error;
        this.notificationService.success('تم إضافة المفسر بنجاح');
      }

      await this.loadInterpreters();
      this.filterInterpreters();
      this.closeModal();
    } catch (error: any) {
      console.error('Failed to save interpreter:', error);
      this.notificationService.error(error.message || 'فشل حفظ المفسر');
    } finally {
      this.saving.set(false);
    }
  }

  deleteInterpreter(interpreter: Interpreter) {
    this.interpreterToDelete.set(interpreter);
  }

  cancelDelete() {
    this.interpreterToDelete.set(null);
  }

  async confirmDelete() {
    const interpreter = this.interpreterToDelete();
    if (!interpreter) return;

    this.deleting.set(true);

    try {
      const { error } = await (this.supabaseService as any).supabase
        .from('interpreters')
        .delete()
        .eq('id', interpreter.id);

      if (error) throw error;

      this.notificationService.success('تم حذف المفسر بنجاح');
      await this.loadInterpreters();
      this.filterInterpreters();
      this.interpreterToDelete.set(null);
    } catch (error: any) {
      console.error('Failed to delete interpreter:', error);
      this.notificationService.error(error.message || 'فشل حذف المفسر');
    } finally {
      this.deleting.set(false);
    }
  }
}
