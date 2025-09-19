export interface Footnote {
  id: number;
  tafsir_type: 'main' | 'extra' | 'translation' | 'uthmani';
  tafsir_id: number | null;
  ref: string | null; // النص المرجعي
  note: string;       // نص الحاشية
  pos: number;        // ترتيب الحاشية
}
