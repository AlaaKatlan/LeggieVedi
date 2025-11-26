// src/app/features/admin/quran-manager/surahs-manager/surahs-manager.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Surah, SurahFootnote } from '../../../../core/models/surah.model';

@Component({
  selector: 'app-surahs-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="surahs-manager">
      <!-- Header -->
      <div class="page-header">
        <h1>إدارة السور</h1>
        <button (click)="router.navigate(['/admin/quran'])" class="btn-secondary">
          <i class="fas fa-arrow-right"></i>
          رجوع
        </button>
      </div>

      <!-- Search -->
      <div class="search-bar">
        <input
          type="search"
          placeholder="بحث في السور..."
          [(ngModel)]="searchTerm"
          (input)="filterSurahs()"
          class="search-input"
        />
        <span class="results-count">{{ filteredSurahs().length }} من {{ surahs().length }}</span>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>جاري تحميل السور...</p>
        </div>
      } @else {
        <!-- Surahs List -->
        <div class="surahs-list">
          @for (surah of filteredSurahs(); track surah.id) {
            <div class="surah-card">
              <div class="surah-header">
                <div class="surah-number">{{ surah.order_number }}</div>
                <div class="surah-names">
                  <h3>{{ surah.name_ar }}</h3>
                  <p class="name-translations">
                    {{ surah.name_it }} • {{ surah.name_en }}
                    @if (surah.name_en_translation) {
                      <span class="translation">({{ surah.name_en_translation }})</span>
                    }
                  </p>
                </div>
                <button (click)="editSurah(surah)" class="btn-icon">
                  <i class="fas fa-edit"></i>
                </button>
              </div>

              <div class="surah-meta">
                <span class="meta-item">
                  <i class="fas fa-align-right"></i>
                  {{ surah.ayah_count }} آية
                </span>
                <!-- <span class="meta-item">
                  <i class="fas fa-map-marker-alt"></i>
                  {{ surah.revelation_place === 'Mecca' ? 'مكية' : 'مدنية' }}
                </span> -->
                @if (surah.name_footnotes && surah.name_footnotes.length > 0) {
                  <span class="meta-item">
                    <i class="fas fa-sticky-note"></i>
                    {{ surah.name_footnotes.length }} حواشي
                  </span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Edit Modal -->
    @if (editingSurah()) {
      <div class="modal-backdrop" (click)="closeModal()"></div>
      <div class="modal large-modal">
        <div class="modal-header">
          <h3>تعديل سورة {{ editingSurah()?.name_ar }}</h3>
          <button class="close-btn" (click)="closeModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form (ngSubmit)="onSubmit()" class="modal-body">
          <!-- Basic Info -->
          <div class="form-section">
            <h4>المعلومات الأساسية</h4>

            <div class="form-row">
              <div class="form-group">
                <label>رقم السورة</label>
                <input
                  type="number"
                  [(ngModel)]="formData.order_number"
                  name="order_number"
                  readonly
                  disabled
                />
              </div>
              <div class="form-group">
                <label>عدد الآيات</label>
                <input
                  type="number"
                  [(ngModel)]="formData.ayah_count"
                  name="ayah_count"
                  readonly
                  disabled
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>الاسم بالعربية</label>
                <input
                  type="text"
                  [(ngModel)]="formData.name_ar"
                  name="name_ar"
                  required
                  class="arabic-input"
                />
              </div>

              <div class="form-group">
                <label>الاسم بالإيطالية</label>
                <input
                  type="text"
                  [(ngModel)]="formData.name_it"
                  name="name_it"
                  required
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>الاسم بالإنجليزية</label>
                <input
                  type="text"
                  [(ngModel)]="formData.name_en"
                  name="name_en"
                  required
                />
              </div>

              <div class="form-group">
                <label>الترجمة الإنجليزية</label>
                <input
                  type="text"
                  [(ngModel)]="formData.name_en_translation"
                  name="name_en_translation"
                  placeholder="The Opening"
                />
              </div>
            </div>

            <div class="form-group">
              <label>مكان النزول</label>
              <select [(ngModel)]="formData.revelation_place" name="revelation_place">
                <option value="Mecca">مكة</option>
                <option value="Medina">المدينة</option>
              </select>
            </div>
          </div>

          <!-- Name Footnotes -->
          <div class="form-section">
            <div class="section-header-flex">
              <h4>حواشي الاسم</h4>
              <button type="button" (click)="addNameFootnote()" class="btn-add-small">
                <i class="fas fa-plus"></i>
                إضافة حاشية
              </button>
            </div>

            @if (formData.name_footnotes && formData.name_footnotes.length > 0) {
              <div class="footnotes-list">
                @for (footnote of formData.name_footnotes; track $index; let i = $index) {
                  <div class="footnote-item">
                    <div class="footnote-header">
                      <span class="footnote-number">{{ i + 1 }}</span>
                      <button
                        type="button"
                        (click)="removeNameFootnote(i)"
                        class="btn-remove-small">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>

                    <div class="form-group">
                      <label>النص المرجعي</label>
                      <input
                        type="text"
                        [(ngModel)]="footnote.ref"
                        [name]="'footnote_ref_' + i"
                        placeholder="الكلمة أو العبارة المشار إليها"
                      />
                    </div>
                    <div class="form-group">
                      <label>نص الحاشية</label>
                      <textarea
                        [(ngModel)]="footnote.note"
                        [name]="'footnote_note_' + i"
                        rows="3"
                        placeholder="شرح أو توضيح للنص المرجعي"
                      ></textarea>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="no-data">لا توجد حواشي للاسم</p>
            }
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
                حفظ التغييرات
              }
            </button>
          </div>
        </form>
      </div>
    }
  `,
  styles: [`
    .surahs-manager {
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

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
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
        border-color: #01579b;
        box-shadow: 0 0 0 3px rgba(1, 87, 155, 0.1);
      }
    }

    .results-count {
      color: #64748b;
      font-weight: 600;
      white-space: nowrap;
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

    .surahs-list {
      display: grid;
      gap: 1rem;
    }

    .surah-card {
      background: white;
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        transform: translateX(-5px);
      }
    }

    .surah-header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 1rem;
    }

    .surah-number {
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #01579b, #00897b);
      color: white;
      border-radius: 12px;
      font-weight: 700;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .surah-names {
      flex: 1;

      h3 {
        margin: 0 0 0.25rem 0;
        font-family: 'Amiri Quran', serif;
        font-size: 1.5rem;
        color: #0f172a;
      }

      .name-translations {
        margin: 0;
        color: #64748b;
        font-size: 0.95rem;

        .translation {
          color: #94a3b8;
          font-style: italic;
        }
      }
    }

    .btn-icon {
      width: 40px;
      height: 40px;
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
        background: #01579b;
        color: white;
      }
    }

    .surah-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #64748b;
      font-size: 0.9rem;

      i {
        color: #01579b;
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
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      z-index: 9999;
      animation: slideUp 0.3s ease;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

      &.large-modal {
        max-width: 1000px;
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
        font-family: 'Amiri Quran', serif;
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

      &:last-of-type {
        border-bottom: none;
      }

      h4 {
        margin: 0 0 1.5rem 0;
        color: #0f172a;
        font-size: 1.25rem;
      }
    }

    .section-header-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;

      h4 {
        margin: 0;
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .form-group {
      margin-bottom: 1rem;

      label {
        display: block;
        font-weight: 600;
        color: #334155;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
      }

      input,
      textarea,
      select {
        width: 100%;
        padding: 0.75rem 1rem;
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
        min-height: 80px;
      }
    }

    .btn-add-small {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }
    }

    .footnotes-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .footnote-item {
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      border-right: 3px solid #01579b;
    }

    .footnote-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .footnote-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background: #01579b;
      color: white;
      border-radius: 50%;
      font-weight: 700;
      font-size: 0.875rem;
    }

    .btn-remove-small {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fee2e2;
      color: #ef4444;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: #ef4444;
        color: white;
      }
    }

    .no-data {
      padding: 2rem;
      text-align: center;
      color: #94a3b8;
      background: #f8fafc;
      border-radius: 0.5rem;
      margin: 0;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #e2e8f0;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #01579b, #00897b);
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(1, 87, 155, 0.3);
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
      .form-row {
        grid-template-columns: 1fr;
      }

      .modal {
        width: 95%;
        max-height: 95vh;
      }
    }
  `]
})
export class SurahsManagerComponent implements OnInit {
  router = inject(Router);
  private supabaseService = inject(SupabaseService);
  private notificationService = inject(NotificationService);

  loading = signal(true);
  saving = signal(false);
  surahs = signal<Surah[]>([]);
  filteredSurahs = signal<Surah[]>([]);
  editingSurah = signal<Surah | null>(null);

  searchTerm = '';

  formData: Partial<Surah> = {
    name_ar: '',
    name_en: '',
    name_it: '',
    name_en_translation: '',
    // revelation_place: 'Mecca',
    name_footnotes: []
  };

  async ngOnInit() {
    await this.loadSurahs();
  }

  async loadSurahs() {
    try {
      const data = await this.supabaseService.getAllSurahs();
      this.surahs.set(data);
      this.filteredSurahs.set(data);
    } catch (error) {
      console.error('Failed to load surahs:', error);
      this.notificationService.error('فشل تحميل السور');
    } finally {
      this.loading.set(false);
    }
  }

  filterSurahs() {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredSurahs.set(this.surahs());
      return;
    }

    const filtered = this.surahs().filter(s =>
      s.name_ar.includes(term) ||
      s.name_en.toLowerCase().includes(term) ||
      s.name_it.toLowerCase().includes(term) ||
      s.order_number.toString() === term
    );

    this.filteredSurahs.set(filtered);
  }

  editSurah(surah: Surah) {
    this.formData = {
      ...surah,
      name_footnotes: surah.name_footnotes ? [...surah.name_footnotes] : []
    };
    this.editingSurah.set(surah);
  }

  closeModal() {
    this.editingSurah.set(null);
  }

  addNameFootnote() {
    if (!this.formData.name_footnotes) {
      this.formData.name_footnotes = [];
    }
    this.formData.name_footnotes.push({ ref: '', note: '' });
  }

  removeNameFootnote(index: number) {
    this.formData.name_footnotes?.splice(index, 1);
  }

  async onSubmit() {
    if (!this.editingSurah()) return;

    this.saving.set(true);

    try {
      const { error } = await (this.supabaseService as any).supabase
        .from('surahs')
        .update({
          name_ar: this.formData.name_ar,
          name_en: this.formData.name_en,
          name_it: this.formData.name_it,
          name_en_translation: this.formData.name_en_translation,
          revelation_place: this.formData.revelation_place,
          name_footnotes: this.formData.name_footnotes
        })
        .eq('id', this.editingSurah()!.id);

      if (error) throw error;

      this.notificationService.success('تم تحديث السورة بنجاح');
      await this.loadSurahs();
      this.filterSurahs();
      this.closeModal();
    } catch (error: any) {
      console.error('Failed to update surah:', error);
      this.notificationService.error(error.message || 'فشل تحديث السورة');
    } finally {
      this.saving.set(false);
    }
  }
}
