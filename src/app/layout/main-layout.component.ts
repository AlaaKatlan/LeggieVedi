import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SurahListComponent } from '../features/surah-list/surah-list.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SurahListComponent, CommonModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  // Signal للتحكم في ظهور القائمة الجانبية على الموبايل
  isSidebarOpen = signal(false);
}
