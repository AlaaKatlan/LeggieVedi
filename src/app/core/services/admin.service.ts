// src/app/core/services/admin.service.ts
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Article } from '../models/article.model';
import { Artwork } from '../models/artwork.model';
import { Publication } from '../models/publication';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private supabase = inject(SupabaseService);

  // ==================== ARTICLES ====================

  async createArticle(article: Partial<Article>): Promise<Article> {
    const { data, error } = await (this.supabase as any).supabase
      .from('articles')
      .insert(article)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateArticle(id: number, updates: Partial<Article>): Promise<Article> {
    const { data, error } = await (this.supabase as any).supabase
      .from('articles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteArticle(id: number): Promise<void> {
    const { error } = await (this.supabase as any).supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ==================== ARTWORKS ====================

  async createArtwork(artwork: Partial<Artwork>): Promise<Artwork> {
    const { data, error } = await (this.supabase as any).supabase
      .from('artworks')
      .insert(artwork)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateArtwork(id: number, updates: Partial<Artwork>): Promise<Artwork> {
    const { data, error } = await (this.supabase as any).supabase
      .from('artworks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteArtwork(id: number): Promise<void> {
    const { error } = await (this.supabase as any).supabase
      .from('artworks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ==================== VIDEOS ====================

  async createVideo(video: { title: string; url: string; description?: string }): Promise<any> {
    const { data, error } = await (this.supabase as any).supabase
      .from('videos')
      .insert(video)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateVideo(id: number, updates: any): Promise<any> {
    const { data, error } = await (this.supabase as any).supabase
      .from('videos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteVideo(id: number): Promise<void> {
    const { error } = await (this.supabase as any).supabase
      .from('videos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ==================== PUBLICATIONS ====================

  async createPublication(pub: Partial<Publication>): Promise<Publication> {
    const { data, error } = await (this.supabase as any).supabase
      .from('publications')
      .insert(pub)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePublication(id: number, updates: Partial<Publication>): Promise<Publication> {
    const { data, error } = await (this.supabase as any).supabase
      .from('publications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deletePublication(id: number): Promise<void> {
    const { error } = await (this.supabase as any).supabase
      .from('publications')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ==================== FILE UPLOAD ====================

  async uploadImage(file: File, bucket: string = 'images'): Promise<string> {
    const fileName = `${Date.now()}_${file.name}`;

    const { data, error } = await (this.supabase as any).supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) throw error;

    // الحصول على رابط عام
    const { data: urlData } = (this.supabase as any).supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  // ==================== STATISTICS ====================

  async getDashboardStats(): Promise<{
    articlesCount: number;
    artworksCount: number;
    videosCount: number;
    publicationsCount: number;
  }> {
    const [articles, artworks, videos, pubs] = await Promise.all([
      this.supabase.getAllArticles(),
      this.supabase.getArtworks(),
      this.supabase.getAllVideos(),
      this.supabase.getAllPublications()
    ]);

    return {
      articlesCount: articles.length,
      artworksCount: artworks.length,
      videosCount: videos.length,
      publicationsCount: pubs.length
    };
  }
}
