// Pré-classification de l'intent du message utilisateur.
// Trois catégories :
//   - PERSONAL    : la question parle de la situation perso de l'user (mon/ma/mes/je + verbe financier)
//   - FACTUAL_PURE: question factuelle pure (date, formulaire, bio, actu) — pas de personnalisation forcée
//   - CONCEPTUAL  : explication d'un concept fiscal/financier — personnalisation conditionnelle

export type Intent = 'PERSONAL' | 'FACTUAL_PURE' | 'CONCEPTUAL';

const FACTUAL_PURE_PATTERNS: RegExp[] = [
  /date (limite|butoir|de) (déclaration|dépôt|envoi)/i,
  /quand (faut|dois|est-ce)/i,
  /c'est quand/i,
  /formulaire (\d+)/i,
  /numéro (de|du) formulaire/i,
  /qui est (le|la) (ministre|président|directeur)/i,
  /\bactualité\b/i,
  /(l'|la )?impôts? gouv/i,
];

const PERSONAL_PATTERNS: RegExp[] = [
  /\bmon\b|\bma\b|\bmes\b/i,
  /\bje\b[^.?!]{0,40}(paie|gagne|dois|peux|ai|suis|veux|vais|devrais|pourrais)/i,
  /dans ma situation/i,
  /pour moi\b/i,
  /\bai-je\b/i,
  /\bsuis-je\b/i,
];

export function classifyIntent(message: string): Intent {
  const msg = message || '';
  const hasPersonal = PERSONAL_PATTERNS.some((p) => p.test(msg));
  const hasFactual = FACTUAL_PURE_PATTERNS.some((p) => p.test(msg));

  if (hasPersonal) return 'PERSONAL';
  if (hasFactual && !hasPersonal) return 'FACTUAL_PURE';
  return 'CONCEPTUAL';
}
