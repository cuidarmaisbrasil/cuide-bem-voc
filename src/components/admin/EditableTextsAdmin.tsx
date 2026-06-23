import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Row {
  id: string;
  key: string;
  label: string;
  content: string;
}

export const EditableTextsAdmin = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("wellness_editable_texts")
      .select("id,key,label,content")
      .order("label");
    const list = (data as Row[]) || [];
    setRows(list);
    setDrafts(Object.fromEntries(list.map((r) => [r.id, r.content])));
  }

  useEffect(() => {
    load();
  }, []);

  async function save(r: Row) {
    setBusy(r.id);
    const { error } = await supabase
      .from("wellness_editable_texts")
      .update({ content: drafts[r.id] ?? "" })
      .eq("id", r.id);
    setBusy(null);
    if (error) return toast.error("Erro ao salvar: " + error.message);
    toast.success("Texto salvo.");
    load();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Textos exibidos publicamente. As alterações são imediatas.
      </p>
      {rows.map((r) => (
        <Card key={r.id} className="p-4 space-y-2">
          <Label className="font-semibold">{r.label}</Label>
          <p className="text-xs text-muted-foreground">
            Chave: <code>{r.key}</code>
          </p>
          <Textarea
            rows={4}
            value={drafts[r.id] ?? ""}
            onChange={(e) => setDrafts({ ...drafts, [r.id]: e.target.value })}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={() => save(r)} disabled={busy === r.id}>
              {busy === r.id ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </Card>
      ))}
      {!rows.length && (
        <p className="text-sm text-muted-foreground">Nenhum texto cadastrado.</p>
      )}
    </div>
  );
};
