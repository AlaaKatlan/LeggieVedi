// export interface Article {
//   id: number;
//   title: string;
//   slug: string;
//   content: string;
//   cover_image_url?: string;
//   published_at: string; // ISO date string
// }


export interface Article {
  id: number;
  title: string;
  slug: string;
  content?: string;
  cover_image_url?: string;
  published_at: string;
  // إضافة الكاتب
  author: {
    display_name_it: string;
  } | null;
}
