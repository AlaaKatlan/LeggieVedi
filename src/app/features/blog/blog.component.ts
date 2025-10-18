import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase.service';
import { Article } from '../../core/models/article.model';
import { RouterLink } from '@angular/router'; // <-- لاستخدام [routerLink]

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterLink], // <-- أضف CommonModule و RouterLink
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss'
})
export class BlogComponent implements OnInit {
  private supabase = inject(SupabaseService);

  // Signals لإدارة البيانات
  private allArticles = signal<Article[]>([]);

  // الفئات التي طلبتها
  public categories = signal<string[]>(['All', 'نصوص', 'مقالات', 'وجدانيات']);
  public activeCategory = signal<string>('All');
  public loading = signal<boolean>(true);

  // computed signal لفلترة المقالات بناءً على التصنيف النشط
  public filteredArticles = computed(() => {
    const articles = this.allArticles();
    const category = this.activeCategory();

    if (category === 'All') {
      return articles;
    }
    return articles.filter(a => a.category === category);
  });

  async ngOnInit() {
    try {
      // جلب البيانات عند تحميل المكون
      // تأكد من إضافة دالة "getAllArticles" إلى SupabaseService
      const articles = await this.supabase.getAllArticles();
      this.allArticles.set(articles);
    } catch (error) {
      console.error("Failed to load articles", error);
    } finally {
      this.loading.set(false);
    }
  }

  // دالة لتغيير الفلتر النشط
  setFilter(category: string) {
    this.activeCategory.set(category);
  }
}
