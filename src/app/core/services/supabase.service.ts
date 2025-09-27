import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Surah } from '../models/surah.model';
import { AyahFull } from '../models/ayah.model';
import { Achievement } from '../models/achievement.model';
import { Article } from '../models/article.model';
import { Artwork } from '../models/artwork.model';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    // تأكد من أن ملف البيئة يحتوي على مفاتيح Supabase الخاصة بك
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

  /**
   * جلب قائمة بكل السور
   */
  async getAllSurahs(): Promise<Surah[]> {
    const { data, error } = await this.supabase
      .from('surahs')
      .select('*')
      .order('order_number', { ascending: true });
    if (error) {
        console.error('Error fetching surahs:', error);
        throw new Error(error.message);
    }
    return data || [];
  }

  /**
   * جلب كل آيات سورة معينة مع التفاسير والحواشي
   * (يستعلم من v_ayah_full)
   */
  async getFullSurah(surahId: number): Promise<AyahFull[]> {
    const { data, error } = await this.supabase
      .from('v_ayah_full')
      .select('*')
      .eq('surah_id', surahId)
      .order('verse_number', { ascending: true });
    if (error) {
        console.error('Error fetching full surah:', error);
        throw new Error(error.message);
    }
    return data || [];
  }

  /**
   * جلب المعلومات الكاملة لسورة واحدة فقط (مثل الاسم، عدد الآيات، إلخ)
   * (هذه هي الدالة التي كانت مفقودة)
   */
  async getSurahInfo(surahId: number): Promise<Surah | null> {
    const { data, error } = await this.supabase
      .from('surahs')
      .select('*')
      .eq('id', surahId)
      .single(); // .single() لجلب نتيجة واحدة فقط أو null

    if (error) {
      // لا نعتبر "عدم العثور على نتيجة" خطأً يوقف التطبيق
      if (error.code !== 'PGRST116') {
        console.error('Error fetching surah info:', error);
      }
      return null;
    }
    return data;
  }
  /**
   * Fetches the most recent articles.
   */
  async getLatestArticles(limit: number = 6): Promise<Article[]> {
    const { data, error } = await this.supabase
      .from('articles')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data as Article[];
  }

  /**
   * Fetches a single article by its unique slug.
   * This is the function that was missing.
   */
  async getArticleBySlug(slug: string): Promise<Article | null> {
    const { data, error } = await this.supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .single(); // Use .single() to get one record or null
    if (error && error.code !== 'PGRST116') {
      console.error(`Error fetching article with slug ${slug}:`, error);
    }
    return data;
  }

  /**
   * Fetches artworks, optionally filtering by category.
   */
  async getArtworks(category?: string): Promise<Artwork[]> {
    let query = this.supabase.from('artworks').select('*');
    if (category) {
      query = query.eq('category', category);
    }
    const { data, error } = await query.order('creation_date', { ascending: false });
    if (error) throw error;
    return data as Artwork[];
  }

  /**
   * Fetches all achievements for the timeline.
   */
  async getAchievements(): Promise<Achievement[]> {
    const { data, error } = await this.supabase
      .from('achievements')
      .select('*')
      .order('achievement_date', { ascending: false });
    if (error) throw error;
    return data as Achievement[];
  }
}
