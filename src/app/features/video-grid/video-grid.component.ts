// src/app/features/video-grid/video-grid.component.ts

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SupabaseService } from '../../core/services/supabase.service';

interface VideoCategory {
  id: number;
  categories_ar: string;
  categories_en: string;
}

interface Video {
  id: number;
  title: string;
  title_en?: string;
  url: string;
  categorie_id: number;
  thumbnail?: string;
  created_at: string;
  videos_categories?: VideoCategory; // تغيير الاسم هنا
}

@Component({
  selector: 'app-video-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-grid.component.html',
  styleUrls: ['./video-grid.component.scss']
})
export class VideoGridComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private sanitizer = inject(DomSanitizer);

  // Signals
  private allVideos = signal<Video[]>([]);
  allCategories = signal<VideoCategory[]>([]);
  activeCategory = signal<number | null>(null);
  loading = signal(true);
  selectedVideo = signal<Video | null>(null);

  // Computed: الفيديوهات المفلترة
  filteredVideos = computed(() => {
    const videos = this.allVideos();
    const categoryId = this.activeCategory();

    if (!categoryId) {
      return videos;
    }

    return videos.filter(v => v.categorie_id === categoryId);
  });

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      const [videos, categories] = await Promise.all([
        this.supabaseService.getAllVideos(),
        this.supabaseService.getVideoCategories()
      ]);
console.log('Fetched videos:', videos);
console.log('Fetched categories:', categories);
      this.allVideos.set(videos.map(v => ({
        ...v,
        thumbnail: this.getYoutubeThumbnail(v.url)
      })));

      this.allCategories.set(categories);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  // تغيير الفلتر
  setFilter(categoryId: number | null) {
    this.activeCategory.set(categoryId);
  }

  extractVideoId(url: string): string {
    const match = url.match(/(?:v=|\/embed\/|\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : '';
  }

  getYoutubeThumbnail(url: string): string {
    const videoId = this.extractVideoId(url);
    // استخدام hqdefault بدلاً من maxresdefault لأنها متوفرة دائماً
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }

  // معالجة خطأ تحميل الصورة
  onImageError(event: Event, video: Video) {
    const img = event.target as HTMLImageElement;
    const videoId = this.extractVideoId(video.url);
    // محاولة استخدام default thumbnail
    img.src = `https://img.youtube.com/vi/${videoId}/default.jpg`;
  }

  getSafeEmbedUrl(url: string): SafeResourceUrl {
    const videoId = this.extractVideoId(url);
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  openVideo(video: Video) {
    this.selectedVideo.set(video);
  }

  closeVideo() {
    this.selectedVideo.set(null);
  }
}
