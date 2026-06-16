import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface TatImage {
  id: string;
  label: string;
  url: string;
  storage_path: string | null;
  sort_order: number;
  active: boolean;
  notes: string | null;
}

const BUCKET = "tat-images";

export const TatAdmin = () => {
  const [images, setImages] = useState<TatImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const { data, error } = await supabase
      .from("tat_images")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) return toast.error(error.message);
    setImages((data as any) || []);
  }
  useEffect(() => { load(); }, []);

  async function handleUpload(file: File, replaceId?: string) {
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const url = pub.publicUrl;

      if (replaceId) {
        const target = images.find((i) => i.id === replaceId);
        const { error: updErr } = await supabase
          .from("tat_images")
          .update({ url, storage_path: path })
          .eq("id", replaceId);
        if (updErr) throw updErr;
        if (target?.storage_path) {
          await supabase.storage.from(BUCKET).remove([target.storage_path]);
        }
        toast.success("Imagem substituída.");
      } else {
        const nextOrder = images.length ? Math.max(...images.map((i) => i.sort_order)) + 1 : 1;
        const { error: insErr } = await supabase.from("tat_images").insert({
          label: newLabel || file.name,
          url,
          storage_path: path,
          sort_order: nextOrder,
          active: true,
        });
        if (insErr) throw insErr;
        setNewLabel("");
        toast.success("Imagem adicionada.");
      }
      await load();
    } catch (e: any) {
      toast.error(e.message || "Falha no upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function updateField(id: string, patch: Partial<TatImage>) {
    const { error } = await supabase.from("tat_images").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    setImages((arr) => arr.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  async function remove(img: TatImage) {
    if (!confirm(`Remover imagem "${img.label}"?`)) return;
    const { error } = await supabase.from("tat_images").delete().eq("id", img.id);
    if (error) return toast.error(error.message);
    if (img.storage_path) await supabase.storage.from(BUCKET).remove([img.storage_path]);
    setImages((arr) => arr.filter((i) => i.id !== img.id));
    toast.success("Imagem removida.");
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">Imagens do TAT</h3>
        <p className="text-xs text-muted-foreground">
          As imagens ativas são sorteadas aleatoriamente para cada participante na onda do PHQ-9, antes do COPSOQ.
          A interpretação é qualitativa (analisada pelo psicólogo); a pontuação automatizada será adicionada futuramente.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
          <div className="md:col-span-2">
            <Label>Rótulo (opcional)</Label>
            <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="ex: Cena 1 — figuras ambíguas" />
          </div>
          <div>
            <Label>Adicionar imagem</Label>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
            />
          </div>
        </div>
      </Card>

      {images.length === 0 && (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Nenhuma imagem cadastrada ainda. Adicione pelo menos uma para que a atividade apareça aos participantes.
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {images.map((img) => (
          <Card key={img.id} className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">#{img.sort_order}</Badge>
              <Badge variant={img.active ? "default" : "secondary"}>{img.active ? "Ativa" : "Inativa"}</Badge>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs">Ativa</span>
                <Switch checked={img.active} onCheckedChange={(v) => updateField(img.id, { active: v })} />
              </div>
            </div>
            <div className="rounded border overflow-hidden bg-muted flex items-center justify-center" style={{ minHeight: 160 }}>
              <img src={img.url} alt={img.label} className="max-h-56 object-contain" />
            </div>
            <Input
              value={img.label}
              onChange={(e) => setImages((arr) => arr.map((i) => i.id === img.id ? { ...i, label: e.target.value } : i))}
              onBlur={(e) => updateField(img.id, { label: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                value={img.sort_order}
                onChange={(e) => setImages((arr) => arr.map((i) => i.id === img.id ? { ...i, sort_order: +e.target.value } : i))}
                onBlur={(e) => updateField(img.id, { sort_order: +e.target.value })}
              />
              <ReplaceButton onPick={(file) => handleUpload(file, img.id)} disabled={uploading} />
            </div>
            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => remove(img)}>
              Remover
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

function ReplaceButton({ onPick, disabled }: { onPick: (f: File) => void; disabled?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) { onPick(f); if (ref.current) ref.current.value = ""; } }}
      />
      <Button variant="outline" size="sm" disabled={disabled} onClick={() => ref.current?.click()}>
        Substituir imagem
      </Button>
    </>
  );
}

export default TatAdmin;
