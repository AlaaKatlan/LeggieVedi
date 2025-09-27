import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Article } from '../../../core/models/article.model';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './article-detail.component.html',
  styleUrls: ['./article-detail.component.scss']
})
export class ArticleDetailComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private location = inject(Location);

  // يستقبل 'slug' المقال من الرابط
  @Input() slug!: string;

  article = signal<Article | null>(null);

  async ngOnInit() {
    if (this.slug) {
      try {
        const articleData = await this.supabase.getArticleBySlug(this.slug);
        this.article.set(articleData);
      } catch (error) {
        console.error("Error fetching article:", error);
        this.article.set(null); // في حالة حدوث خطأ
      }
    }
  }

  goBack(): void {
    this.location.back();
  }
}
