import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Q {
  id: string;
  instrument: string;
  n: number;
  text: string;
  scale: string | null;
  reverse: boolean;
  response_set: string | null;
  active: boolean;
}

const RESPONSE_SETS: Record<string, { value: number; label: string }[]> = {
  phq9_freq: [
    { value: 0, label: "Nenhuma vez" },
    { value: 1, label: "Vários dias" },
    { value: 2, label: "Mais da metade dos dias" },
    { value: 3, label: "Quase todos os dias" },
  ],
  phq9_impact: [
    { value: 0, label: "Nada difícil" },
    { value: 1, label: "Um pouco difícil" },
    { value: 2, label: "Muito difícil" },
    { value: 3, label: "Extremamente difícil" },
  ],
  ecig_5: [
    { value: 1, label: "Nunca" },
    { value: 2, label: "Raramente" },
    { value: 3, label: "Às vezes" },
    { value: 4, label: "Frequentemente" },
    { value: 5, label: "Sempre" },
  ],
  copsoq_5_freq: [
    { value: 1, label: "Nunca" },
    { value: 2, label: "Raramente" },
    { value: 3, label: "Às vezes" },
    { value: 4, label: "Frequentemente" },
    { value: 5, label: "Sempre" },
  ],
  lipt_0_4: [
    { value: 0, label: "Nunca" },
    { value: 1, label: "Raramente" },
    { value: 2, label: "Algumas vezes/mês" },
    { value: 3, label: "Várias vezes/semana" },
    { value: 4, label: "Diariamente" },
  ],
  asx_5: [
    { value: 1, label: "Discordo totalmente" },
    { value: 2, label: "Discordo" },
    { value: 3, label: "Neutro" },
    { value: 4, label: "Concordo" },
    { value: 5, label: "Concordo totalmente" },
  ],
};

const INSTRUMENTS: { value: string; label: string; wave: string }[] = [
  { value: "phq9", label: "PHQ-9 — Depressão (+ TAT)", wave: "Onda 1" },
  { value: "copsoq_short_br", label: "COPSOQ II — Fatores psicossociais (versão curta BR)", wave: "Onda 2" },
  { value: "copsoq_mid_br", label: "COPSOQ II — versão média BR", wave: "Onda 2" },
  { value: "ecig", label: "ECIG — Conflito intragrupal (+ Rorschach)", wave: "Onda 3" },
  { value: "lipt60", label: "LIPT-60 — Assédio moral", wave: "Onda 4" },
  { value: "phq9", label: "PHQ-9 — Reteste", wave: "Onda 4 (reteste)" },
  { value: "assedio_sexual", label: "MDiSH + SHRAS — Assédio sexual", wave: "Onda 5" },
];

