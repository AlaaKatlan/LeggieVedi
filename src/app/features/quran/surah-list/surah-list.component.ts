import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Surah } from '../../../core/models/surah.model';

@Component({
  selector: 'app-surah-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './surah-list.component.html',
  styleUrls: ['./surah-list.component.scss'],
})
export class SurahListComponent implements OnInit {
   supabase = inject(SupabaseService);
  themeService = inject(ThemeService);

  allSurahs = signal<Surah[]>([]);
  searchTerm = signal<string>('');
filterType = signal<'surah' | 'ayah'>('surah');

  filteredSurahs = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const surahs = this.allSurahs();
    if (!term) return surahs;

    return surahs.filter(s =>
      s.name_ar.includes(term) ||
      s.name_en.toLowerCase().includes(term) ||
      s.name_en_translation.toLowerCase().includes(term) ||
      s.order_number.toString().includes(term)
    );
  });

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
}
