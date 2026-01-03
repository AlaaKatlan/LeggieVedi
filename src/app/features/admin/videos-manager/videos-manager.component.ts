import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AdminService } from '../../../core/services/admin.service';
import { Video, VideoCategory } from '../../../core/models/video.model';

@Component({
  selector: 'app-videos-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="manager-container">
      <div class="page-header">
        <h1>إدارة الفيديوهات</h1>
        <button (click)="openAddModal()" class="btn-primary">
          <i class="fas fa-plus"></i>
          فيديو جديد
        </button>
      </div>

      <div class="search-bar">
        <input
          type="search"
          placeholder="بحث في الفيديوهات..."
          [(ngModel)]="searchTerm"
          (input)="filterVideos()"
          class="search-input"
        />

        <select [(ngModel)]="filterCategory" (change)="filterVideos()" class="filter-select">
          <option [ngValue]="null">كل الفئات</option>
          @for (cat of categories(); track cat.id) {
            <option [ngValue]="cat.id">{{ cat.categories_ar }}</option>
          }
        </select>

        <span class="results-count">{{ filteredVideos().length }} فيديو</span>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>جاري تحميل الفيديوهات...</p>
        </div>
      } @else {
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
                <div class="video-thumbnail" (click)="previewVideo(video)">
                  <img [src]="video.thumbnail" [alt]="video.title" />
                  <div class="play-overlay">
                    <i class="fas fa-play-circle"></i>
                  </div>
                  @if (video.videos_categories) {
                    <div class="category-badge">
                      {{ video.videos_categories.categories_ar }}
                    </div>
                  }
                </div>

                <div class="video-info">
                  <h3>{{ video.title }}</h3>

                </div>

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

    @if (showModal()) {
      <div class="custom-backdrop" (click)="closeModal()"></div>
      <div class="custom-modal form-modal">
        <div class="modal-header">
          <h3>{{ isEditMode() ? 'تعديل الفيديو' : 'فيديو جديد' }}</h3>
          <button class="close-btn" (click)="closeModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form (ngSubmit)="onSubmit()" class="modal-body">

          <div class="form-group">
            <label for="category" class="required">تصنيف الفيديو</label>
            <select
              id="category"
              [(ngModel)]="formData.categorie_id"
              name="categorie_id"
              class="form-select"
              required>
              <option [ngValue]="undefined" disabled>اختر التصنيف</option>
              @for (cat of categories(); track cat.id) {
                <option [ngValue]="cat.id">{{ cat.categories_ar }}</option>
              }
            </select>
          </div>

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
          </div>

          @if (formData.thumbnail) {
            <div class="thumbnail-preview">
              <img [src]="formData.thumbnail" alt="Preview" />
            </div>
          }

          <div class="form-group">
            <label for="title" class="required">عنوان الفيديو (عربي)</label>
            <input
              type="text"
              id="title"
              [(ngModel)]="formData.title"
              name="title"
              required
              placeholder="أدخل عنوان الفيديو"
            />
          </div>

           <div class="form-group">
            <label for="title_en">العنوان (إنجليزي - اختياري)</label>
            <input
              type="text"
              id="title_en"
              [(ngModel)]="formData.title_en"
              name="title_en"
              placeholder="English Title"
            />
          </div>



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

    @if (previewingVideo()) {
      <div class="custom-backdrop" (click)="closePreview()"></div>
      <div class="custom-modal preview-modal">
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

        </div>
      </div>
    }

    @if (videoToDelete()) {
      <div class="custom-backdrop" (click)="cancelDelete()"></div>
      <div class="custom-modal confirm-modal">
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
    .manager-container { max-width: 1400px; margin: 0 auto; padding: 1rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .page-header h1 { font-size: 2rem; color: #0f172a; margin: 0; }

    .btn-primary {
      display: inline-flex;
      align-items: center; gap: 0.5rem; padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, #ef4444, #dc2626); color: white;
      border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease;
    }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    .search-bar {
      background: white; padding: 1.5rem; border-radius: 1rem; margin-bottom: 2rem;
      display: flex; align-items: center; gap: 1rem; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .search-input {
      flex: 1; padding: 0.75rem 1rem; border: 2px solid #e2e8f0; border-radius: 0.5rem; font-size: 1rem;
    }
    .filter-select {
        padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 0.5rem; min-width: 160px;
        background-color: #f8fafc; cursor: pointer;
    }

    /* Grid & Cards */
    .videos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    .video-card { background: white; border-radius: 1rem; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: transform 0.3s; }
    .video-card:hover { transform: translateY(-5px); }

    .video-thumbnail { position: relative; aspect-ratio: 16/9; overflow: hidden; cursor: pointer; }
    .video-thumbnail img { width: 100%; height: 100%; object-fit: cover; }
    .play-overlay {
        position: absolute; inset: 0; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;
        opacity: 0; transition: 0.3s;
    }
    .play-overlay i { font-size: 3rem; color: white; }
    .video-thumbnail:hover .play-overlay { opacity: 1; }

    .category-badge {
        position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white;
        padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;
        backdrop-filter: blur(4px);
    }

    .video-info { padding: 1rem; }
    .video-info h3 { margin: 0 0 0.5rem 0; font-size: 1.1rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .description { color: #64748b; font-size: 0.9rem; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0; }

    .video-actions { display: flex; gap: 0.5rem; padding: 0 1rem 1rem; }
    .btn-icon { flex: 1; padding: 0.5rem; border: none; background: #f1f5f9; color: #475569; border-radius: 0.5rem; cursor: pointer; transition: 0.3s; }
    .btn-icon:hover { background: #ef4444; color: white; }

    /* Modal Styles (Custom Class to fix blur issue) */
    .custom-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); z-index: 9998; }
    .custom-modal {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: white; border-radius: 1rem; width: 90%; z-index: 9999;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); max-height: 90vh; overflow-y: auto;
    }
    .form-modal { max-width: 600px; }
    .preview-modal { max-width: 900px; }
    .confirm-modal { max-width: 500px; }

    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #e2e8f0; }
    .modal-body { padding: 1.5rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; padding: 1.5rem; border-top: 1px solid #e2e8f0; }

    .form-group { margin-bottom: 1.5rem; }
    .form-group label { display: block; font-weight: 600; margin-bottom: 0.5rem; }
    .form-group label.required::after { content: ' *'; color: #ef4444; }
    .form-group input, .form-group textarea, .form-group select {
        width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 0.5rem; font-size: 1rem;
    }
    .form-select {
      background-color: white;
      appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: left 1rem center;
      background-size: 1em;
    }

    .thumbnail-preview img { width: 100%; border-radius: 0.5rem; }
    .video-player { position: relative; width: 100%; aspect-ratio: 16/9; margin-bottom: 1rem; }
    .video-player iframe { width: 100%; height: 100%; border-radius: 0.5rem; }

    .btn-secondary { padding: 0.75rem 1.5rem; background: #e2e8f0; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600; color: #475569; }
    .btn-danger { padding: 0.75rem 1.5rem; background: #ef4444; color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; }
    .spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class VideosManagerComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private adminService = inject(AdminService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);

  // Data Signals
  allVideos = signal<Video[]>([]);
  filteredVideos = signal<Video[]>([]);
  categories = signal<VideoCategory[]>([]); // قائمة الفئات
  loading = signal(true);

  // Filters
  searchTerm = '';
  filterCategory: number | null = null;

  // Modal states
  showModal = signal(false);
  isEditMode = signal(false);
  saving = signal(false);

  // Form Data
  formData: Partial<Video> = {
    title: '',
    title_en: '',
    url: '',
     thumbnail: '',
    categorie_id: undefined
  };

  // Preview & Delete
  previewingVideo = signal<Video | null>(null);
  videoToDelete = signal<Video | null>(null);
  deleting = signal(false);

  private editingId: number | null = null;

  async ngOnInit() {
    await Promise.all([this.loadVideos(), this.loadCategories()]);
  }

  async loadCategories() {
    try {
      const cats = await this.supabaseService.getVideoCategories();
      this.categories.set(cats);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }

  async loadVideos() {
    try {
      const videos = await this.supabaseService.getAllVideos();
      const mappedVideos = videos.map(v => ({
        ...v,
        thumbnail: this.getYoutubeThumbnail(v.url)
      }));
      this.allVideos.set(mappedVideos);
      this.filterVideos();
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      this.loading.set(false);
    }
  }

  filterVideos() {
    let result = this.allVideos();
    const term = this.searchTerm.toLowerCase().trim();

    if (term) {
      result = result.filter(v =>
        v.title.toLowerCase().includes(term)
       );
    }

    if (this.filterCategory) {
      result = result.filter(v => v.categorie_id === this.filterCategory);
    }

    this.filteredVideos.set(result);
  }

  // --- YouTube Helpers ---
  extractVideoId(url: string): string {
    const match = url.match(/(?:v=|\/embed\/|\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : '';
  }

  getYoutubeThumbnail(url: string): string {
    const videoId = this.extractVideoId(url);
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
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

  // --- Modal Logic ---
  openAddModal() {
    this.isEditMode.set(false);
    this.editingId = null;
    this.formData = {
      title: '',
      title_en: '',
      url: '',
       thumbnail: '',
      categorie_id: undefined
    };

    setTimeout(() => {
      this.showModal.set(true);
      this.cdr.detectChanges();
    }, 10);
  }

  editVideo(video: Video) {
    this.isEditMode.set(true);
    this.editingId = video.id;
    // نسخ القيم بما فيها categorie_id لتظهر في القائمة المنسدلة
    this.formData = { ...video };

    setTimeout(() => {
      this.showModal.set(true);
      this.cdr.detectChanges();
    }, 10);
  }

  closeModal() {
    this.showModal.set(false);
  }

  async onSubmit() {
    // التحقق من اختيار التصنيف
    if (!this.formData.categorie_id) {
      alert('الرجاء اختيار فئة للفيديو');
      return;
    }

    this.saving.set(true);

    try {
      this.extractThumbnail();

      if (this.isEditMode() && this.editingId) {
        // حذف videos_categories من البيانات المرسلة لأنها ليست عموداً في جدول videos
        const { videos_categories, ...payload } = this.formData as any;
        // هنا يتم إرسال categorie_id المحدث مع الـ payload
        await this.adminService.updateVideo(this.editingId, payload);
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

  // --- Preview & Delete ---
  previewVideo(video: Video) {
    this.previewingVideo.set(video);
    setTimeout(() => this.cdr.detectChanges(), 10);
  }

  closePreview() {
    this.previewingVideo.set(null);
  }

  deleteVideo(video: Video) {
    this.videoToDelete.set(video);
    setTimeout(() => this.cdr.detectChanges(), 10);
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
