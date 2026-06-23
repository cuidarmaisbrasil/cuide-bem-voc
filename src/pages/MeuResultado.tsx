import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Section { section_key: string; severity: string; title: string; body: string; metadata: any }
interface WaveReport { wave: string; round_no: number; completed_at: string; metrics: any; sections: Section[] }
interface ReportPayload { company: { name: string }; global_sections: Section[]; reports: WaveReport[] }

const WAVE_LABEL: Record<string, string> = {
  phq9: "PHQ-9 (humor/depressão)",
  ecig: "ECIG (clima do grupo)",
  copsoq: "COPSOQ (bem-estar no trabalho)",
  psicossocial: "LIPT-60 (clima psicossocial)",
  assedio_sexual: "MDiSH + SHRAS (assédio sexual)",
};

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
    <main className="min-h-screen bg-background py-8">
      <div className="container max-w-2xl space-y-5">
        <div className="text-center space-y-1">
          <h1 className="font-display text-2xl font-semibold">Seu relatório pessoal</h1>
          <p className="text-xs text-muted-foreground">{data.company.name}</p>
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
