import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AyahFull } from '../../../core/models/ayah.model';
import { Footnote } from '../../../core/models/footnote.model';
import { Surah } from '../../../core/models/surah.model';
import { QuranBookmarkService } from '../../../core/services/quran-bookmark.service';

type TextSegment = string | Footnote;

@Component({
  selector: 'app-reader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reader.component.html',
  styleUrls: ['./reader.component.scss'],
})
export class ReaderComponent implements OnInit, OnDestroy {
  // ============================================
  // SIGNALS (الحالات)
  // ============================================
  ayahs = signal<AyahFull[]>([]);
  surahInfo = signal<Surah | null>(null);
  activeFootnoteText = signal<string | null>(null);
  ayahSearchTerm = signal<string>('');
  selectedAyah = signal<number | null>(null);
  allSurahs = signal<Surah[]>([]);
  searchResults = signal<{surah: Surah, ayah: AyahFull}[]>([]);
  isSearching = signal<boolean>(false);

  // ============================================
  // SERVICES (الخدمات)
  // ============================================
  public bookmarkService = inject(QuranBookmarkService);
  private supabase = inject(SupabaseService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // ============================================
  // PRIVATE VARIABLES (متغيرات داخلية)
  // ============================================
  private currentSurahId: number | null = null;
  private routeSubscription!: Subscription;
  private searchTimeout: any = null;

  // ============================================
  // LIFECYCLE HOOKS
  // ============================================

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const surahId = Number(params.get('id'));
      const ayahNumber = params.get('ayahNumber') ? Number(params.get('ayahNumber')) : null;

      // تحديث الآية المختارة لتطبيق التظليل عليها
      this.selectedAyah.set(ayahNumber);

      // تحميل بيانات السورة فقط إذا كانت سورة جديدة
      if (surahId && surahId !== this.currentSurahId) {
        this.currentSurahId = surahId;
        this.loadSurah(surahId).then(() => {
          if (ayahNumber) {
            this.scrollToAyah(ayahNumber);
          }
        });
      } else if (ayahNumber) {
        // إذا كانت السورة محملة بالفعل، فقط انتقل للآية
        this.scrollToAyah(ayahNumber);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  // ============================================
  // DATA LOADING METHODS
  // ============================================

  /**
   * تحميل بيانات السورة
   */
  async loadSurah(id: number): Promise<void> {
    if (isNaN(id)) return;

    // مسح الآيات القديمة
    this.ayahs.set([]);

    // إذا لم يكن هناك بحث نشط، نمسح المعلومات السابقة
    if (this.ayahSearchTerm().length < 3) {
      this.activeFootnoteText.set(null);
      this.surahInfo.set(null);
    }

    try {
      const [surahData, ayahsData] = await Promise.all([
        this.supabase.getSurahInfo(id),
        this.supabase.getFullSurah(id),
      ]);
      this.surahInfo.set(surahData);
      this.ayahs.set(ayahsData);
    } catch (error) {
      console.error('Failed to load Surah data:', error);
    }
  }

  /**
   * الانتقال إلى آية معينة
   */
  scrollToAyah(verseNumber: number): void {
    setTimeout(() => {
      const element = document.getElementById(`ayah-${verseNumber}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  // ============================================
  // SEARCH FUNCTIONALITY
  // ============================================

  /**
   * Computed signal لفلترة الآيات
   */
  filteredAyahs = computed(() => {
    const term = this.ayahSearchTerm().toLowerCase().trim();
    const allAyahs = this.ayahs();

    // إذا كان البحث فارغاً، عرض آيات السورة الحالية
    if (!term) return allAyahs;

    // إذا كان البحث أقل من 3 أحرف، ابحث فقط في السورة الحالية
    if (term.length < 3) {
      return allAyahs.filter(ayah => {
        const inArabic = ayah.text_clean.includes(term);
        const inTafsir = ayah.primary_tafsir?.text.toLowerCase().includes(term) ?? false;
        return inArabic || inTafsir;
      });
    }

    // إذا كان هناك نتائج بحث شاملة، عرضها
    if (this.searchResults().length > 0) {
      return this.searchResults().map(result => result.ayah);
    }

    return allAyahs;
  });

  /**
   * معالج حدث البحث
   */
  onAyahSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.ayahSearchTerm.set(term);

    // إلغاء أي بحث سابق
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // إذا كان البحث أقل من 3 أحرف، لا نبحث في كل المصحف
    if (term.length < 3) {
      this.searchResults.set([]);
      this.isSearching.set(false);
      return;
    }

    // تأخير البحث 500ms بعد توقف الكتابة (debouncing)
    this.searchTimeout = setTimeout(() => {
      this.searchInAllSurahs(term);
    }, 500);
  }

  /**
   * البحث في كل سور المصحف
   */
  async searchInAllSurahs(term: string): Promise<void> {
    this.isSearching.set(true);
    this.searchResults.set([]);

    try {
      // جلب جميع السور إذا لم تكن محملة
      if (this.allSurahs().length === 0) {
        const surahs = await this.supabase.getAllSurahs();
        this.allSurahs.set(surahs);
      }

      const results: {surah: Surah, ayah: AyahFull}[] = [];

      // البحث في كل سورة
      for (const surah of this.allSurahs()) {
        const ayahs = await this.supabase.getFullSurah(surah.id);

        for (const ayah of ayahs) {
          const inArabic = ayah.text_clean.includes(term);
          const inTafsir = ayah.primary_tafsir?.text.toLowerCase().includes(term) ?? false;

          if (inArabic || inTafsir) {
            results.push({ surah, ayah });

            // للحد من عدد النتائج وتحسين الأداء (100 نتيجة كحد أقصى)
            if (results.length >= 100) {
              break;
            }
          }
        }

        // توقف إذا وصلنا لـ 100 نتيجة
        if (results.length >= 100) {
          break;
        }
      }

      this.searchResults.set(results);
    } catch (error) {
      console.error('Error searching in all surahs:', error);
    } finally {
      this.isSearching.set(false);
    }
  }

  /**
   * الانتقال إلى آية من نتائج البحث
   */
  navigateToAyah(surahId: number, ayahNumber: number): void {
    this.router.navigate(['/quran', 'surah', surahId, 'ayah', ayahNumber]);
  }

  /**
   * مسح البحث والعودة للسورة الحالية
   */
  clearSearch(): void {
    this.ayahSearchTerm.set('');
    this.searchResults.set([]);
    this.isSearching.set(false);

    // العودة لعرض السورة الحالية
    if (this.currentSurahId) {
      this.loadSurah(this.currentSurahId);
    }
  }

  // ============================================
  // FOOTNOTES METHODS
  // ============================================

  /**
   * جلب الحواشي الخاصة بتفسير معين
   */
  getFootnotesForTafsir(ayah: AyahFull, type: string, tafsirId: number | null): Footnote[] {
    if (!tafsirId) return [];
    return ayah.footnotes.filter(note =>
      note.tafsir_type === type && note.tafsir_id === tafsirId
    );
  }

  /**
   * معالجة النص مع الحواشي
   */
  processTextWithFootnotes(text: string, notes: Footnote[]): TextSegment[] {
    if (!text || !notes || notes.length === 0) {
      return [text];
    }

    try {
      // فلترة الحواشي الصالحة فقط
      const validNotes = notes.filter(note => note.ref && text.includes(note.ref));
      if (validNotes.length === 0) {
        return [text];
      }

      // ترتيب الحواشي حسب موقعها في النص
      const sortedNotes = validNotes.sort((a, b) => text.indexOf(a.ref!) - text.indexOf(b.ref!));

      const segments: TextSegment[] = [];
      let lastIndex = 0;

      sortedNotes.forEach(note => {
        const noteIndex = text.indexOf(note.ref!, lastIndex);
        if (noteIndex !== -1) {
          // إضافة النص قبل الحاشية
          segments.push(text.substring(lastIndex, noteIndex));
          // إضافة النص المرجعي
          segments.push(note.ref!);
          // إضافة الحاشية نفسها
          segments.push(note);
          lastIndex = noteIndex + note.ref!.length;
        }
      });

      // إضافة باقي النص
      segments.push(text.substring(lastIndex));
      return segments;
    } catch (error) {
      console.error('Error processing text with footnotes:', error);
      return [text];
    }
  }

  /**
   * التحقق من أن العنصر حاشية
   */
  isFootnote(segment: TextSegment): segment is Footnote {
    return typeof segment === 'object' && segment !== null && 'note' in segment;
  }

  /**
   * عرض نافذة الحاشية
   */
  showFootnote(noteText: string, event: MouseEvent): void {
    event.stopPropagation();
    this.activeFootnoteText.set(noteText);
  }

  /**
   * إغلاق نافذة الحاشية
   */
  closeFootnote(): void {
    this.activeFootnoteText.set(null);
  }
}
