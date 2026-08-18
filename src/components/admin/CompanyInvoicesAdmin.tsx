import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Download, Trash2, Upload } from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string | null;
  competencia: string | null;
  description: string | null;
  amount_cents: number;
  status: string;
  issued_at: string | null;
  due_date: string | null;
  file_path: string | null;
}

interface Props {
  companyId: string;
  companyName: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const CompanyInvoicesAdmin = ({ companyId, companyName, open, onOpenChange }: Props) => {
  const [items, setItems] = useState<Invoice[]>([]);
  const [busy, setBusy] = useState(false);
  const [number, setNumber] = useState("");
  const [competencia, setCompetencia] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function load() {
    const { data } = await supabase
      .from("company_invoices")
      .select("id,invoice_number,competencia,description,amount_cents,status,issued_at,due_date,file_path")
      .eq("company_id", companyId)
      .order("issued_at", { ascending: false });
    setItems((data as any) ?? []);
  }

  useEffect(() => {
    if (open) load();
  }, [open, companyId]);

  async function create() {
    const cents = Math.round(parseFloat(amount.replace(",", ".")) * 100);
    if (!Number.isFinite(cents) || cents <= 0) return toast.error("Informe um valor válido.");
    setBusy(true);
    try {
      let filePath: string | null = null;
      if (file) {
        filePath = `${companyId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("company-invoices").upload(filePath, file);
        if (upErr) throw upErr;
      }
      const { error } = await supabase.from("company_invoices").insert({
        company_id: companyId,
        invoice_number: number.trim() || null,
        competencia: competencia.trim() || null,
        description: description.trim() || null,
        amount_cents: cents,
        issued_at: issuedAt || null,
        due_date: dueDate || null,
        file_path: filePath,
      });
      if (error) throw error;
      toast.success("Nota fiscal registrada.");
      setNumber(""); setCompetencia(""); setDescription(""); setAmount(""); setIssuedAt(""); setDueDate(""); setFile(null);
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao registrar nota.");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: string) {
    const { error } = await supabase
      .from("company_invoices")
      .update({ status, paid_at: status === "paga" ? new Date().toISOString().slice(0, 10) : null })
      .eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  async function remove(inv: Invoice) {
    if (!confirm("Excluir esta nota fiscal?")) return;
    if (inv.file_path) await supabase.storage.from("company-invoices").remove([inv.file_path]);
    const { error } = await supabase.from("company_invoices").delete().eq("id", inv.id);
    if (error) return toast.error(error.message);
    load();
  }

  async function download(inv: Invoice) {
    if (!inv.file_path) return toast.error("Sem arquivo anexado.");
    const { data, error } = await supabase.storage.from("company-invoices").createSignedUrl(inv.file_path, 60);
    if (error || !data) return toast.error("Não foi possível gerar o link.");
    window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notas fiscais — {companyName}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label>Número</Label><Input value={number} onChange={(e) => setNumber(e.target.value)} /></div>
          <div><Label>Competência</Label><Input value={competencia} onChange={(e) => setCompetencia(e.target.value)} placeholder="Ex.: 2026-08" /></div>
          <div className="sm:col-span-2"><Label>Descrição</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ciclo 1 — Cuidar+ Trabalho" /></div>
          <div><Label>Valor (R$)</Label><Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1200,00" /></div>
          <div><Label>Emissão</Label><Input type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} /></div>
          <div><Label>Vencimento</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          <div>
            <Label>Arquivo (PDF)</Label>
            <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <Button onClick={create} disabled={busy}>
          <Upload className="h-4 w-4 mr-1" /> {busy ? "Salvando…" : "Registrar nota"}
        </Button>

        <div className="space-y-2 pt-2">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma nota registrada.</p>
          ) : (
            items.map((inv) => (
              <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 p-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium">
                    NF {inv.invoice_number ?? "—"} {inv.competencia ? `· ${inv.competencia}` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground">{inv.description ?? "—"}</div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">{brl(inv.amount_cents)}</span>
                  <Badge variant={inv.status === "paga" ? "default" : inv.status === "cancelada" ? "destructive" : "secondary"}>
                    {inv.status}
                  </Badge>
                  {inv.status !== "paga" && (
                    <Button size="sm" variant="outline" onClick={() => setStatus(inv.id, "paga")}>Marcar paga</Button>
                  )}
                  {inv.status !== "cancelada" && (
                    <Button size="sm" variant="ghost" onClick={() => setStatus(inv.id, "cancelada")}>Cancelar</Button>
                  )}
                  {inv.file_path && (
                    <Button size="sm" variant="outline" onClick={() => download(inv)}><Download className="h-4 w-4" /></Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(inv)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
