import { Tafsir, ExtraTafsir } from './tafsir.model';
import { Footnote } from './footnote.model';

export interface AyahFull {
  ayah_id: number;
  surah_id: number;
  verse_number: number;
  text_uthmani: string;
  text_clean: string;
  primary_tafsir: Tafsir | null;
  extra_tafsirs: ExtraTafsir[];
  footnotes: Footnote[];
}
