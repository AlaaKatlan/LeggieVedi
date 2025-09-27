// src/app/core/services/quran-bookmark.service.ts

import { Injectable, signal, effect, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class QuranBookmarkService {
  private readonly STORAGE_KEY = 'quranAppBookmarks';

  // Signal لتخزين أرقام ID الآيات المحفوظة
  public bookmarks = signal<number[]>(this.loadFromStorage());

  constructor() {
    // Effect لحفظ أي تغيير في المفضلة تلقائيًا في LocalStorage
    effect(() => {
      this.saveToStorage(this.bookmarks());
    });
  }

  // دالة لإضافة آية إلى المفضلة
  addBookmark(ayahId: number): void {
    this.bookmarks.update(ids => [...ids, ayahId]);
  }

  // دالة لحذف آية من المفضلة
  removeBookmark(ayahId: number): void {
    this.bookmarks.update(ids => ids.filter(id => id !== ayahId));
  }

  // دالة للتبديل بين الإضافة والحذف
  toggleBookmark(ayahId: number): void {
    if (this.isBookmarked(ayahId)) {
      this.removeBookmark(ayahId);
    } else {
      this.addBookmark(ayahId);
    }
  }

  // دالة لمعرفة ما إذا كانت آية معينة في المفضلة أم لا
  isBookmarked(ayahId: number): boolean {
    return this.bookmarks().includes(ayahId);
  }

  // دوال خاصة بالتعامل مع LocalStorage
  private loadFromStorage(): number[] {
    const storedBookmarks = localStorage.getItem(this.STORAGE_KEY);
    return storedBookmarks ? JSON.parse(storedBookmarks) : [];
  }

  private saveToStorage(bookmarkIds: number[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bookmarkIds));
  }
}
