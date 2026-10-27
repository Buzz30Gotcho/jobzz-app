import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { FaqEntry } from '@jobzz/shared';

/**
 * Charge et parse la FAQ depuis `content/faq.md` (CLAUDE.md §4.10), facile à éditer.
 * Les sections commencent par `## ` (la ligne de titre `# ` est ignorée).
 */
export function parseFaq(markdown: string): FaqEntry[] {
  const entries: FaqEntry[] = [];
  let current: FaqEntry | null = null;

  for (const line of markdown.split('\n')) {
    if (line.startsWith('## ')) {
      if (current) entries.push({ ...current, answer: current.answer.trim() });
      current = { question: line.slice(3).trim(), answer: '' };
    } else if (line.startsWith('# ')) {
      // Titre du document : ignoré.
      continue;
    } else if (current) {
      current.answer += line + '\n';
    }
  }
  if (current) entries.push({ ...current, answer: current.answer.trim() });
  return entries.filter((e) => e.question && e.answer);
}

/** Emplacements candidats du fichier (cwd = apps/api en dev comme en prod). */
const CANDIDATES = [
  resolve(process.cwd(), 'content', 'faq.md'),
  resolve(process.cwd(), '..', '..', 'content', 'faq.md'),
  resolve(__dirname, '..', '..', '..', '..', 'content', 'faq.md'),
];

let cache: FaqEntry[] | null = null;

export function loadFaq(): FaqEntry[] {
  if (cache) return cache;
  const path = CANDIDATES.find((p) => existsSync(p));
  cache = path ? parseFaq(readFileSync(path, 'utf8')) : [];
  return cache;
}