export default function InstrumentQuestionsAdmin() {
  const [instrument, setInstrument] = useState<string>("phq9");
  const [rows, setRows] = useState<Q[]>([]);
  const [edits, setEdits] = useState<Record<string, Partial<Q>>>({});
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("instrument_questions")
      .select("*")
      .eq("instrument", instrument)
      .order("n");
    if (error) toast.error(error.message);
    setRows((data ?? []) as Q[]);
    setEdits({});
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [instrument]);

  const meta = useMemo(() => INSTRUMENTS.find(i => i.value === instrument)!, [instrument]);

  function patch(id: string, p: Partial<Q>) {
    setEdits(e => ({ ...e, [id]: { ...e[id], ...p } }));
  }

  async function save(row: Q) {
    const e = edits[row.id];
    if (!e) return;
    const { error } = await supabase
      .from("instrument_questions")
      .update({ ...e, updated_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success(`Item ${row.n} salvo`);
    await load();
  }

  async function toggleActive(row: Q, active: boolean) {
    const { error } = await supabase.from("instrument_questions").update({ active }).eq("id", row.id);
    if (error) return toast.error(error.message);
    setRows(rs => rs.map(r => r.id === row.id ? { ...r, active } : r));
  }

  async function remove(row: Q) {
    if (!confirm(`Excluir item ${row.n}?`)) return;
    const { error } = await supabase.from("instrument_questions").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
    await load();
  }

  async function add() {
    const nextN = (rows.at(-1)?.n ?? 0) + 1;
    const { error } = await supabase.from("instrument_questions").insert({
      instrument, n: nextN, text: "Nova pergunta", scale: null, reverse: false, response_set: null, active: true,
    });
    if (error) return toast.error(error.message);
    await load();
  }

  return (
    <div className="space-y-3">
      <Card className="p-4 flex flex-wrap items-center gap-3">
        <Label className="text-sm">Instrumento</Label>
        <Select value={instrument} onValueChange={setInstrument}>
          <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
          <SelectContent>
            {INSTRUMENTS.map(i => (
              <SelectItem key={i.value} value={i.value}>
                {i.wave} — {i.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary">{rows.length} itens</Badge>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={add}><Plus className="h-4 w-4 mr-1" /> Adicionar item</Button>
        </div>
        <p className="text-xs text-muted-foreground w-full">
          Edições são aplicadas imediatamente ao questionário enviado aos colaboradores. Para o COPSOQ, use a aba "Perguntas".
        </p>
      </Card>

      {(() => {
        const sets = Array.from(new Set(rows.map(r => r.response_set).filter(Boolean))) as string[];
        if (sets.length === 0) return null;
        return (
          <Card className="p-4 space-y-3 bg-muted/30">
            <p className="text-sm font-medium">Respostas possíveis (visto pelo colaborador)</p>
            {sets.map(s => {
              const opts = RESPONSE_SETS[s];
              return (
                <div key={s} className="space-y-1">
                  <Badge variant="outline" className="text-[10px] font-mono">{s}</Badge>
                  {opts ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {opts.map(o => (
                        <Badge key={o.value} variant="secondary" className="text-[11px]">
                          <span className="font-mono mr-1 opacity-60">{o.value}</span>{o.label}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-destructive">⚠ Conjunto não mapeado em WellnessResponder — colaborador verá o fallback COPSOQ 1–5.</p>
                  )}
                </div>
              );
            })}
          </Card>
        );
      })()}

      {loading && <p className="text-sm text-muted-foreground text-center py-6">Carregando…</p>}

      <div className="space-y-2">
        {rows.map(row => {
          const e = edits[row.id] ?? {};
          const dirty = Object.keys(e).length > 0;
          return (
            <Card key={row.id} className="p-3 space-y-2">
              <div className="flex items-start gap-2 flex-wrap">
                <Badge variant="outline" className="font-mono">{row.n}</Badge>
                {row.scale && <Badge variant="secondary" className="text-[10px]">{row.scale}</Badge>}
                {row.reverse && <Badge className="text-[10px]">reverso</Badge>}
                {row.response_set && <Badge variant="outline" className="text-[10px]">resp: {row.response_set}</Badge>}
                {!row.active && <Badge variant="destructive" className="text-[10px]">inativa</Badge>}
                <div className="ml-auto flex items-center gap-2">
                  <Label className="text-xs">Ativa</Label>
                  <Switch checked={row.active} onCheckedChange={(c) => toggleActive(row, c)} />
                  <Button size="sm" variant="ghost" onClick={() => remove(row)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <Textarea
                value={e.text ?? row.text}
                onChange={(ev) => patch(row.id, { text: ev.target.value })}
                rows={2}
                className="text-sm"
              />

              {(() => {
                const rs = (e.response_set ?? row.response_set) || "";
                const opts = RESPONSE_SETS[rs];
                if (!opts) return null;
                return (
                  <div className="flex flex-wrap gap-1 pl-1">
                    <span className="text-[10px] text-muted-foreground mr-1">Opções:</span>
                    {opts.map(o => (
                      <Badge key={o.value} variant="outline" className="text-[10px] font-normal">
                        <span className="font-mono mr-1 opacity-60">{o.value}</span>{o.label}
                      </Badge>
                    ))}
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div>
                  <Label className="text-[11px]">Escala / fator</Label>
                  <Input
                    value={e.scale ?? row.scale ?? ""}
                    onChange={(ev) => patch(row.id, { scale: ev.target.value })}
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Conjunto de resposta</Label>
                  <Input
                    value={e.response_set ?? row.response_set ?? ""}
                    onChange={(ev) => patch(row.id, { response_set: ev.target.value })}
                    placeholder="ex: phq9_freq, likert5"
                    className="text-xs h-8"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Label className="text-[11px]">Reverso</Label>
                  <Switch
                    checked={e.reverse ?? row.reverse}
                    onCheckedChange={(c) => patch(row.id, { reverse: c })}
                  />
                </div>
                <div className="flex items-end justify-end">
                  <Button size="sm" disabled={!dirty} onClick={() => save(row)}>Salvar</Button>
                </div>
              </div>
            </Card>
          );
        })}
        {!loading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum item para <strong>{meta.label}</strong>. Clique em "Adicionar item".
          </p>
        )}
      </div>
    </div>
  );
}
