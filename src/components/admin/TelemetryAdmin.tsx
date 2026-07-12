// Dashboard MVP Fase 1 — Telemetria comportamental
// Mostra sessões recentes, distribuição de tempos por questão e scores de autenticidade.

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { format } from "date-fns";

type ScoreRow = {
  id: string;
  session_id: string;
  instrument: string;
  authenticity_score: number;
  flag: "ok" | "suspect" | "reject";
  n_items: number | null;
  median_time_ms: number | null;
  total_time_ms: number | null;
  straightlining: boolean;
  had_paste: boolean;
  blur_count: number;
  fast_ratio: number | null;
  signals: { reasons?: string[]; times_count?: number } | null;
  created_at: string;
};

type SessionRow = {
  id: string;
  session_token: string;
  instrument: string | null;
  company_id: string | null;
  device_type: string | null;
  browser_name: string | null;
  os_name: string | null;
  timezone: string | null;
  started_at: string;
  submitted_at: string | null;
  flush_count: number;
};

function fmtMs(ms: number | null | undefined) {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

function flagBadge(flag: ScoreRow["flag"]) {
  const map = {
    ok: { label: "OK", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
    suspect: { label: "Suspeito", cls: "bg-amber-100 text-amber-800 border-amber-300" },
    reject: { label: "Rejeitar", cls: "bg-red-100 text-red-800 border-red-300" },
  }[flag];
  return <Badge variant="outline" className={map.cls}>{map.label}</Badge>;
}

export function TelemetryAdmin() {
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [sc, se] = await Promise.all([
      supabase
        .from("telemetry_scores")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("telemetry_sessions")
        .select("id, session_token, instrument, company_id, device_type, browser_name, os_name, timezone, started_at, submitted_at, flush_count")
        .order("started_at", { ascending: false })
        .limit(200),
    ]);
    setScores((sc.data ?? []) as ScoreRow[]);
    setSessions((se.data ?? []) as SessionRow[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  // stats agregados
  const stats = useMemo(() => {
    const total = scores.length;
    const ok = scores.filter((s) => s.flag === "ok").length;
    const suspect = scores.filter((s) => s.flag === "suspect").length;
    const reject = scores.filter((s) => s.flag === "reject").length;
    const withStraight = scores.filter((s) => s.straightlining).length;
    const withPaste = scores.filter((s) => s.had_paste).length;
    const medians = scores.map((s) => s.median_time_ms).filter((n): n is number => n != null);
    const overallMedian = medians.length
      ? medians.sort((a, b) => a - b)[Math.floor(medians.length / 2)]
      : null;
    return { total, ok, suspect, reject, withStraight, withPaste, overallMedian };
  }, [scores]);

  // Histograma simples de median_time_ms por respondente
  const histogram = useMemo(() => {
    const buckets = [
      { label: "< 1s", max: 1000, count: 0 },
      { label: "1–3s", max: 3000, count: 0 },
      { label: "3–5s", max: 5000, count: 0 },
      { label: "5–10s", max: 10000, count: 0 },
      { label: "10–20s", max: 20000, count: 0 },
      { label: "> 20s", max: Infinity, count: 0 },
    ];
    for (const s of scores) {
      if (s.median_time_ms == null) continue;
      const b = buckets.find((x) => s.median_time_ms! < x.max);
      if (b) b.count++;
    }
    const max = Math.max(1, ...buckets.map((b) => b.count));
    return buckets.map((b) => ({ ...b, pct: (b.count / max) * 100 }));
  }, [scores]);

  const sessionMap = useMemo(() => {
    const m = new Map<string, SessionRow>();
    sessions.forEach((s) => m.set(s.id, s));
    return m;
  }, [sessions]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Telemetria comportamental (Fase 1 — MVP)</h3>
          <p className="text-xs text-muted-foreground">
            Detecção de fraude/bot em questionários. Sinais anônimos (timing, foco, colagem, fingerprint).
            Score começa em 1.0 e desconta por red flags; abaixo de 0.4 sugere descarte.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <Stat label="Sessões" value={sessions.length} />
        <Stat label="Scores calculados" value={stats.total} />
        <Stat label="OK" value={stats.ok} tone="ok" />
        <Stat label="Suspeitos" value={stats.suspect} tone="warn" />
        <Stat label="Rejeitar" value={stats.reject} tone="bad" />
        <Stat label="Tempo mediano" value={fmtMs(stats.overallMedian)} />
      </div>

      <Card className="p-4">
        <h4 className="text-sm font-semibold mb-3">Distribuição do tempo mediano por item (respondente)</h4>
        <div className="space-y-1.5">
          {histogram.map((b) => (
            <div key={b.label} className="flex items-center gap-2 text-xs">
              <div className="w-16 text-muted-foreground text-right">{b.label}</div>
              <div className="flex-1 bg-muted rounded h-4 overflow-hidden">
                <div
                  className="h-full bg-primary/70"
                  style={{ width: `${b.pct}%` }}
                />
              </div>
              <div className="w-8 font-mono text-right">{b.count}</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Tempo mediano por item &lt; 1 s é fortemente suspeito (leitura impossível). Barras não normalizadas absolutas — a maior recebe 100%.
        </p>
      </Card>

      <Card className="p-4">
        <h4 className="text-sm font-semibold mb-3">Últimas sessões pontuadas</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground border-b">
              <tr>
                <th className="py-2 pr-3">Quando</th>
                <th className="pr-3">Instrumento</th>
                <th className="pr-3">Device</th>
                <th className="pr-3">Score</th>
                <th className="pr-3">Flag</th>
                <th className="pr-3">Itens</th>
                <th className="pr-3">Med</th>
                <th className="pr-3">Total</th>
                <th className="pr-3">Sinais</th>
              </tr>
            </thead>
            <tbody>
              {scores.length === 0 && (
                <tr><td colSpan={9} className="py-6 text-center text-muted-foreground">
                  {loading ? "Carregando…" : "Nenhum score ainda. Faça uma coleta de teste para gerar dados."}
                </td></tr>
              )}
              {scores.map((s) => {
                const sess = sessionMap.get(s.session_id);
                const reasons = s.signals?.reasons ?? [];
                return (
                  <tr key={s.id} className="border-b hover:bg-muted/30">
                    <td className="py-1.5 pr-3 whitespace-nowrap">{format(new Date(s.created_at), "dd/MM HH:mm")}</td>
                    <td className="pr-3 font-mono">{s.instrument}</td>
                    <td className="pr-3 text-muted-foreground">
                      {sess ? `${sess.device_type ?? "?"} · ${sess.browser_name ?? "?"}` : "—"}
                    </td>
                    <td className="pr-3 font-mono">{s.authenticity_score.toFixed(3)}</td>
                    <td className="pr-3">{flagBadge(s.flag)}</td>
                    <td className="pr-3">{s.n_items ?? "—"}</td>
                    <td className="pr-3">{fmtMs(s.median_time_ms)}</td>
                    <td className="pr-3">{fmtMs(s.total_time_ms)}</td>
                    <td className="pr-3">
                      <div className="flex flex-wrap gap-1">
                        {s.straightlining && <Badge variant="outline" className="text-[10px]">straight</Badge>}
                        {s.had_paste && <Badge variant="outline" className="text-[10px]">paste</Badge>}
                        {s.blur_count > 5 && <Badge variant="outline" className="text-[10px]">blur×{s.blur_count}</Badge>}
                        {reasons.filter((r) => !["straightlining", "paste_event"].includes(r)).map((r) => (
                          <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="text-sm font-semibold mb-3">Sessões (últimas 20)</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground border-b">
              <tr>
                <th className="py-2 pr-3">Início</th>
                <th className="pr-3">Instr.</th>
                <th className="pr-3">Device</th>
                <th className="pr-3">SO</th>
                <th className="pr-3">Browser</th>
                <th className="pr-3">TZ</th>
                <th className="pr-3">Flushes</th>
                <th className="pr-3">Submit</th>
              </tr>
            </thead>
            <tbody>
              {sessions.slice(0, 20).map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="py-1.5 pr-3 whitespace-nowrap">{format(new Date(s.started_at), "dd/MM HH:mm")}</td>
                  <td className="pr-3 font-mono">{s.instrument ?? "—"}</td>
                  <td className="pr-3">{s.device_type ?? "—"}</td>
                  <td className="pr-3">{s.os_name ?? "—"}</td>
                  <td className="pr-3">{s.browser_name ?? "—"}</td>
                  <td className="pr-3 text-muted-foreground">{s.timezone ?? "—"}</td>
                  <td className="pr-3">{s.flush_count}</td>
                  <td className="pr-3">{s.submitted_at ? "sim" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: "ok" | "warn" | "bad" }) {
  const toneCls =
    tone === "ok" ? "text-emerald-700" :
    tone === "warn" ? "text-amber-700" :
    tone === "bad" ? "text-red-700" : "";
  return (
    <Card className="p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${toneCls}`}>{value}</div>
    </Card>
  );
}
