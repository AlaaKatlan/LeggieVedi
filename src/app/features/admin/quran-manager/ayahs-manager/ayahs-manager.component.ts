// src/app/features/admin/quran-manager/ayahs-manager/ayahs-manager.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Surah } from '../../../../core/models/surah.model';
import { AyahFull } from '../../../../core/models/ayah.model';

@Component({
  selector: 'app-ayahs-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ayahs-manager">
      <!-- Header -->
      <div class="page-header">
        <h1>إدارة الآيات</h1>
        <button (click)="router.navigate(['/admin/quran'])" class="btn-secondary">
          <i class="fas fa-arrow-right"></i>
          رجوع
        </button>
      </div>

      <!-- Surah Selector -->
      <div class="surah-selector">
        <div class="selector-group">
          <label>اختر السورة:</label>
          <select [(ngModel)]="selectedSurahId" (change)="onSurahChange()" class="surah-select">
            <option [value]="null">-- اختر السورة --</option>
            @for (surah of surahs(); track surah.id) {
              <option [value]="surah.id">
                {{ surah.order_number }}. {{ surah.name_ar }} ({{ surah.ayah_count }} آية)
              </option>
            }
          </select>
        </div>

        @if (selectedSurah()) {
          <div class="surah-info">
            <h3>{{ selectedSurah()?.name_ar }}</h3>
            <p>{{ selectedSurah()?.name_it }} - {{ selectedSurah()?.ayah_count }} آيات</p>
          </div>
        }
      </div>

      <!-- Loading -->
      @if (loadingAyahs()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>جاري تحميل الآيات...</p>
        </div>
      } @else if (selectedSurahId) {
        <!-- Search -->
        <div class="search-bar">
          <input
            type="search"
            placeholder="بحث في الآيات..."
            [(ngModel)]="searchTerm"
            (input)="filterAyahs()"
            class="search-input"
          />
          <span class="results-count">{{ filteredAyahs().length }} من {{ ayahs().length }} آية</span>
        </div>

        <!-- Ayahs List -->
        @if (filteredAyahs().length === 0) {
          <div class="empty-state">
            <i class="fas fa-search"></i>
            <p>لا توجد نتائج</p>
          </div>
        } @else {
          <div class="ayahs-list">
            @for (ayah of filteredAyahs(); track ayah.ayah_id) {
              <div class="ayah-card">
                <div class="ayah-header">
                  <span class="ayah-number">آية {{ ayah.verse_number }}</span>
                  <button (click)="editAyah(ayah)" class="btn-icon">
                    <i class="fas fa-edit"></i>
                  </button>
                </div>

                <div class="ayah-content">
                  <div class="arabic-text">{{ ayah.text_uthmani }}</div>

                  @if (ayah.primary_tafsir) {
                    <div class="tafsir-preview">
                      <strong>التفسير:</strong>
                      {{ ayah.primary_tafsir.text | slice:0:150 }}...
                    </div>
                  }

                  <div class="ayah-meta">
                    @if (ayah.extra_tafsirs.length > 0) {
                      <span class="meta-badge">
                        <i class="fas fa-comments"></i>
                        {{ ayah.extra_tafsirs.length }} تفسير إضافي
                      </span>
                    }
                    @if (ayah.footnotes.length > 0) {
                      <span class="meta-badge">
                        <i class="fas fa-sticky-note"></i>
                        {{ ayah.footnotes.length }} حاشية
                      </span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }
      } @else {
        <div class="empty-state">
          <i class="fas fa-book-quran"></i>
          <p>الرجاء اختيار سورة لعرض الآيات</p>
        </div>
      }
    </div>

    <!-- Edit Modal -->
    @if (editingAyah()) {
      <div class="modal-backdrop" (click)="closeModal()"></div>
      <div class="modal large-modal">
        <div class="modal-header">
          <h3>تعديل الآية {{ editingAyah()?.verse_number }} - {{ selectedSurah()?.name_ar }}</h3>
          <button class="close-btn" (click)="closeModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form (ngSubmit)="onSubmit()" class="modal-body">
          <!-- Arabic Text -->
          <div class="form-section">
            <h4>النص القرآني</h4>

            <div class="form-group">
              <label>النص العثماني</label>
              <textarea
                [(ngModel)]="formData.text_uthmani"
                name="text_uthmani"
                rows="4"
                class="arabic-input"
                readonly
              ></textarea>
              <small>⚠️ النص القرآني لا يُعدل - للعرض فقط</small>
            </div>

            <div class="form-group">
              <label>النص المنقّى (للبحث)</label>
              <textarea
                [(ngModel)]="formData.text_clean"
                name="text_clean"
                rows="3"
              ></textarea>
            </div>
          </div>

          <!-- Primary Tafsir -->
          <div class="form-section">
            <h4>التفسير الرئيسي</h4>

            @if (formData.primary_tafsir) {
              <div class="form-group">
                <label>المفسر</label>
                <input
                  type="text"
                  [value]="formData.primary_tafsir.interpreter?.display_name_it || 'غير محدد'"
                  readonly
                  disabled
                />
              </div>

              <div class="form-group">
                <label>نص التفسير</label>
                <textarea
                  [(ngModel)]="formData.primary_tafsir.text"
                  name="primary_tafsir_text"
                  rows="8"
                ></textarea>
              </div>

              <div class="form-group">
                <label>اللغة</label>
                <select [(ngModel)]="formData.primary_tafsir.lang" name="primary_tafsir_lang">
                  <option value="ar">العربية</option>
                  <option value="it">الإيطالية</option>
                  <option value="en">الإنجليزية</option>
                </select>
              </div>
            } @else {
              <p class="no-data">لا يوجد تفسير رئيسي لهذه الآية</p>
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
    .ayahs-manager {
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

    .surah-selector {
      background: white;
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      margin-bottom: 2rem;
    }

    .selector-group {
      margin-bottom: 1.5rem;

      label {
        display: block;
        font-weight: 600;
        color: #334155;
        margin-bottom: 0.5rem;
      }

      .surah-select {
        width: 100%;
        padding: 0.875rem 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 0.5rem;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;

        &:focus {
          outline: none;
          border-color: #01579b;
          box-shadow: 0 0 0 3px rgba(1, 87, 155, 0.1);
        }
      }
    }

    .surah-info {
      padding: 1rem;
      background: linear-gradient(135deg, #01579b, #00897b);
      border-radius: 0.75rem;
      color: white;

      h3 {
        margin: 0 0 0.5rem 0;
        font-family: 'Amiri Quran', serif;
        font-size: 1.75rem;
      }

      p {
        margin: 0;
        opacity: 0.95;
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

    .loading-state,
    .empty-state {
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
      border-top-color: #01579b;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .ayahs-list {
      display: grid;
      gap: 1rem;
    }

    .ayah-card {
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

    .ayah-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e2e8f0;
    }

    .ayah-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, #01579b, #00897b);
      color: white;
      border-radius: 2rem;
      font-weight: 700;
      font-size: 0.95rem;
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

    .ayah-content {
      .arabic-text {
        font-family: 'Amiri Quran', serif;
        font-size: 1.75rem;
        line-height: 2.5;
        text-align: right;
        direction: rtl;
        color: #0f172a;
        margin-bottom: 1.5rem;
        padding: 1.5rem;
        background: #f8fafc;
        border-radius: 0.75rem;
        border-right: 4px solid #01579b;
      }

      .tafsir-preview {
        padding: 1rem;
        background: #f1f5f9;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        color: #475569;
        line-height: 1.8;

        strong {
          color: #01579b;
          display: block;
          margin-bottom: 0.5rem;
        }
      }
    }

    .ayah-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .meta-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.75rem;
      background: #e0f2fe;
      color: #0369a1;
      border-radius: 1rem;
      font-size: 0.85rem;
      font-weight: 600;

      i {
        font-size: 0.875rem;
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
      max-width: 900px;
      max-height: 90vh;
      overflow-y: auto;
      z-index: 9999;
      animation: slideUp 0.3s ease;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

      &.large-modal {
        max-width: 1100px;
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

      &:last-of-type {
        border-bottom: none;
      }

      h4 {
        margin: 0 0 1.5rem 0;
        color: #0f172a;
        font-size: 1.25rem;
      }
    }

    .form-group {
      margin-bottom: 1.5rem;

      &:last-child {
        margin-bottom: 0;
      }

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

      textarea {
        resize: vertical;
        min-height: 100px;

        &.arabic-input {
          font-family: 'Amiri Quran', serif;
          font-size: 1.5rem;
          line-height: 2;
          text-align: right;
          direction: rtl;
        }
      }

      small {
        display: block;
        margin-top: 0.5rem;
        color: #64748b;
        font-size: 0.85rem;
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
      .modal {
        width: 95%;
        max-height: 95vh;
      }
    }
  `]
})
export class AyahsManagerComponent implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private supabaseService = inject(SupabaseService);
  private notificationService = inject(NotificationService);

  surahs = signal<Surah[]>([]);
  ayahs = signal<AyahFull[]>([]);
  filteredAyahs = signal<AyahFull[]>([]);

  loadingAyahs = signal(false);
  saving = signal(false);

  selectedSurahId: number | null = null;
  selectedSurah = computed(() =>
    this.surahs().find(s => s.id === this.selectedSurahId) || null
  );

  editingAyah = signal<AyahFull | null>(null);
  searchTerm = '';

  formData: Partial<AyahFull> = {
    text_uthmani: '',
    text_clean: '',
    primary_tafsir: null
  };

  async ngOnInit() {
    // Load surahs
    const surahsData = await this.supabaseService.getAllSurahs();
    this.surahs.set(surahsData);

    // Check if surah is specified in query params
    this.route.queryParams.subscribe(params => {
      if (params['surah']) {
        this.selectedSurahId = parseInt(params['surah']);
        this.onSurahChange();
      }
    });
  }

  async onSurahChange() {
    if (!this.selectedSurahId) {
      this.ayahs.set([]);
      this.filteredAyahs.set([]);
      return;
    }

    this.loadingAyahs.set(true);
    this.searchTerm = '';

    try {
      const data = await this.supabaseService.getFullSurah(this.selectedSurahId);
      this.ayahs.set(data);
      this.filteredAyahs.set(data);
      this.notificationService.success(`تم تحميل ${data.length} آية`);
    } catch (error) {
      console.error('Failed to load ayahs:', error);
      this.notificationService.error('فشل تحميل الآيات');
    } finally {
      this.loadingAyahs.set(false);
    }
  }

  filterAyahs() {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredAyahs.set(this.ayahs());
      return;
    }

    const filtered = this.ayahs().filter(ayah =>
      ayah.text_clean.includes(term) ||
      ayah.text_uthmani.includes(term) ||
      ayah.primary_tafsir?.text.toLowerCase().includes(term)
    );

    this.filteredAyahs.set(filtered);
  }

  editAyah(ayah: AyahFull) {
    this.formData = {
      ...ayah,
      primary_tafsir: ayah.primary_tafsir ? { ...ayah.primary_tafsir } : null
    };
    this.editingAyah.set(ayah);
  }

  closeModal() {
    this.editingAyah.set(null);
  }

  async onSubmit() {
    if (!this.editingAyah()) return;

    this.saving.set(true);

    try {
      // Update text_clean in ayahs table
      if (this.formData.text_clean !== this.editingAyah()?.text_clean) {
        const { error: ayahError } = await (this.supabaseService as any).supabase
          .from('ayahs')
          .update({ text_clean: this.formData.text_clean })
          .eq('id', this.editingAyah()!.ayah_id);

        if (ayahError) throw ayahError;
      }

      // Update primary tafsir if exists
      if (this.formData.primary_tafsir?.id) {
        const { error: tafsirError } = await (this.supabaseService as any).supabase
          .from('tafsirs')
          .update({
            text: this.formData.primary_tafsir.text,
            lang: this.formData.primary_tafsir.lang
          })
          .eq('id', this.formData.primary_tafsir.id);

        if (tafsirError) throw tafsirError;
      }

      this.notificationService.success('تم تحديث الآية بنجاح');
      await this.onSurahChange(); // Reload
      this.closeModal();
    } catch (error: any) {
      console.error('Failed to update ayah:', error);
      this.notificationService.error(error.message || 'فشل تحديث الآية');
    } finally {
      this.saving.set(false);
    }
  }
}
