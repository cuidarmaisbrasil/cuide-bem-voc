import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { copsoqScales, type CopsoqScaleType } from "@/data/copsoq";

interface RoundData {
  round_no: number;
  opened_at: string;
  closed_at: string | null;
  devolutiva_communicated_at: string | null;
  devolutiva_notes: string | null;
  status: "open" | "closed" | "devolutiva_communicated";
  waves: Record<string, { scheduled: number; sent: number; completed: number }>;
  copsoq: { n: number; hidden: boolean; scales: Record<string, { mean: number; n: number }> };
  phq9: { n: number; hidden: boolean; severity_dist: Record<string, number> };
  psicossocial: {
    n: number; hidden: boolean;
    IGAP: number; NEAP: number; flagged_pct: number;
    subscales: Record<string, number>;
    flagged_departments: string[];
  };
  assedio_sexual: {
    n: number; hidden: boolean;
    MDiSH_total: number; SHRAS_total: number; any_endorsed_pct: number;
    subscales: Record<string, number>;
  };
}
interface StatsResp { rounds: RoundData[]; min_recorte: number }
interface Company { id: string; name: string; cnpj?: string | null; sector?: string | null; size_range?: string | null }

function bandFor(type: CopsoqScaleType, mean: number) {
  if (type === "positive") return mean >= 75 ? "Saudável" : mean >= 50 ? "Atenção" : "Risco";
  return mean <= 25 ? "Saudável" : mean <= 50 ? "Atenção" : "Risco";
}
function bandColor(label: string) {
  if (label === "Saudável") return "#0d7a5f";
  if (label === "Atenção") return "#d97706";
  return "#b91c1c";
}
function fmtDate(s: string | null) { return s ? new Date(s).toLocaleDateString("pt-BR") : "—"; }

