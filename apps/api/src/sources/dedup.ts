import type { NormalizedOffer } from '@jobzz/shared';
import { normalizeKey } from '../common/normalize';

/**
 * Dédoublonnage entre sources (CLAUDE.md §4.4) : même SIRET + titre proche, ou même entreprise
 * normalisée + titre + commune. On garde la première occurrence. Fonction pure (testée).
 */
export function dedupeOffers(offers: NormalizedOffer[]): NormalizedOffer[] {
  const seen = new Set<string>();
  const result: NormalizedOffer[] = [];
  for (const offer of offers) {
    const titleKey = normalizeKey(offer.title);
    const key = offer.siret
      ? `siret:${offer.siret}|${titleKey}`
      : `name:${normalizeKey(offer.companyName ?? '')}|${titleKey}|${offer.communeCode ?? offer.locationLabel ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(offer);
  }
  return result;
}
