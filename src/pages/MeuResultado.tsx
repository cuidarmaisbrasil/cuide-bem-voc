import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { toast } from "sonner";

interface Section { section_key: string; severity: string; title: string; body: string; metadata: any }
interface Timings {
  n_items: number;
  total_ms: number;
  mean_ms: number;
  median_ms: number;
  min_ms: number;
  max_ms: number;
  per_item: { n: number; ms: number }[];
}
interface WaveReport { wave: string; round_no: number; completed_at: string; metrics: any; sections: Section[]; timings?: Timings | null }
interface TimingComparisonRow { round_no: number; is_retest?: boolean; total_ms: number; median_ms: number; mean_ms: number; n_items: number; completed_at: string }
interface ReportPayload {
  company: { name: string };
  global_sections: Section[];
  reports: WaveReport[];
  timing_comparisons?: Record<string, TimingComparisonRow[]>;
}

const WAVE_LABEL: Record<string, string> = {
  phq9: "PHQ-9 (humor/depressão)",
  phq9_retest: "PHQ-9 (reteste)",
  gad7: "GAD-7 (ansiedade)",
  gad7_retest: "GAD-7 (reteste)",
  ecig: "ECIG (clima do grupo)",
  copsoq: "COPSOQ (bem-estar no trabalho)",
  psicossocial: "LIPT-60 (clima psicossocial)",
  assedio_sexual: "MDiSH + SHRAS (assédio sexual)",
};

function fmtMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 1000) return `${ms} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)} s`;
  const m = Math.floor(s / 60);
  const rs = Math.round(s - m * 60);
  return `${m} min ${rs.toString().padStart(2, "0")} s`;
}

function TimingsBlock({ timings }: { timings: Timings }) {
  const { per_item, median_ms, mean_ms, total_ms, min_ms, max_ms, n_items } = timings;
  const maxMs = Math.max(...per_item.map((p) => p.ms), 1);
  return (
    <div className="space-y-2 border-t pt-3">
      <p className="text-sm font-semibold">Tempo de resposta</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <div className="rounded bg-muted/50 p-2">
          <div className="text-muted-foreground">Total</div>
          <div className="font-semibold text-sm">{fmtMs(total_ms)}</div>
        </div>
        <div className="rounded bg-muted/50 p-2">
          <div className="text-muted-foreground">Mediana / questão</div>
          <div className="font-semibold text-sm">{fmtMs(median_ms)}</div>
        </div>
        <div className="rounded bg-muted/50 p-2">
          <div className="text-muted-foreground">Média / questão</div>
          <div className="font-semibold text-sm">{fmtMs(mean_ms)}</div>
        </div>
        <div className="rounded bg-muted/50 p-2">
          <div className="text-muted-foreground">Mín – Máx</div>
          <div className="font-semibold text-sm">{fmtMs(min_ms)} – {fmtMs(max_ms)}</div>
        </div>
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Ver tempo por questão ({n_items} itens)
        </summary>
        <div className="mt-2 space-y-1">
          {per_item.map((it) => (
            <div key={it.n} className="flex items-center gap-2">
              <span className="w-8 text-right font-mono text-[11px] text-muted-foreground">Q{it.n}</span>
              <div className="flex-1 h-2 rounded bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary/70"
                  style={{ width: `${(it.ms / maxMs) * 100}%` }}
                />
              </div>
              <span className="w-16 text-right font-mono text-[11px]">{fmtMs(it.ms)}</span>
            </div>
          ))}
        </div>
      </details>
      <p className="text-[10px] text-muted-foreground">
        Coletado apenas para você e para métricas de qualidade — nenhum conteúdo escrito é registrado.
      </p>
    </div>
  );
}

