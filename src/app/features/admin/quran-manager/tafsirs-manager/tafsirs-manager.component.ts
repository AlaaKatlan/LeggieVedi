// src/app/features/admin/quran-manager/tafsirs-manager/tafsirs-manager.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {  Surah } from '../../../../core/models/surah.model';
import { Interpreter } from '../../../../core/models/interpreter.model';

@Component({
  selector: 'app-tafsirs-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tafsirs-manager">
      <!-- Header -->
      <div class="page-header">
        <h1>إدارة التفاسير</h1>
        <div class="header-actions">
          <button (click)="openAddModal()" class="btn-primary">
            <i class="fas fa-plus"></i>
            تفسير جديد
          </button>
          <button (click)="router.navigate(['/admin/quran'])" class="btn-secondary">
            <i class="fas fa-arrow-right"></i>
            رجوع
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <input
          type="search"
          placeholder="بحث في التفاسير..."
          [(ngModel)]="searchTerm"
          (input)="filterTafsirs()"
          class="search-input"
        />

        <select [(ngModel)]="filterType" (change)="filterTafsirs()" class="filter-select">
          <option value="">كل الأنواع</option>
          <option value="main">رئيسي</option>
          <option value="extra">إضافي</option>
        </select>

        <select [(ngModel)]="filterLang" (change)="filterTafsirs()" class="filter-select">
          <option value="">كل اللغات</option>
          <option value="ar">عربي</option>
          <option value="it">إيطالي</option>
          <option value="en">إنجليزي</option>
        </select>

        <span class="results-count">{{ filteredTafsirs().length }} تفسير</span>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>جاري تحميل التفاسير...</p>
        </div>
      } @else {
        <!-- Tafsirs List -->
        @if (filteredTafsirs().length === 0) {
          <div class="empty-state">
            <i class="fas fa-comments"></i>
            <p>لا توجد تفاسير</p>
          </div>
        } @else {
          <div class="tafsirs-list">
            @for (tafsir of filteredTafsirs(); track tafsir.id) {
              <div class="tafsir-card">
                <div class="tafsir-header">
                  <div class="tafsir-badge" [class.main]="tafsir.type === 'main'" [class.extra]="tafsir.type === 'extra'">
                    {{ tafsir.type === 'main' ? 'رئيسي' : 'إضافي' }}
                  </div>
                  <div class="tafsir-meta">
                    <span class="surah-info">
                      {{ tafsir.surah_name }} - آية {{ tafsir.verse_number }}
                    </span>
                    <span class="lang-badge" [class]="'lang-' + tafsir.language_code">
                      {{ getLangName(tafsir.language_code) }}
                    </span>
                  </div>
                  <div class="actions">
                    <button (click)="editTafsir(tafsir)" class="btn-icon" title="تعديل">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button (click)="deleteTafsir(tafsir)" class="btn-icon btn-danger" title="حذف">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>

                <div class="tafsir-content">
                  <div class="arabic-text">{{ tafsir.text_uthmani }}</div>
                  <div class="tafsir-text">
                    {{ tafsir.tafsir_text | slice:0:200 }}...
                  </div>
                  @if (tafsir.interpreter) {
                    <div class="interpreter-info">
                      <i class="fas fa-user-graduate"></i>
                      {{ tafsir.interpreter.display_name_it || tafsir.interpreter.short_name }}
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
      <div class="modal large-modal">
        <div class="modal-header">
          <h3>{{ isEditMode() ? 'تعديل التفسير' : 'تفسير جديد' }}</h3>
          <button class="close-btn" (click)="closeModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form (ngSubmit)="onSubmit()" class="modal-body">
          <!-- Type Selection -->
          <div class="form-group">
            <label class="required">نوع التفسير</label>
            <select [(ngModel)]="formData.type" name="type" required [disabled]="isEditMode()">
              <option value="">-- اختر النوع --</option>
              <option value="main">رئيسي</option>
              <option value="extra">إضافي</option>
            </select>
          </div>

          <!-- Surah and Ayah Selection -->
          <div class="form-row">
            <div class="form-group">
              <label class="required">السورة</label>
              <select
                [(ngModel)]="selectedSurahId"
                name="surah"
                required
                (change)="onSurahChange()"
                [disabled]="isEditMode()">
                <option [value]="null">-- اختر السورة --</option>
                @for (surah of surahs(); track surah.id) {
                  <option [value]="surah.id">
                    {{ surah.order_number }}. {{ surah.name_ar }}
                  </option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="required">رقم الآية</label>
              <select
                [(ngModel)]="formData.ayah_id"
                name="ayah_id"
                required
                [disabled]="!selectedSurahId || isEditMode()">
                <option [value]="null">-- اختر الآية --</option>
                @for (ayah of availableAyahs(); track ayah.id) {
                  <option [value]="ayah.id">
                    آية {{ ayah.verse_number }}
                  </option>
                }
              </select>
            </div>
          </div>

          <!-- Interpreter -->
          <div class="form-group">
            <label>المفسر (اختياري)</label>
            <select [(ngModel)]="formData.interpreter_id" name="interpreter_id">
              <option [value]="null">-- بدون مفسر --</option>
              @for (interp of interpreters(); track interp.id) {
                <option [value]="interp.id">
                  {{ interp.display_name_it || interp.short_name }}
                </option>
              }
            </select>
          </div>

          <!-- Language -->
          <div class="form-group">
            <label class="required">اللغة</label>
            <select [(ngModel)]="formData.language_code" name="language_code" required>
              <option value="ar">العربية</option>
              <option value="it">الإيطالية</option>
              <option value="en">الإنجليزية</option>
            </select>
          </div>

          <!-- Tafsir Text -->
          <div class="form-group">
            <label class="required">نص التفسير</label>
            <textarea
              [(ngModel)]="formData.tafsir_text"
              name="tafsir_text"
              rows="15"
              required
              placeholder="اكتب نص التفسير هنا..."
            ></textarea>
          </div>

          <!-- Extra Tafsir Fields -->
          @if (formData.type === 'extra') {
            <div class="form-row">
              <div class="form-group">
                <label>اسم المصدر (اختياري)</label>
                <input
                  type="text"
                  [(ngModel)]="formData.source_name"
                  name="source_name"
                  placeholder="اسم الكتاب أو المصدر"
                />
              </div>

              <div class="form-group">
                <label>ترتيب العرض</label>
                <input
                  type="number"
                  [(ngModel)]="formData.display_order"
                  name="display_order"
                  min="0"
                />
              </div>
            </div>
          }

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
    @if (tafsirToDelete()) {
      <div class="modal-backdrop" (click)="cancelDelete()"></div>
      <div class="modal confirm-modal">
        <div class="modal-header">
          <h3>تأكيد الحذف</h3>
          <button class="close-btn" (click)="cancelDelete()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>هل أنت متأكد من حذف هذا التفسير؟</p>
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
    .tafsirs-manager {
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

    .filters-bar {
      background: white;
      padding: 1.5rem;
      border-radius: 1rem;
      margin-bottom: 2rem;
      display: flex;
      gap: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      flex-wrap: wrap;
    }

    .search-input {
      flex: 1;
      min-width: 250px;
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
      background: white;
      transition: all 0.3s ease;

      &:focus {
        outline: none;
        border-color: #01579b;
      }
    }

    .results-count {
      display: flex;
      align-items: center;
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
      border-top-color: #01579b;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .tafsirs-list {
      display: grid;
      gap: 1.5rem;
    }

    .tafsir-card {
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

    .tafsir-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e2e8f0;
      flex-wrap: wrap;
    }

    .tafsir-badge {
      padding: 0.375rem 0.875rem;
      border-radius: 1rem;
      font-size: 0.875rem;
      font-weight: 700;
      text-transform: uppercase;

      &.main {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
      }

      &.extra {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        color: white;
      }
    }

    .tafsir-meta {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .surah-info {
      font-weight: 600;
      color: #334155;
    }

    .lang-badge {
      padding: 0.25rem 0.625rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;

      &.lang-ar {
        background: #dcfce7;
        color: #166534;
      }

      &.lang-it {
        background: #dbeafe;
        color: #1e40af;
      }

      &.lang-en {
        background: #fef3c7;
        color: #92400e;
      }
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
        background: #01579b;
        color: white;
      }

      &.btn-danger:hover {
        background: #ef4444;
      }
    }

    .tafsir-content {
      .arabic-text {
        font-family: 'Amiri Quran', serif;
        font-size: 1.5rem;
        line-height: 2;
        text-align: right;
        direction: rtl;
        color: #0f172a;
        margin-bottom: 1rem;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 0.5rem;
        border-right: 4px solid #01579b;
      }

      .tafsir-text {
        color: #475569;
        line-height: 1.8;
        margin-bottom: 1rem;
      }

      .interpreter-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #64748b;
        font-size: 0.9rem;

        i {
          color: #01579b;
        }
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

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
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
        line-height: 1.6;
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
      .filters-bar {
        flex-direction: column;
      }

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
export class TafsirsManagerComponent implements OnInit {
  router = inject(Router);
  private supabaseService = inject(SupabaseService);
  private notificationService = inject(NotificationService);

  loading = signal(true);
  saving = signal(false);
  deleting = signal(false);

  allTafsirs = signal<any[]>([]);
  filteredTafsirs = signal<any[]>([]);
  surahs = signal<Surah[]>([]);
  interpreters = signal<Interpreter[]>([]);
  availableAyahs = signal<any[]>([]);

  searchTerm = '';
  filterType = '';
  filterLang = '';

  showModal = signal(false);
  isEditMode = signal(false);
  tafsirToDelete = signal<any>(null);

  selectedSurahId: number | null = null;
  private editingId: number | null = null;

  formData: any = {
    type: '',
    ayah_id: null,
    tafsir_text: '',
    interpreter_id: null,
    language_code: 'it',
    source_name: '',
    display_order: 0
  };

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      // Load surahs
      const surahsData = await this.supabaseService.getAllSurahs();
      this.surahs.set(surahsData);

      // Load interpreters
      const { data: interpretersData } = await (this.supabaseService as any).supabase
        .from('interpreters')
        .select('*')
        .order('short_name');

      if (interpretersData) {
        this.interpreters.set(interpretersData);
      }

      // Load all tafsirs
      await this.loadTafsirs();
    } catch (error) {
      console.error('Failed to load data:', error);
      this.notificationService.error('فشل تحميل البيانات');
    } finally {
      this.loading.set(false);
    }
  }

  async loadTafsirs() {
    try {
      // Load main tafsirs
      const { data: mainData } = await (this.supabaseService as any).supabase
        .from('tafsir_main')
        .select(`
          *,
          ayahs!inner(id, verse_number, text_uthmani, surah_id),
          surahs!inner(name_ar),
          interpreters(*)
        `)
        .order('ayahs(surah_id)', { ascending: true })
        .order('ayahs(verse_number)', { ascending: true });

      // Load extra tafsirs
      const { data: extraData } = await (this.supabaseService as any).supabase
        .from('tafsir_extra')
        .select(`
          *,
          ayahs!inner(id, verse_number, text_uthmani, surah_id),
          surahs!inner(name_ar),
          interpreters(*)
        `)
        .order('ayahs(surah_id)', { ascending: true })
        .order('ayahs(verse_number)', { ascending: true })
        .order('display_order', { ascending: true });

      const allTafsirs = [
        ...(mainData || []).map((t: any) => ({
          ...t,
          type: 'main',
          surah_name: t.surahs?.name_ar,
          verse_number: t.ayahs?.verse_number,
          text_uthmani: t.ayahs?.text_uthmani,
          interpreter: t.interpreters
        })),
        ...(extraData || []).map((t: any) => ({
          ...t,
          type: 'extra',
          surah_name: t.surahs?.name_ar,
          verse_number: t.ayahs?.verse_number,
          text_uthmani: t.ayahs?.text_uthmani,
          interpreter: t.interpreters
        }))
      ];

      this.allTafsirs.set(allTafsirs);
      this.filteredTafsirs.set(allTafsirs);
    } catch (error) {
      console.error('Failed to load tafsirs:', error);
    }
  }

  filterTafsirs() {
    let filtered = this.allTafsirs();

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.tafsir_text.toLowerCase().includes(term) ||
        t.surah_name?.includes(term)
      );
    }

    // Filter by type
    if (this.filterType) {
      filtered = filtered.filter(t => t.type === this.filterType);
    }

    // Filter by language
    if (this.filterLang) {
      filtered = filtered.filter(t => t.language_code === this.filterLang);
    }

    this.filteredTafsirs.set(filtered);
  }

  async onSurahChange() {
    if (!this.selectedSurahId) {
      this.availableAyahs.set([]);
      return;
    }

    try {
      const { data } = await (this.supabaseService as any).supabase
        .from('ayahs')
        .select('id, verse_number')
        .eq('surah_id', this.selectedSurahId)
        .order('verse_number');

      this.availableAyahs.set(data || []);
    } catch (error) {
      console.error('Failed to load ayahs:', error);
    }
  }

  getLangName(code: string): string {
    const map: any = { ar: 'عربي', it: 'إيطالي', en: 'إنجليزي' };
    return map[code] || code;
  }

  openAddModal() {
    this.isEditMode.set(false);
    this.editingId = null;
    this.selectedSurahId = null;
    this.availableAyahs.set([]);
    this.formData = {
      type: '',
      ayah_id: null,
      tafsir_text: '',
      interpreter_id: null,
      language_code: 'it',
      source_name: '',
      display_order: 0
    };
    this.showModal.set(true);
  }

  editTafsir(tafsir: any) {
    this.isEditMode.set(true);
    this.editingId = tafsir.id;
    this.selectedSurahId = tafsir.ayahs?.surah_id || null;

    this.formData = {
      type: tafsir.type,
      ayah_id: tafsir.ayah_id,
      tafsir_text: tafsir.tafsir_text,
      interpreter_id: tafsir.interpreter_id,
      language_code: tafsir.language_code,
      source_name: tafsir.source_name || '',
      display_order: tafsir.display_order || 0
    };

    if (this.selectedSurahId) {
      this.onSurahChange();
    }

    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  async onSubmit() {
    this.saving.set(true);

    try {
      const table = this.formData.type === 'main' ? 'tafsir_main' : 'tafsir_extra';

      const dataToSave: any = {
        ayah_id: this.formData.ayah_id,
        tafsir_text: this.formData.tafsir_text,
        language_code: this.formData.language_code,
        interpreter_id: this.formData.interpreter_id || null
      };

      if (this.formData.type === 'extra') {
        dataToSave.source_name = this.formData.source_name;
        dataToSave.display_order = this.formData.display_order;
      }

      if (this.isEditMode() && this.editingId) {
        const { error } = await (this.supabaseService as any).supabase
          .from(table)
          .update(dataToSave)
          .eq('id', this.editingId);

        if (error) throw error;
        this.notificationService.success('تم تحديث التفسير بنجاح');
      } else {
        const { error } = await (this.supabaseService as any).supabase
          .from(table)
          .insert([dataToSave]);

        if (error) throw error;
        this.notificationService.success('تم إضافة التفسير بنجاح');
      }

      await this.loadTafsirs();
      this.filterTafsirs();
      this.closeModal();
    } catch (error: any) {
      console.error('Failed to save tafsir:', error);
      this.notificationService.error(error.message || 'فشل حفظ التفسير');
    } finally {
      this.saving.set(false);
    }
  }

  deleteTafsir(tafsir: any) {
    this.tafsirToDelete.set(tafsir);
  }

  cancelDelete() {
    this.tafsirToDelete.set(null);
  }

  async confirmDelete() {
    const tafsir = this.tafsirToDelete();
    if (!tafsir) return;

    this.deleting.set(true);

    try {
      const table = tafsir.type === 'main' ? 'tafsir_main' : 'tafsir_extra';

      const { error } = await (this.supabaseService as any).supabase
        .from(table)
        .delete()
        .eq('id', tafsir.id);

      if (error) throw error;

      this.notificationService.success('تم حذف التفسير بنجاح');
      await this.loadTafsirs();
      this.filterTafsirs();
      this.tafsirToDelete.set(null);
    } catch (error: any) {
      console.error('Failed to delete tafsir:', error);
      this.notificationService.error(error.message || 'فشل حذف التفسير');
    } finally {
      this.deleting.set(false);
    }
  }
}
