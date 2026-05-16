import { useEffect, useMemo, useState } from "react";
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
import { getCopsoq, type CopsoqVersion } from "@/data/copsoq";
import { aggregateScales, bandLabel, type ScaleScore } from "@/lib/copsoqScoring";
import { Plus, Trash2, RotateCcw } from "lucide-react";

interface Override { n: number; text_override: string; active: boolean; }

const SAMPLE_RESPONSES = 24;
function buildSampleAggregates(version: CopsoqVersion) {
  const qs = getCopsoq(version);
  const fake: ScaleScore[][] = Array.from({ length: SAMPLE_RESPONSES }, () => {
    const scaleAcc: Record<string, { sum: number; n: number; type: "positive" | "negative" }> = {};
    qs.forEach((q) => {
      const raw = 1 + Math.floor(Math.random() * 5);
      const score = [0, 25, 50, 75, 100][raw - 1] * (q.reverse ? -1 : 1) + (q.reverse ? 100 : 0);
      const meta = scaleAcc[q.scale] || { sum: 0, n: 0, type: "negative" as const };
      meta.sum += score; meta.n += 1;
      scaleAcc[q.scale] = meta;
    });
    return Object.entries(scaleAcc).map(([scaleId, v]) => ({
      scaleId, name: scaleId, type: v.type, mean: v.sum / v.n, band: "warning" as const, itemCount: v.n,
    }));
  });
  return aggregateScales(fake);
}

