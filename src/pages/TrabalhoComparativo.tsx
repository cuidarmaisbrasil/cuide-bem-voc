import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GitCompareArrows, TrendingDown, TrendingUp, Minus } from "lucide-react";

interface RoundStat {
  round_no: number;
  opened_at: string | null;
  status: string;
  waves: Record<string, { scheduled: number; sent: number; completed: number }>;
  copsoq: { n: number; hidden: boolean; scales: Record<string, { mean: number; n: number }> };
  phq9: { n: number; hidden: boolean; severity_dist: Record<string, number> };
  psicossocial: { n: number; hidden: boolean; IGAP: number; flagged_pct: number };
  assedio_sexual: { n: number; hidden: boolean; MDiSH_total: number; any_endorsed_pct: number };
}

const dt = (v?: string | null) => (v ? new Date(v).toLocaleDateString("pt-BR") : "—");

const Delta = ({ from, to, lowerIsBetter = true }: { from?: number; to?: number; lowerIsBetter?: boolean }) => {
  if (typeof from !== "number" || typeof to !== "number") return <span className="text-muted-foreground">—</span>;
  const d = +(to - from).toFixed(2);
  if (Math.abs(d) < 0.05)
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Minus className="h-3 w-3" /> estável
      </span>
    );
  const better = lowerIsBetter ? d < 0 : d > 0;
  const Icon = d > 0 ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 ${better ? "text-primary" : "text-destructive"}`}>
      <Icon className="h-3 w-3" />
      {d > 0 ? "+" : ""}
      {d}
    </span>
  );
};

export default function TrabalhoComparativo() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [rounds, setRounds] = useState<RoundStat[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    document.title = "Comparação entre ciclos — Cuidar+ Trabalho";
    if (!loading && !user) navigate("/trabalho");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: co } = await supabase
        .from("companies")
        .select("id,name")
        .eq("owner_user_id", user.id)
        .maybeSingle();
      if (!co) return setBusy(false);
      setCompanyName(co.name);
      const { data: sess } = await supabase.auth.getSession();
      const base = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${base}/functions/v1/wellness-company-stats?company_id=${co.id}&period=all`, {
        headers: {
          Authorization: `Bearer ${sess.session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      const json = await res.json();
      setRounds(json?.rounds ?? []);
      setBusy(false);
    })();
  }, [user]);

  const scaleIds = useMemo(() => {
    const s = new Set<string>();
    rounds.forEach((r) => Object.keys(r.copsoq?.scales ?? {}).forEach((k) => s.add(k)));
    return Array.from(s).sort();
  }, [rounds]);

  const first = rounds[0];
  const last = rounds[rounds.length - 1];

  const adherence = (r: RoundStat) => {
    let sent = 0;
    let completed = 0;
    Object.values(r.waves ?? {}).forEach((w) => {
      sent += w.sent ?? 0;
      completed += w.completed ?? 0;
    });
    return sent ? Math.round((completed / sent) * 100) : 0;
  };

  const phqModPlus = (r: RoundStat) => {
    const d = r.phq9?.severity_dist ?? {};
    const total = Object.values(d).reduce((a, b) => a + (b as number), 0);
    if (!total) return undefined;
    const mod = ["moderada", "moderadamente grave", "grave", "moderate", "moderately severe", "severe"].reduce(
      (a, k) => a + ((d as any)[k] ?? 0),
      0,
    );
    return Math.round((mod / total) * 100);
  };

  if (loading || busy)
    return <main className="container py-20 text-center text-muted-foreground">Carregando…</main>;

  if (rounds.length < 2)
    return (
      <main className="container max-w-2xl py-20">
        <Card className="p-6 space-y-3 text-center">
          <p className="text-muted-foreground">
            A comparação fica disponível a partir do segundo ciclo concluído.
          </p>
          <Button onClick={() => navigate("/trabalho/painel")}>Voltar ao painel</Button>
        </Card>
      </main>
    );

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-5xl py-8 space-y-6">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2 mb-1" onClick={() => navigate("/trabalho/painel")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao painel
          </Button>
          <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5 text-primary" /> Comparação entre ciclos
          </h1>
          <p className="text-sm text-muted-foreground">
            {companyName} · {rounds.length} ciclos · variação do ciclo {first.round_no} ao {last.round_no}
          </p>
        </div>

        <Card className="p-5 overflow-x-auto">
          <h2 className="font-display text-lg font-semibold mb-3">Visão geral</h2>
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-2">Indicador</th>
                {rounds.map((r) => (
                  <th key={r.round_no} className="py-2">
                    Ciclo {r.round_no}
                    <div className="font-normal">{dt(r.opened_at)}</div>
                  </th>
                ))}
                <th className="py-2">Variação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr>
                <td className="py-2">Adesão (%)</td>
                {rounds.map((r) => (
                  <td key={r.round_no} className="py-2">{adherence(r)}%</td>
                ))}
                <td className="py-2">
                  <Delta from={adherence(first)} to={adherence(last)} lowerIsBetter={false} />
                </td>
              </tr>
              <tr>
                <td className="py-2">PHQ-9 moderado+ (%)</td>
                {rounds.map((r) => (
                  <td key={r.round_no} className="py-2">
                    {r.phq9?.hidden ? "oculto" : `${phqModPlus(r) ?? 0}%`}
                  </td>
                ))}
                <td className="py-2">
                  <Delta from={phqModPlus(first)} to={phqModPlus(last)} />
                </td>
              </tr>
              <tr>
                <td className="py-2">IGAP (assédio moral)</td>
                {rounds.map((r) => (
                  <td key={r.round_no} className="py-2">
                    {r.psicossocial?.hidden ? "oculto" : r.psicossocial?.IGAP}
                  </td>
                ))}
                <td className="py-2">
                  <Delta from={first.psicossocial?.IGAP} to={last.psicossocial?.IGAP} />
                </td>
              </tr>
              <tr>
                <td className="py-2">MDiSH médio</td>
                {rounds.map((r) => (
                  <td key={r.round_no} className="py-2">
                    {r.assedio_sexual?.hidden ? "oculto" : r.assedio_sexual?.MDiSH_total}
                  </td>
                ))}
                <td className="py-2">
                  <Delta from={first.assedio_sexual?.MDiSH_total} to={last.assedio_sexual?.MDiSH_total} />
                </td>
              </tr>
            </tbody>
          </table>
        </Card>

        {scaleIds.length > 0 && (
          <Card className="p-5 overflow-x-auto">
            <h2 className="font-display text-lg font-semibold mb-3">Dimensões COPSOQ II (média por ciclo)</h2>
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="py-2">Dimensão</th>
                  {rounds.map((r) => (
                    <th key={r.round_no} className="py-2">Ciclo {r.round_no}</th>
                  ))}
                  <th className="py-2">Variação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {scaleIds.map((id) => (
                  <tr key={id}>
                    <td className="py-2">{id}</td>
                    {rounds.map((r) => (
                      <td key={r.round_no} className="py-2">
                        {r.copsoq?.scales?.[id]?.mean ?? "—"}
                      </td>
                    ))}
                    <td className="py-2">
                      <Delta from={first.copsoq?.scales?.[id]?.mean} to={last.copsoq?.scales?.[id]?.mean} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground mt-3">
              Recortes com número de respondentes abaixo do mínimo aparecem como "oculto" para preservar o
              anonimato.
            </p>
          </Card>
        )}

        <div className="flex flex-wrap gap-2">
          {rounds.map((r) => (
            <Badge key={r.round_no} variant="outline">
              Ciclo {r.round_no}: {r.status === "open" ? "em andamento" : "concluído"}
            </Badge>
          ))}
        </div>
      </div>
    </main>
  );
}
