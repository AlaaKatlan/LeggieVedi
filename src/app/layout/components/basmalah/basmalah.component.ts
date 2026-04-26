// FILE: src/app/features/quran/basmalah/basmalah.component.ts

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-basmalah',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="basmalah-container" *ngIf="show">
      <p class="basmalah-arabic">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
      <p class="basmalah-translation">{{ translation }}</p>
    </div>
  `,
  styles: [`
    .basmalah-container {
      text-align: center;
      padding: 24px 16px 8px;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
      margin-bottom: 16px;
    }
    .basmalah-arabic {
      font-size: 2rem;
      font-family: 'Scheherazade New', serif;
      color: var(--text-primary);
      margin: 0 0 8px;
      direction: rtl;
    }
    .basmalah-translation {
      font-size: 0.95rem;
      color: var(--text-secondary, #6b7280);
      font-style: italic;
      margin: 0;
    }
  `]
})
export class BasmalahComponent {
  // سورة التوبة (9) لا تبدأ بالبسملة
  private readonly NO_BASMALAH_SURAH_ID = 9;

  @Input() surahId: number | null = null;

  get show(): boolean {
    return this.surahId !== null && this.surahId !== this.NO_BASMALAH_SURAH_ID;
  }

  get translation(): string {
    return 'Nel nome di Allah, il Compassionevole, il Misericordioso';
  }
}
