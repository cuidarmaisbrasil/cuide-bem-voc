import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Lock, Sparkles, Heart, TrendingUp, TrendingDown, Minus, LifeBuoy, MessageCircleQuestion, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface Section { section_key: string; severity: string; title: string; body: string; metadata: any }
interface Timings {
  n_items: number; total_ms: number; mean_ms: number; median_ms: number; min_ms: number; max_ms: number;
  per_item: { n: number; ms: number }[];
}
interface WaveReport {
  wave: string; round_no: number; completed_at: string;
  metrics: any; sections: Section[]; timings?: Timings | null;
}
interface TimingComparisonRow { round_no: number; is_retest?: boolean; total_ms: number; median_ms: number; mean_ms: number; n_items: number; completed_at: string }
interface ScoreComparisonRow { round_no: number; is_retest?: boolean; completed_at: string; score: number | null; severity: string | null; scores: Record<string, number> | null }
interface ReportPayload {
  company: { name: string };
  global_sections: Section[];
  reports: WaveReport[];
  timing_comparisons?: Record<string, TimingComparisonRow[]>;
  score_comparisons?: Record<string, ScoreComparisonRow[]>;
  needs_referral?: boolean;
}

const WAVE_LABEL: Record<string, string> = {
  phq9: "humor e depressão",
  phq9_retest: "humor e depressão (reteste)",
  gad7: "ansiedade",
  gad7_retest: "ansiedade (reteste)",
  ecig: "clima do seu grupo",
  copsoq: "seu bem-estar no trabalho",
  psicossocial: "clima psicossocial",
  assedio_sexual: "assédio sexual",
};

