// src/app/features/admin/quran-manager/tafsirs-manager/tafsirs-manager.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Surah } from '../../../../core/models/surah.model';
import { Interpreter } from '../../../../core/models/interpreter.model';

interface TafsirItem {
  id: number;
  type: 'main' | 'extra';
  ayah_id: number;
  tafsir_text: string;
  language_code: string;
  interpreter_id: number | null;
  interpreter: any | null;
  source_name?: string;
  display_order?: number;
  isEditing?: boolean;
  editText?: string;
  editLang?: string;
  editInterpreterId?: number | null;
  editSourceName?: string;
  editDisplayOrder?: number;
  saving?: boolean;
}

interface AyahGroup {
  ayah_id: number;
  surah_id: number;
  surah_name: string;
  surah_order: number;
  verse_number: number;
  text_uthmani: string;
  tafsirs: TafsirItem[];
  isOpen: boolean;
  showAddForm?: boolean;
  newTafsir?: Partial<TafsirItem>;
  addingSaving?: boolean;
}

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
  allGroups = signal<AyahGroup[]>([]);
  filteredGroups = signal<AyahGroup[]>([]);
  surahs = signal<Surah[]>([]);
  interpreters = signal<Interpreter[]>([]);

  searchTerm = '';
  filterType = '';
  filterLang = '';
  filterSurahId: number | null = null;
  filterAyahId: number | null = null;
  filterAyahs = signal<any[]>([]);

  tafsirToDelete = signal<{ tafsir: TafsirItem; group: AyahGroup } | null>(null);
  deleting = signal(false);

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      const surahsData = await this.supabaseService.getAllSurahs();
      this.surahs.set(surahsData);

      const { data: interpretersData } = await (this.supabaseService as any).supabase
        .from('interpreters').select('*').order('short_name');
      if (interpretersData) this.interpreters.set(interpretersData);

      await this.loadTafsirs();
    } catch (error) {
      this.notificationService.error('فشل تحميل البيانات');
    } finally {
      this.loading.set(false);
    }
  }

  async loadTafsirs() {
    try {
      const selectQuery = `
        id, ayah_id, tafsir_text, language_code, interpreter_id,
        interpreters ( id, short_name, display_name_ar, display_name_en, display_name_it, language_code ),
        ayahs!inner (
          id, verse_number, text_uthmani, surah_id,
          surahs!inner ( id, name_ar, order_number )
        )
      `;

      const [mainRes, extraRes] = await Promise.all([
        (this.supabaseService as any).supabase
          .from('tafsir_main').select(selectQuery)
          .order('ayahs(surah_id)', { ascending: true })
          .order('ayahs(verse_number)', { ascending: true }),
        (this.supabaseService as any).supabase
          .from('tafsir_extra').select(`${selectQuery}, source_name, display_order`)
          .order('ayahs(surah_id)', { ascending: true })
          .order('ayahs(verse_number)', { ascending: true })
          .order('display_order', { ascending: true })
      ]);

      if (mainRes.error) throw mainRes.error;
      if (extraRes.error) throw extraRes.error;

      const mapTafsir = (t: any, type: 'main' | 'extra'): TafsirItem => ({
        id: t.id, type, ayah_id: t.ayah_id,
        tafsir_text: t.tafsir_text, language_code: t.language_code,
        interpreter_id: t.interpreter_id, interpreter: t.interpreters || null,
        source_name: t.source_name || '', display_order: t.display_order || 0,
        isEditing: false
      });

      const allTafsirs: TafsirItem[] = [
        ...(mainRes.data || []).map((t: any) => mapTafsir(t, 'main')),
        ...(extraRes.data || []).map((t: any) => mapTafsir(t, 'extra'))
      ];

      const ayahMap = new Map<number, any>();
      [...(mainRes.data || []), ...(extraRes.data || [])].forEach((t: any) => {
        if (!ayahMap.has(t.ayah_id)) {
          ayahMap.set(t.ayah_id, {
            ayah_id: t.ayah_id,
            surah_id: t.ayahs?.surahs?.id ?? t.ayahs?.surah_id,
            surah_name: t.ayahs?.surahs?.name_ar,
            surah_order: t.ayahs?.surahs?.order_number,
            verse_number: t.ayahs?.verse_number,
            text_uthmani: t.ayahs?.text_uthmani
          });
        }
      });

      const groups: AyahGroup[] = [];
      ayahMap.forEach((ayah, ayah_id) => {
        groups.push({
          ...ayah,
          tafsirs: allTafsirs.filter(t => t.ayah_id === ayah_id),
          isOpen: false, showAddForm: false,
          newTafsir: this.emptyNewTafsir()
        });
      });

      groups.sort((a, b) =>
        a.surah_order !== b.surah_order
          ? a.surah_order - b.surah_order
          : a.verse_number - b.verse_number
      );

      this.allGroups.set(groups);
      this.filteredGroups.set(groups);
    } catch (error) {
      this.notificationService.error('فشل تحميل التفاسير');
    }
  }

  private emptyNewTafsir(): Partial<TafsirItem> {
    return { type: 'main', tafsir_text: '', language_code: 'it', interpreter_id: null, source_name: '', display_order: 0 };
  }

  // ==================== فلاتر ====================

  async onFilterSurahChange() {
    this.filterAyahId = null;
    this.filterSurahId = this.filterSurahId ? Number(this.filterSurahId) : null;
    if (!this.filterSurahId) {
      this.filterAyahs.set([]);
    } else {
      const { data } = await (this.supabaseService as any).supabase
        .from('ayahs').select('id, verse_number')
        .eq('surah_id', this.filterSurahId).order('verse_number');
      this.filterAyahs.set(data || []);
    }
    this.applyFilters();
  }

  applyFilters() {
    let filtered = this.allGroups();
    const term = this.searchTerm.trim().toLowerCase();

    if (term) {
      filtered = filtered.filter(g =>
        g.text_uthmani?.includes(term) ||
        g.surah_name?.includes(term) ||
        g.tafsirs.some(t => t.tafsir_text?.toLowerCase().includes(term))
      );
    }
    if (this.filterSurahId) {
      const sid = Number(this.filterSurahId);
      filtered = filtered.filter(g => Number(g.surah_id) === sid);
    }
    if (this.filterAyahId) {
      const aid = Number(this.filterAyahId);
      filtered = filtered.filter(g => Number(g.ayah_id) === aid);
    }
    if (this.filterType) {
      filtered = filtered.filter(g => g.tafsirs.some(t => t.type === this.filterType));
    }
    if (this.filterLang) {
      filtered = filtered.filter(g => g.tafsirs.some(t => t.language_code === this.filterLang));
    }

    this.filteredGroups.set(filtered);
  }

  // ==================== Accordion ====================

  toggleGroup(group: AyahGroup) {
    group.isOpen = !group.isOpen;
    if (!group.isOpen) {
      group.showAddForm = false;
      group.tafsirs.forEach(t => { t.isEditing = false; });
    }
  }

  // ==================== Inline Edit ====================

  startEdit(tafsir: TafsirItem) {
    tafsir.isEditing = true;
    tafsir.editText = tafsir.tafsir_text;
    tafsir.editLang = tafsir.language_code;
    tafsir.editInterpreterId = tafsir.interpreter_id;
    tafsir.editSourceName = tafsir.source_name || '';
    tafsir.editDisplayOrder = tafsir.display_order || 0;
  }

  cancelEdit(tafsir: TafsirItem) { tafsir.isEditing = false; }

  async saveEdit(tafsir: TafsirItem) {
    if (!tafsir.editText?.trim()) { this.notificationService.error('نص التفسير مطلوب'); return; }
    tafsir.saving = true;
    try {
      const table = tafsir.type === 'main' ? 'tafsir_main' : 'tafsir_extra';
      const payload: any = {
        tafsir_text: tafsir.editText,
        language_code: tafsir.editLang,
        interpreter_id: tafsir.editInterpreterId || null
      };
      if (tafsir.type === 'extra') {
        payload.source_name = tafsir.editSourceName || '';
        payload.display_order = tafsir.editDisplayOrder || 0;
      }
      const { error } = await (this.supabaseService as any).supabase
        .from(table).update(payload).eq('id', tafsir.id);
      if (error) throw error;

      tafsir.tafsir_text = tafsir.editText!;
      tafsir.language_code = tafsir.editLang!;
      tafsir.interpreter_id = tafsir.editInterpreterId ?? null;
      tafsir.interpreter = this.interpreters().find(i => i.id === tafsir.interpreter_id) || null;
      tafsir.source_name = tafsir.editSourceName;
      tafsir.display_order = tafsir.editDisplayOrder;
      tafsir.isEditing = false;
      this.notificationService.success('✅ تم حفظ التعديل');
    } catch (error: any) {
      this.notificationService.error(error.message || 'فشل الحفظ');
    } finally {
      tafsir.saving = false;
    }
  }

  // ==================== إضافة ====================

  toggleAddForm(group: AyahGroup) {
    group.showAddForm = !group.showAddForm;
    if (group.showAddForm) {
      const hasMain = group.tafsirs.some(t => t.type === 'main');
      group.newTafsir = { ...this.emptyNewTafsir(), type: hasMain ? 'extra' : 'main' };
    }
  }

  async saveNewTafsir(group: AyahGroup) {
    const nt = group.newTafsir!;
    if (!nt.type) { this.notificationService.error('اختر نوع التفسير'); return; }
    if (!nt.tafsir_text?.trim()) { this.notificationService.error('نص التفسير مطلوب'); return; }

    // منع إضافة تفسير رئيسي ثانٍ
    if (nt.type === 'main' && group.tafsirs.some(t => t.type === 'main')) {
      this.notificationService.error('⚠️ يوجد تفسير رئيسي لهذه الآية — يمكن إضافة تفسير إضافي فقط');
      return;
    }
    group.addingSaving = true;
    try {
      const table = nt.type === 'main' ? 'tafsir_main' : 'tafsir_extra';
      const payload: any = {
        ayah_id: group.ayah_id,
        tafsir_text: nt.tafsir_text,
        language_code: nt.language_code || 'it',
        interpreter_id: nt.interpreter_id || null
      };
      if (nt.type === 'extra') {
        payload.source_name = nt.source_name || '';
        payload.display_order = nt.display_order || 0;
      }
      const { data, error } = await (this.supabaseService as any).supabase
        .from(table).insert([payload]).select().single();
      if (error) throw error;

      group.tafsirs.push({
        ...payload, id: data.id, type: nt.type!,
        interpreter: this.interpreters().find(i => i.id === payload.interpreter_id) || null,
        isEditing: false
      });
      group.showAddForm = false;
      group.newTafsir = this.emptyNewTafsir();
      this.notificationService.success('✅ تم إضافة التفسير');
    } catch (error: any) {
      this.notificationService.error(error.message || 'فشل الإضافة');
    } finally {
      group.addingSaving = false;
    }
  }

  // ==================== حذف ====================

  confirmDeleteTafsir(tafsir: TafsirItem, group: AyahGroup) {
    this.tafsirToDelete.set({ tafsir, group });
  }

  cancelDelete() { this.tafsirToDelete.set(null); }

  async doDelete() {
    const item = this.tafsirToDelete();
    if (!item) return;
    this.deleting.set(true);
    try {
      const table = item.tafsir.type === 'main' ? 'tafsir_main' : 'tafsir_extra';
      const { error } = await (this.supabaseService as any).supabase
        .from(table).delete().eq('id', item.tafsir.id);
      if (error) throw error;

      item.group.tafsirs = item.group.tafsirs.filter(t => t.id !== item.tafsir.id);
      this.tafsirToDelete.set(null);
      this.notificationService.success('✅ تم الحذف');
    } catch (error: any) {
      this.notificationService.error(error.message || 'فشل الحذف');
    } finally {
      this.deleting.set(false);
    }
  }

  // ==================== مساعدات ====================

  getLangName(code: string): string {
    const map: any = { ar: 'عربي', it: 'إيطالي', en: 'إنجليزي' };
    return map[code] || code;
  }

  getInterpreterName(interp: any): string {
    if (!interp) return '—';
    return interp.display_name_it || interp.display_name_ar || interp.short_name || '—';
  }

  getTafsirsByType(group: AyahGroup, type: 'main' | 'extra'): TafsirItem[] {
    return group.tafsirs.filter(t => t.type === type);
  }
}
