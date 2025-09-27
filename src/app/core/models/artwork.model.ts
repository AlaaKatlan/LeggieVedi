export interface Artwork {
  id: number;
  title: string;
  description?: string;
  image_url: string;
  category?: string;
  creation_date?: string; // ISO date string
}
