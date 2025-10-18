
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SupabaseService } from '../../core/services/supabase.service';

interface Video {
  id: number;
  title: string;
  url: string;
  description?: string;
  thumbnail?: string;
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

  videos = signal<Video[]>([]);
  loading = signal(true);
  selectedVideo = signal<Video | null>(null);

  ngOnInit(): void {
    this.loadVideos();
  }

  async loadVideos() {
    try {
      const data = await this.supabaseService.getAllVideos();
      this.videos.set(data.map(v => ({
        ...v,
        thumbnail: this.getYoutubeThumbnail(v.url)
      })));
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      this.loading.set(false);
    }
  }

  extractVideoId(url: string): string {
    const match = url.match(/v=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : '';
  }

  getYoutubeThumbnail(url: string): string {
    const videoId = this.extractVideoId(url);
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }

  getSafeEmbedUrl(url: string): SafeResourceUrl {
    const videoId = this.extractVideoId(url);
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=0`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  openVideo(video: Video) {
    this.selectedVideo.set(video);
  }

  closeVideo() {
    this.selectedVideo.set(null);
  }
}
