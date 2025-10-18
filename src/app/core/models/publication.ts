export interface Publication {
  id: number;
  author: string;
  original_title: string | null;
  published_title: string;
  publisher: string | null;
  read_url: string | null;      // رابط القراءة
  cover_image_url: string | null; // صورة الغلاف
  notes: string | null;
}
