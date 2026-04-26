// FILE: src/app/core/services/supabase.service.ts

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
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

  public getClient(): SupabaseClient {
    return this.supabase;
  }

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

  async getSurahInfo(surahId: number): Promise<Surah | null> {
    const { data, error } = await this.supabase
      .from('surahs')
      .select('*')
      .eq('id', surahId)
      .single();
    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('Error fetching surah info:', error);
      }
      return null;
    }
    return data;
  }

  // ✅ الدالة المصححة — تستعلم من v_ayah_full مثل getFullSurah تماماً
  async getBasmalah(): Promise<AyahFull | null> {
    const { data, error } = await this.supabase
      .from('v_ayah_full')
      .select('*')
      .eq('surah_id', 1)
      .eq('verse_number', 1)
      .single();

    if (error) {
      console.error('Error fetching basmalah:', error);
      return null;
    }
    return data as AyahFull;
  }

  async getLatestArticles(limit: number = 6): Promise<Article[]> {
    const { data, error } = await this.supabase
      .from('articles')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data as Article[];
  }

  async getArticleBySlug(slug: string): Promise<Article | null> {
    const { data, error } = await this.supabase
      .from('articles')
      .select(`*, is_link, article_link`)
      .eq('slug', slug)
      .single();
    if (error) {
      console.error('Error fetching article by slug:', error);
      return null;
    }
    return data as Article;
  }

  async getArtworks(category?: string): Promise<Artwork[]> {
    let query = this.supabase.from('artworks').select('*');
    if (category) {
      query = query.eq('category', category);
    }
    const { data, error } = await query.order('creation_date', { ascending: false });
    if (error) throw error;
    return data as Artwork[];
  }

  async getAchievements(): Promise<Achievement[]> {
    const { data, error } = await this.supabase
      .from('achievements')
      .select('*')
      .order('achievement_date', { ascending: false });
    if (error) throw error;
    return data as Achievement[];
  }

  async getAllVideos(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('videos')
      .select(`*, videos_categories (id, categories_ar, categories_en)`)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching videos:', error);
      throw new Error(error.message);
    }
    return data || [];
  }

  async getVideoCategories(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('videos_categories')
      .select('*')
      .order('id', { ascending: true });
    if (error) {
      console.error('Error fetching video categories:', error);
      throw new Error(error.message);
    }
    return data || [];
  }

  async getAllArticles(category?: string): Promise<Article[]> {
    let query = this.supabase.from('articles').select('*');
    if (category && category !== 'All') {
      query = query.eq('category', category);
    }
    const { data, error } = await query.order('published_at', { ascending: false });
    if (error) {
      console.error('Error fetching all articles:', error);
      throw error;
    }
    return (data as Article[]) || [];
  }

  async getAllPublications(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('publications')
      .select('*')
      .order('id', { ascending: true });
    if (error) {
      console.error('Error fetching publications:', error);
      throw error;
    }
    return data || [];
  }

  async searchInQuran(searchTerm: string, limit: number = 50): Promise<any[]> {
    try {
      const { data: arabicResults, error: arabicError } = await this.supabase
        .from('v_ayah_full')
        .select(`
          ayah_id, surah_id, verse_number, text_uthmani, text_clean,
          primary_tafsir, extra_tafsirs, footnotes,
          surahs!inner (id, name_ar, name_en, name_it, order_number,
            ayah_count, revelation_place, name_en_translation)
        `)
        .ilike('text_clean', `%${searchTerm}%`)
        .limit(limit);
      if (arabicError) throw arabicError;

      const { data: tafsirResults, error: tafsirError } = await this.supabase
        .from('v_ayah_full')
        .select(`
          ayah_id, surah_id, verse_number, text_uthmani, text_clean,
          primary_tafsir, extra_tafsirs, footnotes,
          surahs!inner (id, name_ar, name_en, name_it, order_number,
            ayah_count, revelation_place, name_en_translation)
        `)
        .ilike('primary_tafsir->text', `%${searchTerm}%`)
        .limit(limit);
      if (tafsirError) throw tafsirError;

      const allResults = [...(arabicResults || []), ...(tafsirResults || [])];
      const uniqueResults = Array.from(
        new Map(allResults.map(item => [item.ayah_id, item])).values()
      );

      return uniqueResults
        .sort((a, b) => {
          if (a.surah_id !== b.surah_id) return a.surah_id - b.surah_id;
          return a.verse_number - b.verse_number;
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Error searching in Quran:', error);
      throw error;
    }
  }

  async createVideo(video: { title: string; url: string; description?: string }): Promise<any> {
    const { data, error } = await (this.supabase as any)
      .from('videos').insert(video).select().single();
    if (error) throw error;
    return data;
  }

  async updateVideo(id: number, updates: any): Promise<any> {
    const { data, error } = await (this.supabase as any)
      .from('videos').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async deleteVideo(id: number): Promise<void> {
    const { error } = await (this.supabase as any)
      .from('videos').delete().eq('id', id);
    if (error) throw error;
  }
}
