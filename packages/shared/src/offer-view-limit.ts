/**
 * Limite des offres vues par jour (gratuit) — CLAUDE.md §2, §4.5. Fonction pure, testée.
 *
 * Chaque offre ne compte qu'une fois par jour (table `OfferView`). Au-delà de la limite, les offres
 * suivantes sont **floutées** (rang + score seulement), jamais cachées en silence. On renvoie aussi
 * le **vrai nombre** d'offres encore pertinentes (« 13 autres te correspondent »).
 */
export interface ViewLimitResult<T extends { id: string }> {
  offers: (T & { locked: boolean })[];
  /** Identifiants nouvellement vus (à enregistrer dans OfferView). */
  newlyViewedIds: string[];
  /** Offres vues aujourd'hui après cet appel (0..limite). */
  viewedCount: number;
  /** Offres pertinentes restées floutées (le « vrai nombre » à annoncer). */
  remainingMatches: number;
}

export function applyDailyViewLimit<T extends { id: string }>(
  offers: T[],
  alreadyViewedIds: Set<string>,
  limit: number | null,
): ViewLimitResult<T> {
  // Illimité (Premium ou PLAN_ENFORCEMENT=false) : rien n'est flouté.
  if (limit === null) {
    const newlyViewedIds = offers.map((o) => o.id).filter((id) => !alreadyViewedIds.has(id));
    return {
      offers: offers.map((o) => ({ ...o, locked: false })),
      newlyViewedIds,
      viewedCount: alreadyViewedIds.size + newlyViewedIds.length,
      remainingMatches: 0,
    };
  }

  let quota = Math.max(0, limit - alreadyViewedIds.size);
  const newlyViewedIds: string[] = [];
  let lockedCount = 0;

  const result = offers.map((o) => {
    if (alreadyViewedIds.has(o.id)) {
      return { ...o, locked: false }; // déjà vue aujourd'hui : reste lisible, ne consomme rien
    }
    if (quota > 0) {
      quota -= 1;
      newlyViewedIds.push(o.id);
      return { ...o, locked: false };
    }
    lockedCount += 1;
    return { ...o, locked: true };
  });

  return {
    offers: result,
    newlyViewedIds,
    viewedCount: Math.min(limit, alreadyViewedIds.size + newlyViewedIds.length),
    remainingMatches: lockedCount,
  };
}
