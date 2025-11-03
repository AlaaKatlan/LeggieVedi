// src/app/features/admin/videos-manager/videos-manager.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AdminService } from '../../../core/services/admin.service';

interface Video {
  id: number;
  title: string;
  url: string;
  description?: string;
  thumbnail?: string;
}

@Component({
  selector: 'app-videos-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="videos-manager">
      <!-- Header -->
      <div class="page-header">
        <h1>إدارة الفيديوهات</h1>
        <button (click)="openAddModal()" class="btn-primary">
          <i class="fas fa-plus"></i>
          فيديو جديد
        </button>
      </div>

      <!-- Search Bar -->
      <div class="search-bar">
        <input
          type="search"
          placeholder="بحث في الفيديوهات..."
          [(ngModel)]="searchTerm"
          (input)="filterVideos()"
          class="search-input"
        />
        <span class="results-count">{{ filteredVideos().length }} فيديو</span>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>جاري تحميل الفيديوهات...</p>
        </div>
      } @else {
        <!-- Videos Grid -->
        @if (filteredVideos().length === 0) {
          <div class="empty-state">
            <i class="fas fa-video-slash"></i>
            <p>لا توجد فيديوهات</p>
            <button (click)="openAddModal()" class="btn-secondary">
              <i class="fas fa-plus"></i>
              أضف أول فيديو
            </button>
          </div>
        } @else {
          <div class="videos-grid">
            @for (video of filteredVideos(); track video.id) {
              <div class="video-card">
                <!-- Thumbnail -->
                <div class="video-thumbnail" (click)="previewVideo(video)">
                  <img [src]="video.thumbnail" [alt]="video.title" />
                  <div class="play-overlay">
                    <i class="fas fa-play-circle"></i>
                  </div>
                </div>

                <!-- Info -->
                <div class="video-info">
                  <h3>{{ video.title }}</h3>
                  @if (video.description) {
                    <p class="description">{{ video.description }}</p>
                  }
                </div>

                <!-- Actions -->
                <div class="video-actions">
                  <button (click)="previewVideo(video)" class="btn-icon" title="معاينة">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button (click)="editVideo(video)" class="btn-icon" title="تعديل">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button (click)="deleteVideo(video)" class="btn-icon btn-danger" title="حذف">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>

    <!-- Add/Edit Modal -->
    @if (showModal()) {
      <div class="modal-backdrop" (click)="closeModal()"></div>
      <div class="modal">
        <div class="modal-header">
          <h3>{{ isEditMode() ? 'تعديل الفيديو' : 'فيديو جديد' }}</h3>
          <button class="close-btn" (click)="closeModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form (ngSubmit)="onSubmit()" class="modal-body">
          <!-- YouTube URL -->
          <div class="form-group">
            <label for="url" class="required">رابط اليوتيوب</label>
            <input
              type="url"
              id="url"
              [(ngModel)]="formData.url"
              name="url"
              required
              placeholder="https://www.youtube.com/watch?v=..."
              (blur)="extractThumbnail()"
            />
            <small>أدخل رابط الفيديو من YouTube</small>
          </div>

          <!-- Thumbnail Preview -->
          @if (formData.thumbnail) {
            <div class="thumbnail-preview">
              <img [src]="formData.thumbnail" alt="Preview" />
            </div>
          }

          <!-- Title -->
          <div class="form-group">
            <label for="title" class="required">عنوان الفيديو</label>
            <input
              type="text"
              id="title"
              [(ngModel)]="formData.title"
              name="title"
              required
              placeholder="أدخل عنوان الفيديو"
            />
          </div>

          <!-- Description -->
          <div class="form-group">
            <label for="description">الوصف (اختياري)</label>
            <textarea
              id="description"
              [(ngModel)]="formData.description"
              name="description"
              rows="4"
              placeholder="وصف قصير عن الفيديو"
            ></textarea>
          </div>

          <!-- Submit Buttons -->
          <div class="modal-footer">
            <button type="button" (click)="closeModal()" class="btn-secondary">
              إلغاء
            </button>
            <button type="submit" class="btn-primary" [disabled]="saving()">
              @if (saving()) {
                <span class="spinner-sm"></span>
                جاري الحفظ...
              } @else {
                <i class="fas fa-save"></i>
                حفظ
              }
            </button>
          </div>
        </form>
      </div>
    }

    <!-- Preview Modal -->
    @if (previewingVideo()) {
      <div class="modal-backdrop" (click)="closePreview()"></div>
      <div class="modal preview-modal">
        <div class="modal-header">
          <h3>{{ previewingVideo()?.title }}</h3>
          <button class="close-btn" (click)="closePreview()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="video-player">
            <iframe
              [src]="getEmbedUrl(previewingVideo()!.url)"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              title="{{ previewingVideo()?.title }}">
            </iframe>
          </div>
          @if (previewingVideo()?.description) {
            <p class="preview-description">{{ previewingVideo()?.description }}</p>
          }
        </div>
      </div>
    }

    <!-- Delete Confirmation -->
    @if (videoToDelete()) {
      <div class="modal-backdrop" (click)="cancelDelete()"></div>
      <div class="modal confirm-modal">
        <div class="modal-header">
          <h3>تأكيد الحذف</h3>
          <button class="close-btn" (click)="cancelDelete()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>هل أنت متأكد من حذف الفيديو: <strong>{{ videoToDelete()?.title }}</strong>؟</p>
          <p class="warning">⚠️ هذا الإجراء لا يمكن التراجع عنه!</p>
        </div>
        <div class="modal-footer">
          <button (click)="cancelDelete()" class="btn-secondary">إلغاء</button>
          <button (click)="confirmDelete()" class="btn-danger" [disabled]="deleting()">
            @if (deleting()) {
              <span class="spinner-sm"></span>
              جاري الحذف...
            } @else {
              حذف
            }
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .videos-manager {
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;

      h1 {
        font-size: 2rem;
        color: #0f172a;
        margin: 0;
      }
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .search-bar {
      background: white;
      padding: 1.5rem;
      border-radius: 1rem;
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .search-input {
      flex: 1;
      padding: 0.75rem 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 1rem;
      transition: all 0.3s ease;

      &:focus {
        outline: none;
        border-color: #ef4444;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
      }
    }

    .results-count {
      color: #64748b;
      font-weight: 600;
      white-space: nowrap;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: 1rem;
    }

    .spinner {
      width: 60px;
      height: 60px;
      border: 4px solid #e2e8f0;
      border-top-color: #ef4444;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 1rem;
      color: #94a3b8;

      i {
        font-size: 4rem;
        margin-bottom: 1rem;
      }

      p {
        font-size: 1.25rem;
        margin-bottom: 1.5rem;
      }
    }

    .videos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .video-card {
      background: white;
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      }
    }

    .video-thumbnail {
      position: relative;
      width: 100%;
      aspect-ratio: 16/9;
      overflow: hidden;
      cursor: pointer;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }

      .play-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.3);
        opacity: 0;
        transition: opacity 0.3s ease;

        i {
          font-size: 3rem;
          color: white;
          transform: scale(1);
          transition: transform 0.3s ease;
        }
      }

      &:hover {
        img {
          transform: scale(1.05);
        }

        .play-overlay {
          opacity: 1;

          i {
            transform: scale(1.2);
          }
        }
      }
    }

    .video-info {
      padding: 1.25rem;

      h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
        color: #0f172a;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .description {
        margin: 0;
        color: #64748b;
        font-size: 0.9rem;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }

    .video-actions {
      display: flex;
      gap: 0.5rem;
      padding: 0 1.25rem 1.25rem;
    }

    .btn-icon {
      flex: 1;
      padding: 0.625rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: #f1f5f9;
      color: #475569;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 1rem;

      &:hover {
        background: #ef4444;
        color: white;
        transform: translateY(-2px);
      }

      &.btn-danger:hover {
        background: #dc2626;
      }
    }

    .btn-secondary {
      padding: 0.75rem 1.5rem;
      background: #e2e8f0;
      color: #475569;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: #cbd5e1;
      }
    }

    /* Modal Styles */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 9998;
      animation: fadeIn 0.2s ease;
    }

    .modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 1rem;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      z-index: 9999;
      animation: slideUp 0.3s ease;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

      &.preview-modal {
        max-width: 900px;
      }

      &.confirm-modal {
        max-width: 500px;
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translate(-50%, -40%);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%);
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e2e8f0;

      h3 {
        margin: 0;
        color: #0f172a;
        font-size: 1.25rem;
      }

      .close-btn {
        background: none;
        border: none;
        color: #64748b;
        font-size: 1.5rem;
        cursor: pointer;
        transition: color 0.3s ease;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.5rem;

        &:hover {
          color: #0f172a;
          background: #f1f5f9;
        }
      }
    }

    .modal-body {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;

      label {
        display: block;
        font-weight: 600;
        color: #334155;
        margin-bottom: 0.5rem;

        &.required::after {
          content: ' *';
          color: #ef4444;
        }
      }

      input[type="text"],
      input[type="url"],
      textarea {
        width: 100%;
        padding: 0.875rem 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 0.5rem;
        font-size: 1rem;
        font-family: inherit;
        transition: all 0.3s ease;

        &:focus {
          outline: none;
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
      }

      textarea {
        resize: vertical;
      }

      small {
        display: block;
        margin-top: 0.5rem;
        color: #64748b;
        font-size: 0.875rem;
      }
    }

    .thumbnail-preview {
      margin-bottom: 1.5rem;

      img {
        width: 100%;
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    }

    .video-player {
      position: relative;
      width: 100%;
      aspect-ratio: 16/9;
      margin-bottom: 1rem;

      iframe {
        width: 100%;
        height: 100%;
        border-radius: 0.5rem;
      }
    }

    .preview-description {
      color: #475569;
      line-height: 1.6;
      margin: 0;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #e2e8f0;
    }

    .btn-danger {
      padding: 0.75rem 1.5rem;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      &:hover:not(:disabled) {
        background: #dc2626;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .warning {
      color: #f59e0b;
      font-weight: 600;
    }

    .spinner-sm {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @media (max-width: 768px) {
      .videos-grid {
        grid-template-columns: 1fr;
      }

      .modal {
        width: 95%;
        max-height: 95vh;
      }
    }
  `]
})
export class VideosManagerComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private adminService = inject(AdminService);
  private sanitizer = inject(DomSanitizer);

  allVideos = signal<Video[]>([]);
  filteredVideos = signal<Video[]>([]);
  loading = signal(true);

  searchTerm = '';

  // Modal states
  showModal = signal(false);
  isEditMode = signal(false);
  saving = signal(false);

  formData: Partial<Video> = {
    title: '',
    url: '',
    description: '',
    thumbnail: ''
  };

  // Preview
  previewingVideo = signal<Video | null>(null);

  // Delete
  videoToDelete = signal<Video | null>(null);
  deleting = signal(false);

  private editingId: number | null = null;

  async ngOnInit() {
    await this.loadVideos();
  }

  async loadVideos() {
    try {
      const videos = await this.supabaseService.getAllVideos();
      this.allVideos.set(videos.map(v => ({
        ...v,
        thumbnail: this.getYoutubeThumbnail(v.url)
      })));
      this.filteredVideos.set(this.allVideos());
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      this.loading.set(false);
    }
  }

  filterVideos() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredVideos.set(this.allVideos());
      return;
    }

    this.filteredVideos.set(
      this.allVideos().filter(v =>
        v.title.toLowerCase().includes(term) ||
        v.description?.toLowerCase().includes(term)
      )
    );
  }

  extractVideoId(url: string): string {
    const match = url.match(/(?:v=|\/embed\/|\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : '';
  }

  getYoutubeThumbnail(url: string): string {
    const videoId = this.extractVideoId(url);
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }

  getEmbedUrl(url: string): SafeResourceUrl {
    const videoId = this.extractVideoId(url);
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  extractThumbnail() {
    if (this.formData.url) {
      this.formData.thumbnail = this.getYoutubeThumbnail(this.formData.url);
    }
  }

  openAddModal() {
    this.isEditMode.set(false);
    this.editingId = null;
    this.formData = {
      title: '',
      url: '',
      description: '',
      thumbnail: ''
    };
    this.showModal.set(true);
  }

  editVideo(video: Video) {
    this.isEditMode.set(true);
    this.editingId = video.id;
    this.formData = { ...video };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  async onSubmit() {
    this.saving.set(true);

    try {
      // Extract thumbnail
      this.extractThumbnail();

      if (this.isEditMode() && this.editingId) {
        await this.adminService.updateVideo(this.editingId, this.formData);
      } else {
        await this.adminService.createVideo(this.formData as any);
      }

      await this.loadVideos();
      this.closeModal();
    } catch (error) {
      console.error('Failed to save video:', error);
      alert('فشل حفظ الفيديو');
    } finally {
      this.saving.set(false);
    }
  }

  previewVideo(video: Video) {
    this.previewingVideo.set(video);
  }

  closePreview() {
    this.previewingVideo.set(null);
  }

  deleteVideo(video: Video) {
    this.videoToDelete.set(video);
  }

  cancelDelete() {
    this.videoToDelete.set(null);
  }

  async confirmDelete() {
    const video = this.videoToDelete();
    if (!video) return;

    this.deleting.set(true);

    try {
      await this.adminService.deleteVideo(video.id);

      this.allVideos.update(videos => videos.filter(v => v.id !== video.id));
      this.filterVideos();

      this.videoToDelete.set(null);
    } catch (error) {
      console.error('Failed to delete video:', error);
      alert('فشل حذف الفيديو');
    } finally {
      this.deleting.set(false);
    }
  }
}
