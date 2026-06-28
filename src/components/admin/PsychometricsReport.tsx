import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw } from "lucide-react";

/**
 * Real psychometrics report — every number comes from `wellness_psychometrics_runs`,
 * computed by the `wellness-psychometrics-light` edge function (native TS) and,
 * for CFA / ω / RMSEA / invariance / DIF, from the external Python worker
 * (wired in a follow-up). No hardcoded sample values.
 */

type Status = "ok" | "insufficient_n" | "worker_error" | "pending";

interface Run {
  instrument: string;
  status: Status;
  n_used: number;
  bias_metrics: {
    cronbach_alpha?: number | null;
    harman_first_factor_pct?: number | null;
    midpoint_pct?: number | null;
    straightlining_pct?: number | null;
    acquiescence_index?: number | null;
    social_desirability_r?: number | null;
  } | null;
  fit_indices: {
    chi2_df?: number;
    cfi?: number;
    tli?: number;
    rmsea?: number;
    srmr?: number;
    omega?: number;
  } | null;
  invariance: any | null;
  error_msg?: string | null;
}

const INSTRUMENT_LABEL: Record<string, string> = {
  phq9: "PHQ-9",
  ecig: "ECIG",
  copsoq: "COPSOQ-II BR",
  lipt60: "LIPT-60",
  mdish: "MDiSH",
  shras: "SHRAS",
};

function fmt(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toFixed(digits);
}

interface Props {
  companyId?: string;
  roundNo?: number;
  isAdmin?: boolean;
}

export const PsychometricsReport = ({ companyId, roundNo, isAdmin = false }: Props) => {
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);

  const load = async () => {
    if (!companyId || typeof roundNo !== "number") {
      setRuns([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("wellness_psychometrics_runs")
      .select("instrument, status, n_used, bias_metrics, fit_indices, invariance, error_msg")
      .eq("company_id", companyId)
      .eq("round_no", roundNo);
    if (error) console.error(error);
    setRuns((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [companyId, roundNo]);

  const runCompute = async () => {
    if (!companyId || typeof roundNo !== "number") return;
    setComputing(true);
    const { error } = await supabase.functions.invoke("wellness-psychometrics-light", {
      body: { company_id: companyId, round_no: roundNo },
    });
    if (error) console.error(error);
    await load();
    setComputing(false);
  };

  // No company/round selected → don't render fictitious values
  if (!companyId || typeof roundNo !== "number") {
    return (
      <Card className="p-5 md:p-6 space-y-3">
        <h2 className="font-display text-xl font-semibold">
          Análise fatorial confirmatória (CFA) e análise de viés
        </h2>
        <p className="text-sm text-muted-foreground">
          Selecione uma empresa e um ciclo para ver os resultados psicométricos calculados sobre
          as respostas reais. Nenhum valor demonstrativo é exibido aqui.
        </p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando análise psicométrica…
      </Card>
    );
  }

  if (!runs || runs.length === 0) {
    return (
      <Card className="p-5 md:p-6 space-y-3">
        <h2 className="font-display text-xl font-semibold">
          Análise fatorial confirmatória (CFA) e análise de viés
        </h2>
        <p className="text-sm text-muted-foreground">
          Análise psicométrica ainda não executada para este ciclo.
        </p>
        {isAdmin && (
          <Button size="sm" onClick={runCompute} disabled={computing}>
            {computing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Calculando…</>
            ) : (
              <><RefreshCw className="h-4 w-4" /> Calcular agora</>
            )}
          </Button>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-5 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">
            Análise fatorial confirmatória (CFA) e análise de viés
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Métricas calculadas sobre as respostas reais deste ciclo. Valores não disponíveis aparecem
            como "—" ou rotulados como "n insuficiente" / "pendente" — nada é simulado.
          </p>
        </div>
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={runCompute} disabled={computing}>
            {computing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Recalcular
          </Button>
        )}
      </div>

      {/* Bias (native TS) */}
      <section className="space-y-2">
        <h3 className="font-semibold text-sm">Viés de resposta (cálculo nativo)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-2">Instrumento</th>
                <th className="p-2 text-right">n</th>
                <th className="p-2 text-right">α</th>
                <th className="p-2 text-right">Harman %</th>
                <th className="p-2 text-right">Midpoint %</th>
                <th className="p-2 text-right">Straightlining %</th>
                <th className="p-2 text-right">Aquiescência</th>
                <th className="p-2 text-right">r MC-SDS</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.instrument} className="border-t">
                  <td className="p-2 font-medium">{INSTRUMENT_LABEL[r.instrument] ?? r.instrument}</td>
                  <td className="p-2 text-right">{r.n_used}</td>
                  <td className="p-2 text-right">{fmt(r.bias_metrics?.cronbach_alpha)}</td>
                  <td className="p-2 text-right">{fmt(r.bias_metrics?.harman_first_factor_pct, 1)}</td>
                  <td className="p-2 text-right">{fmt(r.bias_metrics?.midpoint_pct, 1)}</td>
                  <td className="p-2 text-right">{fmt(r.bias_metrics?.straightlining_pct, 1)}</td>
                  <td className="p-2 text-right">{fmt(r.bias_metrics?.acquiescence_index)}</td>
                  <td className="p-2 text-right">{fmt(r.bias_metrics?.social_desirability_r)}</td>
                  <td className="p-2">
                    {r.status === "ok" && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">OK</Badge>}
                    {r.status === "insufficient_n" && <Badge variant="outline">n insuficiente</Badge>}
                    {r.status === "worker_error" && isAdmin && <Badge variant="destructive">erro</Badge>}
                    {r.status === "pending" && <Badge variant="outline">pendente</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CFA / Invariance — pending external worker */}
      <section className="space-y-2">
        <h3 className="font-semibold text-sm">CFA, ω, RMSEA e invariância</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-2">Instrumento</th>
                <th className="p-2 text-right">χ²/gl</th>
                <th className="p-2 text-right">CFI</th>
                <th className="p-2 text-right">TLI</th>
                <th className="p-2 text-right">RMSEA</th>
                <th className="p-2 text-right">SRMR</th>
                <th className="p-2 text-right">ω</th>
                <th className="p-2">Invariância</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.instrument} className="border-t">
                  <td className="p-2 font-medium">{INSTRUMENT_LABEL[r.instrument] ?? r.instrument}</td>
                  <td className="p-2 text-right">{fmt(r.fit_indices?.chi2_df)}</td>
                  <td className="p-2 text-right">{fmt(r.fit_indices?.cfi, 3)}</td>
                  <td className="p-2 text-right">{fmt(r.fit_indices?.tli, 3)}</td>
                  <td className="p-2 text-right">{fmt(r.fit_indices?.rmsea, 3)}</td>
                  <td className="p-2 text-right">{fmt(r.fit_indices?.srmr, 3)}</td>
                  <td className="p-2 text-right">{fmt(r.fit_indices?.omega)}</td>
                  <td className="p-2 text-muted-foreground">
                    {r.invariance ? "calculada" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted-foreground">
          CFA, ω de McDonald, RMSEA, SRMR e invariância (configural / métrica / escalar) exigem
          algoritmos de equações estruturais (estimador WLSMV) que rodam fora deste ambiente.
          A integração com o serviço de cálculo estatístico será ativada após a configuração do
          worker externo. Até lá, esses campos permanecem vazios — não são preenchidos com valores
          ilustrativos.
        </p>
      </section>
    </Card>
  );
};

export default PsychometricsReport;
