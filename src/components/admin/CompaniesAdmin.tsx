import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  slug: string;
  status: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  cnpj: string | null;
  created_at: string;
  approved_at: string | null;
  notes: string | null;
}

export function CompaniesAdmin() {
  const [items, setItems] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: "approved" | "rejected" | "pending") {
    const patch: any = { status };
    if (status === "approved") patch.approved_at = new Date().toISOString();
    if (status !== "approved") patch.approved_at = null;
    const { error } = await supabase.from("companies").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? "Empresa aprovada" : status === "rejected" ? "Empresa rejeitada" : "Status atualizado");
    await load();
  }

  const filtered = items.filter((c) => filter === "all" || c.status === filter);
  const counts = {
    pending: items.filter((i) => i.status === "pending").length,
    approved: items.filter((i) => i.status === "approved").length,
    rejected: items.filter((i) => i.status === "rejected").length,
    all: items.length,
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-lg font-semibold">Empresas (Cuidar+ Trabalho)</h2>
        <div className="flex gap-1 flex-wrap">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f === "pending" ? "Pendentes" : f === "approved" ? "Aprovadas" : f === "rejected" ? "Rejeitadas" : "Todas"} ({counts[f]})
            </Button>
          ))}
        </div>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma empresa nesta categoria.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">/{c.slug}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{c.contact_name}</div>
                    <div className="text-xs text-muted-foreground">{c.contact_email}</div>
                    {c.contact_phone && <div className="text-xs text-muted-foreground">{c.contact_phone}</div>}
                  </TableCell>
                  <TableCell className="text-xs">{c.cnpj ?? "—"}</TableCell>
                  <TableCell className="text-xs">{new Date(c.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "approved" ? "default" : c.status === "rejected" ? "destructive" : "secondary"}>
                      {c.status === "approved" ? "Aprovada" : c.status === "rejected" ? "Rejeitada" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {c.status !== "approved" && (
                        <Button size="sm" onClick={() => setStatus(c.id, "approved")}>Aprovar</Button>
                      )}
                      {c.status !== "rejected" && (
                        <Button size="sm" variant="outline" onClick={() => setStatus(c.id, "rejected")}>Rejeitar</Button>
                      )}
                      {c.status !== "pending" && (
                        <Button size="sm" variant="ghost" onClick={() => setStatus(c.id, "pending")}>Reabrir</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
