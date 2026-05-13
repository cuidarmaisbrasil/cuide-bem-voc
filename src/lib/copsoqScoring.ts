// COPSOQ II — pontuação e interpretação
// Conversão padrão: 1→0, 2→25, 3→50, 4→75, 5→100
// Itens com `reverse=true` são invertidos antes da média (100 - score).
// Por escala calcula-se a média 0-100.
//
// Faixa de risco (recomendada COPSOQ II PT — Silva et al., 2011):
//   - Escalas POSITIVAS (recurso): >75 saudável | 50-75 atenção | <50 risco
//   - Escalas NEGATIVAS (exigência/sintoma): <25 saudável | 25-50 atenção | >50 risco

import { CopsoqQuestion, CopsoqScale, copsoqScales } from "@/data/copsoq";

export type RiskBand = "healthy" | "warning" | "risk";

export interface ScaleScore {
  scaleId: string;
  name: string;
  type: CopsoqScale["type"];
  mean: number; // 0-100
  band: RiskBand;
  itemCount: number;
}

const VALUE_MAP = [0, 25, 50, 75, 100];

export function rawToScore(raw: 1 | 2 | 3 | 4 | 5, reverse = false): number {
  const v = VALUE_MAP[raw - 1];
  return reverse ? 100 - v : v;
}

export function bandFor(type: CopsoqScale["type"], mean: number): RiskBand {
  if (type === "positive") {
    if (mean >= 75) return "healthy";
    if (mean >= 50) return "warning";
    return "risk";
  }
  if (mean <= 25) return "healthy";
  if (mean <= 50) return "warning";
  return "risk";
}

export function bandLabel(band: RiskBand): string {
  if (band === "healthy") return "Saudável";
  if (band === "warning") return "Atenção";
  return "Risco";
}

export function bandColor(band: RiskBand): string {
  if (band === "healthy") return "hsl(var(--primary))";
  if (band === "warning") return "hsl(38 92% 50%)";
  return "hsl(var(--destructive))";
}

/**
 * Compute scale-level scores from raw answers.
 * @param answers map of question number -> 1..5
 * @param questions full COPSOQ question list for the version used
 */
export function computeScales(
  answers: Record<number, 1 | 2 | 3 | 4 | 5>,
  questions: CopsoqQuestion[],
): ScaleScore[] {
  const grouped = new Map<string, number[]>();
  for (const q of questions) {
    const raw = answers[q.n];
    if (!raw) continue;
    const scored = rawToScore(raw, q.reverse);
    if (!grouped.has(q.scale)) grouped.set(q.scale, []);
    grouped.get(q.scale)!.push(scored);
  }
  const out: ScaleScore[] = [];
  for (const [scaleId, values] of grouped.entries()) {
    const meta = copsoqScales[scaleId];
    if (!meta) continue;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    out.push({
      scaleId,
      name: meta.name,
      type: meta.type,
      mean: Math.round(mean * 10) / 10,
      band: bandFor(meta.type, mean),
      itemCount: values.length,
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, "pt"));
}

export interface AggregateRow {
  scaleId: string;
  name: string;
  type: CopsoqScale["type"];
  mean: number;
  band: RiskBand;
  responses: number;
}

/** Aggregates many response rows (each row = ScaleScore[] for one respondent) into an org-wide view */
export function aggregateScales(allRespondents: ScaleScore[][]): AggregateRow[] {
  const acc = new Map<string, { sum: number; count: number; meta: CopsoqScale }>();
  for (const respondent of allRespondents) {
    for (const s of respondent) {
      const meta = copsoqScales[s.scaleId];
      if (!meta) continue;
      if (!acc.has(s.scaleId)) acc.set(s.scaleId, { sum: 0, count: 0, meta });
      const entry = acc.get(s.scaleId)!;
      entry.sum += s.mean;
      entry.count += 1;
    }
  }
  const rows: AggregateRow[] = [];
  for (const [scaleId, { sum, count, meta }] of acc.entries()) {
    const mean = sum / count;
    rows.push({
      scaleId,
      name: meta.name,
      type: meta.type,
      mean: Math.round(mean * 10) / 10,
      band: bandFor(meta.type, mean),
      responses: count,
    });
  }
  return rows.sort((a, b) => {
    // group by band severity desc (risk first)
    const order: Record<RiskBand, number> = { risk: 0, warning: 1, healthy: 2 };
    if (order[a.band] !== order[b.band]) return order[a.band] - order[b.band];
    return a.name.localeCompare(b.name, "pt");
  });
}
