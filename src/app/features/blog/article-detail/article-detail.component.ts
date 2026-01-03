import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Article } from '../../../core/models/article.model';
import { SafeUrlPipe } from '../../../core/pipes/safe-url.pipe';
import { SafeHtmlPipe } from '../../../core/pipes/safe-html.pipe';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [
    CommonModule,
    SafeUrlPipe,
    SafeHtmlPipe
  ],
  templateUrl: './article-detail.component.html',
  styleUrls: ['./article-detail.component.scss']
})
export class ArticleDetailComponent implements OnInit {

  private supabase = inject(SupabaseService);
  private location = inject(Location);

  @Input() slug!: string;

  article = signal<Article | null>(null);
  loading = signal<boolean>(true);

  async ngOnInit() {
    if (!this.slug) return;

    try {
      const articleData = await this.supabase.getArticleBySlug(this.slug);
      console.log('Article:', articleData);
      this.article.set(articleData);
    } catch (error) {
      console.error('Error fetching article:', error);
      this.article.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  goBack(): void {
    this.location.back();
  }

  // 🔹 Google Drive PDF preview
  getDrivePreviewUrl(link: string): string | null {
    const match = link.match(/\/d\/([^/]+)/);
    if (!match) return null;
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }

  // 🔹 Google Docs (Word)
  isGoogleDoc(link: string): boolean {
    return link.includes('docs.google.com');
  }

  // 🔹 Google Drive PDF
  isGoogleDrive(link: string): boolean {
    return link.includes('drive.google.com');
  }
}
