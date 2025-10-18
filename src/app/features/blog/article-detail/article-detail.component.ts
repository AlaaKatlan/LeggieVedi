import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Article } from '../../../core/models/article.model';
import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { SafeUrlPipe } from "../../../core/pipes/safe-url.pipe";
@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [CommonModule, NgxDocViewerModule, SafeUrlPipe],
  templateUrl: './article-detail.component.html',
  styleUrls: ['./article-detail.component.scss']
})
export class ArticleDetailComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private location = inject(Location);

  // يستقبل 'slug' المقال من الرابط
  @Input() slug!: string;

  article = signal<Article | null>(null);
  loading = signal<boolean>(true); // (إضافة)

  async ngOnInit() {
    if (this.slug) {
      try {
        const articleData = await this.supabase.getArticleBySlug(this.slug);
        // ---!!! أضف هذا السطر بالضبط هنا !!!---
        console.log('البيانات القادمة من سوبابيس:', articleData);
        // ---!!! ---
        this.article.set(articleData);
      } catch (error) {
        console.error("Error fetching article:", error);
        this.article.set(null); // في حالة حدوث خطأ
      } finally {
        this.loading.set(false); // (إضافة)
      }
    }
  }

  goBack(): void {
    this.location.back();
  }
}
