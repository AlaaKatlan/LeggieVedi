// // يمثل كائن التفسير الأساسي
// export interface Tafsir {
//   id: number;
//   tafsir_text: string;
//   language_code: string;
// }

// // يمثل كائن التفسير الإضافي داخل مصفوفة التفاسير
// export interface ExtraTafsir {
//   id: number;
//   title: string;
//   text: string;
//   source: string | null;
//   lang: string;
//   order: number;
// }

import { Interpreter } from './interpreter.model';

// يمثل كائن التفسير الأساسي
export interface Tafsir {
  id: number;
  text: string;         // تم تغيير الاسم من tafsir_text
  lang: string;         // تم تغيير الاسم من language_code
  interpreter: Interpreter | null;
}

// يمثل كائن التفسير الإضافي
export interface ExtraTafsir {
 id: number;
  text: string;              // من JSONB في View
  lang: string;              // من JSONB في View
  order: number;
  interpreter: Interpreter | null;
}
// للإدراة: نموذج يطابق الجداول الفعلية
export interface TafsirDatabase {
  id: number;
  ayah_id: number;
  tafsir_text: string;       // ✅ اسم العمود الفعلي
  language_code: string;     // ✅ اسم العمود الفعلي
  interpreter_id: number | null;
}

export interface ExtraTafsirDatabase {
  id: number;
  ayah_id: number;
  tafsir_text: string;       // ✅ اسم العمود الفعلي
  language_code: string;     // ✅ اسم العمود الفعلي
  source_name: string | null;
  display_order: number;
  interpreter_id: number | null;
}
