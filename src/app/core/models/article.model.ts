// export interface Article {
//   id: number;
//   title: string;
//   slug: string;
//   content: string;
//   cover_image_url?: string;
//   published_at: string; // ISO date string
// }


// export interface Article {
//   category: string;
//   id: number;
//   title: string;
//   slug: string;
//   content?: string;
//   cover_image_url?: string;
//   published_at: string;
//   // إضافة الكاتب
//   author: {
//     display_name_it: string;
//   } | null;
// }
export interface Article {
  id: number;
  title: string;
  content: string;
  excerpt?: string;      // مقتطف (اختياري)
  category: string;     // نصوص، مقالات، وجدانيات
  published_at: string; // تاريخ النشر
  slug: string;           // الرابط الفريد
  cover_image_url?: string; // صورة غلاف (اختياري)
  created_at: string;
  is_link: boolean;     // The boolean flag you added
  article_link?: string; // The URL to the published file
}
