// ========================================
// FILE: src/app/features/quran/surah-list/surah-list.component.ts
// ========================================

import { Component, OnInit, inject, signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Surah } from '../../../core/models/surah.model';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs';

@Component({
  selector: 'app-surah-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './surah-list.component.html',
  styleUrls: ['./surah-list.component.scss'],
})
export class SurahListComponent implements OnInit {
  @Output() openWord = new EventEmitter<string>();
  @Output() openReader = new EventEmitter<void>();

  supabase = inject(SupabaseService);
  themeService = inject(ThemeService);
  router = inject(Router);
  wordFilePath = signal<string | null>(null);

  allSurahs = signal<Surah[]>([]);
  searchTerm = signal<string>('');
  selectedSurahId = signal<number | null>(null);
  selectedAyah = signal<number | null>(null);

  currentViewType = signal<'surah' | 'dedica' | 'introduzione' | null>(null);



  filteredSurahs = computed(() => {

    const term = this.searchTerm().toLowerCase().trim();
    const surahs = this.allSurahs();
    if (!term) return surahs;
    return surahs.filter(
      s =>
        s.name_ar.includes(term) ||
        s.name_en.toLowerCase().includes(term) ||
        s.name_en_translation.toLowerCase().includes(term) ||
        s.order_number.toString().includes(term)
    );
  });

  filteredAyahs() {
    const surah = this.allSurahs().find(s => s.id === this.selectedSurahId());
    return surah ? Array.from({ length: surah.ayah_count }, (_, i) => i + 1) : [];
  }

  // 4. تعديل الـ constructor ليقرأ الرابط عند التحميل
  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {

      const url = event.urlAfterRedirects;
      // البحث عن رقم السورة في الرابط
      const surahMatch = url.match(/\/quran\/surah\/(\d+)/);

      if (surahMatch) {
        const surahId = parseInt(surahMatch[1], 10);

        // لا تقم بتغيير الحالة إذا كان المستخدم قد اختار ملف وورد
        if (this.currentViewType() !== 'dedica' && this.currentViewType() !== 'introduzione') {
            this.currentViewType.set('surah');
        }
        // تحديث السورة المختارة من الرابط
        this.selectedSurahId.set(surahId);

        // البحث عن رقم الآية
        const ayahMatch = url.match(/\/quran\/surah\/\d+\/ayah\/(\d+)/);
        if (ayahMatch) {
          const ayahNumber = parseInt(ayahMatch[1], 10);
          this.selectedAyah.set(ayahNumber);
        } else {
          // إذا لم يكن هناك آية، قم بتصفيرها
          if (this.currentViewType() === 'surah') {
             this.selectedAyah.set(null);
          }
        }
      }
    });
  }

  async ngOnInit() {
    const surahs = await this.supabase.getAllSurahs();
    this.allSurahs.set(surahs);
  }

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  // 5. تعديل onSurahChange (للقائمة المنسدلة)
  onSurahChange(surahId: number | null) {
    this.selectedSurahId.set(surahId);
    this.selectedAyah.set(null);

    if (surahId !== null) {
      this.currentViewType.set('surah');
      this.openReader.emit(); // <-- إخبار الأب بالتبديل
      this.router.navigate(['/quran', 'surah', surahId]);
    }
  }

  // 6. تعديل onAyahChange (للقائمة المنسدلة)
  onAyahChange(ayahNumber: number | null) {
    this.selectedAyah.set(ayahNumber);

    if (this.selectedSurahId() && ayahNumber !== null) {
      this.openReader.emit(); // <-- إخبار الأب بالتبديل
      this.router.navigate(['/quran', 'surah', this.selectedSurahId(), 'ayah', ayahNumber]);
    }
  }

  scrollToAyah(verseNumber: number) {
    // ... (no change)
  }

  onAyahSelect(verseNumber: number) {
    // ... (no change)
  }

  // 7. إضافة دالة جديدة لروابط السور
  onSurahLinkClick(surahId: number) {
    this.currentViewType.set('surah');
    this.selectedSurahId.set(surahId);
    this.selectedAyah.set(null); // تصفير الآية عند اختيار سورة جديدة
    this.openReader.emit(); // <-- إخبار الأب بالتبديل
    // لا داعي لاستدعاء router.navigate لأن [routerLink] سيقوم بذلك
  }

  openDedica() {
    this.selectedSurahId.set(null);
    this.selectedAyah.set(null);
    this.currentViewType.set('dedica');
    this.openWord.emit('Dedica');
  }

  openIntroduzione() {
    this.selectedSurahId.set(null);
    this.selectedAyah.set(null);
    this.currentViewType.set('introduzione');
    this.openWord.emit('Introduzione');
  }
}
