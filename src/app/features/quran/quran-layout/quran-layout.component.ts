import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SurahListComponent } from '../surah-list/surah-list.component'; // تأكد من أن المسار صحيح

@Component({
  selector: 'app-quran-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SurahListComponent],
  templateUrl: './quran-layout.component.html',
  styleUrls: ['./quran-layout.component.scss']
})
export class QuranLayoutComponent {
  isSidebarOpen = signal(false);
}
