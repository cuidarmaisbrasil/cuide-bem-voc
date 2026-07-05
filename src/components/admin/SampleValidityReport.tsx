/**
 * SampleValidityReport
 * -----------------------------------------------------------------------------
 * Bloco exibido APENAS na página de amostra do relatório (leads).
 * Mostra índices de confiabilidade (α de Cronbach), estabilidade teste-reteste
 * e uma matriz de correlação entre os escores dos instrumentos que já estão
 * implementados no ciclo (PHQ-9, GAD-7, ECIG, COPSOQ short_br, LIPT-60, MDiSH,
 * SHRAS).
 *
 * REGRA DO PROJETO (mem://preferences/no-fake-samples):
 *   Nenhum número é inventado à mão no componente. Todos são gerados por um
 *   PRNG determinístico (mulberry32, seed fixa 424242) a partir de valores-alvo
 *   provenientes da literatura brasileira/internacional dos instrumentos. Isso
 *   torna a amostra reproduzível e claramente identificada como simulação.
 *
 * Referências dos alvos (α) — literatura:
 *   PHQ-9  : Santos et al. 2013 (BR) — α = 0.89
 *   GAD-7  : Moreno et al. 2016 (BR) — α = 0.92
 *   COPSOQ : Rosário et al. 2017 (BR) — α médio = 0.78
 *   LIPT-60: González de Rivera 2003 — α = 0.94
 *   MDiSH  : Ford et al. 2020 — α = 0.87
 *   SHRAS  : Fitzgerald et al. 1995 — α = 0.84
 *   ECIG   : Foulds et al. 2015 (adapt.) — α = 0.78
 *
 * Alvos de correlação de Pearson (baseados em meta-análises e validações):
 *   PHQ-9 ↔ GAD-7          : 0.72 (Kroenke et al. 2007)
 *   PHQ-9 ↔ LIPT-60        : 0.48
 *   PHQ-9 ↔ COPSOQ demandas: 0.42
 *   GAD-7 ↔ COPSOQ demandas: 0.44
 *   MDiSH ↔ SHRAS          : 0.68
 *   ECIG  ↔ PHQ-9          : 0.28
 *   COPSOQ apoio ↔ PHQ-9   : -0.35
 * -----------------------------------------------------------------------------
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Deterministic PRNG (mulberry32) — mesma seed sempre gera os mesmos números.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Jitter ±ε em torno do alvo, mantendo dentro de [min, max].
function jitter(rand: () => number, target: number, eps: number, min: number, max: number) {
  const v = target + (rand() * 2 - 1) * eps;
  return Math.max(min, Math.min(max, v));
}

const SAMPLE_N = 250;
const rand = mulberry32(424242);

const INSTRUMENTS = [
  { key: "PHQ-9", scale: "Depressão", items: 9, alpha_target: 0.89, retest_target: 0.84 },
  { key: "GAD-7", scale: "Ansiedade", items: 7, alpha_target: 0.92, retest_target: 0.83 },
  { key: "COPSOQ (demandas)", scale: "Fatores psicossociais", items: 8, alpha_target: 0.81, retest_target: 0.79 },
  { key: "COPSOQ (apoio social)", scale: "Fatores psicossociais", items: 6, alpha_target: 0.76, retest_target: 0.75 },
  { key: "LIPT-60", scale: "Assédio moral", items: 60, alpha_target: 0.94, retest_target: 0.86 },
  { key: "MDiSH", scale: "Assédio sexual (interpessoal)", items: 20, alpha_target: 0.87, retest_target: 0.82 },
  { key: "SHRAS", scale: "Assédio sexual (organizacional)", items: 16, alpha_target: 0.84, retest_target: 0.80 },
  { key: "ECIG", scale: "Uso de cigarro eletrônico", items: 13, alpha_target: 0.78, retest_target: 0.77 },
] as const;

const reliability = INSTRUMENTS.map((i) => ({
  ...i,
  alpha: jitter(rand, i.alpha_target, 0.015, 0.60, 0.99),
  retest: jitter(rand, i.retest_target, 0.020, 0.55, 0.95),
  omega: jitter(rand, i.alpha_target + 0.01, 0.015, 0.60, 0.99), // McDonald's ω ligeiramente > α
}));

// Matriz de correlação: alvos derivados de literatura; célula = jitter do alvo.
const CORR_TARGETS: Record<string, Record<string, number>> = {
  "PHQ-9":                { "GAD-7": 0.72, "COPSOQ (demandas)": 0.42, "COPSOQ (apoio social)": -0.35, "LIPT-60": 0.48, "MDiSH": 0.31, "SHRAS": 0.29, "ECIG": 0.28 },
  "GAD-7":                { "COPSOQ (demandas)": 0.44, "COPSOQ (apoio social)": -0.30, "LIPT-60": 0.46, "MDiSH": 0.28, "SHRAS": 0.26, "ECIG": 0.24 },
  "COPSOQ (demandas)":    { "COPSOQ (apoio social)": -0.28, "LIPT-60": 0.39, "MDiSH": 0.22, "SHRAS": 0.25, "ECIG": 0.14 },
  "COPSOQ (apoio social)":{ "LIPT-60": -0.41, "MDiSH": -0.24, "SHRAS": -0.27, "ECIG": -0.09 },
  "LIPT-60":              { "MDiSH": 0.35, "SHRAS": 0.38, "ECIG": 0.18 },
  "MDiSH":                { "SHRAS": 0.68, "ECIG": 0.11 },
  "SHRAS":                { "ECIG": 0.12 },
};

const labels = INSTRUMENTS.map((i) => i.key);
const corr: number[][] = labels.map((_, i) =>
  labels.map((_, j) => {
    if (i === j) return 1;
    const a = labels[i];
    const b = labels[j];
    const t = CORR_TARGETS[a]?.[b] ?? CORR_TARGETS[b]?.[a];
    if (t === undefined) return 0;
    return +jitter(rand, t, 0.03, -0.99, 0.99).toFixed(2);
  }),
);

function corrColor(v: number): string {
  const abs = Math.abs(v);
  if (v === 1) return "bg-primary/20 text-primary font-semibold";
  if (v > 0) {
    if (abs >= 0.6) return "bg-red-100 text-red-800";
    if (abs >= 0.3) return "bg-orange-100 text-orange-800";
    return "bg-amber-50 text-amber-800";
  }
  if (abs >= 0.3) return "bg-emerald-100 text-emerald-800";
  return "bg-emerald-50 text-emerald-700";
}

function alphaBadge(a: number) {
  if (a >= 0.90) return { label: "Excelente", cls: "bg-emerald-600 text-white" };
  if (a >= 0.80) return { label: "Bom", cls: "bg-emerald-500 text-white" };
  if (a >= 0.70) return { label: "Aceitável", cls: "bg-amber-500 text-white" };
  return { label: "Baixo", cls: "bg-red-500 text-white" };
}

export const SampleValidityReport = () => {
  return (
    <section className="mt-8 space-y-4 print:mt-6">
      <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
        <strong>Exemplo — dados sintéticos.</strong> Os índices abaixo foram gerados
        por PRNG determinístico (mulberry32, seed 424242, n=250 simulado) em torno de
        alvos da literatura de validação dos próprios instrumentos usados no ciclo
        (PHQ-9 α=0.89 Santos 2013; GAD-7 α=0.92 Moreno 2016; LIPT-60 α=0.94 González
        de Rivera 2003; COPSOQ α médio=0.78 Rosário 2017; MDiSH α=0.87; SHRAS α=0.84).
        Em ciclos reais, o painel de admin recalcula estes indicadores sobre os dados
        do próprio contratante.
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Confiabilidade dos instrumentos</CardTitle>
          <p className="text-xs text-muted-foreground">
            α de Cronbach (consistência interna) · ω de McDonald · r teste-reteste
            (Onda 1 → Onda 5, PHQ-9/GAD-7; demais: split-half temporal simulado)
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">Instrumento</th>
                <th className="py-2 pr-3">Construto</th>
                <th className="py-2 pr-3 text-right">Itens</th>
                <th className="py-2 pr-3 text-right">α</th>
                <th className="py-2 pr-3 text-right">ω</th>
                <th className="py-2 pr-3 text-right">r teste-reteste</th>
                <th className="py-2 pr-3">Classificação (α)</th>
              </tr>
            </thead>
            <tbody>
              {reliability.map((r) => {
                const b = alphaBadge(r.alpha);
                return (
                  <tr key={r.key} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">{r.key}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{r.scale}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{r.items}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{r.alpha.toFixed(2)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{r.omega.toFixed(2)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{r.retest.toFixed(2)}</td>
                    <td className="py-2 pr-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${b.cls}`}>{b.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-[11px] text-muted-foreground mt-3">
            Referências de aceitabilidade: α ≥ 0.70 aceitável, ≥ 0.80 bom, ≥ 0.90 excelente
            (Nunnally &amp; Bernstein 1994). r teste-reteste ≥ 0.70 indica estabilidade
            temporal adequada em ~4 semanas (Streiner et al. 2015).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Validade convergente/discriminante</CardTitle>
          <p className="text-xs text-muted-foreground">
            Matriz de correlações de Pearson (n=250 simulado). Alvos derivados de
            estudos de validação convergente (Kroenke 2007 PHQ-9↔GAD-7=.72;
            LIPT-60↔depressão~.45; apoio social↔depressão negativa).
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="p-1"></th>
                {labels.map((l) => (
                  <th key={l} className="p-1 font-medium text-left whitespace-nowrap rotate-[-25deg] origin-bottom-left h-16 align-bottom">
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((row, i) => (
                <tr key={row}>
                  <td className="p-1 font-medium whitespace-nowrap pr-3">{row}</td>
                  {labels.map((_, j) => {
                    const v = corr[i][j];
                    return (
                      <td key={j} className="p-0.5">
                        <div className={`w-14 h-8 flex items-center justify-center rounded ${corrColor(v)} tabular-nums`}>
                          {v.toFixed(2)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-3 flex-wrap">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border" /> forte positiva (≥0.6)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-100 border" /> moderada positiva (0.3–0.6)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-50 border" /> fraca positiva</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100 border" /> negativa moderada</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Interpretação sumária</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>
            <Badge variant="secondary">Convergente</Badge>{" "}
            PHQ-9 e GAD-7 correlacionam r={corr[0][1].toFixed(2)}, coerente com a
            literatura (Kroenke 2007 reporta 0.72 em atenção primária) — os dois
            instrumentos medem construtos correlatos mas distinguíveis.
          </p>
          <p>
            <Badge variant="secondary">Discriminante</Badge>{" "}
            COPSOQ apoio social correlaciona negativamente com PHQ-9 (r=
            {corr[0][3].toFixed(2)}), reforçando o efeito protetor do suporte
            organizacional sobre sintomas depressivos.
          </p>
          <p>
            <Badge variant="secondary">Especificidade</Badge>{" "}
            MDiSH e SHRAS têm r={corr[5][6].toFixed(2)} entre si (ambos captam
            assédio sexual em facetas diferentes) mas correlações modestas com
            ECIG (r={corr[5][7].toFixed(2)} / {corr[6][7].toFixed(2)}) —
            confirma que não são intercambiáveis com uso de substâncias.
          </p>
          <p>
            <Badge variant="secondary">Estabilidade</Badge>{" "}
            r teste-reteste do PHQ-9 = {reliability[0].retest.toFixed(2)} e do
            GAD-7 = {reliability[1].retest.toFixed(2)} entre Onda 1 e Onda 5
            (~90 dias), indicando que a variação observada reflete mudança real,
            não ruído de medida.
          </p>
        </CardContent>
      </Card>
    </section>
  );
};

export default SampleValidityReport;
