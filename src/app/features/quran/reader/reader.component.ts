// FILE: src/app/features/quran/reader/reader.component.ts

import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AyahFull } from '../../../core/models/ayah.model';
import { Footnote } from '../../../core/models/footnote.model';
import { Surah } from '../../../core/models/surah.model';
import { QuranBookmarkService } from '../../../core/services/quran-bookmark.service';

type TextSegment = string | any;

@Component({
  selector: 'app-reader',
  standalone: true,
  imports: [CommonModule], // ✅ أزلنا BasmalahComponent — لم نعد نحتاجه
  templateUrl: './reader.component.html',
  styleUrls: ['./reader.component.scss'],
})
export class ReaderComponent implements OnInit, OnDestroy {

  ayahs = signal<AyahFull[]>([]);
  surahInfo = signal<Surah | null>(null);
  activeFootnoteText = signal<string | null>(null);
  ayahSearchTerm = signal<string>('');
  selectedAyah = signal<number | null>(null);
  allSurahs = signal<Surah[]>([]);
  searchResults = signal<{ surah: Surah, ayah: AyahFull }[]>([]);
  isSearching = signal<boolean>(false);
  basmalahAyah = signal<AyahFull | null>(null); // ✅ البسملة الكاملة من DB

  public bookmarkService = inject(QuranBookmarkService);
  private supabase = inject(SupabaseService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private currentSurahId: number | null = null;
  private routeSubscription!: Subscription;
  private searchTimeout: any = null;
  private searchCache = new Map<string, { surah: Surah, ayah: AyahFull }[]>();

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const surahId = Number(params.get('id'));
      const ayahNumber = params.get('ayahNumber') ? Number(params.get('ayahNumber')) : null;

      this.selectedAyah.set(ayahNumber);

      if (surahId && surahId !== this.currentSurahId) {
        this.currentSurahId = surahId;
        this.loadSurah(surahId).then(() => {
          if (ayahNumber) this.scrollToAyah(ayahNumber);
        });
      } else if (ayahNumber) {
        this.scrollToAyah(ayahNumber);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) this.routeSubscription.unsubscribe();
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
  }

  async loadSurah(id: number): Promise<void> {
    if (isNaN(id)) return;

    this.ayahs.set([]);
    this.activeFootnoteText.set(null);
    this.surahInfo.set(null);
    this.basmalahAyah.set(null);

    try {
      const [surahData, ayahsData] = await Promise.all([
        this.supabase.getSurahInfo(id),
        this.supabase.getFullSurah(id),
      ]);

      this.surahInfo.set(surahData);
      this.ayahs.set(ayahsData);

      // ✅ جلب البسملة الكاملة لكل السور ما عدا الفاتحة (تعرضها كآية) والتوبة (لا بسملة)
      if (id !== 1 && id !== 9) {
        const basmalah = await this.supabase.getBasmalah();
        this.basmalahAyah.set(basmalah);
      }

    } catch (error) {
      console.error('Failed to load Surah data:', error);
    }
  }

  scrollToAyah(verseNumber: number): void {
    setTimeout(() => {
      const element = document.getElementById(`ayah-${verseNumber}`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  filteredAyahs = computed(() => {
    const term = this.ayahSearchTerm().toLowerCase().trim();
    let allAyahs = this.ayahs();

    // ✅ في سورة الفاتحة البسملة آية عادية — لا نحذفها
    // في باقي السور لا يوجد verse_number=1 يشبه البسملة فلا حاجة للفلتر

    if (!term) return allAyahs;

    if (term.length < 3) {
      return allAyahs.filter(ayah => {
        const inArabic = ayah.text_clean?.includes(term) ?? false;
        const inTafsir = ayah.primary_tafsir?.text?.toLowerCase().includes(term) ?? false;
        return inArabic || inTafsir;
      });
    }

    if (this.searchResults().length > 0) {
      return this.searchResults().map(result => result.ayah);
    }

    return allAyahs;
  });

  onAyahSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.ayahSearchTerm.set(term);

    if (this.searchTimeout) clearTimeout(this.searchTimeout);

    if (term.length < 3) {
      this.searchResults.set([]);
      this.isSearching.set(false);
      return;
    }

    this.searchTimeout = setTimeout(() => {
      this.searchInAllSurahs(term);
    }, 500);
  }

  async searchInAllSurahs(term: string): Promise<void> {
    if (this.searchCache.has(term)) {
      this.searchResults.set(this.searchCache.get(term)!);
      return;
    }

    this.isSearching.set(true);
    this.searchResults.set([]);

    try {
      if (this.allSurahs().length === 0) {
        const surahs = await this.supabase.getAllSurahs();
        this.allSurahs.set(surahs);
      }

      const results: { surah: Surah, ayah: AyahFull }[] = [];

      for (const surah of this.allSurahs()) {
        if (results.length >= 50) break;

        try {
          const ayahs = await this.supabase.getFullSurah(surah.id);

          for (const ayah of ayahs) {
            const searchInUthmani = ayah.text_uthmani?.includes(term) ?? false;
            const searchInClean = ayah.text_clean?.includes(term) ?? false;
            const searchInTafsir = ayah.primary_tafsir?.text?.toLowerCase().includes(term.toLowerCase()) ?? false;

            if (searchInUthmani || searchInClean || searchInTafsir) {
              results.push({ surah, ayah });
              if (results.length % 5 === 0) this.searchResults.set([...results]);
              if (results.length >= 50) break;
            }
          }
        } catch (err) {
          console.error(`Error in surah ${surah.name_ar}:`, err);
        }
      }

      this.searchResults.set([...results]);
      if (results.length > 0) this.searchCache.set(term, results);

    } catch (error) {
      console.error('Search error:', error);
    } finally {
      this.isSearching.set(false);
    }
  }

  navigateToAyah(surahId: number, ayahNumber: number): void {
    this.router.navigate(['/quran', 'surah', surahId, 'ayah', ayahNumber]);
  }

  clearSearch(): void {
    this.ayahSearchTerm.set('');
    this.searchResults.set([]);
    this.isSearching.set(false);
    if (this.currentSurahId) this.loadSurah(this.currentSurahId);
  }

  getFootnotesForTafsir(ayah: AyahFull, type: string, tafsirId: number | null): Footnote[] {
    if (!tafsirId) return [];
    return ayah.footnotes.filter(note =>
      note.tafsir_type === type && note.tafsir_id === tafsirId
    );
  }

  processTextWithFootnotes(text: string | undefined, notes: any[]): any[] {
    if (!text || !notes || notes.length === 0) return [text || ''];

    try {
      const validNotes = notes.filter(note => note.ref && text.includes(note.ref));
      if (validNotes.length === 0) return [text];

      const sortedNotes = validNotes.sort((a, b) =>
        text.indexOf(a.ref!) - text.indexOf(b.ref!)
      );

      const segments: any[] = [];
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
      return [text || ''];
    }
  }

  isFootnote(segment: any): boolean {
    return typeof segment === 'object' && segment !== null && 'note' in segment;
  }

  showFootnote(noteText: string, event: MouseEvent): void {
    event.stopPropagation();
    this.activeFootnoteText.set(noteText);
  }

  closeFootnote(): void {
    this.activeFootnoteText.set(null);
  }
}
