import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { copsoqScales, type CopsoqScaleType } from "@/data/copsoq";
import { TatAdmin } from "@/components/admin/TatAdmin";
import { RorschachAdmin } from "@/components/admin/RorschachAdmin";

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
}

function bandFor(type: CopsoqScaleType, mean: number) {
  if (type === "positive") return mean >= 75 ? "Saudável" : mean >= 50 ? "Atenção" : "Risco";
  return mean <= 25 ? "Saudável" : mean <= 50 ? "Atenção" : "Risco";
}
function deltaIsImprovement(type: CopsoqScaleType, delta: number) {
  return type === "positive" ? delta > 0 : delta < 0;
}

interface Company { id: string; name: string; status: string }
interface Item { id: string; instrument: string; n: number; text: string; scale: string | null; reverse: boolean; response_set: string | null; active: boolean }


interface Item { id: string; instrument: string; n: number; text: string; scale: string | null; reverse: boolean; response_set: string | null; active: boolean }

export const WellnessAdmin = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState<string>("");
  const [emails, setEmails] = useState("");
  const [intervals, setIntervals] = useState({ phq9: 0, ecig: 15, copsoq: 30, psicossocial: 45, assedio_sexual: 60 });
  const [statsPeriod, setStatsPeriod] = useState<"30d" | "all">("all");
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [devolutivaOpen, setDevolutivaOpen] = useState<RoundData | null>(null);
  const [devolutivaNotes, setDevolutivaNotes] = useState("");


  // Items editor
  const [instrument, setInstrument] = useState("phq9");
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    supabase.from("companies").select("id,name,status").eq("status", "approved").order("name")
      .then(({ data }) => setCompanies((data as any) || []));
  }, []);

  useEffect(() => {
    supabase.from("instrument_questions").select("*").eq("instrument", instrument).order("n")
      .then(({ data }) => setItems((data as any) || []));
  }, [instrument]);

  useEffect(() => { if (companyId) loadStats(); }, [companyId, statsPeriod]);

  async function loadStats() {
    const base = import.meta.env.VITE_SUPABASE_URL;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${base}/functions/v1/wellness-company-stats?company_id=${companyId}&period=${statsPeriod}`, {
      headers: { Authorization: `Bearer ${session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    });
    setStats(await res.json());
  }

  async function enroll() {
    if (!companyId) return toast.error("Selecione uma empresa");
    const list = emails.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
    if (!list.length) return toast.error("Cole pelo menos um e-mail");
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("wellness-enroll", {
        body: { company_id: companyId, emails: list, intervals_days: intervals },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      toast.success(`${(data as any).enrolled} trabalhadores cadastrados`);
      setEmails("");
      loadStats();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  }

  async function dispatch() {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("wellness-dispatch", { body: {} });
      if (error) throw error;
      toast.success(`Processados: ${(data as any).processed} · enviados: ${(data as any).sent} · falhas: ${(data as any).failed}`);
      loadStats();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  }

  async function openNewRound() {
    if (!companyId) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("wellness-open-round", { body: { company_id: companyId } });
      if (error) throw error;
      const d = data as any;
      if (d?.error) throw new Error(d.message || d.error);
      toast.success(`Rodada #${d.round.round_no} aberta`);
      loadStats();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  }

  async function submitDevolutiva() {
    if (!devolutivaOpen || !companyId) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("wellness-mark-devolutiva", {
        body: { company_id: companyId, round_no: devolutivaOpen.round_no, notes: devolutivaNotes || null },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      toast.success(`Devolutiva da Rodada #${devolutivaOpen.round_no} registrada`);
      setDevolutivaOpen(null);
      setDevolutivaNotes("");
      loadStats();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  }



  async function updateItem(id: string, patch: Partial<Item>) {
    const { error } = await supabase.from("instrument_questions").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    setItems((arr) => arr.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  async function addItem() {
    const nextN = items.length ? Math.max(...items.map((i) => i.n)) + 1 : 1;
    const { data, error } = await supabase.from("instrument_questions")
      .insert({ instrument, n: nextN, text: "[Nova pergunta]", response_set: instrument === "phq9" ? "phq9_freq" : "ecig_5", active: true })
      .select().single();
    if (error) return toast.error(error.message);
    setItems((arr) => [...arr, data as any]);
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="program">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="program">Programa por empresa</TabsTrigger>
          <TabsTrigger value="test">Teste de ondas</TabsTrigger>
          <TabsTrigger value="items">Editar perguntas</TabsTrigger>
          <TabsTrigger value="tat">TAT (imagens)</TabsTrigger>
          <TabsTrigger value="rorschach">Rorschach (pranchas)</TabsTrigger>
          <TabsTrigger value="latency">Latências</TabsTrigger>
        </TabsList>

        <TabsContent value="tat" className="space-y-4 pt-4">
          <TatAdmin />
        </TabsContent>

        <TabsContent value="rorschach" className="space-y-4 pt-4">
          <RorschachAdmin />
        </TabsContent>


        <TabsContent value="program" className="space-y-4 pt-4">
          <Card className="p-4 space-y-3">
            <Label>Empresa</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>
                {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div><Label>Dias até PHQ-9</Label><Input type="number" value={intervals.phq9} onChange={(e) => setIntervals({ ...intervals, phq9: +e.target.value })} /></div>
              <div><Label>Dias até ECIG</Label><Input type="number" value={intervals.ecig} onChange={(e) => setIntervals({ ...intervals, ecig: +e.target.value })} /></div>
              <div><Label>Dias até COPSOQ</Label><Input type="number" value={intervals.copsoq} onChange={(e) => setIntervals({ ...intervals, copsoq: +e.target.value })} /></div>
              <div><Label>Dias até Psicossocial (LIPT-60)</Label><Input type="number" value={intervals.psicossocial} onChange={(e) => setIntervals({ ...intervals, psicossocial: +e.target.value })} /></div>
              <div><Label>Dias até Assédio sexual (MDiSH+SHRAS)</Label><Input type="number" value={intervals.assedio_sexual} onChange={(e) => setIntervals({ ...intervals, assedio_sexual: +e.target.value })} /></div>
            </div>

            <Label>E-mails dos trabalhadores (um por linha ou separados por vírgula)</Label>
            <Textarea rows={5} value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="ana@empresa.com&#10;joao@empresa.com" />

            <div className="flex gap-2">
              <Button onClick={enroll} disabled={busy}>Cadastrar e agendar</Button>
              <Button variant="outline" onClick={dispatch} disabled={busy}>Disparar convites pendentes agora</Button>
            </div>
          </Card>

          {stats?.summary && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <h3 className="font-semibold">Progresso</h3>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Período</Label>
                  <div className="w-44">
                    <Select value={statsPeriod} onValueChange={(v) => setStatsPeriod(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30d">Últimos 30 dias</SelectItem>
                        <SelectItem value="all">Todo o histórico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(["phq9", "ecig", "copsoq", "psicossocial"] as const).map((w) => (
                  <div key={w} className="rounded border p-3">
                    <div className="text-xs uppercase text-muted-foreground">{w}</div>
                    <div className="text-sm mt-1">Agendados: <b>{stats.summary[w]?.scheduled ?? 0}</b></div>
                    <div className="text-sm">Enviados: <b>{stats.summary[w]?.sent ?? 0}</b></div>
                    <div className="text-sm">Concluídos: <b>{stats.summary[w]?.completed ?? 0}</b></div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {stats?.rounds && (
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="font-semibold">Rodadas de rastreio</h3>
                <Button size="sm" onClick={openNewRound} disabled={busy || !stats.can_open_new_round}
                  title={stats.can_open_new_round ? "" : "Marque a devolutiva da rodada atual antes"}>
                  Abrir nova rodada
                </Button>
              </div>
              {!stats.can_open_new_round && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  A rodada atual ainda não teve a devolutiva comunicada aos trabalhadores (exigência NR-1 — Q&amp;A MTE 2026, perg. 17).
                  Marque a devolutiva antes de abrir uma nova rodada.
                </p>
              )}
              {(stats.rounds as RoundData[]).slice().reverse().map((r, idx, arr) => {
                const prev = arr[idx + 1];
                const scaleIds = Object.keys(r.copsoq.scales);
                const totalScheduled = Object.values(r.waves).reduce((s, w: any) => s + w.scheduled, 0);
                const totalCompleted = Object.values(r.waves).reduce((s, w: any) => s + w.completed, 0);
                return (
                  <div key={r.round_no} className="rounded border p-3 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Rodada #{r.round_no}</span>
                        <Badge variant={r.status === "open" ? "outline" : "secondary"}>
                          {r.status === "open" ? "Em coleta" : r.status === "closed" ? "Fechada" : "Devolutiva comunicada"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.opened_at).toLocaleDateString("pt-BR")}
                          {r.devolutiva_communicated_at ? ` → devolutiva ${new Date(r.devolutiva_communicated_at).toLocaleDateString("pt-BR")}` : ""}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {!r.devolutiva_communicated_at && (
                          <Button size="sm" variant="outline"
                            onClick={() => { setDevolutivaOpen(r); setDevolutivaNotes(r.devolutiva_notes || ""); }}>
                            Marcar devolutiva
                          </Button>
                        )}
                        <Button asChild size="sm" variant="outline">
                          <a href={`/admin/aep/${companyId}/${r.round_no}`} target="_blank" rel="noopener noreferrer">
                            Exportar AEP
                          </a>
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Adesão: {totalCompleted}/{totalScheduled} convites concluídos
                      {r.copsoq.hidden
                        ? ` · COPSOQ oculto (n=${r.copsoq.n} < ${stats.min_recorte})`
                        : ` · COPSOQ n=${r.copsoq.n}`}
                    </div>
                    {!r.copsoq.hidden && scaleIds.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs">
                        {scaleIds.map((sid) => {
                          const meta = copsoqScales[sid];
                          if (!meta) return null;
                          const mean = r.copsoq.scales[sid].mean;
                          const band = bandFor(meta.type, mean);
                          const prevMean = prev?.copsoq.scales[sid]?.mean;
                          const delta = typeof prevMean === "number" ? +(mean - prevMean).toFixed(1) : null;
                          const bandClass = band === "Risco" ? "text-red-700" : band === "Atenção" ? "text-amber-700" : "text-emerald-700";
                          return (
                            <div key={sid} className="flex items-center justify-between border-b py-1">
                              <span className="truncate pr-2">{meta.name}</span>
                              <span className="flex items-center gap-2 shrink-0">
                                <span>{mean.toFixed(1)}</span>
                                <span className={`text-[10px] font-semibold ${bandClass}`}>{band}</span>
                                {delta !== null && (
                                  <span className={`text-[10px] ${delta === 0 ? "text-muted-foreground" : deltaIsImprovement(meta.type, delta) ? "text-emerald-700" : "text-red-700"}`}>
                                    {delta > 0 ? "▲+" : delta < 0 ? "▼" : "="}{delta !== 0 ? Math.abs(delta) : ""}
                                  </span>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </Card>
          )}

          {companyId && <SettingsPanel companyId={companyId} />}
        </TabsContent>



        <TabsContent value="items" className="space-y-4 pt-4">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="w-full sm:w-64">
              <Label>Instrumento</Label>
              <Select value={instrument} onValueChange={setInstrument}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="phq9">PHQ-9 (depressão)</SelectItem>
                  <SelectItem value="ecig">ECIG (conflito intragrupo)</SelectItem>
                  <SelectItem value="lipt60">LIPT-60 (assédio moral / mobbing)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={addItem}>+ Item</Button>
          </div>

          <div className="space-y-2">
            {items.map((it) => (
              <Card key={it.id} className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">#{it.n}</Badge>
                  {it.scale && <Badge>{it.scale}</Badge>}
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs">Ativo</span>
                    <Switch checked={it.active} onCheckedChange={(v) => updateItem(it.id, { active: v })} />
                  </div>
                </div>
                <Textarea value={it.text} onChange={(e) => setItems((arr) => arr.map((i) => i.id === it.id ? { ...i, text: e.target.value } : i))}
                  onBlur={(e) => updateItem(it.id, { text: e.target.value })} rows={2} />
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <Input placeholder="escala" value={it.scale ?? ""} onChange={(e) => setItems((arr) => arr.map((i) => i.id === it.id ? { ...i, scale: e.target.value } : i))} onBlur={(e) => updateItem(it.id, { scale: e.target.value })} />
                  <Input placeholder="response_set" value={it.response_set ?? ""} onChange={(e) => setItems((arr) => arr.map((i) => i.id === it.id ? { ...i, response_set: e.target.value } : i))} onBlur={(e) => updateItem(it.id, { response_set: e.target.value })} />
                  <label className="flex items-center gap-2 text-xs">
                    <Switch checked={it.reverse} onCheckedChange={(v) => updateItem(it.id, { reverse: v })} /> reverse
                  </label>
                </div>
              </Card>
            ))}
            {!items.length && <p className="text-sm text-muted-foreground">Sem itens para este instrumento.</p>}
          </div>
        </TabsContent>

        <TabsContent value="test" className="space-y-4 pt-4">
          <TestModePanel companies={companies} />
        </TabsContent>

        <TabsContent value="latency" className="space-y-4 pt-4">
          <LatencyPanel companyId={companyId} companies={companies} onSelectCompany={setCompanyId} />
        </TabsContent>
      </Tabs>

      <Dialog open={!!devolutivaOpen} onOpenChange={(o) => !o && setDevolutivaOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar devolutiva — Rodada #{devolutivaOpen?.round_no}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Confirme que os resultados agregados desta rodada foram <strong>comunicados aos trabalhadores</strong>
              (NR-1 — participação dos trabalhadores). A rodada será fechada e a próxima poderá ser aberta.
            </p>
            <Label>Anotações (opcional — como foi comunicado)</Label>
            <Textarea rows={4} value={devolutivaNotes} onChange={(e) => setDevolutivaNotes(e.target.value)}
              placeholder="Ex.: Apresentação na reunião geral em 15/06, painel impresso na sala de café, e-mail interno." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDevolutivaOpen(null)}>Cancelar</Button>
            <Button onClick={submitDevolutiva} disabled={busy}>Confirmar devolutiva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface CompanySettings {
  company_id: string;
  min_recorte_company: number;
  min_recorte_department: number;
  cadence_months: number;
  cadence_auto_open: boolean;
  reminder_days: number[];
  signal_min_adherence_pct: number;
  signal_max_days_since_devolutiva: number;
  signals_enabled: boolean;
}

const DEFAULT_SETTINGS: Omit<CompanySettings, "company_id"> = {
  min_recorte_company: 5,
  min_recorte_department: 5,
  cadence_months: 4,
  cadence_auto_open: false,
  reminder_days: [3, 7, 14],
  signal_min_adherence_pct: 40,
  signal_max_days_since_devolutiva: 180,
  signals_enabled: true,
};

function SettingsPanel({ companyId }: { companyId: string }) {
  const [s, setS] = useState<CompanySettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [reminderDaysText, setReminderDaysText] = useState("3,7,14");

  useEffect(() => {
    supabase.from("wellness_company_settings").select("*").eq("company_id", companyId).maybeSingle()
      .then(({ data }: any) => {
        const merged = { ...DEFAULT_SETTINGS, company_id: companyId, ...(data || {}) } as CompanySettings;
        setS(merged);
        setReminderDaysText((merged.reminder_days || [3, 7, 14]).join(","));
      });
  }, [companyId]);

  async function save() {
    if (!s) return;
    setSaving(true);
    try {
      const reminder_days = reminderDaysText.split(",").map((x) => parseInt(x.trim(), 10)).filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
      const payload = { ...s, reminder_days };
      const { error } = await supabase.from("wellness_company_settings").upsert(payload, { onConflict: "company_id" });
      if (error) throw error;
      toast.success("Configurações salvas");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function runCadenceTick() {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("wellness-cadence-tick", { body: {} });
      if (error) throw error;
      const d = data as any;
      toast.success(`Verificação: ${d.companies} empresas · ${d.opened} rodadas abertas · ${d.alertsRaised} alertas`);
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  if (!s) return null;
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold">Configurações de rastreio</h3>
        <Button size="sm" variant="outline" onClick={runCadenceTick} disabled={saving}>
          Rodar verificação agora
        </Button>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground">Privacidade — n mínimo de recorte</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>n mínimo (empresa)</Label>
            <Input type="number" min={1} value={s.min_recorte_company}
              onChange={(e) => setS({ ...s, min_recorte_company: +e.target.value })} />
          </div>
          <div>
            <Label>n mínimo (por departamento)</Label>
            <Input type="number" min={1} value={s.min_recorte_department}
              onChange={(e) => setS({ ...s, min_recorte_department: +e.target.value })} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Resultados só ficam visíveis quando o número de respondentes atinge esse limite. Padrão = 5.
        </p>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground">Cadência anual</h4>
        <div className="grid grid-cols-2 gap-3 items-end">
          <div>
            <Label>Meses entre rodadas</Label>
            <Input type="number" min={1} max={12} value={s.cadence_months}
              onChange={(e) => setS({ ...s, cadence_months: +e.target.value })} />
            <p className="text-[11px] text-muted-foreground mt-1">3 = Baseline / Pulse / Verificação por ano.</p>
          </div>
          <label className="flex items-center gap-2 pb-2">
            <Switch checked={s.cadence_auto_open} onCheckedChange={(v) => setS({ ...s, cadence_auto_open: v })} />
            <span className="text-sm">Abrir nova rodada automaticamente após devolutiva</span>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground">Lembretes escalonados</h4>
        <Label>Dias após o envio (separados por vírgula)</Label>
        <Input value={reminderDaysText} onChange={(e) => setReminderDaysText(e.target.value)} placeholder="3,7,14" />
        <p className="text-xs text-muted-foreground">
          Para cada convite enviado e não concluído, reenviamos nesses intervalos.
        </p>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground">Disparo inteligente por sinal</h4>
        <label className="flex items-center gap-2">
          <Switch checked={s.signals_enabled} onCheckedChange={(v) => setS({ ...s, signals_enabled: v })} />
          <span className="text-sm">Gerar alertas automáticos</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Adesão mínima (%)</Label>
            <Input type="number" min={0} max={100} value={s.signal_min_adherence_pct}
              onChange={(e) => setS({ ...s, signal_min_adherence_pct: +e.target.value })} />
            <p className="text-[11px] text-muted-foreground mt-1">Alerta se rodada aberta &gt;14 dias e adesão abaixo disso.</p>
          </div>
          <div>
            <Label>Máx. dias desde devolutiva</Label>
            <Input type="number" min={30} value={s.signal_max_days_since_devolutiva}
              onChange={(e) => setS({ ...s, signal_max_days_since_devolutiva: +e.target.value })} />
            <p className="text-[11px] text-muted-foreground mt-1">Alerta se passar muito tempo sem nova rodada.</p>
          </div>
        </div>
      </div>

      <Button onClick={save} disabled={saving}>Salvar configurações</Button>
    </Card>
  );
}



function median(arr: number[]) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function LatencyPanel({ companyId, companies, onSelectCompany }: { companyId: string; companies: Company[]; onSelectCompany: (id: string) => void }) {
  const [wave, setWave] = useState<"phq9" | "ecig" | "copsoq" | "psicossocial">("phq9");
  const [period, setPeriod] = useState<"30d" | "all">("all");
  const [rows, setRows] = useState<{ n: string; mean: number; median: number; n_resp: number; outliers: number }[]>([]);
  const [totalN, setTotalN] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    const table = wave === "phq9" ? "phq9_company_responses" : wave === "ecig" ? "ecig_responses" : wave === "copsoq" ? "copsoq_responses" : "psicossocial_responses";
    let q = (supabase as any).from(table).select("latencies_ms,created_at").eq("company_id", companyId);
    if (period === "30d") {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      q = q.gte("created_at", since);
    }
    q.then(({ data }: any) => {
      setTotalN((data ?? []).length);
      const acc: Record<string, number[]> = {};
      (data ?? []).forEach((r: any) => {
        const lat = r.latencies_ms || {};
        const entries = Array.isArray(lat) ? lat.map((v: number, i: number) => [String(i + 1), v]) : Object.entries(lat);
        for (const [k, v] of entries as [string, number][]) {
          if (typeof v !== "number") continue;
          (acc[k] = acc[k] || []).push(v);
        }
      });
      const out = Object.entries(acc).sort((a, b) => +a[0] - +b[0]).map(([n, arr]) => ({
        n,
        mean: Math.round(arr.reduce((s, v) => s + v, 0) / arr.length),
        median: Math.round(median(arr)),
        n_resp: arr.length,
        outliers: arr.filter((v) => v < 500 || v > 120000).length,
      }));
      setRows(out);
      setLoading(false);
    });
  }, [companyId, wave, period]);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-full sm:w-64">
          <Label>Empresa</Label>
          <Select value={companyId} onValueChange={onSelectCompany}>
            <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
            <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-48">
          <Label>Onda</Label>
          <Select value={wave} onValueChange={(v) => setWave(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="phq9">PHQ-9</SelectItem>
              <SelectItem value="ecig">ECIG</SelectItem>
              <SelectItem value="copsoq">COPSOQ</SelectItem>
              <SelectItem value="psicossocial">Psicossocial (LIPT-60)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-48">
          <Label>Período</Label>
          <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo o histórico</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:ml-auto text-sm text-muted-foreground">
          Respostas no recorte: <b className="text-foreground">{totalN}</b>
        </div>
      </div>
      {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground"><tr><th className="text-left p-2">Questão</th><th className="text-right p-2">Média (ms)</th><th className="text-right p-2">Mediana (ms)</th><th className="text-right p-2">N</th><th className="text-right p-2">Outliers (&lt;0.5s / &gt;2min)</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.n} className="border-t"><td className="p-2">#{r.n}</td><td className="p-2 text-right">{r.mean.toLocaleString()}</td><td className="p-2 text-right">{r.median.toLocaleString()}</td><td className="p-2 text-right">{r.n_resp}</td><td className="p-2 text-right">{r.outliers}</td></tr>
            ))}</tbody>
          </table>
          {!rows.length && <p className="text-sm text-muted-foreground p-2">Sem dados ainda para esta onda.</p>}
        </div>
      )}
    </Card>
  );
}

const WAVES = ["phq9", "ecig", "copsoq", "psicossocial"] as const;
type Wave = typeof WAVES[number];
const WAVE_LABEL: Record<Wave, string> = {
  phq9: "PHQ-9 (depressão)",
  ecig: "ECIG (conflito intragrupo)",
  copsoq: "COPSOQ (psicossociais)",
  psicossocial: "Psicossocial (LIPT-60)",
};

interface TestInvitation {
  id: string;
  wave: Wave;
  round_no: number;
  status: string;
  scheduled_at: string;
  sent_at: string | null;
  completed_at: string | null;
  attempts: number;
  reminder_count: number | null;
  last_reminder_at: string | null;
  last_error: string | null;
}

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" });
}

function TestModePanel({ companies }: { companies: Company[] }) {
  const [companyId, setCompanyId] = useState("");
  const [email, setEmail] = useState("");
  const [mins, setMins] = useState<Record<Wave, number>>({ phq9: 0, ecig: 1, copsoq: 2, psicossocial: 3 });
  const [busy, setBusy] = useState(false);
  const [participant, setParticipant] = useState<{ id: string; token: string; email: string } | null>(null);
  const [invs, setInvs] = useState<TestInvitation[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastTickResult, setLastTickResult] = useState<string>("");

  const currentRound = invs.length ? invs[0].round_no : null;
  const allCompleted = invs.length === 4 && invs.every((i) => i.completed_at);

  async function refreshStatus() {
    if (!companyId || !email) return;
    const { data, error } = await supabase.functions.invoke("wellness-test-status", {
      body: { company_id: companyId, email: email.trim().toLowerCase() },
    });
    if (error) return;
    const d = data as any;
    setParticipant(d.participant);
    // keep only the latest round to show "as 5 respostas" (4 ondas) do teste atual
    const allInvs: TestInvitation[] = d.invitations || [];
    const latest = allInvs.length ? allInvs[0].round_no : null;
    setInvs(latest ? allInvs.filter((i) => i.round_no === latest) : []);
  }

  useEffect(() => {
    if (!autoRefresh || !participant) return;
    const id = setInterval(() => { refreshStatus(); }, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, participant?.id, companyId, email]);

  async function startTest() {
    if (!companyId) return toast.error("Selecione a empresa");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return toast.error("E-mail inválido");
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("wellness-enroll", {
        body: {
          company_id: companyId,
          emails: [email.trim()],
          intervals_minutes: mins,
        },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      toast.success(`Teste agendado na Rodada #${(data as any).round_no}`);
      await refreshStatus();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  }

  async function dispatchNow() {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("wellness-dispatch", { body: {} });
      if (error) throw error;
      const d = data as any;
      setLastTickResult(`Processados: ${d.processed} · enviados: ${d.sent} · lembretes: ${d.reminded ?? 0} · falhas: ${d.failed}`);
      await refreshStatus();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  }

  const responderBase = window.location.origin;

  return (
    <Card className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold">Teste do mecanismo de ondas</h3>
        <p className="text-sm text-muted-foreground">
          Use 1 e-mail real (seu) para receber as 4 ondas (PHQ-9 → ECIG → COPSOQ → LIPT-60) com intervalos em minutos.
          Responda cada link e veja o relatório final no fim.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Empresa (use uma empresa de teste)</Label>
          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
            <SelectContent>
              {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>E-mail de teste (apenas 1)</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@dominio.com" />
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Atraso de cada onda (minutos a partir de agora)</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {WAVES.map((w) => (
            <div key={w}>
              <Label className="text-xs">{WAVE_LABEL[w]}</Label>
              <Input type="number" min={0} value={mins[w]}
                onChange={(e) => setMins({ ...mins, [w]: Math.max(0, +e.target.value) })} />
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          Ex.: 0 / 1 / 2 / 3 → recebe as 4 ondas em ~3 minutos. O disparador checa pendentes ao rodar “Disparar agora”.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={startTest} disabled={busy}>Agendar teste</Button>
        <Button variant="outline" onClick={dispatchNow} disabled={busy}>Disparar pendentes agora</Button>
        <Button variant="ghost" onClick={refreshStatus} disabled={busy || !participant}>Atualizar status</Button>
        <label className="flex items-center gap-2 text-xs ml-auto">
          <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} /> Auto-refresh 5s
        </label>
      </div>

      {lastTickResult && <p className="text-xs text-muted-foreground">Última execução do dispatcher — {lastTickResult}</p>}

      {participant && (
        <div className="space-y-2">
          <div className="text-sm">
            Participante: <b>{participant.email}</b>
            {currentRound && <> · Rodada <b>#{currentRound}</b></>}
          </div>
          <div className="overflow-auto rounded border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-left p-2">Onda</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Agendado</th>
                  <th className="text-left p-2">Enviado</th>
                  <th className="text-left p-2">Concluído</th>
                  <th className="text-left p-2">Tent.</th>
                  <th className="text-left p-2">Link</th>
                </tr>
              </thead>
              <tbody>
                {WAVES.map((w) => {
                  const i = invs.find((x) => x.wave === w);
                  const url = i ? `${responderBase}/w/${participant.token}/${w}` : null;
                  const statusBadge = !i ? "—"
                    : i.completed_at ? "✅ concluída"
                    : i.sent_at ? "📨 enviada"
                    : i.status === "cancelled" ? "❌ cancelada"
                    : "⏳ pendente";
                  return (
                    <tr key={w} className="border-t">
                      <td className="p-2 font-medium">{WAVE_LABEL[w]}</td>
                      <td className="p-2">{statusBadge}</td>
                      <td className="p-2">{fmt(i?.scheduled_at ?? null)}</td>
                      <td className="p-2">{fmt(i?.sent_at ?? null)}</td>
                      <td className="p-2">{fmt(i?.completed_at ?? null)}</td>
                      <td className="p-2">{i?.attempts ?? 0}{i?.reminder_count ? ` (+${i.reminder_count}r)` : ""}</td>
                      <td className="p-2">
                        {url
                          ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline">abrir</a>
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {invs.some((i) => i.last_error) && (
            <div className="text-xs text-red-700">
              {invs.filter((i) => i.last_error).map((i) => <div key={i.id}>{i.wave}: {i.last_error}</div>)}
            </div>
          )}
          {allCompleted && currentRound && (
            <div className="rounded border border-emerald-300 bg-emerald-50 p-3 text-sm">
              ✅ Todas as ondas concluídas. Veja o relatório final:
              <div className="mt-2">
                <Button asChild size="sm">
                  <a href={`/admin/aep/${companyId}/${currentRound}`} target="_blank" rel="noopener noreferrer">
                    Abrir relatório AEP (Rodada #{currentRound})
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

