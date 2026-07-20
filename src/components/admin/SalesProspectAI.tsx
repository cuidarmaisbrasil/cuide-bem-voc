import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Sparkles, Trash2, ExternalLink, Copy, ChevronDown, ChevronUp, Building2 } from "lucide-react";

type Prospect = {
  id: string;
  company_name: string;
  website: string | null;
  sector: string | null;
  employee_size: string | null;
  city: string | null;
  state: string | null;
  fit_score: number;
  fit_rationale: string | null;
  target_role: string | null;
  outreach_copy: string | null;
  status: string;
  seller_notes: string | null;
  source_urls: any;
  created_at: string;
  cnpj: string | null;
  razao_social: string | null;
  cnae_principal: string | null;
  situacao_cadastral: string | null;
  municipio: string | null;
  uf: string | null;
  porte_receita: string | null;
  capital_social: number | null;
  data_abertura: string | null;
  enriched_at: string | null;
  enrichment_source: string | null;
};

const STATUSES = [
  { v: "novo", label: "Novo", tone: "secondary" as const },
  { v: "contatado", label: "Contatado", tone: "default" as const },
  { v: "reuniao", label: "Reunião", tone: "default" as const },
  { v: "proposta", label: "Proposta", tone: "default" as const },
  { v: "fechado", label: "Fechado ✓", tone: "default" as const },
  { v: "descartado", label: "Descartado", tone: "destructive" as const },
];

const SECTOR_PRESETS = [
  "Saúde / hospitais",
  "Call center / BPO",
  "Logística e transporte",
  "Bancos e financeiras",
  "Segurança pública ou privada",
  "Educação",
  "Mineração / indústria pesada",
  "Varejo de grande porte",
  "Tecnologia",
];

