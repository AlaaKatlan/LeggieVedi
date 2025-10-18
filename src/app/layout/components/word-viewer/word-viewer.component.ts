import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as mammoth from 'mammoth';

@Component({
  selector: 'app-word-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './word-viewer.component.html',
})
export class WordViewerComponent implements OnChanges {
 @Input() path!: string;

  wordHtmlContent: string | null = null;
  loading = true;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['path'] && this.path) {
      this.loading = true;
      console.log('📄 Path received:', this.path);

      // مثال: حمّل ملف الـ Word أو HTML حسب القيمة
      this.loadWordFile(this.path);
    }
  }

  loadWordFile(path: string) {
    // مثال بسيط
    setTimeout(() => {
      this.wordHtmlContent = `<h2>${path} content loaded!</h2>`;
      this.loading = false;
    }, 500);
  }
}
