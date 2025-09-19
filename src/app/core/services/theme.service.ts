import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDarkTheme = signal<boolean>(
    localStorage.getItem('theme') === 'dark'
  );

  constructor() {
    effect(() => {
      const theme = this.isDarkTheme() ? 'dark' : 'light';
      localStorage.setItem('theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    });
  }

  toggleTheme() {
    this.isDarkTheme.update(current => !current);
  }
}
