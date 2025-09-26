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
  text: string;
  lang: string;
  order: number;
  interpreter: Interpreter | null; // تم استبدال title و source
}
