// src/app/features/admin/quran-manager/quran-manager.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Surah } from '../../../core/models/surah.model';

interface QuranStats {
  totalSurahs: number;
  totalAyahs: number;
  totalTafsirs: number;
  totalFootnotes: number;
}

@Component({
  selector: 'app-quran-manager',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="quran-manager">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>إدارة القرآن الكريم</h1>
          <p class="subtitle">إدارة السور، الآيات، التفاسير والحواشي</p>
        </div>
      </div>

      <!-- Statistics Cards -->
      @if (!loading()) {
        <div class="stats-grid">
          <div class="stat-card primary">
            <div class="stat-icon">
              <i class="fas fa-book-quran"></i>
            </div>
            <div class="stat-info">
              <h3>السور</h3>
              <p class="stat-number">{{ stats().totalSurahs }}</p>
            </div>
          </div>

          <div class="stat-card success">
            <div class="stat-icon">
              <i class="fas fa-align-right"></i>
            </div>
            <div class="stat-info">
              <h3>الآيات</h3>
              <p class="stat-number">{{ stats().totalAyahs }}</p>
            </div>
          </div>

          <div class="stat-card warning">
            <div class="stat-icon">
              <i class="fas fa-comments"></i>
            </div>
            <div class="stat-info">
              <h3>التفاسير</h3>
              <p class="stat-number">{{ stats().totalTafsirs }}</p>
            </div>
          </div>

          <div class="stat-card info">
            <div class="stat-icon">
              <i class="fas fa-sticky-note"></i>
            </div>
            <div class="stat-info">
              <h3>الحواشي</h3>
              <p class="stat-number">{{ stats().totalFootnotes }}</p>
            </div>
          </div>
        </div>
      }

      <!-- Main Sections -->
      <div class="sections-grid">
        <!-- Surahs Section -->
        <div class="section-card" [routerLink]="['surahs']">
          <div class="section-header">
            <i class="fas fa-book-quran"></i>
            <h2>إدارة السور</h2>
          </div>
          <p>تعديل معلومات السور، الأسماء، والترجمات</p>
          <div class="section-actions">
            <span class="action-link">
              إدارة السور →
            </span>
          </div>
        </div>

        <!-- Ayahs Section -->
        <div class="section-card" [routerLink]="['ayahs']">
          <div class="section-header">
            <i class="fas fa-align-right"></i>
            <h2>إدارة الآيات</h2>
          </div>
          <p>تعديل نص الآيات والترجمات</p>
          <div class="section-actions">
            <span class="action-link">
              إدارة الآيات →
            </span>
          </div>
        </div>

        <!-- Tafsirs Section -->
        <div class="section-card" [routerLink]="['tafsirs']">
          <div class="section-header">
            <i class="fas fa-comments"></i>
            <h2>إدارة التفاسير</h2>
          </div>
          <p>إضافة وتعديل التفاسير الرئيسية والإضافية</p>
          <div class="section-actions">
            <span class="action-link">
              إدارة التفاسير →
            </span>
          </div>
        </div>

        <!-- Footnotes Section -->
        <div class="section-card" [routerLink]="['footnotes']">
          <div class="section-header">
            <i class="fas fa-sticky-note"></i>
            <h2>إدارة الحواشي</h2>
          </div>
          <p>إضافة وتعديل الحواشي التوضيحية</p>
          <div class="section-actions">
            <span class="action-link">
              إدارة الحواشي →
            </span>
          </div>
        </div>

        <!-- Interpreters Section -->
        <div class="section-card" [routerLink]="['interpreters']">
          <div class="section-header">
            <i class="fas fa-user-graduate"></i>
            <h2>إدارة المفسرين</h2>
          </div>
          <p>إضافة وتعديل بيانات المفسرين</p>
          <div class="section-actions">
            <span class="action-link">
              إدارة المفسرين →
            </span>
          </div>
        </div>

        <!-- Quick Navigation -->
        <div class="section-card quick-nav">
          <div class="section-header">
            <i class="fas fa-search"></i>
            <h2>بحث سريع</h2>
          </div>
          <div class="quick-search">
            <input
              type="text"
              placeholder="ابحث عن سورة أو آية..."
              [(ngModel)]="searchQuery"
              (input)="onSearch()"
              class="search-input"
            />
            @if (searchResults().length > 0) {
              <div class="search-results">
                @for (surah of searchResults(); track surah.id) {
                  <a
                    [routerLink]="['ayahs']"
                    [queryParams]="{surah: surah.id}"
                    class="search-result-item">
                    <span class="surah-number">{{ surah.order_number }}</span>
                    <span class="surah-name">{{ surah.name_ar }}</span>
                  </a>
                }
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="recent-activity">
        <h2>آخر التعديلات</h2>
        <div class="activity-list">
          <div class="activity-item">
            <i class="fas fa-edit activity-icon"></i>
            <div class="activity-details">
              <p>تم تحديث تفسير سورة الفاتحة</p>
              <span class="activity-time">منذ ساعتين</span>
            </div>
          </div>
          <div class="activity-item">
            <i class="fas fa-plus activity-icon"></i>
            <div class="activity-details">
              <p>تمت إضافة حاشية جديدة</p>
              <span class="activity-time">منذ 5 ساعات</span>
            </div>
          </div>
          <div class="activity-item">
            <i class="fas fa-sync activity-icon"></i>
            <div class="activity-details">
              <p>تم تحديث معلومات السورة</p>
              <span class="activity-time">أمس</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .quran-manager {
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 3rem;

      h1 {
        font-size: 2.5rem;
        color: #0f172a;
        margin: 0 0 0.5rem 0;
        font-weight: 800;
      }

      .subtitle {
        color: #64748b;
        font-size: 1.1rem;
        margin: 0;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .stat-card {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      }

      &.primary { border-left: 4px solid #01579b; }
      &.success { border-left: 4px solid #10b981; }
      &.warning { border-left: 4px solid #f59e0b; }
      &.info { border-left: 4px solid #8b5cf6; }
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;

      .primary & {
        background: linear-gradient(135deg, #01579b, #0288d1);
        color: white;
      }

      .success & {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
      }

      .warning & {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
      }

      .info & {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        color: white;
      }
    }

    .stat-info {
      h3 {
        margin: 0 0 0.5rem 0;
        color: #64748b;
        font-size: 0.95rem;
        font-weight: 600;
      }

      .stat-number {
        margin: 0;
        font-size: 2rem;
        font-weight: 800;
        color: #0f172a;
      }
    }

    .sections-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .section-card {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      cursor: pointer;
      border: 2px solid transparent;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
        border-color: #01579b;
      }

      &.quick-nav {
        cursor: default;

        &:hover {
          transform: none;
          border-color: transparent;
        }
      }
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;

      i {
        font-size: 2rem;
        color: #01579b;
      }

      h2 {
        margin: 0;
        font-size: 1.5rem;
        color: #0f172a;
        font-weight: 700;
      }
    }

    .section-card > p {
      color: #64748b;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }

    .section-actions {
      display: flex;
      justify-content: flex-end;
    }

    .action-link {
      color: #01579b;
      font-weight: 600;
      transition: all 0.3s ease;

      &:hover {
        transform: translateX(-5px);
      }
    }

    .quick-search {
      position: relative;
    }

    .search-input {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 1rem;
      transition: all 0.3s ease;

      &:focus {
        outline: none;
        border-color: #01579b;
        box-shadow: 0 0 0 3px rgba(1, 87, 155, 0.1);
      }
    }

    .search-results {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 0.5rem;
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      max-height: 300px;
      overflow-y: auto;
      z-index: 10;
    }

    .search-result-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      text-decoration: none;
      color: inherit;
      transition: background 0.2s ease;

      &:hover {
        background: #f8fafc;
      }

      .surah-number {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #01579b;
        color: white;
        border-radius: 50%;
        font-weight: 700;
        font-size: 0.9rem;
        flex-shrink: 0;
      }

      .surah-name {
        font-family: 'Amiri Quran', serif;
        font-size: 1.25rem;
        color: #0f172a;
      }
    }

    .recent-activity {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

      h2 {
        margin: 0 0 1.5rem 0;
        font-size: 1.5rem;
        color: #0f172a;
      }
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      border-right: 3px solid #01579b;
    }

    .activity-icon {
      color: #01579b;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .activity-details {
      flex: 1;

      p {
        margin: 0 0 0.25rem 0;
        color: #334155;
        font-weight: 500;
      }

      .activity-time {
        font-size: 0.85rem;
        color: #94a3b8;
      }
    }

    @media (max-width: 768px) {
      .stats-grid,
      .sections-grid {
        grid-template-columns: 1fr;
      }

      .page-header h1 {
        font-size: 2rem;
      }
    }
  `]
})
export class QuranManagerComponent implements OnInit {
  private supabaseService = inject(SupabaseService);

  loading = signal(true);
  stats = signal<QuranStats>({
    totalSurahs: 114,
    totalAyahs: 6236,
    totalTafsirs: 0,
    totalFootnotes: 0
  });

  allSurahs = signal<Surah[]>([]);
  searchQuery = '';
  searchResults = signal<Surah[]>([]);

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      const surahs = await this.supabaseService.getAllSurahs();
      this.allSurahs.set(surahs);

      // حساب الإحصائيات
      const totalAyahs = surahs.reduce((sum, s) => sum + s.ayah_count, 0);

      this.stats.update(s => ({
        ...s,
        totalSurahs: surahs.length,
        totalAyahs
      }));
    } catch (error) {
      console.error('Failed to load Quran data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onSearch() {
    const query = this.searchQuery.toLowerCase().trim();

    if (!query) {
      this.searchResults.set([]);
      return;
    }

    const filtered = this.allSurahs().filter(s =>
      s.name_ar.includes(query) ||
      s.name_en.toLowerCase().includes(query) ||
      s.name_it.toLowerCase().includes(query) ||
      s.order_number.toString() === query
    );

    this.searchResults.set(filtered.slice(0, 5));
  }
}
