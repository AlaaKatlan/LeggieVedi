import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SurahListComponent } from '../surah-list/surah-list.component'; // تأكد من أن المسار صحيح
import { WordViewerComponent } from '../../../layout/components/word-viewer/word-viewer.component';
import { filter } from 'rxjs';

@Component({
  selector: 'app-quran-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SurahListComponent, WordViewerComponent],
  templateUrl: './quran-layout.component.html',
  styleUrls: ['./quran-layout.component.scss']
})
export class QuranLayoutComponent {
  isSidebarOpen = signal(false);
  currentComponent = signal<'reader' | 'word'>('reader');
  wordFilePath = signal<string>('Dedica');
  router = inject(Router);
  showWord(path: string) {
    this.wordFilePath.set(path);
    this.currentComponent.set('word');
  }
  // أضف هذا الـ constructor
  constructor() {
    this.router.events.pipe(
      // فلترة الأحداث لتشمل NavigationEnd فقط
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // إذا كان الرابط الجديد يحتوي على "surah"، أعد العرض إلى القارئ
      if (event.url.includes('/quran/surah')) {
        this.showReader();
      }
    });

      // عند التحميل الأول، افتح Dedica افتراضيًا
    if (this.router.url === '/quran' || this.router.url === '/quran/') {
      setTimeout(() => this.showWord('Dedica'), 0);
    }
  }
  showReader() {
    this.currentComponent.set('reader');
  }
}
