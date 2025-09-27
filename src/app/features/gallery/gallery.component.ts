import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase.service';
import { Artwork } from '../../core/models/artwork.model';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent implements OnInit {
  private supabase = inject(SupabaseService);

  // Signals لإدارة البيانات
  private allArtworks = signal<Artwork[]>([]);
  public categories = computed(() => {
    // استخراج التصنيفات الفريدة من الأعمال الفنية
    const cats = this.allArtworks().map(art => art.category || 'Uncategorized');
    return ['All', ...new Set(cats)];
  });
  public activeCategory = signal<string>('All');

  // computed signal لفلترة الأعمال بناءً على التصنيف النشط
  public filteredArtworks = computed(() => {
    const art = this.allArtworks();
    const cat = this.activeCategory();
    if (cat === 'All') {
      return art;
    }
    return art.filter(a => (a.category || 'Uncategorized') === cat);
  });

  async ngOnInit() {
    // جلب البيانات عند تحميل المكون
    const artworks = await this.supabase.getArtworks();
    this.allArtworks.set(artworks);
  }

  // دالة لتغيير الفلتر النشط
  setFilter(category: string) {
    this.activeCategory.set(category);
  }
}
