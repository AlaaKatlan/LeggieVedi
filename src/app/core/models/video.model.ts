// src/app/core/models/video.model.ts

export interface VideoCategory {
  id: number;
  categories_ar: string;
  categories_en: string;
}

export interface Video {
  id: number;
  title: string;
  title_en?: string;
  url: string;
  categorie_id: number;
  thumbnail?: string;
  created_at: string;
  videos_categories?: VideoCategory; // العلاقة مع جدول videos_categories
}

// ===== في ملف supabase.service.ts، أضف/عدّل هذه الدوال =====

// داخل class SupabaseService:

/**
 * جلب جميع الفيديوهات مع معلومات الفئات
 */
