import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Trash2, Plus, Upload, ArrowLeft } from "lucide-react";

interface Participant {
  id: string;
  company_id: string;
  email: string;
  full_name: string | null;
  area: string | null;
  setor: string | null;
  departamento: string | null;
}

interface Company {
  id: string;
  name: string;
  status: string;
  owner_user_id: string;
}

interface Round {
  id: string;
  round_no: number;
  first_wave_approved_at: string | null;
  opened_at: string | null;
  closed_at: string | null;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function TrabalhoOndas() {
  const navigate = useNavigate();
  const { user, loading, isAdmin, isWaveManager, waveManagerCompanyIds } = useAuth();

  const [company, setCompany] = useState<Company | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [round1, setRound1] = useState<Round | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [invStats, setInvStats] = useState<Record<string, { sent: number; total: number }>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [approving, setApproving] = useState(false);
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Gestão de ondas — Cuidar+ Trabalho";
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Determine which company: owner or wave manager
      let companyId: string | null = null;
      const { data: owned } = await supabase
        .from("companies")
        .select("id,name,status,owner_user_id")
        .eq("owner_user_id", user.id)
        .maybeSingle();
      if (owned) {
        setCompany(owned as any);
        companyId = owned.id;
      } else if (waveManagerCompanyIds.length > 0) {
        const { data: c } = await supabase
          .from("companies")
          .select("id,name,status,owner_user_id")
          .eq("id", waveManagerCompanyIds[0])
          .maybeSingle();
        if (c) {
          setCompany(c as any);
          companyId = c.id;
        }
      }
      if (!companyId) return;
      await refresh(companyId);
    })();
  }, [user, waveManagerCompanyIds.join(",")]);

  async function refresh(companyId: string) {
    const [pRes, rRes] = await Promise.all([
      supabase
        .from("wellness_participants")
        .select("id,company_id,email,full_name,area,setor,departamento")
        .eq("company_id", companyId)
        .order("email"),
      supabase
        .from("wellness_company_rounds")
        .select("id,round_no,first_wave_approved_at,opened_at,closed_at")
        .eq("company_id", companyId)
        .order("round_no"),
    ]);
    setParticipants((pRes.data as any) ?? []);
    const rs = (rRes.data as any as Round[]) ?? [];
    setRounds(rs);
    setRound1(rs.find((r) => r.round_no === 1) ?? null);

    // Invitation stats per wave (round 1)
    if (pRes.data && pRes.data.length > 0) {
      const pids = pRes.data.map((p: any) => p.id);
      const { data: invs } = await supabase
        .from("wellness_invitations")
        .select("wave,round_no,status,sent_at")
        .in("participant_id", pids);
      const stats: Record<string, { sent: number; total: number }> = {};
      (invs ?? []).forEach((i: any) => {
        const k = `${i.round_no}-${i.wave}`;
        if (!stats[k]) stats[k] = { sent: 0, total: 0 };
        stats[k].total += 1;
        if (i.sent_at) stats[k].sent += 1;
      });
      setInvStats(stats);
    }
  }

  const grouped = useMemo(() => {
    const g: Record<string, Record<string, Record<string, Participant[]>>> = {};
    participants.forEach((p) => {
      const d = p.departamento?.trim() || "— Sem departamento —";
      const s = p.setor?.trim() || "— Sem setor —";
      const a = p.area?.trim() || "— Sem área —";
      g[d] ??= {};
      g[d][s] ??= {};
      g[d][s][a] ??= [];
      g[d][s][a].push(p);
    });
    return g;
  }, [participants]);

  const validation = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const emails = participants.map((p) => (p.email ?? "").trim().toLowerCase());
    const invalid = emails.filter((e) => !EMAIL_RE.test(e));
    if (invalid.length) errors.push(`${invalid.length} e-mail(s) inválido(s)`);
    const dupes = emails.filter((e, i) => emails.indexOf(e) !== i);
    if (dupes.length) errors.push(`${new Set(dupes).size} e-mail(s) duplicado(s)`);
    const missing = participants.filter((p) => !p.area || !p.setor || !p.departamento).length;
    if (missing) warnings.push(`${missing} colaborador(es) sem área/setor/departamento`);
    if (participants.length === 0) errors.push("Nenhum colaborador cadastrado");
    return { errors, warnings, ok: errors.length === 0 };
  }, [participants]);

  const canEdit = !round1?.first_wave_approved_at || isAdmin;

  async function addParticipant() {
    if (!company) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("wellness_participants")
      .insert({ company_id: company.id, email: `novo-${Date.now()}@exemplo.com` })
      .select("id,company_id,email,full_name,area,setor,departamento")
      .single();
    setBusy(false);
    if (error) return toast.error(error.message);
    setParticipants((prev) => [...prev, data as any]);
  }

  async function updateParticipant(id: string, patch: Partial<Participant>) {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    const { error } = await supabase.from("wellness_participants").update(patch).eq("id", id);
    if (error) toast.error(error.message);
  }

  async function deleteParticipant(id: string) {
    if (!confirm("Excluir este colaborador?")) return;
    const { error } = await supabase.from("wellness_participants").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  }

  async function bulkImport() {
    if (!company || !importText.trim()) return;
    const lines = importText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const rows = lines.map((l) => {
      const parts = l.split(/[,;\t]/).map((s) => s.trim());
      const [email, full_name, area, setor, departamento] = parts;
      return { email: (email ?? "").toLowerCase(), full_name, area, setor, departamento };
    });
    const valid = rows.filter((r) => EMAIL_RE.test(r.email));
    if (valid.length === 0) return toast.error("Nenhuma linha válida (formato: email, nome, área, setor, departamento)");
    setBusy(true);
    const payload = valid.map((r) => ({ company_id: company.id, ...r }));
    const { error } = await supabase
      .from("wellness_participants")
      .upsert(payload, { onConflict: "company_id,email", ignoreDuplicates: false });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${valid.length} colaborador(es) importado(s)`);
    setImportText("");
    setShowImport(false);
    await refresh(company.id);
  }

  async function approveFirstWave() {
    if (!company) return;
    if (!validation.ok) return toast.error("Corrija os erros antes de aprovar.");
    if (!confirmed) return toast.error("Confirme a revisão marcando a caixa.");
    setApproving(true);
    try {
      const { data, error } = await supabase.functions.invoke("wellness-approve-first-wave", {
        body: { company_id: company.id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      // Enroll participants (creates invitations if not already)
      const emails = participants.map((p) => p.email);
      await supabase.functions.invoke("wellness-enroll", {
        body: { company_id: company.id, emails },
      });
      toast.success("1ª onda aprovada! Envios agendados.");
      await refresh(company.id);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao aprovar");
    } finally {
      setApproving(false);
    }
  }

  if (loading) return <div className="container py-20 text-center text-muted-foreground">Carregando…</div>;
  if (!user) return null;

  if (!company) {
    return (
      <main className="container max-w-3xl py-10">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            Você não está vinculado a nenhuma empresa como gestor de ondas ou owner.
          </p>
        </Card>
      </main>
    );
  }

  if (company.status !== "approved") {
    return (
      <main className="container max-w-3xl py-10 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/trabalho")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            O cadastro da empresa <strong>{company.name}</strong> ainda está aguardando aprovação. Você poderá gerenciar as ondas assim que for aprovada.
          </p>
        </Card>
      </main>
    );
  }

  const WAVES: Array<{ key: string; label: string }> = [
    { key: "phq9", label: "1 · Humor (PHQ-9)" },
    { key: "copsoq", label: "2 · Trabalho (COPSOQ)" },
    { key: "ecig", label: "3 · Clima da equipe (ECIG)" },
    { key: "psicossocial", label: "4 · LIPT-60" },
    { key: "phq9_retest", label: "5 · Reteste PHQ-9" },
    { key: "assedio_sexual", label: "6 · MDiSH + SHRAS" },
  ];

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <button
            onClick={() => navigate("/trabalho")}
            className="flex items-center gap-2 font-display font-semibold"
          >
            <ArrowLeft className="h-4 w-4" /> Cuidar+ Trabalho
          </button>
          <Badge variant="secondary">Gestão de ondas</Badge>
        </div>
      </header>

      <div className="container max-w-4xl py-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">{company.name}</h1>
          <p className="text-sm text-muted-foreground">
            Revise, edite e organize os colaboradores por área, setor e departamento antes de aprovar o envio da 1ª onda.
          </p>
        </div>

        {/* Approval card */}
        {!round1?.first_wave_approved_at ? (
          <Card className="p-6 space-y-3 border-primary/40 bg-primary/5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="font-display text-lg font-semibold">1ª onda · aguardando sua aprovação</h2>
                <p className="text-xs text-muted-foreground">
                  Após aprovar, os convites da 1ª onda (PHQ-9 + DSM + GAD-7) são enviados aos colaboradores.
                </p>
              </div>
              <Badge variant="outline">Pendente</Badge>
            </div>
            {validation.errors.length > 0 && (
              <div className="text-sm text-destructive space-y-1">
                {validation.errors.map((e, i) => (
                  <div key={i}>• {e}</div>
                ))}
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div className="text-sm text-amber-600 space-y-1">
                {validation.warnings.map((w, i) => (
                  <div key={i}>⚠ {w}</div>
                ))}
              </div>
            )}
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(Boolean(v))} />
              <span>
                Confirmo que revisei todos os e-mails e sua alocação por <strong>área</strong>, <strong>setor</strong> e <strong>departamento</strong>.
              </span>
            </label>
            <Button
              onClick={approveFirstWave}
              disabled={!validation.ok || !confirmed || approving}
              className="w-full sm:w-auto"
            >
              {approving ? "Aprovando…" : "Aprovar envio da 1ª onda"}
            </Button>
          </Card>
        ) : (
          <Card className="p-6 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="font-display text-lg font-semibold">1ª onda aprovada</h2>
                <p className="text-xs text-muted-foreground">
                  Em {new Date(round1.first_wave_approved_at).toLocaleString("pt-BR")}.
                </p>
              </div>
              <Badge>Ativa</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {WAVES.map((w) => {
                const s = invStats[`1-${w.key}`];
                return (
                  <div key={w.key} className="text-xs border border-border/60 rounded p-2">
                    <div className="font-medium">{w.label}</div>
                    <div className="text-muted-foreground">
                      {s ? `${s.sent}/${s.total} enviados` : "aguardando cronograma"}
                    </div>
                  </div>
                );
              })}
            </div>
            {!canEdit && (
              <p className="text-xs text-muted-foreground pt-2">
                Após a aprovação, os cadastros ficam somente-leitura para preservar consistência dos agrupamentos. Contate o admin para alterações.
              </p>
            )}
          </Card>
        )}

        {/* Participants table */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="font-display text-lg font-semibold">Colaboradores ({participants.length})</h2>
              <p className="text-xs text-muted-foreground">
                Adicione, edite ou importe. Preencha área/setor/departamento para agrupar os relatórios.
              </p>
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowImport((v) => !v)}>
                  <Upload className="h-4 w-4 mr-1" /> Importar
                </Button>
                <Button size="sm" onClick={addParticipant} disabled={busy}>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar
                </Button>
              </div>
            )}
          </div>

          {showImport && canEdit && (
            <div className="space-y-2 border border-border/60 rounded p-3 bg-muted/30">
              <Label className="text-xs">
                Cole uma linha por colaborador: <code>email, nome, área, setor, departamento</code>
              </Label>
              <Textarea
                rows={6}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="joao@empresa.com, João Silva, Vendas, Comercial, Operações"
              />
              <Button size="sm" onClick={bulkImport} disabled={busy}>
                Importar linhas
              </Button>
            </div>
          )}

          {participants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum colaborador cadastrado. Clique em "Adicionar" ou "Importar".
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="p-2">E-mail</th>
                    <th className="p-2">Nome</th>
                    <th className="p-2">Área</th>
                    <th className="p-2">Setor</th>
                    <th className="p-2">Departamento</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="p-1">
                        <Input
                          value={p.email}
                          disabled={!canEdit}
                          onChange={(e) => setParticipants((prev) => prev.map((x) => x.id === p.id ? { ...x, email: e.target.value } : x))}
                          onBlur={(e) => updateParticipant(p.id, { email: e.target.value.trim().toLowerCase() })}
                          className={!EMAIL_RE.test(p.email) ? "border-destructive" : ""}
                        />
                      </td>
                      <td className="p-1">
                        <Input value={p.full_name ?? ""} disabled={!canEdit}
                          onChange={(e) => setParticipants((prev) => prev.map((x) => x.id === p.id ? { ...x, full_name: e.target.value } : x))}
                          onBlur={(e) => updateParticipant(p.id, { full_name: e.target.value || null })} />
                      </td>
                      <td className="p-1">
                        <Input value={p.area ?? ""} disabled={!canEdit}
                          onChange={(e) => setParticipants((prev) => prev.map((x) => x.id === p.id ? { ...x, area: e.target.value } : x))}
                          onBlur={(e) => updateParticipant(p.id, { area: e.target.value || null })} />
                      </td>
                      <td className="p-1">
                        <Input value={p.setor ?? ""} disabled={!canEdit}
                          onChange={(e) => setParticipants((prev) => prev.map((x) => x.id === p.id ? { ...x, setor: e.target.value } : x))}
                          onBlur={(e) => updateParticipant(p.id, { setor: e.target.value || null })} />
                      </td>
                      <td className="p-1">
                        <Input value={p.departamento ?? ""} disabled={!canEdit}
                          onChange={(e) => setParticipants((prev) => prev.map((x) => x.id === p.id ? { ...x, departamento: e.target.value } : x))}
                          onBlur={(e) => updateParticipant(p.id, { departamento: e.target.value || null })} />
                      </td>
                      <td className="p-1">
                        {canEdit && (
                          <Button size="icon" variant="ghost" onClick={() => deleteParticipant(p.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Grouped view */}
        {participants.length > 0 && (
          <Card className="p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold">Visualização agrupada</h2>
            <div className="space-y-3">
              {Object.entries(grouped).map(([dep, setores]) => {
                const depTotal = Object.values(setores).reduce(
                  (acc, s) => acc + Object.values(s).reduce((a, arr) => a + arr.length, 0),
                  0,
                );
                return (
                  <div key={dep} className="border border-border/60 rounded p-3">
                    <div className="font-medium text-sm">
                      {dep} <span className="text-xs text-muted-foreground">({depTotal})</span>
                    </div>
                    <div className="ml-3 mt-1 space-y-1">
                      {Object.entries(setores).map(([set, areas]) => {
                        const setTotal = Object.values(areas).reduce((a, arr) => a + arr.length, 0);
                        return (
                          <div key={set}>
                            <div className="text-xs">
                              → {set} <span className="text-muted-foreground">({setTotal})</span>
                            </div>
                            <div className="ml-4">
                              {Object.entries(areas).map(([ar, list]) => (
                                <div key={ar} className="text-xs text-muted-foreground">
                                  · {ar}: {list.length}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
