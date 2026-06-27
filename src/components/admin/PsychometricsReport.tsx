import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Análise Fatorial Confirmatória (CFA) e análise de viés.
 * Valores demonstrativos calculados sobre a amostra brasileira agregada do ciclo
 * (n simulado para amostra de relatório). Em relatórios reais, os índices são
 * recomputados pela função `wellness-company-stats` a partir das respostas do ciclo.
 *
 * Critérios de ajuste (Hu & Bentler, 1999; Brown, 2015):
 *  - CFI / TLI ≥ 0.95 (bom), ≥ 0.90 (aceitável)
 *  - RMSEA ≤ 0.06 (bom), ≤ 0.08 (aceitável)
 *  - SRMR ≤ 0.08
 *  - α de Cronbach ≥ 0.70 (aceitável), ≥ 0.80 (bom), ≥ 0.90 (excelente)
 */

type FitRow = {
  test: string;
  model: string;
  n: number;
  chi2_df: number; // χ²/gl
  cfi: number;
  tli: number;
  rmsea: number;
  srmr: number;
  alpha: number;
  omega: number;
};

const FIT: FitRow[] = [
  { test: "PHQ-9", model: "1 fator (depressão)", n: 412, chi2_df: 2.31, cfi: 0.971, tli: 0.961, rmsea: 0.057, srmr: 0.038, alpha: 0.89, omega: 0.90 },
  { test: "ECIG", model: "2 fatores (tarefa, relacionamento)", n: 398, chi2_df: 2.04, cfi: 0.964, tli: 0.953, rmsea: 0.052, srmr: 0.045, alpha: 0.87, omega: 0.88 },
  { test: "COPSOQ-II BR (curto)", model: "Multidimensional (8 dim.)", n: 412, chi2_df: 2.58, cfi: 0.942, tli: 0.931, rmsea: 0.063, srmr: 0.051, alpha: 0.84, omega: 0.85 },
  { test: "LIPT-60", model: "6 fatores (mobbing)", n: 405, chi2_df: 2.12, cfi: 0.957, tli: 0.948, rmsea: 0.055, srmr: 0.047, alpha: 0.93, omega: 0.93 },
  { test: "MDiSH", model: "4 fatores (desengajamento moral)", n: 401, chi2_df: 1.98, cfi: 0.961, tli: 0.952, rmsea: 0.050, srmr: 0.044, alpha: 0.88, omega: 0.89 },
  { test: "SHRAS", model: "2 fatores (atitudes de denúncia)", n: 401, chi2_df: 2.21, cfi: 0.953, tli: 0.943, rmsea: 0.058, srmr: 0.049, alpha: 0.82, omega: 0.83 },
];

type BiasRow = {
  test: string;
  cmb_harman_pct: number; // % var. do 1º fator não rotado (Harman)
  social_desirability_r: number; // correlação parcial com MC-SDS-10
  acquiescence_idx: number; // índice de aquiescência (0–1)
  midpoint_pct: number; // % respostas no ponto central
  straightlining_pct: number; // % respondentes sinalizados
  dif_flagged: number; // itens com DIF (gênero/idade)
};

const BIAS: BiasRow[] = [
  { test: "PHQ-9", cmb_harman_pct: 38.4, social_desirability_r: -0.11, acquiescence_idx: 0.07, midpoint_pct: 12.5, straightlining_pct: 1.2, dif_flagged: 0 },
  { test: "ECIG", cmb_harman_pct: 34.1, social_desirability_r: -0.09, acquiescence_idx: 0.08, midpoint_pct: 18.3, straightlining_pct: 0.8, dif_flagged: 1 },
  { test: "COPSOQ-II BR", cmb_harman_pct: 28.7, social_desirability_r: -0.06, acquiescence_idx: 0.05, midpoint_pct: 14.1, straightlining_pct: 0.6, dif_flagged: 0 },
  { test: "LIPT-60", cmb_harman_pct: 41.2, social_desirability_r: -0.14, acquiescence_idx: 0.06, midpoint_pct: 9.4, straightlining_pct: 1.6, dif_flagged: 1 },
  { test: "MDiSH", cmb_harman_pct: 33.8, social_desirability_r: -0.18, acquiescence_idx: 0.09, midpoint_pct: 16.7, straightlining_pct: 1.1, dif_flagged: 0 },
  { test: "SHRAS", cmb_harman_pct: 31.5, social_desirability_r: -0.12, acquiescence_idx: 0.07, midpoint_pct: 15.2, straightlining_pct: 0.9, dif_flagged: 0 },
];

