import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // 1. قم باستيراد RouterModule هنا

import { SupabaseService } from '../../core/services/supabase.service';
import { ArticleCardComponent } from '../../shared/components/article-card/article-card.component';
import { Article } from '../../core/models/article.model';
import { Artwork } from '../../core/models/artwork.model';
import { Achievement } from '../../core/models/achievement.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ArticleCardComponent,
    RouterModule // 2. أضف RouterModule إلى مصفوفة imports هنا
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  // ... بقية الكود يبقى كما هو
  private supabase = inject(SupabaseService);

  latestArticles = signal<Article[]>([]);
  featuredArtworks = signal<Artwork[]>([]);
  achievements = signal<Achievement[]>([]);

  async ngOnInit() {
    try {
      const [articles, artworks] = await Promise.all([
        this.supabase.getLatestArticles(3),
        this.supabase.getArtworks(),
      ]);

      this.latestArticles.set(articles);
      this.featuredArtworks.set(artworks.slice(0, 4));
    } catch (error) {
      console.error("Error loading homepage data:", error);
    }
  }
}
