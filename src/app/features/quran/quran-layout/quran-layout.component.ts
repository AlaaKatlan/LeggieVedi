import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SurahListComponent } from '../surah-list/surah-list.component'; // تأكد من أن المسار صحيح
import { WordViewerComponent } from '../../../layout/components/word-viewer/word-viewer.component';

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

  showWord(path: string) {
    this.wordFilePath.set(path);
    this.currentComponent.set('word');
  }

  showReader() {
    this.currentComponent.set('reader');
  }
}
