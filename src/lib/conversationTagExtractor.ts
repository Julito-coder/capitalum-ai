/**
 * Extracteur automatique de tags fiscaux à partir du contenu des conversations.
 * Scanne les messages pour détecter des mots-clés fiscaux et retourne des tags uniques.
 */

// Dictionnaire de mots-clés fiscaux avec mapping vers les IDs du glossaire
const FISCAL_KEYWORDS: { keyword: RegExp; tag: string; glossaryTermId?: string }[] = [
  { keyword: /\btmi\b/i, tag: 'TMI', glossaryTermId: 'tmi' },
  { keyword: /\bimpôt sur le revenu\b|\b(?:ir)\b/i, tag: 'IR', glossaryTermId: 'ir' },
  { keyword: /\bper\b/i, tag: 'PER', glossaryTermId: 'per' },
  { keyword: /\bpea\b/i, tag: 'PEA', glossaryTermId: 'pea' },
  { keyword: /\burssaf\b/i, tag: 'URSSAF', glossaryTermId: 'urssaf' },
  { keyword: /\bmicro[- ]entreprise\b|\bauto[- ]entrepreneur\b/i, tag: 'Micro-entreprise', glossaryTermId: 'micro-entreprise' },
  { keyword: /\btva\b/i, tag: 'TVA', glossaryTermId: 'tva' },
  { keyword: /\bcfe\b/i, tag: 'CFE', glossaryTermId: 'cfe' },
  { keyword: /\bscpi\b/i, tag: 'SCPI', glossaryTermId: 'scpi' },
  { keyword: /\bassurance[- ]vie\b/i, tag: 'Assurance-vie', glossaryTermId: 'assurance-vie' },
  { keyword: /\bdéficit foncier\b/i, tag: 'Déficit foncier' },
  { keyword: /\bplus[- ]value[s]?\b/i, tag: 'Plus-value' },
  { keyword: /\bcrypto\b/i, tag: 'Crypto' },
  { keyword: /\b2042\b/i, tag: '2042', glossaryTermId: 'declaration-2042' },
  { keyword: /\b2044\b/i, tag: '2044', glossaryTermId: 'declaration-2044' },
  { keyword: /\b2086\b/i, tag: '2086' },
  { keyword: /\beurl\b/i, tag: 'EURL', glossaryTermId: 'eurl' },
  { keyword: /\bsasu\b/i, tag: 'SASU', glossaryTermId: 'sasu' },
  { keyword: /\bsas\b/i, tag: 'SAS' },
  { keyword: /\bsarl\b/i, tag: 'SARL' },
  { keyword: /\bimpôt sur les sociétés\b|\b(?:is)\b/i, tag: 'IS', glossaryTermId: 'is' },
  { keyword: /\bprélèvement à la source\b|\bpas\b/i, tag: 'PAS', glossaryTermId: 'pas' },
  { keyword: /\bquotient familial\b/i, tag: 'Quotient familial', glossaryTermId: 'quotient-familial' },
  { keyword: /\bfrais réels\b/i, tag: 'Frais réels', glossaryTermId: 'frais-reels' },
  { keyword: /\brevenus fonciers\b/i, tag: 'Revenus fonciers' },
  { keyword: /\blmnp\b/i, tag: 'LMNP' },
  { keyword: /\bpinel\b/i, tag: 'Pinel' },
  { keyword: /\bdenormandie\b/i, tag: 'Denormandie' },
  { keyword: /\bcsg\b/i, tag: 'CSG' },
  { keyword: /\bcrds\b/i, tag: 'CRDS' },
  { keyword: /\bifi\b/i, tag: 'IFI' },
  { keyword: /\bflat tax\b|\bpfu\b/i, tag: 'PFU' },
  { keyword: /\bréduction d'impôt\b|\bcrédit d'impôt\b/i, tag: 'Réductions/Crédits' },
  { keyword: /\bépargne salariale\b|\bpee\b|\bperco\b/i, tag: 'Épargne salariale' },
  { keyword: /\btrésorerie\b/i, tag: 'Trésorerie' },
  { keyword: /\bversement libératoire\b/i, tag: 'Versement libératoire', glossaryTermId: 'versement-liberatoire' },
];

interface MessageInput {
  role: string;
  content: string;
}

/**
 * Extrait les tags fiscaux uniques à partir d'un tableau de messages.
 */
export function extractFiscalTags(messages: MessageInput[]): string[] {
  const allContent = messages.map(m => m.content).join(' ');
  const foundTags = new Set<string>();

  for (const { keyword, tag } of FISCAL_KEYWORDS) {
    if (keyword.test(allContent)) {
      foundTags.add(tag);
    }
  }

  return Array.from(foundTags);
}

/**
 * Retourne les IDs de termes du glossaire liés aux tags détectés.
 */
export function getGlossaryTermIdsFromTags(tags: string[]): string[] {
  const termIds: string[] = [];
  for (const { tag, glossaryTermId } of FISCAL_KEYWORDS) {
    if (glossaryTermId && tags.includes(tag)) {
      termIds.push(glossaryTermId);
    }
  }
  return [...new Set(termIds)];
}
