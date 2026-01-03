// src/app/features/admin/quran-manager/tafsirs-manager/tafsirs-manager.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Surah } from '../../../../core/models/surah.model';
import { Interpreter } from '../../../../core/models/interpreter.model';

@Component({
  selector: 'app-tafsirs-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tafsirs-manager.component.html',
  styleUrls: ['./tafsirs-manager.component.scss']
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
    tafsir_text: '',        // ✅ اسم العمود الفعلي
    interpreter_id: null,
    language_code: 'it',    // ✅ اسم العمود الفعلي
    source_name: '',
    display_order: 0
  };

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      const surahsData = await this.supabaseService.getAllSurahs();
      this.surahs.set(surahsData);

      const { data: interpretersData } = await (this.supabaseService as any).supabase
        .from('interpreters')
        .select('*')
        .order('short_name');

      if (interpretersData) {
        this.interpreters.set(interpretersData);
      }

      await this.loadTafsirs();
    } catch (error) {
      console.error('❌ فشل تحميل البيانات:', error);
      this.notificationService.error('فشل تحميل البيانات');
    } finally {
      this.loading.set(false);
    }
  }

  async loadTafsirs() {
    try {
      console.log('🔄 بدء تحميل التفاسير...');

      // ✅ تحميل التفاسير الرئيسية
      const { data: mainTafsirs, error: mainError } = await (this.supabaseService as any).supabase
        .from('tafsir_main')
        .select(`
          id,
          ayah_id,
          tafsir_text,
          language_code,
          interpreter_id,
          interpreters (
            id,
            short_name,
            display_name_ar,
            display_name_en,
            display_name_it,
            language_code
          ),
          ayahs!inner (
            id,
            verse_number,
            text_uthmani,
            surah_id,
            surahs!inner (
              id,
              name_ar,
              order_number
            )
          )
        `)
        .order('ayahs(surah_id)', { ascending: true })
        .order('ayahs(verse_number)', { ascending: true });

      if (mainError) {
        console.error('❌ خطأ في تحميل التفاسير الرئيسية:', mainError);
        throw mainError;
      }

      // ✅ تحميل التفاسير الإضافية
      const { data: extraTafsirs, error: extraError } = await (this.supabaseService as any).supabase
        .from('tafsir_extra')
        .select(`
          id,
          ayah_id,
          tafsir_text,
          language_code,
          source_name,
          display_order,
          interpreter_id,
          interpreters (
            id,
            short_name,
            display_name_ar,
            display_name_en,
            display_name_it,
            language_code
          ),
          ayahs!inner (
            id,
            verse_number,
            text_uthmani,
            surah_id,
            surahs!inner (
              id,
              name_ar,
              order_number
            )
          )
        `)
        .order('ayahs(surah_id)', { ascending: true })
        .order('ayahs(verse_number)', { ascending: true })
        .order('display_order', { ascending: true });

      if (extraError) {
        console.error('❌ خطأ في تحميل التفاسير الإضافية:', extraError);
        throw extraError;
      }

      // ✅ دمج النتائج
      const allTafsirs = [
        ...(mainTafsirs || []).map((t: any) => ({
          ...t,
          type: 'main',
          surah_name: t.ayahs?.surahs?.name_ar,
          verse_number: t.ayahs?.verse_number,
          text_uthmani: t.ayahs?.text_uthmani,
          interpreter: t.interpreters
        })),
        ...(extraTafsirs || []).map((t: any) => ({
          ...t,
          type: 'extra',
          surah_name: t.ayahs?.surahs?.name_ar,
          verse_number: t.ayahs?.verse_number,
          text_uthmani: t.ayahs?.text_uthmani,
          interpreter: t.interpreters
        }))
      ];

      this.allTafsirs.set(allTafsirs);
      this.filteredTafsirs.set(allTafsirs);

      console.log('✅ تم تحميل', allTafsirs.length, 'تفسير');
      console.log('📊 رئيسي:', mainTafsirs?.length || 0, '| إضافي:', extraTafsirs?.length || 0);
    } catch (error) {
      console.error('❌ خطأ في تحميل التفاسير:', error);
      this.notificationService.error('فشل تحميل التفاسير');
    }
  }

  filterTafsirs() {
    let filtered = this.allTafsirs();

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.tafsir_text.toLowerCase().includes(term) ||
        t.surah_name?.includes(term)
      );
    }

    if (this.filterType) {
      filtered = filtered.filter(t => t.type === this.filterType);
    }

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

    // ✅ جلب surah_id
    (this.supabaseService as any).supabase
      .from('ayahs')
      .select('surah_id')
      .eq('id', tafsir.ayah_id)
      .single()
      .then(({ data }: any) => {
        if (data) {
          this.selectedSurahId = data.surah_id;
          this.onSurahChange();
        }
      });

    this.formData = {
      type: tafsir.type,
      ayah_id: tafsir.ayah_id,
      tafsir_text: tafsir.tafsir_text,
      interpreter_id: tafsir.interpreter_id,
      language_code: tafsir.language_code,
      source_name: tafsir.source_name || '',
      display_order: tafsir.display_order || 0
    };

    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  async onSubmit() {
    this.saving.set(true);

    try {
      const table = this.formData.type === 'main' ? 'tafsir_main' : 'tafsir_extra';

      // ✅ استخدام أسماء الأعمدة الصحيحة
      const dataToSave: any = {
        ayah_id: this.formData.ayah_id,
        tafsir_text: this.formData.tafsir_text,
        language_code: this.formData.language_code,
        interpreter_id: this.formData.interpreter_id || null
      };

      if (this.formData.type === 'extra') {
        dataToSave.source_name = this.formData.source_name;
        dataToSave.display_order = this.formData.display_order || 0;
      }

      if (this.isEditMode() && this.editingId) {
        const { error } = await (this.supabaseService as any).supabase
          .from(table)
          .update(dataToSave)
          .eq('id', this.editingId);

        if (error) throw error;
        this.notificationService.success('✅ تم تحديث التفسير بنجاح');
      } else {
        const { error } = await (this.supabaseService as any).supabase
          .from(table)
          .insert([dataToSave]);

        if (error) throw error;
        this.notificationService.success('✅ تم إضافة التفسير بنجاح');
      }

      await this.loadTafsirs();
      this.filterTafsirs();
      this.closeModal();
    } catch (error: any) {
      console.error('❌ فشل حفظ التفسير:', error);
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

      this.notificationService.success('✅ تم حذف التفسير بنجاح');
      await this.loadTafsirs();
      this.filterTafsirs();
      this.tafsirToDelete.set(null);
    } catch (error: any) {
      console.error('❌ فشل حذف التفسير:', error);
      this.notificationService.error(error.message || 'فشل حذف التفسير');
    } finally {
      this.deleting.set(false);
    }
  }
}