export const TrabalhoAdmin = () => {
  // ===== Question overrides =====
  const [version, setVersion] = useState<CopsoqVersion>("short");
  const baseQuestions = useMemo(() => getCopsoq(version), [version]);
  const [overrides, setOverrides] = useState<Record<number, Override>>({});
  const [edits, setEdits] = useState<Record<number, string>>({});

  async function loadOverrides() {
    const { data } = await supabase.from("copsoq_question_overrides").select("*").eq("version", version);
    const map: Record<number, Override> = {};
    (data ?? []).forEach((r: any) => { map[r.n] = { n: r.n, text_override: r.text_override, active: r.active }; });
    setOverrides(map);
    setEdits({});
  }
  useEffect(() => { loadOverrides(); }, [version]);

  async function saveQuestion(n: number, originalText: string) {
    const newText = (edits[n] ?? overrides[n]?.text_override ?? originalText).trim();
    if (!newText) return toast.error("Texto não pode ser vazio");
    const existing = overrides[n];
    if (existing) {
      const { error } = await supabase.from("copsoq_question_overrides")
        .update({ text_override: newText }).eq("version", version).eq("n", n);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("copsoq_question_overrides")
        .insert({ version, n, text_override: newText, active: true });
      if (error) return toast.error(error.message);
    }
    toast.success(`Pergunta ${n} salva`);
    await loadOverrides();
  }

  async function toggleActive(n: number, active: boolean, originalText: string) {
    const existing = overrides[n];
    if (existing) {
      const { error } = await supabase.from("copsoq_question_overrides")
        .update({ active }).eq("version", version).eq("n", n);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("copsoq_question_overrides")
        .insert({ version, n, text_override: originalText, active });
      if (error) return toast.error(error.message);
    }
    await loadOverrides();
  }

  async function resetQuestion(n: number) {
    if (!confirm(`Restaurar pergunta ${n} ao texto original?`)) return;
    const { error } = await supabase.from("copsoq_question_overrides")
      .delete().eq("version", version).eq("n", n);
    if (error) return toast.error(error.message);
    toast.success("Restaurada");
    await loadOverrides();
  }

  // ===== Report template =====
  const [blocks, setBlocks] = useState<Array<{ id: string; title: string; body: string }>>([]);
  const [templateDirty, setTemplateDirty] = useState(false);

  async function loadTemplate() {
    const { data } = await supabase.from("copsoq_report_template").select("blocks").eq("id", 1).maybeSingle();
    setBlocks((data?.blocks as any) ?? []);
    setTemplateDirty(false);
  }
  useEffect(() => { loadTemplate(); }, []);

  async function saveTemplate() {
    const { error } = await supabase.from("copsoq_report_template").update({ blocks }).eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success("Template salvo");
    setTemplateDirty(false);
  }

  function updateBlock(idx: number, patch: Partial<{ title: string; body: string }>) {
    setBlocks((b) => b.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
    setTemplateDirty(true);
  }
  function addBlock() {
    setBlocks((b) => [...b, { id: `b${Date.now()}`, title: "Novo bloco", body: "" }]);
    setTemplateDirty(true);
  }
  function removeBlock(idx: number) {
    setBlocks((b) => b.filter((_, i) => i !== idx));
    setTemplateDirty(true);
  }
  function moveBlock(idx: number, dir: -1 | 1) {
    setBlocks((b) => {
      const next = [...b];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return next;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
    setTemplateDirty(true);
  }

  // ===== Sample preview =====
  const sample = useMemo(() => buildSampleAggregates(version), [version]);

  // ===== Per-company notes =====
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [companyNotes, setCompanyNotes] = useState<string>("");
  const [companyResponses, setCompanyResponses] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("companies").select("id,name,status,slug").eq("status", "approved").order("name")
      .then(({ data }) => setCompanies(data ?? []));
  }, []);

  useEffect(() => {
    if (!selectedCompany) { setCompanyNotes(""); setCompanyResponses([]); return; }
    supabase.from("copsoq_company_notes").select("notes").eq("company_id", selectedCompany).maybeSingle()
      .then(({ data }) => setCompanyNotes(data?.notes ?? ""));
    supabase.from("copsoq_responses").select("*").eq("company_id", selectedCompany)
      .then(({ data }) => setCompanyResponses(data ?? []));
  }, [selectedCompany]);

  const companyAggregates = useMemo(() => {
    if (!companyResponses.length) return [];
    const all: ScaleScore[][] = companyResponses.map((r) => {
      const sc = r.scores || {};
      return Object.entries(sc).map(([scaleId, v]: [string, any]) => ({
        scaleId, name: scaleId, type: "negative" as const,
        mean: v.mean ?? 0, band: "warning" as const, itemCount: v.n ?? 1,
      }));
    });
    return aggregateScales(all);
  }, [companyResponses]);

  async function saveCompanyNotes() {
    if (!selectedCompany) return;
    const { error } = await supabase.from("copsoq_company_notes")
      .upsert({ company_id: selectedCompany, notes: companyNotes }, { onConflict: "company_id" });
    if (error) return toast.error(error.message);
    toast.success("Observações salvas");
  }

  return (
    <Tabs defaultValue="questions" className="space-y-4">
      <TabsList>
        <TabsTrigger value="questions">Perguntas</TabsTrigger>
        <TabsTrigger value="template">Template do relatório</TabsTrigger>
        <TabsTrigger value="sample">Sample do relatório</TabsTrigger>
        <TabsTrigger value="notes">Observações por empresa</TabsTrigger>
      </TabsList>

      {/* ===== Questions editor ===== */}
      <TabsContent value="questions" className="space-y-3">
        <Card className="p-4 flex items-center gap-3 flex-wrap">
          <Label className="text-sm">Versão</Label>
          <Select value={version} onValueChange={(v) => setVersion(v as CopsoqVersion)}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="short">Curta (41 itens)</SelectItem>
              <SelectItem value="medium">Média (76 itens)</SelectItem>
              <SelectItem value="long">Longa</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Edite o enunciado de qualquer pergunta. Texto vazio = mantém original. Desativar remove a pergunta do questionário.
          </p>
        </Card>

        <div className="space-y-2">
          {baseQuestions.map((q) => {
            const ov = overrides[q.n];
            const value = edits[q.n] ?? ov?.text_override ?? q.text;
            const isOverridden = !!ov && ov.text_override !== q.text;
            const dirty = edits[q.n] !== undefined && edits[q.n] !== (ov?.text_override ?? q.text);
            return (
              <Card key={q.n} className="p-3 space-y-2">
                <div className="flex items-start gap-2 flex-wrap">
                  <Badge variant="outline" className="font-mono">{q.n}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{q.scale}</Badge>
                  {isOverridden && <Badge variant="default" className="text-[10px]">editada</Badge>}
                  {ov?.active === false && <Badge variant="destructive" className="text-[10px]">desativada</Badge>}
                  <div className="ml-auto flex items-center gap-2">
                    <Label className="text-xs">Ativa</Label>
                    <Switch
                      checked={ov?.active !== false}
                      onCheckedChange={(c) => toggleActive(q.n, c, q.text)}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground italic">Original: {q.text}</p>
                <Textarea
                  value={value}
                  onChange={(e) => setEdits({ ...edits, [q.n]: e.target.value })}
                  rows={2}
                  className="text-sm"
                />
                <div className="flex gap-2 justify-end">
                  {isOverridden && (
                    <Button size="sm" variant="ghost" onClick={() => resetQuestion(q.n)}>
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restaurar
                    </Button>
                  )}
                  <Button size="sm" disabled={!dirty && !isOverridden && !edits[q.n]} onClick={() => saveQuestion(q.n, q.text)}>
                    Salvar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </TabsContent>

      {/* ===== Template editor ===== */}
      <TabsContent value="template" className="space-y-3">
        <Card className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div>
              <h3 className="font-semibold">Template global do relatório COPSOQ</h3>
              <p className="text-xs text-muted-foreground">Aplicado a todas as empresas. Blocos aparecem nessa ordem no relatório.</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={addBlock}><Plus className="h-4 w-4 mr-1" /> Novo bloco</Button>
              <Button size="sm" disabled={!templateDirty} onClick={saveTemplate}>Salvar template</Button>
            </div>
          </div>

          <div className="space-y-3">
            {blocks.map((b, i) => (
              <Card key={b.id} className="p-3 space-y-2 bg-muted/30">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="font-mono text-[10px]">{i + 1}</Badge>
                  <Input
                    value={b.title}
                    onChange={(e) => updateBlock(i, { title: e.target.value })}
                    className="flex-1 min-w-[180px] font-medium"
                  />
                  <Button size="sm" variant="ghost" onClick={() => moveBlock(i, -1)} disabled={i === 0}>↑</Button>
                  <Button size="sm" variant="ghost" onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1}>↓</Button>
                  <Button size="sm" variant="ghost" onClick={() => removeBlock(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <Textarea
                  value={b.body}
                  onChange={(e) => updateBlock(i, { body: e.target.value })}
                  rows={4}
                />
              </Card>
            ))}
            {blocks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum bloco. Clique em "Novo bloco" para começar.</p>
            )}
          </div>
        </Card>
      </TabsContent>

      {/* ===== Sample preview ===== */}
      <TabsContent value="sample" className="space-y-3">
        <Card className="p-4 flex items-center gap-3 flex-wrap">
          <Label className="text-sm">Versão (sample)</Label>
          <Select value={version} onValueChange={(v) => setVersion(v as CopsoqVersion)}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="short">Curta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="long">Longa</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Preview com dados simulados ({SAMPLE_RESPONSES} respostas aleatórias).</p>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-display text-xl font-semibold">Relatório COPSOQ II — empresa exemplo</h2>
          {blocks.map((b) => (
            <section key={b.id} className="space-y-1">
              <h3 className="font-semibold text-foreground">{b.title}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{b.body}</p>
            </section>
          ))}

          <section className="space-y-2">
            <h3 className="font-semibold">Resultados por escala</h3>
            {sample.map((row) => (
              <div key={row.scaleId} className="flex items-center justify-between border-b border-border/40 pb-1">
                <span className="text-sm">{row.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono">{row.mean.toFixed(1)}</span>
                  <Badge variant={row.band === "risk" ? "destructive" : row.band === "warning" ? "secondary" : "default"}>
                    {bandLabel(row.band)}
                  </Badge>
                </div>
              </div>
            ))}
          </section>
        </Card>
      </TabsContent>

      {/* ===== Per-company notes ===== */}
      <TabsContent value="notes" className="space-y-3">
        <Card className="p-4 space-y-3">
          <div>
            <Label>Empresa aprovada</Label>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger><SelectValue placeholder="Selecione uma empresa…" /></SelectTrigger>
              <SelectContent>
                {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {selectedCompany && (
            <>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{companyResponses.length} resposta(s) coletadas</Badge>
              </div>

              {companyAggregates.length > 0 && (
                <div className="space-y-1 max-h-64 overflow-y-auto border rounded-md p-3 bg-muted/30">
                  {companyAggregates.map((row) => (
                    <div key={row.scaleId} className="flex items-center justify-between text-xs border-b border-border/40 pb-1">
                      <span>{row.name}</span>
                      <span className="font-mono">{row.mean.toFixed(1)} · {bandLabel(row.band)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <Label>Observações do admin (visíveis para o dono da empresa)</Label>
                <Textarea
                  value={companyNotes}
                  onChange={(e) => setCompanyNotes(e.target.value)}
                  rows={8}
                  placeholder="Análise qualitativa, recomendações específicas, contexto…"
                />
              </div>
              <Button onClick={saveCompanyNotes}>Salvar observações</Button>
            </>
          )}
        </Card>
      </TabsContent>
    </Tabs>
  );
};
