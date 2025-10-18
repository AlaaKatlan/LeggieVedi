import { Component } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import { CommonModule } from '@angular/common';
// 1. استيراد DomSanitizer
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-video-grid',
  standalone: true,
  templateUrl: './video-grid.component.html',
  styleUrl: './video-grid.component.scss',
  imports: [CommonModule]
})
export class VideoGridComponent {
  videos: { id: number; title: string; url: string }[] = [];
  loading = true;

  // 2. إضافة "sanitizer" إلى الـ constructor
  constructor(
    private supabaseService: SupabaseService,
    private sanitizer: DomSanitizer // <-- أضف هذا
  ) { }

  ngOnInit(): void {
    this.loadVideos();
  }

  async loadVideos() {
    try {
      this.videos = await this.supabaseService.getAllVideos();
    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  extractVideoId(url: string): string {
    const match = url.match(/v=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : '';
  }

  // 3. إضافة هذه الدالة الجديدة
  getSafeEmbedUrl(url: string): SafeResourceUrl {
    const videoId = this.extractVideoId(url);
    const embedUrl = 'https://www.youtube.com/embed/' + videoId;
    // تخبر أنغولار أن يثق بهذا الرابط
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }
}