function scoreColor(s: number) {
  if (s >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (s >= 60) return "text-amber-600 dark:text-amber-400";
  if (s >= 40) return "text-orange-600 dark:text-orange-400";
  return "text-muted-foreground";
}

export const SalesProspectAI = () => {
  const { session, isAdmin, loading: authLoading } = useAuth();
  const [sector, setSector] = useState<string>(SECTOR_PRESETS[0]);
  const [size, setSize] = useState<string>("100-1000");
  const [location, setLocation] = useState<string>("Brasil");
  const [trigger, setTrigger] = useState<string>("");
  const [extra, setExtra] = useState<string>("");
  const [limit, setLimit] = useState<number>(10);
  const [loading, setLoading] = useState(false);

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  async function load() {
    const { data, error } = await supabase
      .from("sales_prospects")
      .select("*")
      .order("fit_score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return toast.error(error.message);
    setProspects((data ?? []) as Prospect[]);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => statusFilter === "all" ? prospects : prospects.filter((p) => p.status === statusFilter),
    [prospects, statusFilter],
  );

  async function runProspect() {
    if (!session?.access_token) {
      toast.error("Sua sessão expirou. Entre novamente no painel admin.");
      return;
    }
    if (!isAdmin) {
      toast.error("Apenas administradores podem prospectar com IA.");
      return;
    }
    setLoading(true);
    try {
      const payload = { sector, employee_size: size, location, trigger, extra, save: true, limit };
      console.log("[prospect] payload", payload);
      const { data, error } = await supabase.functions.invoke("sales-prospect-ai", {
        body: payload,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      // Read real backend error body when invoke returns non-2xx
      if (error) {
        let detail = error.message;
        try {
          const ctx: any = (error as any).context;
          if (ctx && typeof ctx.clone === "function" && typeof ctx.text === "function") {
            const txt = await ctx.clone().text();
            console.error("[prospect] backend error body:", txt);
            try {
              const j = JSON.parse(txt);
              detail = j.detail || j.error || txt;
            } catch { detail = txt || detail; }
          } else if (ctx && typeof ctx.text === "function") {
            const txt = await ctx.text();
            console.error("[prospect] backend error body:", txt);
            try {
              const j = JSON.parse(txt);
              detail = j.detail || j.error || txt;
            } catch { detail = txt || detail; }
          }
        } catch (readErr) {
          console.error("[prospect] failed to read error context", readErr);
        }
        throw new Error(detail);
      }
      if ((data as any)?.error) throw new Error((data as any).detail || (data as any).error);
      const n = (data as any)?.saved?.length ?? (data as any)?.count ?? 0;
      toast.success(`${n} empresa(s) encontrada(s) e salva(s) no pipeline`);
      await load();
    } catch (e: any) {
      const msg = String(e?.message || e);
      console.error("[prospect] error:", msg);
      if (msg.includes("rate_limited")) toast.error("Limite de requisições atingido. Aguarde alguns segundos.");
      else if (msg.includes("credits_exhausted")) toast.error("Créditos de IA esgotados. Adicione créditos no workspace.");
      else toast.error(`Erro: ${msg.slice(0, 300)}`);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("sales_prospects").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setProspects((ps) => ps.map((p) => p.id === id ? { ...p, status } : p));
  }
  async function updateNotes(id: string, seller_notes: string) {
    const { error } = await supabase.from("sales_prospects").update({ seller_notes }).eq("id", id);
    if (error) return toast.error(error.message);
  }
  async function removeOne(id: string) {
    if (!confirm("Remover este prospect?")) return;
    const { error } = await supabase.from("sales_prospects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setProspects((ps) => ps.filter((p) => p.id !== id));
  }

  async function enrichCnpj(p: Prospect, rawCnpj?: string) {
    const cnpj = (rawCnpj ?? p.cnpj ?? "").replace(/\D+/g, "");
    if (cnpj.length !== 14) {
      toast.error("Informe um CNPJ com 14 dígitos.");
      return;
    }
    if (!session?.access_token) {
      toast.error("Sua sessão expirou.");
      return;
    }
    const t = toast.loading(`Consultando Receita Federal (CNPJ.ws)…`);
    try {
      const { data, error } = await supabase.functions.invoke("cnpj-enrich", {
        body: { cnpj, prospect_id: p.id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).detail || (data as any).error);
      const updated = (data as any).prospect as Prospect | null;
      if (updated) {
        setProspects((ps) => ps.map((x) => x.id === p.id ? { ...x, ...updated } : x));
      }
      toast.success("Dados oficiais da Receita Federal carregados", { id: t });
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (msg.includes("rate_limited")) toast.error("CNPJ.ws limita 3 consultas/min. Aguarde ~20s.", { id: t });
      else if (msg.includes("cnpj_not_found")) toast.error("CNPJ não encontrado na Receita Federal.", { id: t });
      else toast.error(`Falha: ${msg.slice(0, 200)}`, { id: t });
    }
  }

  function copyText(txt: string | null) {
    if (!txt) return;
    navigator.clipboard.writeText(txt).then(() => toast.success("Copiado"));
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: prospects.length };
    STATUSES.forEach((s) => { c[s.v] = prospects.filter((p) => p.status === s.v).length; });
    return c;
  }, [prospects]);

  return (
    <div className="space-y-4">
      {/* ===== Search form ===== */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Prospectar novas empresas (IA + busca web em tempo real)</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          A IA (Gemini 2.5 Pro) pesquisa a web via Firecrawl, identifica empresas brasileiras que
          batem com o ICP do Cuidar+ Trabalho e gera score de fit + copy de prospecção pronta.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Setor</Label>
            <Select value={sector} onValueChange={setSector}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SECTOR_PRESETS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Porte (colaboradores)</Label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="100-500">100 a 500</SelectItem>
                <SelectItem value="500-1000">500 a 1.000</SelectItem>
                <SelectItem value="1000-5000">1.000 a 5.000</SelectItem>
                <SelectItem value="5000+">Acima de 5.000</SelectItem>
                <SelectItem value="100-1000">100 a 1.000 (padrão)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Localização (UF, cidade ou região)</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: São Paulo, Sudeste, Brasil" />
          </div>
          <div>
            <Label className="text-xs">Nº máx. de prospects</Label>
            <Input type="number" min={1} max={20} value={limit} onChange={(e) => setLimit(Math.max(1, Math.min(20, Number(e.target.value) || 10)))} />
            <p className="text-[10px] text-muted-foreground mt-1">A IA dispara 5–8 buscas em paralelo (sinônimos + rankings + gatilho) e evita repetir empresas já no pipeline.</p>
          </div>
        </div>

        <div>
          <Label className="text-xs">Gatilho de urgência (opcional)</Label>
          <Input
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            placeholder="Ex: fiscalização MTE recente, ação por assédio, alta rotatividade, relatório ESG…"
          />
        </div>
        <div>
          <Label className="text-xs">Contexto adicional (opcional)</Label>
          <Textarea
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            rows={2}
            placeholder="Ex: com filial no interior de MG, com IPO recente, listadas na B3…"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={runProspect} disabled={loading || authLoading || !session?.access_token || !isAdmin}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Buscando na web…</> : <><Sparkles className="h-4 w-4 mr-2" /> Prospectar com IA</>}
          </Button>
        </div>
      </Card>

      {/* ===== Pipeline ===== */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold">Pipeline de vendas ({prospects.length})</h3>
          <div className="flex items-center gap-1 flex-wrap">
            <Button size="sm" variant={statusFilter === "all" ? "default" : "outline"} onClick={() => setStatusFilter("all")}>
              Todos ({counts.all})
            </Button>
            {STATUSES.map((s) => (
              <Button
                key={s.v}
                size="sm"
                variant={statusFilter === s.v ? "default" : "outline"}
                onClick={() => setStatusFilter(s.v)}
              >
                {s.label} ({counts[s.v] || 0})
              </Button>
            ))}
          </div>
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum prospect ainda. Use o formulário acima para gerar a primeira lista.
          </p>
        )}

        <div className="space-y-2">
          {filtered.map((p) => {
            const isOpen = !!expanded[p.id];
            return (
              <Card key={p.id} className="p-3 space-y-2">
                <div className="flex items-start gap-2 flex-wrap">
                  <div className={`text-2xl font-mono font-bold ${scoreColor(p.fit_score)}`}>{p.fit_score}</div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{p.company_name}</span>
                      {p.website && (
                        <a href={p.website} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1">
                          site <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
                      {p.sector && <Badge variant="outline" className="text-[10px]">{p.sector}</Badge>}
                      {p.employee_size && <Badge variant="outline" className="text-[10px]">{p.employee_size} colab.</Badge>}
                      {(p.city || p.state) && <span>{[p.city, p.state].filter(Boolean).join(" / ")}</span>}
                      {p.target_role && <span>· alvo: <strong>{p.target_role}</strong></span>}
                    </div>
                  </div>
                  <Select value={p.status} onValueChange={(v) => updateStatus(p.id, v)}>
                    <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="ghost" onClick={() => setExpanded((e) => ({ ...e, [p.id]: !isOpen }))}>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => removeOne(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                {isOpen && (
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    {p.fit_rationale && (
                      <div>
                        <Label className="text-[11px] text-muted-foreground uppercase">Por que é fit</Label>
                        <p className="text-sm whitespace-pre-wrap">{p.fit_rationale}</p>
                      </div>
                    )}
                    {p.outreach_copy && (
                      <div>
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px] text-muted-foreground uppercase">Copy de prospecção</Label>
                          <Button size="sm" variant="ghost" onClick={() => copyText(p.outreach_copy)}>
                            <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                          </Button>
                        </div>
                        <Textarea
                          defaultValue={p.outreach_copy}
                          rows={6}
                          className="text-sm"
                          onBlur={(e) => {
                            if (e.target.value !== p.outreach_copy) {
                              supabase.from("sales_prospects").update({ outreach_copy: e.target.value }).eq("id", p.id);
                            }
                          }}
                        />
                      </div>
                    )}
                    {Array.isArray(p.source_urls) && p.source_urls.length > 0 && (
                      <div>
                        <Label className="text-[11px] text-muted-foreground uppercase">Fontes</Label>
                        <ul className="text-xs space-y-0.5">
                          {p.source_urls.slice(0, 6).map((u: string, i: number) => (
                            <li key={i}>
                              <a href={u} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">{u}</a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <Label className="text-[11px] text-muted-foreground uppercase">Notas do vendedor</Label>
                      <Textarea
                        defaultValue={p.seller_notes ?? ""}
                        rows={3}
                        placeholder="Histórico de contato, próximos passos…"
                        onBlur={(e) => updateNotes(p.id, e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default SalesProspectAI;
