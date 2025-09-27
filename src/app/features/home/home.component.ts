import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase.service';

import { ArticleCardComponent } from '../../shared/components/article-card/article-card.component'; // Example shared component
import { Article } from '../../core/models/article.model';
import { Artwork } from '../../core/models/artwork.model';
import { Achievement } from '../../core/models/achievement.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ArticleCardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private supabase = inject(SupabaseService);

  // Use signals for reactive data
  latestArticles = signal<Article[]>([]);
  artworks = signal<Artwork[]>([]);
  achievements = signal<Achievement[]>([]);

  async ngOnInit() {
    // Load all data in parallel for faster loading
    const [articles, artworks, achievements] = await Promise.all([
      this.supabase.getLatestArticles(),
      this.supabase.getArtworks(),
      this.supabase.getAchievements()
    ]);

    this.latestArticles.set(articles);
    this.artworks.set(artworks);
    this.achievements.set(achievements);
  }
}