function TimingComparison({ rows, waveLabel }: { rows: TimingComparisonRow[]; waveLabel: string }) {
  if (rows.length < 2) return null;
  const first = rows[0];
  const last = rows[rows.length - 1];
  const deltaTotal = last.total_ms - first.total_ms;
  const pct = first.total_ms ? Math.round((deltaTotal / first.total_ms) * 100) : 0;
  const trend = deltaTotal === 0 ? "estável" : deltaTotal < 0 ? "mais rápido" : "mais lento";
  return (
    <div className="border-t pt-3 space-y-2">
      <p className="text-sm font-semibold">Comparação entre ciclos — {waveLabel}</p>
      <div className="text-xs text-muted-foreground">
        Do 1º ao último ciclo você ficou <strong className="text-foreground">{trend}</strong>
        {deltaTotal !== 0 && <> ({pct > 0 ? "+" : ""}{pct}% no tempo total)</>}.
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead className="text-muted-foreground">
            <tr className="border-b">
              <th className="text-left py-1 pr-2">Ciclo</th>
              <th className="text-right py-1 pr-2">Itens</th>
              <th className="text-right py-1 pr-2">Total</th>
              <th className="text-right py-1 pr-2">Mediana</th>
              <th className="text-right py-1">Data</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.round_no}-${r.is_retest ? "r" : "n"}`} className="border-b last:border-0">
                <td className="py-1 pr-2 font-mono">
                  {r.round_no}{r.is_retest ? " (reteste)" : ""}
                </td>
                <td className="py-1 pr-2 text-right">{r.n_items}</td>
                <td className="py-1 pr-2 text-right">{fmtMs(r.total_ms)}</td>
                <td className="py-1 pr-2 text-right">{fmtMs(r.median_ms)}</td>
                <td className="py-1 text-right">{new Date(r.completed_at).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderBody(body: string) {
  // simple markdown-ish: **bold**, • bullets and newlines
  const lines = body.split("\n");
  return lines.map((ln, i) => {
    const html = ln.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    return <p key={i} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
  });
}

export default function MeuResultado() {
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get("code") || "");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportPayload | null>(null);

  // View-only protections: block print, copy, context menu, drag, selection and save/print shortcuts.
  useEffect(() => {
    const prevent = (e: Event) => { e.preventDefault(); };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ["p", "s", "c", "a", "x"].includes(k)) {
        e.preventDefault();
        toast.info("Visualização apenas — salvar, copiar e imprimir estão desativados.");
      }
    };
    const beforePrint = () => {
      toast.info("Impressão desativada — este relatório é apenas para visualização.");
    };
    document.addEventListener("copy", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("dragstart", prevent);
    document.addEventListener("keydown", onKey);
    window.addEventListener("beforeprint", beforePrint);
    const style = document.createElement("style");
    style.id = "meuresultado-noprint";
    style.textContent = `@media print { body { display:none !important; } } .mr-noselect { -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; }`;
    document.head.appendChild(style);
    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("dragstart", prevent);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeprint", beforePrint);
      document.getElementById("meuresultado-noprint")?.remove();
    };
  }, []);


  const submit = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const base = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${base}/functions/v1/wellness-fetch-individual-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ code: code.trim() }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error === "invalid_code" ? "Código não encontrado" : json.error);
      setData(json);
    } catch (e: any) {
      toast.error(e.message || "Erro ao buscar relatório");
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <main className="min-h-screen bg-background py-12">
        <div className="container max-w-md space-y-4">
          <h1 className="font-display text-2xl font-semibold text-center">Meu relatório</h1>
          <p className="text-sm text-muted-foreground text-center">
            Use o código que você recebeu no final do questionário. Ele é o único caminho para acessar seu relatório — preserva seu anonimato perante a empresa.
          </p>
          <Card className="p-6 space-y-3">
            <Label>Código de acesso</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CM-XXXX-XXXX-XXXX"
              className="font-mono tracking-wider"
              autoFocus
            />
            <Button className="w-full" onClick={submit} disabled={loading || !code.trim()}>
              {loading ? "Carregando…" : "Ver meu relatório"}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Não armazenamos o código em claro — se você perdê-lo, não há como recuperar.
            </p>
          </Card>
        </div>
      </main>
    );
  }



  return (
    <main className="min-h-screen bg-background py-8 mr-noselect">
      <div className="container max-w-2xl space-y-5">
        <div className="text-center space-y-1">
          <h1 className="font-display text-2xl font-semibold">Seu relatório pessoal</h1>
          <p className="text-xs text-muted-foreground">{data.company.name}</p>
          <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1 mt-1">
            <Lock className="h-3 w-3" /> Visualização apenas — salvar, copiar e imprimir estão desativados para preservar seu anonimato.
          </p>
        </div>

        {data.global_sections.filter(s => s.section_key === "header" || s.section_key === "intro").map((s, i) => (
          <Card key={i} className="p-5 space-y-2">
            {s.title && <h2 className="font-display text-lg font-semibold">{s.title}</h2>}
            <div className="space-y-1">{renderBody(s.body)}</div>
          </Card>
        ))}

        {data.reports.length === 0 && (
          <Card className="p-6 text-sm text-muted-foreground text-center">
            Você ainda não concluiu nenhum questionário neste programa.
          </Card>
        )}

        {data.reports.map((r) => (
          <Card key={r.wave + r.round_no} className="p-5 space-y-3">
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-lg font-semibold">{WAVE_LABEL[r.wave] || r.wave}</h3>
              <span className="text-[11px] text-muted-foreground">Ciclo {r.round_no} · {new Date(r.completed_at).toLocaleDateString("pt-BR")}</span>
            </div>
            {r.sections.map((s, i) => (
              <div key={i} className="space-y-1 border-t pt-3 first:border-0 first:pt-0">
                {s.title && <p className="text-sm font-semibold">{s.title}</p>}
                <div className="space-y-1">{renderBody(s.body)}</div>
              </div>
            ))}
          </Card>
        ))}

        {data.global_sections.filter(s => s.section_key === "closing" || s.section_key === "disclaimer").map((s, i) => (
          <Card key={i} className="p-5 space-y-2 bg-muted/30">
            {s.title && <h2 className="font-display text-base font-semibold">{s.title}</h2>}
            <div className="space-y-1">{renderBody(s.body)}</div>
          </Card>
        ))}
      </div>
    </main>
  );
}
