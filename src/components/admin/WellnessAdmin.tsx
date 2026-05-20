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

interface Company { id: string; name: string; status: string }
interface Item { id: string; instrument: string; n: number; text: string; scale: string | null; reverse: boolean; response_set: string | null; active: boolean }

export const WellnessAdmin = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState<string>("");
  const [emails, setEmails] = useState("");
  const [intervals, setIntervals] = useState({ phq9: 0, ecig: 15, copsoq: 30 });
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<any>(null);

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

  useEffect(() => { if (companyId) loadStats(); }, [companyId]);

  async function loadStats() {
    const base = import.meta.env.VITE_SUPABASE_URL;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${base}/functions/v1/wellness-company-stats?company_id=${companyId}`, {
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
        <TabsList>
          <TabsTrigger value="program">Programa por empresa</TabsTrigger>
          <TabsTrigger value="items">Editar perguntas</TabsTrigger>
          <TabsTrigger value="latency">Latências</TabsTrigger>
        </TabsList>

        <TabsContent value="program" className="space-y-4 pt-4">
          <Card className="p-4 space-y-3">
            <Label>Empresa</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>
                {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-3 gap-3">
              <div><Label>Dias até PHQ-9</Label><Input type="number" value={intervals.phq9} onChange={(e) => setIntervals({ ...intervals, phq9: +e.target.value })} /></div>
              <div><Label>Dias até ECIG</Label><Input type="number" value={intervals.ecig} onChange={(e) => setIntervals({ ...intervals, ecig: +e.target.value })} /></div>
              <div><Label>Dias até COPSOQ</Label><Input type="number" value={intervals.copsoq} onChange={(e) => setIntervals({ ...intervals, copsoq: +e.target.value })} /></div>
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
              <h3 className="font-semibold mb-3">Progresso</h3>
              <div className="grid grid-cols-3 gap-3">
                {(["phq9", "ecig", "copsoq"] as const).map((w) => (
                  <div key={w} className="rounded border p-3">
                    <div className="text-xs uppercase text-muted-foreground">{w}</div>
                    <div className="text-sm mt-1">Agendados: <b>{stats.summary[w].scheduled}</b></div>
                    <div className="text-sm">Enviados: <b>{stats.summary[w].sent}</b></div>
                    <div className="text-sm">Concluídos: <b>{stats.summary[w].completed}</b></div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="items" className="space-y-4 pt-4">
          <div className="flex gap-2 items-end">
            <div className="w-64">
              <Label>Instrumento</Label>
              <Select value={instrument} onValueChange={setInstrument}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="phq9">PHQ-9 (depressão)</SelectItem>
                  <SelectItem value="ecig">ECIG (conflito intragrupo)</SelectItem>
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
      </Tabs>
    </div>
  );
};