const AepReport = () => {
  const { companyId, roundNo } = useParams<{ companyId: string; roundNo: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState<StatsResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = "Relatório AEP — Cuidar+ Trabalho"; }, []);

  useEffect(() => {
    (async () => {
      if (!companyId) return;
      const [{ data: co }, { data: { session } }] = await Promise.all([
        supabase.from("companies").select("id,name,cnpj,sector,size_range").eq("id", companyId).maybeSingle(),
        supabase.auth.getSession(),
      ]);
      setCompany(co as any);
      const base = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${base}/functions/v1/wellness-company-stats?company_id=${companyId}&period=all`, {
        headers: { Authorization: `Bearer ${session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      setStats(await res.json());
      setLoading(false);
    })();
  }, [companyId]);

  if (loading) return <main className="container py-10 text-sm text-muted-foreground">Carregando…</main>;
  if (!stats || !company) return <main className="container py-10 text-sm">Dados indisponíveis.</main>;

  const target = stats.rounds.find((r) => String(r.round_no) === String(roundNo));
  if (!target) return <main className="container py-10 text-sm">Rodada não encontrada.</main>;

  const prev = stats.rounds.find((r) => r.round_no === target.round_no - 1) || null;

  const scaleRows = Object.entries(target.copsoq.scales)
    .map(([id, v]) => {
      const meta = copsoqScales[id];
      const prevMean = prev?.copsoq.scales[id]?.mean;
      return {
        id, name: meta?.name ?? id, type: meta?.type ?? "negative" as CopsoqScaleType,
        mean: v.mean, n: v.n,
        prevMean,
        delta: typeof prevMean === "number" ? +(v.mean - prevMean).toFixed(1) : null,
      };
    })
    .sort((a, b) => {
      const ord = (mean: number, type: CopsoqScaleType) =>
        bandFor(type, mean) === "Risco" ? 0 : bandFor(type, mean) === "Atenção" ? 1 : 2;
      return ord(a.mean, a.type) - ord(b.mean, b.type) || a.name.localeCompare(b.name, "pt");
    });

  return (
    <main className="min-h-screen bg-white text-black">
      <style>{`
        @media print {
          @page { size: A4; margin: 18mm; }
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .page-break { page-break-before: always; }
        }
        .aep-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .aep-table th, .aep-table td { border: 1px solid #d4d4d8; padding: 6px 8px; text-align: left; vertical-align: top; }
        .aep-table th { background: #f5f5f4; font-weight: 600; }
        .aep-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; color: #fff; }
      `}</style>

      <div className="container max-w-4xl py-8 space-y-8">
        <div className="no-print flex justify-between items-center gap-2 border-b pb-3 mb-4">
          <p className="text-xs text-neutral-500">Pré-visualização — use o botão para gerar PDF via impressão do navegador.</p>
          <button onClick={() => window.print()}
            className="rounded bg-emerald-700 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-800">
            Imprimir / Salvar PDF
          </button>
        </div>

        <header className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-neutral-600">Anexo à AEP — NR-17 / Inventário de Riscos NR-1</p>
          <h1 className="text-2xl font-bold">Relatório de Avaliação de Fatores Psicossociais</h1>
          <p className="text-sm">Empresa: <strong>{company.name}</strong>
            {company.cnpj ? <> · CNPJ {company.cnpj}</> : null}
            {company.sector ? <> · Setor: {company.sector}</> : null}
            {company.size_range ? <> · Porte: {company.size_range}</> : null}
          </p>
          <p className="text-sm">Rodada de rastreio: <strong>#{target.round_no}</strong>
            {" · "}Aberta em {fmtDate(target.opened_at)}
            {" · "}Encerrada em {fmtDate(target.closed_at)}
            {" · "}Devolutiva comunicada aos trabalhadores em {fmtDate(target.devolutiva_communicated_at)}
          </p>
        </header>

        <section>
          <h2 className="text-lg font-semibold mb-2">1. Metodologia</h2>
          <p className="text-sm leading-relaxed">
            Esta avaliação atende à <strong>NR-1 (Portaria MTE nº 1.419/2024)</strong> e à <strong>NR-17</strong> quanto
            aos fatores de risco psicossociais relacionados ao trabalho. Foi aplicado o instrumento
            <strong> COPSOQ II</strong> (Copenhagen Psychosocial Questionnaire — Pejtersen et al., 2010; adaptação
            portuguesa de Silva et al., 2011), em link anônimo único por empresa, sem identificação nominal dos
            respondentes. Resultados publicados respeitam o n mínimo por recorte de <strong>{stats.min_recorte}</strong>
            respondentes para evitar reidentificação. Complementarmente, foi disponibilizado o <strong>PHQ-9</strong>
            (Santos et al., 2013) para triagem individual com encaminhamento a SUS/CVV — os dados clínicos individuais
            não são acessados pela empresa.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">2. Adesão</h2>
          <table className="aep-table">
            <thead><tr><th>Onda</th><th>Agendados</th><th>Enviados</th><th>Concluídos</th><th>Taxa de conclusão</th></tr></thead>
            <tbody>
              {(["copsoq", "phq9", "ecig", "psicossocial", "assedio_sexual"] as const).map((w) => {
                const x = target.waves[w] || { scheduled: 0, sent: 0, completed: 0 };
                const rate = x.sent > 0 ? Math.round((x.completed / x.sent) * 100) : 0;
                return (
                  <tr key={w}>
                    <td className="uppercase">{w}</td>
                    <td>{x.scheduled}</td><td>{x.sent}</td><td>{x.completed}</td><td>{rate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">3. Resultados COPSOQ II por escala</h2>
          {target.copsoq.hidden ? (
            <p className="text-sm text-neutral-600">
              <em>Recorte oculto:</em> número de respondentes COPSOQ ({target.copsoq.n}) abaixo do n mínimo
              ({stats.min_recorte}). Necessário reforçar adesão antes da publicação.
            </p>
          ) : (
            <>
              <p className="text-sm mb-2">n = <strong>{target.copsoq.n}</strong> respondentes COPSOQ nesta rodada.
                {prev && !prev.copsoq.hidden ? <> Comparação com rodada #{prev.round_no} (n = {prev.copsoq.n}).</> : null}
              </p>
              <table className="aep-table">
                <thead>
                  <tr>
                    <th>Escala</th><th>Tipo</th><th>Média (0-100)</th><th>Faixa</th>
                    {prev && !prev.copsoq.hidden ? <th>Δ vs #{prev.round_no}</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {scaleRows.map((r) => {
                    const band = bandFor(r.type, r.mean);
                    return (
                      <tr key={r.id}>
                        <td>{r.name}</td>
                        <td>{r.type === "positive" ? "Recurso" : "Exigência/sintoma"}</td>
                        <td>{r.mean.toFixed(1)}</td>
                        <td><span className="aep-badge" style={{ backgroundColor: bandColor(band) }}>{band}</span></td>
                        {prev && !prev.copsoq.hidden ? (
                          <td>
                            {r.delta === null ? "—" :
                              <span style={{ color: (r.type === "positive" ? r.delta > 0 : r.delta < 0) ? "#0d7a5f" : r.delta === 0 ? "#52525b" : "#b91c1c" }}>
                                {r.delta > 0 ? "+" : ""}{r.delta}
                              </span>}
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-xs text-neutral-600 mt-2">
                Faixas COPSOQ II PT (Silva et al., 2011) — <em>positivas</em>: ≥75 Saudável, 50–75 Atenção, &lt;50 Risco;
                <em> negativas</em>: ≤25 Saudável, 25–50 Atenção, &gt;50 Risco.
              </p>
            </>
          )}
        </section>

        {!target.phq9.hidden && target.phq9.n > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-2">4. Distribuição PHQ-9 (agregada, anônima)</h2>
            <p className="text-sm mb-2">n = <strong>{target.phq9.n}</strong> respondentes PHQ-9.</p>
            <table className="aep-table">
              <thead><tr><th>Faixa</th><th>n</th><th>%</th></tr></thead>
              <tbody>
                {(["minimal","mild","moderate","moderately_severe","severe"] as const).map((k) => {
                  const v = target.phq9.severity_dist[k] || 0;
                  const label = { minimal: "Mínimo", mild: "Leve", moderate: "Moderado", moderately_severe: "Mod-grave", severe: "Grave" }[k];
                  const pct = target.phq9.n > 0 ? Math.round((v / target.phq9.n) * 100) : 0;
                  return <tr key={k}><td>{label}</td><td>{v}</td><td>{pct}%</td></tr>;
                })}
              </tbody>
            </table>
            <p className="text-xs text-neutral-600 mt-2">
              Os scores individuais e dados de identificação <strong>não</strong> são acessados pela empresa.
              Os respondentes recebem orientação direta e encaminhamento ao SUS/CVV quando aplicável.
            </p>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold mb-2">5. Devolutiva aos trabalhadores</h2>
          <p className="text-sm">Data de comunicação: <strong>{fmtDate(target.devolutiva_communicated_at)}</strong></p>
          {target.devolutiva_notes && (
            <div className="mt-2 text-sm border-l-4 border-emerald-700 pl-3 whitespace-pre-wrap">
              {target.devolutiva_notes}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">6. Próximos passos</h2>
          <p className="text-sm">
            Os achados em faixa <strong>Risco</strong> e <strong>Atenção</strong> integram o plano de ação do
            Inventário de Riscos da NR-1, conforme hierarquia das medidas de prevenção (subitens 1.4.1 "g" e
            1.5.5.1.2 da NR-1). O acompanhamento ocorrerá na próxima rodada de rastreio.
          </p>
        </section>

        <footer className="text-xs text-neutral-500 border-t pt-3 mt-8">
          Documento gerado por Cuidar+ Trabalho · cuidarmaisbrasil.life · Material orientativo, não substitui a
          interpretação da legislação vigente.
        </footer>

        <div className="space-y-3 text-sm pt-12">
          <p>Responsável técnico:</p>
          <div className="border-b border-neutral-400 h-8" />
          <p>Assinatura e data</p>
        </div>
      </div>
    </main>
  );
};

export default AepReport;
