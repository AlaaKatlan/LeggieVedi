export interface Footnote {
  id: number;
  tafsir_type: 'main' | 'extra' | 'translation' | 'uthmani';
  tafsir_id: number | null;
  ref: string | null; // النص المرجعي
  note: string;       // نص الحاشية
  pos: number;        // ترتيب الحاشية
}


// للإدراة: نموذج يطابق الجدول الفعلي
export interface FootnoteDatabase {
  id: number;
  ayah_id: number;
  tafsir_type: string;
  tafsir_id: number | null;
  reference_text: string | null;  // ✅ اسم العمود الفعلي
  note_text: string;              // ✅ اسم العمود الفعلي
  position_index: number | null;  // ✅ اسم العمود الفعلي
}
