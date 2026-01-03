// src/app/features/admin/quran-manager/footnotes-manager/footnotes-manager.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Surah } from '../../../../core/models/surah.model';

@Component({
  selector: 'app-footnotes-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './footnotes-manager.component.html',
  styleUrls: ['./footnotes-manager.component.scss']
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
    reference_text: '',      // ✅ اسم العمود الفعلي
    note_text: '',           // ✅ اسم العمود الفعلي
    position_index: null     // ✅ اسم العمود الفعلي
  };

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      const surahsData = await this.supabaseService.getAllSurahs();
      this.surahs.set(surahsData);

      await this.loadFootnotes();
    } catch (error) {
      console.error('❌ فشل تحميل البيانات:', error);
      this.notificationService.error('فشل تحميل البيانات');
    } finally {
      this.loading.set(false);
    }
  }

  async loadFootnotes() {
    try {
      console.log('🔄 بدء تحميل الحواشي...');

      // ✅ طريقة 1: محاولة استخدام View إذا كان موجوداً
      let footnotes: any[] = [];
      let useView = true;

      try {
        const { data: viewData, error: viewError } = await (this.supabaseService as any).supabase
          .from('v_footnotes_full')
          .select('*');

        if (viewError) {
          console.warn('⚠️ View غير موجود، سنستخدم الاستعلام المباشر');
          useView = false;
        } else {
          footnotes = viewData || [];
        }
      } catch {
        useView = false;
      }

      // ✅ طريقة 2: الاستعلام المباشر
      if (!useView) {
        const { data, error } = await (this.supabaseService as any).supabase
          .from('footnotes')
          .select('*');

        if (error) {
          console.error('❌ خطأ في تحميل الحواشي:', error);
          throw error;
        }

        // جلب معلومات الآيات والسور لكل حاشية
        const footnotesWithDetails = await Promise.all(
          (data || []).map(async (f: any) => {
            const { data: ayahData } = await (this.supabaseService as any).supabase
              .from('ayahs')
              .select(`
                verse_number,
                text_uthmani,
                surahs!inner (
                  name_ar,
                  order_number
                )
              `)
              .eq('id', f.ayah_id)
              .single();

            return {
              ...f,
              verse_number: ayahData?.verse_number,
              text_uthmani: ayahData?.text_uthmani,
              surah_name: ayahData?.surahs?.name_ar,
              surah_order: ayahData?.surahs?.order_number
            };
          })
        );

        footnotes = footnotesWithDetails;
      }

      this.allFootnotes.set(footnotes);
      this.filteredFootnotes.set(footnotes);

      console.log('✅ تم تحميل', footnotes.length, 'حاشية');
    } catch (error) {
      console.error('❌ خطأ في تحميل الحواشي:', error);
      this.notificationService.error('فشل تحميل الحواشي');
    }
  }

  filterFootnotes() {
    let filtered = this.allFootnotes();

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(f =>
        f.note_text.toLowerCase().includes(term) ||
        f.reference_text?.toLowerCase().includes(term) ||
        f.surah_name?.includes(term)
      );
    }

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

    // ✅ جلب surah_id
    (this.supabaseService as any).supabase
      .from('ayahs')
      .select('surah_id')
      .eq('id', footnote.ayah_id)
      .single()
      .then(({ data }: any) => {
        if (data) {
          this.selectedSurahId = data.surah_id;
          this.onSurahChange().then(() => {
            if (footnote.ayah_id) {
              this.formData.ayah_id = footnote.ayah_id;
              this.onAyahChange();
            }
          });
        }
      });

    this.formData = {
      tafsir_type: footnote.tafsir_type,
      ayah_id: footnote.ayah_id,
      tafsir_id: footnote.tafsir_id,
      reference_text: footnote.reference_text || '',
      note_text: footnote.note_text,
      position_index: footnote.position_index
    };

    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  async onSubmit() {
    this.saving.set(true);

    try {
      // ✅ استخدام أسماء الأعمدة الصحيحة
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
        this.notificationService.success('✅ تم تحديث الحاشية بنجاح');
      } else {
        const { error } = await (this.supabaseService as any).supabase
          .from('footnotes')
          .insert([dataToSave]);

        if (error) throw error;
        this.notificationService.success('✅ تم إضافة الحاشية بنجاح');
      }

      await this.loadFootnotes();
      this.filterFootnotes();
      this.closeModal();
    } catch (error: any) {
      console.error('❌ فشل حفظ الحاشية:', error);
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

      this.notificationService.success('✅ تم حذف الحاشية بنجاح');
      await this.loadFootnotes();
      this.filterFootnotes();
      this.footnoteToDelete.set(null);
    } catch (error: any) {
      console.error('❌ فشل حذف الحاشية:', error);
      this.notificationService.error(error.message || 'فشل حذف الحاشية');
    } finally {
      this.deleting.set(false);
    }
  }
}
