// يمثل كائن التفسير الأساسي
export interface Tafsir {
  id: number;
  tafsir_text: string;
  language_code: string;
}

// يمثل كائن التفسير الإضافي داخل مصفوفة التفاسير
export interface ExtraTafsir {
  id: number;
  title: string;
  text: string;
  source: string | null;
  lang: string;
  order: number;
}
