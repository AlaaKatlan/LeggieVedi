export interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  cover_image_url?: string;
  published_at: string; // ISO date string
}
