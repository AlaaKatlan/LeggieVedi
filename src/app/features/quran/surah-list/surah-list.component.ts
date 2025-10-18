import { Component, OnInit, inject, signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Surah } from '../../../core/models/surah.model';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-surah-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './surah-list.component.html',
  styleUrls: ['./surah-list.component.scss'],
})
export class SurahListComponent implements OnInit {
  @Output() openWord = new EventEmitter<string>();

  supabase = inject(SupabaseService);
  themeService = inject(ThemeService);
  router = inject(Router);
  wordFilePath = signal<string | null>(null);

  allSurahs = signal<Surah[]>([]);
  searchTerm = signal<string>('');
  selectedSurahId = signal<number | null>(null);
  selectedAyah = signal<number | null>(null);

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
  onAyahChange(ayahNumber: number | null) {
    this.selectedAyah.set(ayahNumber);

    if (this.selectedSurahId() && ayahNumber !== null) {
      // التوجيه للرابط الخاص بالسورة والآية
      this.router.navigate(['/quran', 'surah', this.selectedSurahId(), 'ayah', ayahNumber]);
    }
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

  onSurahChange(surahId: number | null) {
    this.selectedSurahId.set(surahId);
    this.selectedAyah.set(null);

    // إذا اختارت سورة، نوجه المستخدم إليها
    if (surahId !== null) {
      this.router.navigate(['/quran', 'surah', surahId]);
    }
  }
  scrollToAyah(verseNumber: number) {
    setTimeout(() => {
      const el = document.getElementById(`ayah-${verseNumber}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  } onAyahSelect(verseNumber: number) {
    this.selectedAyah.set(verseNumber);
    this.scrollToAyah(verseNumber);
  }

openDedica() {
    this.openWord.emit('Dedica');
  }

openIntroduzione() {
    this.openWord.emit('Introduzione');
  }

}
