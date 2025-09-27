// import { Component, computed, Input, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { SupabaseService } from '../../core/services/supabase.service';
// import { AyahFull } from '../../core/models/ayah.model';
// import { Footnote } from '../../core/models/footnote.model';
// import { Surah } from '../../core/models/surah.model';

// type TextSegment = string | Footnote;

// @Component({
//   selector: 'app-reader',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './reader.component.html',
//   styleUrls: ['./reader.component.scss'],
// })
// export class ReaderComponent {
//   ayahs = signal<AyahFull[]>([]);
//   surahInfo = signal<Surah | null>(null);
//   activeFootnoteText = signal<string | null>(null);
//   ayahSearchTerm = signal<string>('');
//   @Input()
//   set id(surahId: string) {
//     this.loadSurah(parseInt(surahId, 10));
//   }

//   constructor(private supabase: SupabaseService) { }

//   async loadSurah(id: number) {
//     if (isNaN(id)) return;
//     this.ayahSearchTerm.set(''); // إعادة تعيين البحث عند تغيير السورة

//     this.activeFootnoteText.set(null);
//     this.ayahs.set([]);
//     this.surahInfo.set(null);
//     try {
//       const [surahData, ayahsData] = await Promise.all([
//         this.supabase.getSurahInfo(id),
//         this.supabase.getFullSurah(id),
//       ]);

//       // --- نقطة التفتيش 1: لرؤية البيانات القادمة من Supabase ---
//       console.log("SURAH DATA LOADED:", surahData);
//       console.log("AYAHS DATA LOADED:", ayahsData);
//       // تأكد من أن مصفوفة 'footnotes' داخل كل آية تحتوي على البيانات

//       this.surahInfo.set(surahData);
//       this.ayahs.set(ayahsData);
//     } catch (error) {
//       console.error("Failed to load Surah data:", error);
//     }
//   }
//   filteredAyahs = computed(() => {
//     const term = this.ayahSearchTerm().toLowerCase().trim();
//     const allAyahs = this.ayahs();
//     if (!term) return allAyahs;

//     return allAyahs.filter(ayah => {
//       // البحث في النص العربي النظيف (بدون تشكيل)
//       const inArabic = ayah.text_clean.includes(term);
//       // البحث في نص التفسير الأساسي
//       const inTafsir = ayah.primary_tafsir?.text.toLowerCase().includes(term) ?? false;
//       return inArabic || inTafsir;
//     });
//   });
//   onAyahSearch(event: Event) {
//     this.ayahSearchTerm.set((event.target as HTMLInputElement).value);
//   }
//   getFootnotesForTafsir(ayah: AyahFull, type: string, tafsirId: number | null): Footnote[] {
//     if (!tafsirId) return [];
//     return ayah.footnotes.filter(note =>
//       note.tafsir_type === type && note.tafsir_id === tafsirId
//     );
//   }

//   processTextWithFootnotes(text: string, notes: Footnote[]): TextSegment[] {
//     if (!text || !notes || notes.length === 0) {
//       return [text];
//     }

//     // --- نقطة التفتيش 2: هل تصل الحواشي إلى هذه الدالة؟ ---
//     console.log(`Processing ${notes.length} note(s) for text: "${text.substring(0, 30)}..."`);

//     try {
//       const validNotes = notes.filter(note => note.ref && text.includes(note.ref));

//       // --- نقطة التفتيش 3 (الأهم): هل تم العثور على تطابق؟ ---
//       // إذا كانت هذه المصفوفة فارغة، فهذا يعني أن 'reference_text' غير مطابق للنص
//       console.log("Valid notes found:", validNotes);

//       if (validNotes.length === 0) {
//         return [text];
//       }

//       const sortedNotes = validNotes.sort((a, b) => text.indexOf(a.ref!) - text.indexOf(b.ref!));
//       const segments: TextSegment[] = [];
//       let lastIndex = 0;

//       sortedNotes.forEach(note => {
//         const noteIndex = text.indexOf(note.ref!, lastIndex);
//         if (noteIndex !== -1) {
//           segments.push(text.substring(lastIndex, noteIndex));
//           segments.push(note.ref!);
//           segments.push(note);
//           lastIndex = noteIndex + note.ref!.length;
//         }
//       });
//       segments.push(text.substring(lastIndex));
//       return segments;

//     } catch (error) {
//       console.error("Error processing text with footnotes:", error);
//       return [text];
//     }
//   }

//   isFootnote(segment: TextSegment): segment is Footnote {
//     return typeof segment === 'object' && segment !== null && 'note' in segment;
//   }

//   showFootnote(noteText: string, event: MouseEvent) {
//     // --- نقطة التفتيش 4: هل يتم استدعاء دالة الضغط؟ ---
//     console.log("showFootnote called with text:", noteText);
//     event.stopPropagation();
//     this.activeFootnoteText.set(noteText);
//   }

//   closeFootnote() {
//     this.activeFootnoteText.set(null);
//   }
// }
import { Component, computed, inject, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
export class ReaderComponent {
  ayahs = signal<AyahFull[]>([]);
  surahInfo = signal<Surah | null>(null);
  activeFootnoteText = signal<string | null>(null);
  ayahSearchTerm = signal<string>('');
  public bookmarkService = inject(QuranBookmarkService);

  @Input()
  set id(surahId: string) {
    this.loadSurah(parseInt(surahId, 10));
  }

  constructor(private supabase: SupabaseService) {}

  async loadSurah(id: number) {
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
      console.error("Failed to load Surah data:", error);
    }
  }

  // --- تم التعديل هنا ---
  filteredAyahs = computed(() => {
    const term = this.ayahSearchTerm().toLowerCase().trim();
    const allAyahs = this.ayahs();
    if (!term) return allAyahs;

    return allAyahs.filter(ayah => {
      const inArabic = ayah.text_clean.includes(term);
      // تم تغيير tafsir_text إلى text
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
      console.error("Error processing text with footnotes:", error);
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
