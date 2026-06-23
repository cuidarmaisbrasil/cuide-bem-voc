import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Tpl {
  id: string;
  wave: string;
  section_key: string;
  severity: string;
  title: string | null;
  body: string | null;
  enabled: boolean;
  position: number;
}

const WAVES = [
  { v: "global", label: "Global (todas as ondas)" },
  { v: "phq9", label: "PHQ-9" },
  { v: "ecig", label: "ECIG" },
  { v: "copsoq", label: "COPSOQ" },
  { v: "psicossocial", label: "LIPT-60 (psicossocial)" },
  { v: "assedio_sexual", label: "MDiSH/SHRAS (assédio sexual)" },
];

const SEVERITIES = ["all", "minimal", "mild", "moderate", "moderately_severe", "severe"];

const VARS_HINT: Record<string, string> = {
  global: "{{company}}",
  phq9: "{{score}}  {{severity}}  {{functional_impact}}",
  ecig: "{{tarefa}}  {{relacionamento}}  {{processo}}",
  copsoq: "{{<nome_da_dimensao>}} (varia conforme versão)",
  psicossocial: "{{IGAP}}  {{NEAP}}  {{<subescala>}}",
  assedio_sexual: "{{MDiSH_total}}  {{SHRAS_total}}  {{<subescala>}}",
};

export default function IndividualReportAdmin() {
  const [tpls, setTpls] = useState<Tpl[]>([]);
  const [wave, setWave] = useState<string>("global");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // new row form
  const [newSection, setNewSection] = useState("");
  const [newSeverity, setNewSeverity] = useState("all");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("individual_report_templates")
      .select("*")
      .order("wave")
      .order("position")
      .order("section_key");
    if (error) toast.error(error.message);
    setTpls((data as Tpl[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = tpls.filter((t) => t.wave === wave);

  const saveRow = async (t: Tpl) => {
    setSavingId(t.id);
    const { error } = await supabase
      .from("individual_report_templates")
      .update({
        title: t.title,
        body: t.body,
        enabled: t.enabled,
        position: t.position,
        severity: t.severity,
        section_key: t.section_key,
      })
      .eq("id", t.id);
    setSavingId(null);
    if (error) return toast.error(error.message);
    toast.success("Salvo");
  };

  const removeRow = async (id: string) => {
    if (!confirm("Excluir esta seção do relatório individual?")) return;
    const { error } = await supabase.from("individual_report_templates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setTpls((cur) => cur.filter((x) => x.id !== id));
  };

  const addRow = async () => {
    if (!newSection.trim()) return toast.error("Informe a chave da seção (ex: score, interpretation, self_care)");
    const { data, error } = await supabase
      .from("individual_report_templates")
      .insert({
        wave,
        section_key: newSection.trim(),
        severity: newSeverity,
        title: newTitle || null,
        body: newBody || null,
        position: (filtered.at(-1)?.position ?? 0) + 10,
        enabled: true,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setTpls((cur) => [...cur, data as Tpl]);
    setNewSection(""); setNewTitle(""); setNewBody(""); setNewSeverity("all");
    toast.success("Seção criada");
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Relatório individual — conteúdo</h2>
            <p className="text-xs text-muted-foreground">
              Cada seção pode ser ligada/desligada e editada. Use variáveis entre chaves duplas — variáveis disponíveis nesta onda: <code className="px-1 rounded bg-muted">{VARS_HINT[wave]}</code>
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {WAVES.map((w) => (
              <Button key={w.v} size="sm" variant={wave === w.v ? "default" : "outline"} onClick={() => setWave(w.v)}>
                {w.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {loading && <p className="text-sm text-muted-foreground">Carregando…</p>}

      <div className="space-y-3">
        {filtered.map((t) => (
          <Card key={t.id} className="p-4 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Switch checked={t.enabled} onCheckedChange={(v) => setTpls((cur) => cur.map((x) => x.id === t.id ? { ...x, enabled: v } : x))} />
                <span className="text-xs text-muted-foreground">{t.enabled ? "Visível" : "Oculta"}</span>
              </div>
              <div className="flex gap-2 items-center">
                <Label className="text-xs">Chave</Label>
                <Input className="h-8 w-40" value={t.section_key} onChange={(e) => setTpls((cur) => cur.map((x) => x.id === t.id ? { ...x, section_key: e.target.value } : x))} />
              </div>
              <div className="flex gap-2 items-center">
                <Label className="text-xs">Severidade</Label>
                <select className="h-8 border rounded px-2 text-sm bg-background"
                  value={t.severity}
                  onChange={(e) => setTpls((cur) => cur.map((x) => x.id === t.id ? { ...x, severity: e.target.value } : x))}>
                  {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-2 items-center">
                <Label className="text-xs">Posição</Label>
                <Input className="h-8 w-20" type="number" value={t.position} onChange={(e) => setTpls((cur) => cur.map((x) => x.id === t.id ? { ...x, position: Number(e.target.value) } : x))} />
              </div>
              <div className="ml-auto flex gap-2">
                <Button size="sm" onClick={() => saveRow(t)} disabled={savingId === t.id}>{savingId === t.id ? "Salvando…" : "Salvar"}</Button>
                <Button size="sm" variant="destructive" onClick={() => removeRow(t.id)}>Excluir</Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">Título</Label>
              <Input value={t.title || ""} onChange={(e) => setTpls((cur) => cur.map((x) => x.id === t.id ? { ...x, title: e.target.value } : x))} />
            </div>
            <div>
              <Label className="text-xs">Corpo (markdown leve: **negrito**, quebras de linha, • bullets)</Label>
              <Textarea rows={4} value={t.body || ""} onChange={(e) => setTpls((cur) => cur.map((x) => x.id === t.id ? { ...x, body: e.target.value } : x))} />
            </div>
          </Card>
        ))}

        {filtered.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground">Nenhuma seção configurada para esta onda.</p>
        )}
      </div>

      <Card className="p-4 space-y-3 border-dashed">
        <h3 className="font-semibold text-sm">Adicionar nova seção em <span className="capitalize">{wave}</span></h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Chave (ex: score, interpretation, self_care)</Label>
            <Input value={newSection} onChange={(e) => setNewSection(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Severidade</Label>
            <select className="w-full h-10 border rounded px-2 bg-background" value={newSeverity} onChange={(e) => setNewSeverity(e.target.value)}>
              {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <Label className="text-xs">Título</Label>
          <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Corpo</Label>
          <Textarea rows={4} value={newBody} onChange={(e) => setNewBody(e.target.value)} />
        </div>
        <Button onClick={addRow}>Criar seção</Button>
      </Card>
    </div>
  );
}