const SEVERITY_TONE: Record<string, { label: string; color: string; bg: string }> = {
  minimal: { label: "leve", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  mild: { label: "leve a moderado", color: "text-lime-700", bg: "bg-lime-50 border-lime-200" },
  moderate: { label: "moderado", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  moderately_severe: { label: "moderado a alto", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  severe: { label: "alto", color: "text-rose-700", bg: "bg-rose-50 border-rose-200" },
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

/** Simple horizontal bar chart, one row per dimension. Values 0-max scaled. */
function DimensionBars({ scores, max = 100 }: { scores: Record<string, number>; max?: number }) {
  const entries = Object.entries(scores).filter(([, v]) => typeof v === "number");
  if (!entries.length) return null;
  const localMax = Math.max(max, ...entries.map(([, v]) => v as number), 1);
  return (
    <div className="space-y-1.5">
      {entries.map(([k, v]) => {
        const pct = Math.max(2, Math.min(100, ((v as number) / localMax) * 100));
        const tone = v >= localMax * 0.7 ? "bg-rose-400" : v >= localMax * 0.4 ? "bg-amber-400" : "bg-emerald-400";
        return (
          <div key={k} className="flex items-center gap-2 text-[11px]">
            <span className="w-32 truncate text-muted-foreground" title={k}>{k}</span>
            <div className="flex-1 h-2.5 rounded bg-muted overflow-hidden">
              <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="w-10 text-right font-mono">{Math.round(v as number)}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Compare two cycles: score-per-round mini bars. */
function ScoreEvolution({ rows, waveLabel }: { rows: ScoreComparisonRow[]; waveLabel: string }) {
  const values = rows.map((r) => r.score).filter((v): v is number => typeof v === "number");
  const hasScore = values.length >= 2;
  const hasDims = rows.some((r) => r.scores && Object.keys(r.scores).length > 0);
  if (!hasScore && !hasDims) return null;

  let trend: "up" | "down" | "flat" | null = null;
  let delta = 0;
  if (hasScore) {
    delta = values[values.length - 1] - values[0];
    trend = delta === 0 ? "flat" : delta > 0 ? "up" : "down";
  }
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  // For most instruments (PHQ-9, GAD-7, LIPT-60) higher = worse; celebrate a decrease.
  const trendMsg = trend === "down" ? "seu resultado melhorou entre os ciclos" :
                   trend === "up" ? "seu resultado piorou um pouco — vale um olhar" :
                   trend === "flat" ? "seu resultado se manteve estável" : "";
  const maxScore = Math.max(...values, 1);

  return (
    <div className="border-t pt-3 space-y-2">
      <p className="text-sm font-semibold flex items-center gap-2">
        <TrendIcon className="h-4 w-4" /> Sua evolução — {waveLabel}
      </p>
      {trend && <p className="text-xs text-muted-foreground">Você percebeu que {trendMsg}.</p>}
      {hasScore && (
        <div className="space-y-1.5">
          {rows.map((r) => r.score !== null && (
            <div key={`${r.round_no}-${r.is_retest ? "r" : "n"}`} className="flex items-center gap-2 text-[11px]">
              <span className="w-24 text-muted-foreground">
                Ciclo {r.round_no}{r.is_retest ? " (reteste)" : ""}
              </span>
              <div className="flex-1 h-2.5 rounded bg-muted overflow-hidden">
                <div className="h-full bg-primary/70" style={{ width: `${((r.score! / maxScore) * 100).toFixed(0)}%` }} />
              </div>
              <span className="w-10 text-right font-mono">{r.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TimingsBlock({ timings }: { timings: Timings }) {
  const { per_item, median_ms, mean_ms, total_ms, min_ms, max_ms, n_items } = timings;
  const maxMs = Math.max(...per_item.map((p) => p.ms), 1);
  return (
    <div className="space-y-2 border-t pt-3">
      <p className="text-sm font-semibold">Seu ritmo ao responder</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <div className="rounded bg-muted/50 p-2"><div className="text-muted-foreground">Total</div><div className="font-semibold text-sm">{fmtMs(total_ms)}</div></div>
        <div className="rounded bg-muted/50 p-2"><div className="text-muted-foreground">Mediana</div><div className="font-semibold text-sm">{fmtMs(median_ms)}</div></div>
        <div className="rounded bg-muted/50 p-2"><div className="text-muted-foreground">Média</div><div className="font-semibold text-sm">{fmtMs(mean_ms)}</div></div>
        <div className="rounded bg-muted/50 p-2"><div className="text-muted-foreground">Mín – Máx</div><div className="font-semibold text-sm">{fmtMs(min_ms)} – {fmtMs(max_ms)}</div></div>
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Ver tempo por questão ({n_items} itens)</summary>
        <div className="mt-2 space-y-1">
          {per_item.map((it) => (
            <div key={it.n} className="flex items-center gap-2">
              <span className="w-8 text-right font-mono text-[11px] text-muted-foreground">Q{it.n}</span>
              <div className="flex-1 h-2 rounded bg-muted overflow-hidden">
                <div className="h-full bg-primary/70" style={{ width: `${(it.ms / maxMs) * 100}%` }} />
              </div>
              <span className="w-16 text-right font-mono text-[11px]">{fmtMs(it.ms)}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

/** Actions tailored to the reports the person actually has. */
function personalizedActions(reports: WaveReport[]): { title: string; steps: string[] } | null {
  const latest = new Map<string, WaveReport>();
  reports.forEach((r) => {
    const base = r.wave.replace(/_retest$/, "");
    const cur = latest.get(base);
    if (!cur || r.round_no > cur.round_no) latest.set(base, r);
  });

  const steps: string[] = [];

  const phq = latest.get("phq9");
  const gad = latest.get("gad7");
  const copsoq = latest.get("copsoq");
  const lipt = latest.get("psicossocial");

  const phqSev = phq?.metrics?.severity;
  const gadSev = gad?.metrics?.severity;

  if (phqSev === "severe" || phqSev === "moderately_severe") {
    steps.push("Marque uma consulta com um profissional de saúde mental nesta semana — pode ser pelo SUS (Meu SUS Digital) ou pelo seu plano.");
  } else if (phqSev === "moderate") {
    steps.push("Reserve 20 minutos, 3 vezes na semana, para uma atividade que costumava te fazer bem — mesmo sem vontade no início.");
  }

  if (gadSev === "severe") {
    steps.push("Experimente uma respiração 4-7-8 (inspira 4s, segura 7s, solta 8s) duas vezes ao dia — reduz a resposta de ansiedade a curto prazo.");
  } else if (gadSev === "moderate" || gadSev === "mild") {
    steps.push("Anote antes de dormir três coisas que você tem controle sobre amanhã — reduz a ruminação noturna.");
  }

  const copDim = copsoq?.metrics?.scores as Record<string, number> | undefined;
  if (copDim) {
    const entries = Object.entries(copDim).sort((a, b) => (b[1] as number) - (a[1] as number));
    const top = entries[0];
    if (top && (top[1] as number) >= 60) {
      steps.push(`Você marcou alto em "${top[0]}" no trabalho — na próxima 1:1 com sua liderança, traga isso como pauta com um exemplo concreto.`);
    }
  }

  const liptDim = lipt?.metrics?.scores as Record<string, number> | undefined;
  if (liptDim) {
    const someHigh = Object.values(liptDim).some((v) => (v as number) >= 1.5);
    if (someHigh) {
      steps.push("Registre por escrito, quando acontecer, situações que você percebeu como hostis no ambiente — data, quem, o que — isso protege você e ajuda a organizar decisões.");
    }
  }

  if (!steps.length) {
    steps.push("Mantenha o que está funcionando: sono regular, algum movimento no corpo e ao menos uma conexão social significativa por semana.");
    steps.push("Se algo mudar (sono, apetite, humor por mais de duas semanas), volte aqui e responda novamente — a comparação com este ciclo vai te ajudar.");
  }

  return { title: "O que você pode fazer nas próximas duas semanas", steps: steps.slice(0, 3) };
}

function renderBody(body: string) {
  const lines = body.split("\n");
  return lines.map((ln, i) => {
    const html = ln.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    return <p key={i} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
  });
}

function ReferralCard() {
  return (
    <Card className="p-5 border-rose-200 bg-rose-50/50 space-y-3">
      <div className="flex items-center gap-2">
        <LifeBuoy className="h-5 w-5 text-rose-600" />
        <h3 className="font-display text-base font-semibold text-rose-800">Se você quiser conversar com alguém agora</h3>
      </div>
      <p className="text-sm text-rose-900/90">Seu resultado mostrou um nível que merece atenção. Você não precisa lidar com isso sozinho(a) — aqui estão canais gratuitos e confiáveis:</p>
      <ul className="text-sm space-y-2">
        <li><strong>CVV — Centro de Valorização da Vida:</strong> <a className="underline" href="tel:188">188</a> (24h, gratuito) ou <a className="underline" href="https://cvv.org.br/chat/" target="_blank" rel="noreferrer">chat online</a>.</li>
        <li><strong>Meu SUS Digital:</strong> <a className="underline" href="https://meususdigital.saude.gov.br/" target="_blank" rel="noreferrer">agende consulta psicológica ou psiquiátrica</a> pelo SUS.</li>
        <li><strong>CAPS mais próximo:</strong> encontre em <a className="underline" href="https://www.gov.br/saude/pt-br/acesso-a-informacao/acoes-e-programas/caps" target="_blank" rel="noreferrer">gov.br/saude</a> — atendimento gratuito de saúde mental.</li>
        <li><strong>Emergência:</strong> se houver risco imediato, ligue <a className="underline" href="tel:192">192 (SAMU)</a> ou vá a uma UPA.</li>
      </ul>
      <p className="text-[11px] text-rose-900/70">Este relatório é anônimo — nem a empresa nem ninguém que trabalhe com você tem acesso a essas informações.</p>
    </Card>
  );
}

function ExtendedContent({ reports }: { reports: WaveReport[] }) {
  const [open, setOpen] = useState(false);
  const relevant = reports.some((r) => ["moderate", "moderately_severe", "severe"].includes(r.metrics?.severity));
  if (!relevant) return null;
  return (
    <Card className="p-5 space-y-3">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between text-left">
        <span className="font-display text-base font-semibold">Quer entender melhor esse resultado?</span>
        <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-3 text-sm leading-relaxed pt-2 border-t">
          <p><strong>O que quer dizer um resultado "moderado" ou "alto"?</strong> Significa que, no momento em que você respondeu, alguns sintomas estão presentes com frequência ou intensidade suficiente para atrapalhar a vida cotidiana. Não é um diagnóstico — é um sinal.</p>
          <p><strong>Por que isso não é "frescura" nem preguiça.</strong> Sintomas de depressão e ansiedade envolvem alterações reais em sono, energia, foco e regulação emocional. Você não escolhe estar assim, e força de vontade sozinha raramente resolve.</p>
          <p><strong>O que costuma funcionar (com evidência):</strong> Psicoterapia, especialmente Terapia Cognitivo-Comportamental (TCC), tem forte respaldo científico para depressão e ansiedade. Em casos moderados a graves, tratamento medicamentoso pode ser indicado por psiquiatra — e não é sinal de fraqueza.</p>
          <p><strong>Sinais para procurar ajuda logo:</strong> pensamentos de se machucar, sono comprometido há semanas, perda de prazer generalizada, uso crescente de álcool ou substâncias para "aguentar".</p>
          <p><strong>Sobre a empresa:</strong> este relatório é seu e apenas seu. A empresa só vê dados agregados e anônimos. Buscar ajuda é uma decisão privada.</p>
        </div>
      )}
    </Card>
  );
}

function QuestionBox({ code }: { code: string }) {
  const [q, setQ] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async () => {
    if (q.trim().length < 3) return;
    setSending(true);
    try {
      const base = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${base}/functions/v1/wellness-individual-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ code, question: q.trim() }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setSent(true);
      setQ("");
      toast.success("Sua dúvida foi enviada com anonimato.");
    } catch (e: any) {
      toast.error("Não foi possível enviar. Tente novamente em instantes.");
    } finally {
      setSending(false);
    }
  };
  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center gap-2">
        <MessageCircleQuestion className="h-5 w-5 text-primary" />
        <h3 className="font-display text-base font-semibold">Ficou com alguma dúvida?</h3>
      </div>
      <p className="text-xs text-muted-foreground">Escreva abaixo. Sua mensagem chega de forma anônima à equipe do Cuidar+ — nem a empresa nem sua liderança veem esse texto.</p>
      {sent ? (
        <p className="text-sm text-emerald-700">✓ Recebemos sua dúvida. Se quiser, pode enviar outra.</p>
      ) : null}
      <Textarea value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ex.: o que significa 'moderado' no meu resultado? Como marcar consulta pelo SUS?" rows={3} maxLength={2000} />
      <div className="flex justify-end">
        <Button onClick={submit} disabled={sending || q.trim().length < 3} size="sm">
          {sending ? "Enviando…" : "Enviar dúvida"}
        </Button>
      </div>
    </Card>
  );
}

export default function MeuResultado() {
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get("code") || "");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportPayload | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // View-only protections
  useEffect(() => {
    const prevent = (e: Event) => { e.preventDefault(); };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ["p", "s", "c", "a", "x"].includes(k)) {
        e.preventDefault();
        toast.info("Visualização apenas — salvar, copiar e imprimir estão desativados.");
      }
    };
    const beforePrint = () => toast.info("Impressão desativada — este relatório é apenas para visualização.");
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

      // Fire AI summary in background
      if (json.reports?.length) {
        setAiLoading(true);
        try {
          const digest = {
            reports: json.reports.map((r: WaveReport) => ({
              wave: r.wave, round_no: r.round_no, metrics: r.metrics,
            })),
          };
          const aiRes = await fetch(`${base}/functions/v1/wellness-individual-ai-summary`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
            body: JSON.stringify({ digest }),
          });
          const aiJson = await aiRes.json();
          if (aiJson.summary) setAiSummary(aiJson.summary);
        } catch {}
        finally { setAiLoading(false); }
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao buscar relatório");
    } finally {
      setLoading(false);
    }
  };

  const actions = useMemo(() => data ? personalizedActions(data.reports) : null, [data]);

  if (!data) {
    return (
      <main className="min-h-screen bg-background py-12">
        <div className="container max-w-md space-y-4">
          <h1 className="font-display text-2xl font-semibold text-center">Seu relatório pessoal</h1>
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
            <p className="text-[11px] text-muted-foreground">Não armazenamos o código em claro — se você perdê-lo, não há como recuperar.</p>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8 mr-noselect">
      <div className="container max-w-2xl space-y-5">
        <div className="text-center space-y-1">
          <h1 className="font-display text-2xl font-semibold">Seu momento agora</h1>
          <p className="text-xs text-muted-foreground">{data.company.name}</p>
          <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1 mt-1">
            <Lock className="h-3 w-3" /> Visualização apenas — salvar, copiar e imprimir estão desativados para preservar seu anonimato.
          </p>
        </div>

        {/* Integrative AI summary */}
        {(aiLoading || aiSummary) && (
          <Card className="p-5 space-y-2 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-display text-base font-semibold">Uma visão geral do seu momento</h2>
            </div>
            {aiLoading && !aiSummary ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-11/12" />
                <div className="h-3 bg-muted rounded w-4/5" />
              </div>
            ) : (
              <div className="space-y-2 text-sm leading-relaxed whitespace-pre-line">{aiSummary}</div>
            )}
            <p className="text-[10px] text-muted-foreground pt-1">Texto gerado com IA a partir dos seus resultados. É um apoio para reflexão, não substitui uma avaliação clínica.</p>
          </Card>
        )}

        {/* Referral card up top when severity warrants */}
        {data.needs_referral && <ReferralCard />}

        {/* Personalized actions */}
        {actions && (
          <Card className="p-5 space-y-3 border-emerald-200 bg-emerald-50/40">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-emerald-700" />
              <h2 className="font-display text-base font-semibold text-emerald-900">{actions.title}</h2>
            </div>
            <ol className="space-y-2 text-sm list-decimal list-inside text-emerald-950">
              {actions.steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </Card>
        )}

        {/* Global intro sections from templates */}
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

        {data.reports.map((r) => {
          const base = r.wave.replace(/_retest$/, "");
          const sev = r.metrics?.severity as string | undefined;
          const tone = sev ? SEVERITY_TONE[sev] : null;
          const dims = r.metrics?.scores as Record<string, number> | undefined;
          return (
            <Card key={r.wave + r.round_no} className="p-5 space-y-3">
              <div className="flex items-baseline justify-between flex-wrap gap-1">
                <h3 className="font-display text-lg font-semibold">Sobre {WAVE_LABEL[r.wave] || WAVE_LABEL[base] || r.wave}</h3>
                <span className="text-[11px] text-muted-foreground">Ciclo {r.round_no} · {new Date(r.completed_at).toLocaleDateString("pt-BR")}</span>
              </div>
              {tone && (
                <div className={`inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full border ${tone.bg} ${tone.color}`}>
                  Seu nível: <strong>{tone.label}</strong>
                  {typeof r.metrics?.score === "number" && <span className="opacity-70">· escore {r.metrics.score}</span>}
                </div>
              )}
              {dims && Object.keys(dims).length > 0 && (
                <div className="pt-1">
                  <p className="text-xs text-muted-foreground mb-2">Como cada dimensão apareceu para você:</p>
                  <DimensionBars scores={dims} />
                </div>
              )}
              {r.sections.map((s, i) => (
                <div key={i} className="space-y-1 border-t pt-3">
                  {s.title && <p className="text-sm font-semibold">{s.title}</p>}
                  <div className="space-y-1">{renderBody(s.body)}</div>
                </div>
              ))}
              {r.timings && <TimingsBlock timings={r.timings} />}
            </Card>
          );
        })}

        {/* Score evolution across cycles */}
        {data.score_comparisons && Object.entries(data.score_comparisons).some(([, rows]) => rows.length >= 2) && (
          <Card className="p-5 space-y-4">
            <div>
              <h2 className="font-display text-lg font-semibold">Sua evolução entre os ciclos</h2>
              <p className="text-xs text-muted-foreground mt-1">Comparação dos seus escores ao longo do tempo. Isso te ajuda a perceber se algo está mudando — para melhor ou para pior.</p>
            </div>
            {Object.entries(data.score_comparisons)
              .filter(([, rows]) => rows.length >= 2)
              .map(([wave, rows]) => (
                <ScoreEvolution key={wave} rows={rows} waveLabel={WAVE_LABEL[wave] || wave} />
              ))}
          </Card>
        )}

        {/* Timing comparison */}
        {data.timing_comparisons && Object.entries(data.timing_comparisons).some(([, rows]) => rows.length >= 2) && (
          <Card className="p-5 space-y-3">
            <div>
              <h2 className="font-display text-base font-semibold">Seu ritmo entre os ciclos</h2>
              <p className="text-xs text-muted-foreground mt-1">Se você respondeu mais rápido ou mais devagar. Não é avaliado pela empresa — é só para você.</p>
            </div>
            {Object.entries(data.timing_comparisons)
              .filter(([, rows]) => rows.length >= 2)
              .map(([wave, rows]) => {
                const first = rows[0], last = rows[rows.length - 1];
                const delta = last.total_ms - first.total_ms;
                const pct = first.total_ms ? Math.round((delta / first.total_ms) * 100) : 0;
                const trend = delta === 0 ? "estável" : delta < 0 ? "mais rápido" : "mais lento";
                return (
                  <div key={wave} className="text-xs text-muted-foreground border-t pt-2">
                    Em <strong className="text-foreground">{WAVE_LABEL[wave] || wave}</strong> você ficou <strong className="text-foreground">{trend}</strong>
                    {delta !== 0 && <> ({pct > 0 ? "+" : ""}{pct}%)</>}.
                  </div>
                );
              })}
          </Card>
        )}

        {/* Extended psychoeducation when relevant */}
        <ExtendedContent reports={data.reports} />

        {/* Q&A */}
        <QuestionBox code={code} />

        {/* Closing / disclaimer */}
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