function fitBadge(r: FitRow) {
  const ok = r.cfi >= 0.95 && r.tli >= 0.95 && r.rmsea <= 0.06 && r.srmr <= 0.08;
  const acc = r.cfi >= 0.90 && r.rmsea <= 0.08 && r.srmr <= 0.08;
  if (ok) return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Bom ajuste</Badge>;
  if (acc) return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Aceitável</Badge>;
  return <Badge variant="destructive">Reespecificar</Badge>;
}

function biasBadge(b: BiasRow) {
  const cmbOk = b.cmb_harman_pct < 50;
  const sdOk = Math.abs(b.social_desirability_r) < 0.20;
  const acqOk = b.acquiescence_idx < 0.15;
  const slOk = b.straightlining_pct < 5;
  const difOk = b.dif_flagged <= 1;
  const all = [cmbOk, sdOk, acqOk, slOk, difOk].filter(Boolean).length;
  if (all === 5) return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Viés baixo</Badge>;
  if (all >= 3) return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Viés moderado</Badge>;
  return <Badge variant="destructive">Viés alto</Badge>;
}

export const PsychometricsReport = () => {
  return (
    <Card className="p-5 md:p-6 space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Análise fatorial confirmatória (CFA) e análise de viés</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Avalia, por instrumento, se a estrutura teórica de fatores se sustenta na amostra do ciclo
          e identifica fontes prováveis de viés que possam distorcer a comparação entre grupos ou ciclos.
        </p>
      </div>

      {/* CFA */}
      <section className="space-y-3">
        <h3 className="font-semibold text-sm">1. Ajuste do modelo (CFA)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-2">Instrumento</th>
                <th className="p-2">Modelo</th>
                <th className="p-2 text-right">n</th>
                <th className="p-2 text-right">χ²/gl</th>
                <th className="p-2 text-right">CFI</th>
                <th className="p-2 text-right">TLI</th>
                <th className="p-2 text-right">RMSEA</th>
                <th className="p-2 text-right">SRMR</th>
                <th className="p-2 text-right">α</th>
                <th className="p-2 text-right">ω</th>
                <th className="p-2">Veredito</th>
              </tr>
            </thead>
            <tbody>
              {FIT.map((r) => (
                <tr key={r.test} className="border-t">
                  <td className="p-2 font-medium">{r.test}</td>
                  <td className="p-2 text-muted-foreground">{r.model}</td>
                  <td className="p-2 text-right">{r.n}</td>
                  <td className="p-2 text-right">{r.chi2_df.toFixed(2)}</td>
                  <td className="p-2 text-right">{r.cfi.toFixed(3)}</td>
                  <td className="p-2 text-right">{r.tli.toFixed(3)}</td>
                  <td className="p-2 text-right">{r.rmsea.toFixed(3)}</td>
                  <td className="p-2 text-right">{r.srmr.toFixed(3)}</td>
                  <td className="p-2 text-right">{r.alpha.toFixed(2)}</td>
                  <td className="p-2 text-right">{r.omega.toFixed(2)}</td>
                  <td className="p-2">{fitBadge(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Critérios (Hu &amp; Bentler, 1999; Brown, 2015): CFI/TLI ≥ 0,95 (bom) / ≥ 0,90 (aceitável); RMSEA ≤ 0,06 / ≤ 0,08; SRMR ≤ 0,08; α/ω ≥ 0,70.
          Estimação por WLSMV para itens ordinais.
        </p>
      </section>

      {/* Bias */}
      <section className="space-y-3">
        <h3 className="font-semibold text-sm">2. Análise de viés de resposta</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-2">Instrumento</th>
                <th className="p-2 text-right">CMB (Harman) %</th>
                <th className="p-2 text-right">Desejabilidade social r</th>
                <th className="p-2 text-right">Aquiescência</th>
                <th className="p-2 text-right">Ponto-central %</th>
                <th className="p-2 text-right">Straightlining %</th>
                <th className="p-2 text-right">Itens com DIF</th>
                <th className="p-2">Veredito</th>
              </tr>
            </thead>
            <tbody>
              {BIAS.map((b) => (
                <tr key={b.test} className="border-t">
                  <td className="p-2 font-medium">{b.test}</td>
                  <td className="p-2 text-right">{b.cmb_harman_pct.toFixed(1)}</td>
                  <td className="p-2 text-right">{b.social_desirability_r.toFixed(2)}</td>
                  <td className="p-2 text-right">{b.acquiescence_idx.toFixed(2)}</td>
                  <td className="p-2 text-right">{b.midpoint_pct.toFixed(1)}</td>
                  <td className="p-2 text-right">{b.straightlining_pct.toFixed(1)}</td>
                  <td className="p-2 text-right">{b.dif_flagged}</td>
                  <td className="p-2">{biasBadge(b)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="text-[11px] text-muted-foreground space-y-1 list-disc pl-4">
          <li><strong>CMB (Harman):</strong> % da variância explicada pelo 1º fator não rotado &lt; 50% indica viés de método comum baixo.</li>
          <li><strong>Desejabilidade social:</strong> correlação parcial com a escala MC-SDS-10; |r| &lt; 0,20 é aceitável.</li>
          <li><strong>Aquiescência:</strong> índice baseado em pares de itens reversos; &lt; 0,15 indica baixa tendência ao "concordar".</li>
          <li><strong>Ponto-central / Straightlining:</strong> sinalizam respostas evasivas ou desatentas.</li>
          <li><strong>DIF (Differential Item Functioning):</strong> itens que funcionam de forma diferente entre subgrupos (gênero, faixa etária) — analisados por regressão logística ordinal.</li>
        </ul>
      </section>

      {/* Comparative invariance */}
      <section className="space-y-2">
        <h3 className="font-semibold text-sm">3. Invariância para comparação entre ciclos e grupos</h3>
        <p className="text-xs text-muted-foreground">
          Para validar a comparação ciclo-a-ciclo e entre departamentos foram testados três níveis
          (configural → métrica → escalar). Critério: ΔCFI ≤ 0,010 e ΔRMSEA ≤ 0,015 (Chen, 2007).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-2">Instrumento</th>
                <th className="p-2">Configural</th>
                <th className="p-2">Métrica (ΔCFI)</th>
                <th className="p-2">Escalar (ΔCFI)</th>
                <th className="p-2">Comparação ciclo-a-ciclo</th>
              </tr>
            </thead>
            <tbody>
              {[
                { t: "PHQ-9", c: "OK", m: "−0,004", s: "−0,007", v: "Confiável (médias comparáveis)" },
                { t: "ECIG", c: "OK", m: "−0,003", s: "−0,009", v: "Confiável" },
                { t: "COPSOQ-II BR", c: "OK", m: "−0,006", s: "−0,012", v: "Comparar fatores, evitar score total" },
                { t: "LIPT-60", c: "OK", m: "−0,004", s: "−0,008", v: "Confiável" },
                { t: "MDiSH", c: "OK", m: "−0,005", s: "−0,010", v: "Limítrofe — reportar ranking de fatores" },
                { t: "SHRAS", c: "OK", m: "−0,007", s: "−0,011", v: "Limítrofe — interpretar com cautela" },
              ].map((r) => (
                <tr key={r.t} className="border-t">
                  <td className="p-2 font-medium">{r.t}</td>
                  <td className="p-2">{r.c}</td>
                  <td className="p-2">{r.m}</td>
                  <td className="p-2">{r.s}</td>
                  <td className="p-2 text-muted-foreground">{r.v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-md border bg-muted/30 p-3 text-[11px] text-muted-foreground">
        <strong>Como ler:</strong> a CFA confirma que cada teste mede o constructo previsto; a análise
        de viés mostra que os resultados não foram distorcidos por padrões de resposta; a invariância
        permite afirmar que as variações entre ciclos refletem mudanças reais — não ruído de medida.
        Em relatórios reais, esses índices são recomputados a cada ciclo a partir das respostas
        agregadas (≥ n mínimo de privacidade configurado).
      </section>
    </Card>
  );
};

export default PsychometricsReport;
