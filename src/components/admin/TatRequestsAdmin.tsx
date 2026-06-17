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
import { Loader2, RefreshCw, CheckCircle2 } from "lucide-react";

interface TatRequest {
  id: string;
  email: string;
  phq9_score: number | null;
  symptom_count: number | null;
  severity_level: string | null;
  age: number | null;
  status: string;
  sent_at: string | null;
  notes: string | null;
  created_at: string;
}

export const TatRequestsAdmin = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<TatRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tat_public_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    setLoading(false);
    if (error) {
      toast({
        title: "Erro ao carregar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setRows((data ?? []) as TatRequest[]);
  };

  useEffect(() => {
    load();
  }, []);

  const markSent = async (id: string) => {
    setUpdatingId(id);
    const { error } = await supabase
      .from("tat_public_requests")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", id);
    setUpdatingId(null);
    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Marcado como enviado" });
    load();
  };

  const reopen = async (id: string) => {
    setUpdatingId(id);
    const { error } = await supabase
      .from("tat_public_requests")
      .update({ status: "pending", sent_at: null })
      .eq("id", id);
    setUpdatingId(null);
    if (!error) load();
  };

  const pendingCount = rows.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">
            Solicitações TAT (página principal)
          </h2>
          <p className="text-sm text-muted-foreground">
            Pessoas que pediram receber o TAT após o PHQ-9.
            {pendingCount > 0 && (
              <>
                {" "}
                <Badge variant="secondary" className="ml-1">
                  {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
                </Badge>
              </>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Atualizar
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhuma solicitação ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>PHQ-9</TableHead>
                  <TableHead>Sintomas</TableHead>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Idade</TableHead>
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
                    <TableCell className="font-medium">{r.email}</TableCell>
                    <TableCell>{r.phq9_score ?? "—"}</TableCell>
                    <TableCell>{r.symptom_count ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.severity_level ?? "—"}</Badge>
                    </TableCell>
                    <TableCell>{r.age ?? "—"}</TableCell>
                    <TableCell>
                      {r.status === "sent" ? (
                        <Badge className="bg-success/15 text-success border-success/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Enviado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pendente</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "sent" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => reopen(r.id)}
                          disabled={updatingId === r.id}
                        >
                          Reabrir
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => markSent(r.id)}
                          disabled={updatingId === r.id}
                        >
                          {updatingId === r.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Marcar enviado"
                          )}
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
