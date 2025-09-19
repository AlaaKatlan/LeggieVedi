export type Database = {
  public: {
    Tables: {
      surahs: {
        Row: {
          id: number;
          name_ar: string;
          name_en: string;
          name_it: string;
          total_verses: number;
          order_number: number;
        };
        Insert: {
          name_ar: string;
          name_en: string;
          name_it: string;
          total_verses: number;
          order_number: number;
        };
        Update: Partial<{
          name_ar: string;
          name_en: string;
          name_it: string;
          total_verses: number;
          order_number: number;
        }>;
      };
      ayahs: {
        Row: {
          id: number;
          surah_id: number;
          verse_number: number;
          text_uthmani: string;
          text_clean?: string;
        };
        Insert: {
          surah_id: number;
          verse_number: number;
          text_uthmani: string;
          text_clean?: string;
        };
        Update: Partial<{
          surah_id: number;
          verse_number: number;
          text_uthmani: string;
          text_clean?: string;
        }>;
      };
    };
  };
};
