// src/app/features/admin/quran-manager/footnotes-manager/footnotes-manager.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {  Surah } from '../../../../core/models/surah.model';

@Component({
  selector: 'app-footnotes-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="footnotes-manager">
      <!-- Header -->
      <div class="page-header">
        <h1>إدارة الحواشي</h1>
        <div class="header-actions">
          <button (click)="openAddModal()" class="btn-primary">
            <i class="fas fa-plus"></i>
            حاشية جديدة
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
          placeholder="بحث في الحواشي..."
          [(ngModel)]="searchTerm"
          (input)="filterFootnotes()"
          class="search-input"
        />

        <select [(ngModel)]="filterType" (change)="filterFootnotes()" class="filter-select">
          <option value="">كل الأنواع</option>
          <option value="main">تفسير رئيسي</option>
          <option value="extra">تفسير إضافي</option>
        </select>

        <span class="results-count">{{ filteredFootnotes().length }} حاشية</span>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>جاري تحميل الحواشي...</p>
        </div>
      } @else {
        <!-- Footnotes List -->
        @if (filteredFootnotes().length === 0) {
          <div class="empty-state">
            <i class="fas fa-sticky-note"></i>
            <p>لا توجد حواشي</p>
          </div>
        } @else {
          <div class="footnotes-list">
            @for (footnote of filteredFootnotes(); track footnote.id) {
              <div class="footnote-card">
                <div class="footnote-header">
                  <div class="footnote-badge" [class]="'type-' + footnote.tafsir_type">
                    {{ footnote.tafsir_type === 'main' ? 'تفسير رئيسي' : 'تفسير إضافي' }}
                  </div>
                  <div class="footnote-meta">
                    <span class="surah-info">
                      {{ footnote.surah_name }} - آية {{ footnote.verse_number }}
                    </span>
                    @if (footnote.position_index !== null) {
                      <span class="position-badge">ترتيب: {{ footnote.position_index }}</span>
                    }
                  </div>
                  <div class="actions">
                    <button (click)="editFootnote(footnote)" class="btn-icon" title="تعديل">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button (click)="deleteFootnote(footnote)" class="btn-icon btn-danger" title="حذف">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>

                <div class="footnote-content">
                  <div class="arabic-text">{{ footnote.text_uthmani }}</div>

                  @if (footnote.reference_text) {
                    <div class="reference-text">
                      <strong>النص المرجعي:</strong>
                      <span class="ref-highlight">{{ footnote.reference_text }}</span>
                    </div>
                  }

                  <div class="note-text">
                    <strong>نص الحاشية:</strong>
                    <p>{{ footnote.note_text }}</p>
                  </div>
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
          <h3>{{ isEditMode() ? 'تعديل الحاشية' : 'حاشية جديدة' }}</h3>
          <button class="close-btn" (click)="closeModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form (ngSubmit)="onSubmit()" class="modal-body">
          <!-- Tafsir Type -->
          <div class="form-group">
            <label class="required">نوع التفسير</label>
            <select [(ngModel)]="formData.tafsir_type" name="tafsir_type" required [disabled]="isEditMode()">
              <option value="">-- اختر النوع --</option>
              <option value="main">تفسير رئيسي</option>
              <option value="extra">تفسير إضافي</option>
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
                (change)="onAyahChange()"
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

          <!-- Tafsir Selection (if ayah is selected) -->
          @if (formData.ayah_id && availableTafsirs().length > 0) {
            <div class="form-group">
              <label>ربط بتفسير محدد (اختياري)</label>
              <select [(ngModel)]="formData.tafsir_id" name="tafsir_id">
                <option [value]="null">-- بدون ربط --</option>
                @for (tafsir of availableTafsirs(); track tafsir.id) {
                  <option [value]="tafsir.id">
                    {{ tafsir.tafsir_text | slice:0:80 }}...
                  </option>
                }
              </select>
              <small>اختر التفسير المرتبط بهذه الحاشية</small>
            </div>
          }

          <!-- Reference Text -->
          <div class="form-group">
            <label>النص المرجعي</label>
            <input
              type="text"
              [(ngModel)]="formData.reference_text"
              name="reference_text"
              placeholder="الكلمة أو العبارة المشار إليها في الآية"
            />
            <small>النص الذي تشير إليه الحاشية</small>
          </div>

          <!-- Note Text -->
          <div class="form-group">
            <label class="required">نص الحاشية</label>
            <textarea
              [(ngModel)]="formData.note_text"
              name="note_text"
              rows="8"
              required
              placeholder="اكتب نص الحاشية التوضيحية هنا..."
            ></textarea>
          </div>

          <!-- Position Index -->
          <div class="form-group">
            <label>ترتيب الحاشية</label>
            <input
              type="number"
              [(ngModel)]="formData.position_index"
              name="position_index"
              min="0"
              placeholder="الترتيب في حال وجود عدة حواشي"
            />
            <small>اترك فارغاً للترتيب التلقائي</small>
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
    @if (footnoteToDelete()) {
      <div class="modal-backdrop" (click)="cancelDelete()"></div>
      <div class="modal confirm-modal">
        <div class="modal-header">
          <h3>تأكيد الحذف</h3>
          <button class="close-btn" (click)="cancelDelete()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>هل أنت متأكد من حذف هذه الحاشية؟</p>
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
    .footnotes-manager {
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
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      color: white;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
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
        border-color: #8b5cf6;
        box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
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
        border-color: #8b5cf6;
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
      border-top-color: #8b5cf6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .footnotes-list {
      display: grid;
      gap: 1.5rem;
    }

    .footnote-card {
      background: white;
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      border-right: 4px solid #8b5cf6;

      &:hover {
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        transform: translateX(-5px);
      }
    }

    .footnote-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e2e8f0;
      flex-wrap: wrap;
    }

    .footnote-badge {
      padding: 0.375rem 0.875rem;
      border-radius: 1rem;
      font-size: 0.875rem;
      font-weight: 700;
      text-transform: uppercase;

      &.type-main {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
      }

      &.type-extra {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        color: white;
      }
    }

    .footnote-meta {
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

    .position-badge {
      padding: 0.25rem 0.625rem;
      background: #f1f5f9;
      color: #64748b;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
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
        background: #8b5cf6;
        color: white;
      }

      &.btn-danger:hover {
        background: #ef4444;
      }
    }

    .footnote-content {
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
        border-right: 4px solid #8b5cf6;
      }

      .reference-text {
        margin-bottom: 1rem;
        padding: 0.75rem;
        background: #fef3c7;
        border-radius: 0.5rem;
        border-left: 3px solid #f59e0b;

        strong {
          color: #92400e;
          display: block;
          margin-bottom: 0.25rem;
        }

        .ref-highlight {
          color: #78350f;
          font-weight: 600;
          font-style: italic;
        }
      }

      .note-text {
        strong {
          color: #8b5cf6;
          display: block;
          margin-bottom: 0.5rem;
        }

        p {
          color: #475569;
          line-height: 1.8;
          margin: 0;
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
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
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
export class FootnotesManagerComponent implements OnInit {
  router = inject(Router);
  private supabaseService = inject(SupabaseService);
  private notificationService = inject(NotificationService);

  loading = signal(true);
  saving = signal(false);
  deleting = signal(false);

  allFootnotes = signal<any[]>([]);
  filteredFootnotes = signal<any[]>([]);
  surahs = signal<Surah[]>([]);
  availableAyahs = signal<any[]>([]);
  availableTafsirs = signal<any[]>([]);

  searchTerm = '';
  filterType = '';

  showModal = signal(false);
  isEditMode = signal(false);
  footnoteToDelete = signal<any>(null);

  selectedSurahId: number | null = null;
  private editingId: number | null = null;

  formData: any = {
    tafsir_type: '',
    ayah_id: null,
    tafsir_id: null,
    reference_text: '',
    note_text: '',
    position_index: null
  };

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      // Load surahs
      const surahsData = await this.supabaseService.getAllSurahs();
      this.surahs.set(surahsData);

      // Load footnotes
      await this.loadFootnotes();
    } catch (error) {
      console.error('Failed to load data:', error);
      this.notificationService.error('فشل تحميل البيانات');
    } finally {
      this.loading.set(false);
    }
  }

  async loadFootnotes() {
    try {
      const { data } = await (this.supabaseService as any).supabase
        .from('footnotes')
        .select(`
          *,
          ayahs!inner(id, verse_number, text_uthmani, surah_id),
          surahs!inner(name_ar)
        `)
        .order('ayahs(surah_id)', { ascending: true })
        .order('ayahs(verse_number)', { ascending: true })
        .order('position_index', { ascending: true });

      const footnotes = (data || []).map((f: any) => ({
        ...f,
        surah_name: f.surahs?.name_ar,
        verse_number: f.ayahs?.verse_number,
        text_uthmani: f.ayahs?.text_uthmani
      }));

      this.allFootnotes.set(footnotes);
      this.filteredFootnotes.set(footnotes);
    } catch (error) {
      console.error('Failed to load footnotes:', error);
    }
  }

  filterFootnotes() {
    let filtered = this.allFootnotes();

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(f =>
        f.note_text.toLowerCase().includes(term) ||
        f.reference_text?.toLowerCase().includes(term) ||
        f.surah_name?.includes(term)
      );
    }

    // Filter by type
    if (this.filterType) {
      filtered = filtered.filter(f => f.tafsir_type === this.filterType);
    }

    this.filteredFootnotes.set(filtered);
  }

  async onSurahChange() {
    if (!this.selectedSurahId) {
      this.availableAyahs.set([]);
      this.availableTafsirs.set([]);
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

  async onAyahChange() {
    if (!this.formData.ayah_id || !this.formData.tafsir_type) {
      this.availableTafsirs.set([]);
      return;
    }

    try {
      const table = this.formData.tafsir_type === 'main' ? 'tafsir_main' : 'tafsir_extra';

      const { data } = await (this.supabaseService as any).supabase
        .from(table)
        .select('id, tafsir_text')
        .eq('ayah_id', this.formData.ayah_id);

      this.availableTafsirs.set(data || []);
    } catch (error) {
      console.error('Failed to load tafsirs:', error);
    }
  }

  openAddModal() {
    this.isEditMode.set(false);
    this.editingId = null;
    this.selectedSurahId = null;
    this.availableAyahs.set([]);
    this.availableTafsirs.set([]);
    this.formData = {
      tafsir_type: '',
      ayah_id: null,
      tafsir_id: null,
      reference_text: '',
      note_text: '',
      position_index: null
    };
    this.showModal.set(true);
  }

  editFootnote(footnote: any) {
    this.isEditMode.set(true);
    this.editingId = footnote.id;
    this.selectedSurahId = footnote.ayahs?.surah_id || null;

    this.formData = {
      tafsir_type: footnote.tafsir_type,
      ayah_id: footnote.ayah_id,
      tafsir_id: footnote.tafsir_id,
      reference_text: footnote.reference_text || '',
      note_text: footnote.note_text,
      position_index: footnote.position_index
    };

    if (this.selectedSurahId) {
      this.onSurahChange().then(() => {
        if (this.formData.ayah_id) {
          this.onAyahChange();
        }
      });
    }

    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  async onSubmit() {
    this.saving.set(true);

    try {
      const dataToSave = {
        ayah_id: this.formData.ayah_id,
        tafsir_type: this.formData.tafsir_type,
        tafsir_id: this.formData.tafsir_id || null,
        reference_text: this.formData.reference_text || null,
        note_text: this.formData.note_text,
        position_index: this.formData.position_index || null
      };

      if (this.isEditMode() && this.editingId) {
        const { error } = await (this.supabaseService as any).supabase
          .from('footnotes')
          .update(dataToSave)
          .eq('id', this.editingId);

        if (error) throw error;
        this.notificationService.success('تم تحديث الحاشية بنجاح');
      } else {
        const { error } = await (this.supabaseService as any).supabase
          .from('footnotes')
          .insert([dataToSave]);

        if (error) throw error;
        this.notificationService.success('تم إضافة الحاشية بنجاح');
      }

      await this.loadFootnotes();
      this.filterFootnotes();
      this.closeModal();
    } catch (error: any) {
      console.error('Failed to save footnote:', error);
      this.notificationService.error(error.message || 'فشل حفظ الحاشية');
    } finally {
      this.saving.set(false);
    }
  }

  deleteFootnote(footnote: any) {
    this.footnoteToDelete.set(footnote);
  }

  cancelDelete() {
    this.footnoteToDelete.set(null);
  }

  async confirmDelete() {
    const footnote = this.footnoteToDelete();
    if (!footnote) return;

    this.deleting.set(true);

    try {
      const { error } = await (this.supabaseService as any).supabase
        .from('footnotes')
        .delete()
        .eq('id', footnote.id);

      if (error) throw error;

      this.notificationService.success('تم حذف الحاشية بنجاح');
      await this.loadFootnotes();
      this.filterFootnotes();
      this.footnoteToDelete.set(null);
    } catch (error: any) {
      console.error('Failed to delete footnote:', error);
      this.notificationService.error(error.message || 'فشل حذف الحاشية');
    } finally {
      this.deleting.set(false);
    }
  }
}
