import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, CheckCircle2, Download } from "lucide-react";

interface Lead {
  id: string;
  name: string | null;
  email: string;
  company: string;
  role: string;
  age: number | null;
  phone: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export const SampleReportLeadsAdmin = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sample_report_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    setRows((data ?? []) as Lead[]);
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id: string, status: string) => {
    setBusy(id);
    const { error } = await supabase
      .from("sample_report_leads")
      .update({ status })
      .eq("id", id);
    setBusy(null);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  const exportCsv = () => {
    const headers = ["data", "nome", "email", "empresa", "cargo", "idade", "telefone", "status"];
    const lines = rows.map((r) =>
      [
        new Date(r.created_at).toISOString(),
        r.name ?? "",
        r.email,
        r.company,
        r.role,
        r.age ?? "",
        r.phone,
        r.status,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sample-report-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pending = rows.filter((r) => r.status === "new").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-display text-2xl font-semibold">Amostras do relatório (leads)</h2>
          <p className="text-sm text-muted-foreground">
            Pessoas que pediram acesso à amostra em /trabalho.
            {pending > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pending} novo{pending > 1 ? "s" : ""}
              </Badge>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!rows.length}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhum pedido de amostra ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Idade</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>{r.name ?? "—"}</TableCell>
                    <TableCell className="font-medium">{r.email}</TableCell>
                    <TableCell>{r.company}</TableCell>
                    <TableCell>{r.role}</TableCell>
                    <TableCell>{r.age ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.phone}</TableCell>
                    <TableCell>
                      {r.status === "contacted" ? (
                        <Badge className="bg-success/15 text-success border-success/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Contatado
                        </Badge>
                      ) : r.status === "archived" ? (
                        <Badge variant="outline">Arquivado</Badge>
                      ) : (
                        <Badge variant="secondary">Novo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status !== "contacted" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setStatus(r.id, "contacted")}
                          disabled={busy === r.id}
                        >
                          Marcar contatado
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setStatus(r.id, "new")}
                          disabled={busy === r.id}
                        >
                          Reabrir
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
};
