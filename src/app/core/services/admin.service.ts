// src/app/core/services/admin.service.ts
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Article } from '../models/article.model';
import { Artwork } from '../models/artwork.model';
import { Publication } from '../models/publication';

@Injectable({ providedIn: 'root' })
export class AdminService {
  // تم تغيير الاسم إلى supabaseService للتوضيح أنه الخدمة وليس العميل مباشرة
  private supabaseService = inject(SupabaseService);

  // ==================== ARTICLES ====================

  async createArticle(article: Partial<Article>): Promise<Article> {
    const { data, error } = await this.supabaseService.getClient()
      .from('articles')
      .insert(article)
      .select()
      .single();

    if (error) throw error;
    return data as Article;
  }

  async updateArticle(id: number, updates: Partial<Article>): Promise<Article> {
    const { data, error } = await this.supabaseService.getClient()
      .from('articles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Article;
  }

  async deleteArticle(id: number): Promise<void> {
    const { error } = await this.supabaseService.getClient()
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ==================== ARTWORKS ====================

  async createArtwork(artwork: Partial<Artwork>): Promise<Artwork> {
    const { data, error } = await this.supabaseService.getClient()
      .from('artworks')
      .insert(artwork)
      .select()
      .single();

    if (error) throw error;
    return data as Artwork;
  }

  async updateArtwork(id: number, updates: Partial<Artwork>): Promise<Artwork> {
    const { data, error } = await this.supabaseService.getClient()
      .from('artworks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Artwork;
  }

  async deleteArtwork(id: number): Promise<void> {
    const { error } = await this.supabaseService.getClient()
      .from('artworks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ==================== VIDEOS ====================

  async createVideo(video: { title: string; url: string; description?: string }): Promise<any> {
    const { data, error } = await this.supabaseService.getClient()
      .from('videos')
      .insert(video)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateVideo(id: number, updates: any): Promise<any> {
    const { data, error } = await this.supabaseService.getClient()
      .from('videos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteVideo(id: number): Promise<void> {
    const { error } = await this.supabaseService.getClient()
      .from('videos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ==================== PUBLICATIONS ====================

  async createPublication(pub: Partial<Publication>): Promise<Publication> {
    const { data, error } = await this.supabaseService.getClient()
      .from('publications')
      .insert(pub)
      .select()
      .single();

    if (error) throw error;
    return data as Publication;
  }

  async updatePublication(id: number, updates: Partial<Publication>): Promise<Publication> {
    const { data, error } = await this.supabaseService.getClient()
      .from('publications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Publication;
  }

  async deletePublication(id: number): Promise<void> {
    const { error } = await this.supabaseService.getClient()
      .from('publications')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ==================== FILE UPLOAD ====================

  async uploadImage(file: File, bucket: string = 'images'): Promise<string> {
    const fileName = `${Date.now()}_${file.name}`;
    const client = this.supabaseService.getClient();

    const { data, error } = await client.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) throw error;

    // الحصول على رابط عام
    const { data: urlData } = client.storage
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
      this.supabaseService.getAllArticles(),
      this.supabaseService.getArtworks(),
      this.supabaseService.getAllVideos(),
      this.supabaseService.getAllPublications()
    ]);

    return {
      articlesCount: articles.length,
      artworksCount: artworks.length,
      videosCount: videos.length,
      publicationsCount: pubs.length
    };
  }
}
