import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router'; // 1. استيراد ما نحتاجه
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
// 2. تطبيق OnInit و OnDestroy
export class ReaderComponent implements OnInit, OnDestroy {
  // --- Signals (الحالات) ---
  ayahs = signal<AyahFull[]>([]);
  surahInfo = signal<Surah | null>(null);
  activeFootnoteText = signal<string | null>(null);
  ayahSearchTerm = signal<string>('');
  selectedAyah = signal<number | null>(null); // هذا سيُستخدم لتلوين الآية المختارة

  // --- Services (الخدمات) ---
  public bookmarkService = inject(QuranBookmarkService);
  private supabase = inject(SupabaseService);
  private route = inject(ActivatedRoute); // 3. حقن ActivatedRoute

  // --- متغيرات داخلية ---
  private currentSurahId: number | null = null;
  private routeSubscription!: Subscription;

  // 4. إزالة @Input() واستخدام ngOnInit للاستماع للرابط
  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const surahId = Number(params.get('id'));
      const ayahNumber = params.get('ayahNumber') ? Number(params.get('ayahNumber')) : null;

      // تحديث الآية المختارة لتطبيق التظليل عليها
      this.selectedAyah.set(ayahNumber);

      // تحميل بيانات السورة فقط إذا كانت سورة جديدة
      if (surahId && surahId !== this.currentSurahId) {
        this.currentSurahId = surahId;
        // بعد تحميل السورة، قم بالانتقال للآية المطلوبة
        this.loadSurah(surahId).then(() => {
          if (ayahNumber) {
            this.scrollToAyah(ayahNumber);
          }
        });
      }
      // إذا كانت السورة محملة بالفعل، فقط قم بالانتقال للآية
      else if (ayahNumber) {
        this.scrollToAyah(ayahNumber);
      }
    });
  }

  // 5. دالة ngOnDestroy لتنظيف الاشتراك عند مغادرة الصفحة
  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  // دالة تحميل بيانات السورة
  async loadSurah(id: number): Promise<void> {
    if (isNaN(id)) return;
    this.ayahSearchTerm.set('');
    this.activeFootnoteText.set(null);
    this.ayahs.set([]);
    this.surahInfo.set(null);
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

  // 6. تعديل بسيط على دالة الانتقال للآية
  scrollToAyah(verseNumber: number) {
    // نستخدم تأخير بسيط لضمان أن واجهة المستخدم قد تم تحديثها بالكامل
    setTimeout(() => {
      const element = document.getElementById(`ayah-${verseNumber}`);
      if (element) {
        // اجعل العنصر في منتصف الشاشة بحركة ناعمة
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  // --- باقي الدوال تبقى كما هي ---
  filteredAyahs = computed(() => {
    const term = this.ayahSearchTerm().toLowerCase().trim();
    const allAyahs = this.ayahs();
    if (!term) return allAyahs;

    return allAyahs.filter(ayah => {
      const inArabic = ayah.text_clean.includes(term);
      const inTafsir = ayah.primary_tafsir?.text.toLowerCase().includes(term) ?? false;
      return inArabic || inTafsir;
    });
  });

  onAyahSearch(event: Event) {
    this.ayahSearchTerm.set((event.target as HTMLInputElement).value);
  }

  getFootnotesForTafsir(ayah: AyahFull, type: string, tafsirId: number | null): Footnote[] {
    if (!tafsirId) return [];
    return ayah.footnotes.filter(note =>
      note.tafsir_type === type && note.tafsir_id === tafsirId
    );
  }

  processTextWithFootnotes(text: string, notes: Footnote[]): TextSegment[] {
    if (!text || !notes || notes.length === 0) {
      return [text];
    }
    try {
      const validNotes = notes.filter(note => note.ref && text.includes(note.ref));
      if (validNotes.length === 0) {
        return [text];
      }
      const sortedNotes = validNotes.sort((a, b) => text.indexOf(a.ref!) - text.indexOf(b.ref!));
      const segments: TextSegment[] = [];
      let lastIndex = 0;
      sortedNotes.forEach(note => {
        const noteIndex = text.indexOf(note.ref!, lastIndex);
        if (noteIndex !== -1) {
          segments.push(text.substring(lastIndex, noteIndex));
          segments.push(note.ref!);
          segments.push(note);
          lastIndex = noteIndex + note.ref!.length;
        }
      });
      segments.push(text.substring(lastIndex));
      return segments;
    } catch (error) {
      console.error('Error processing text with footnotes:', error);
      return [text];
    }
  }

  isFootnote(segment: TextSegment): segment is Footnote {
    return typeof segment === 'object' && segment !== null && 'note' in segment;
  }

  showFootnote(noteText: string, event: MouseEvent) {
    event.stopPropagation();
    this.activeFootnoteText.set(noteText);
  }

  closeFootnote() {
    this.activeFootnoteText.set(null);
  }
}
