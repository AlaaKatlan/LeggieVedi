export interface SurahName {
  name: string;
  meaning: string;
}

// نموذج جديد للحاشية الخاصة بالاسم
export interface SurahFootnote {
  ref: string;
  note: string;
}

export interface Surah {
  id: number;
  name_ar: string;
  name_en: string;
  name_it: string;
  order_number: number;
  ayah_count: number;
  revelation_place: 'Meccan' | 'Medinan';
  name_en_translation: string;
  other_names: SurahName[] | null;

  // --- الإضافة الجديدة ---
  name_footnotes: SurahFootnote[] | null;
}
