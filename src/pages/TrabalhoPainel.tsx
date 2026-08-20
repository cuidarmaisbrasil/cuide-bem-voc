import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ContractSignCard } from "@/components/ContractSignCard";
import { SiteHeader } from "@/components/SiteHeader";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Download,
  FileText,
  GitCompareArrows,
  Receipt,
  Users,
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  slug: string;
  status: string;
  cnpj: string | null;
  sector: string | null;
  size_range: string | null;
  contact_name: string;
  contact_role: string | null;
  contact_email: string;
  contact_phone: string | null;
  wave_manager_name: string | null;
  wave_manager_email: string | null;
  wave_manager_role: string | null;
  wave_manager_whatsapp: string | null;
  created_at: string;
  approved_at: string | null;
}

interface Invoice {
  id: string;
  invoice_number: string | null;
  competencia: string | null;
  description: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  issued_at: string | null;
  due_date: string | null;
  paid_at: string | null;
  file_path: string | null;
}

interface RoundStat {
  round_no: number;
  opened_at: string | null;
  closed_at: string | null;
  devolutiva_communicated_at: string | null;
  status: string;
  waves: Record<string, { scheduled: number; sent: number; completed: number }>;
}

const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dt = (v?: string | null) => (v ? new Date(v).toLocaleDateString("pt-BR") : "—");

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-sm font-medium break-words">{value?.trim() ? value : "—"}</div>
  </div>
);

export default function TrabalhoPainel() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [rounds, setRounds] = useState<RoundStat[]>([]);
  const [participants, setParticipants] = useState(0);
  const [busy, setBusy] = useState(true);
  const [wm, setWm] = useState({ name: "", role: "", email: "", whatsapp: "" });
  const [savingWm, setSavingWm] = useState(false);
  const [sendingWm, setSendingWm] = useState(false);

  async function saveWaveManager() {
    if (!company) return;
    const email = wm.email.trim().toLowerCase();
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("E-mail do gestor inválido.");
      return;
    }
    setSavingWm(true);
    const patch = {
      wave_manager_name: wm.name.trim() || null,
      wave_manager_role: wm.role.trim() || null,
      wave_manager_email: email || null,
      wave_manager_whatsapp: wm.whatsapp.trim() || null,
    };
    const { error } = await supabase.from("companies").update(patch).eq("id", company.id);
    setSavingWm(false);
    if (error) return toast.error(error.message);
    setCompany({ ...company, ...patch } as any);
    toast.success("Gestor de ciclos atualizado.");
  }

  async function sendWmInvite() {
    if (!company) return;
    setSendingWm(true);
    const { data, error } = await supabase.functions.invoke("wave-manager-invite", {
      body: { company_id: company.id },
    });
    setSendingWm(false);
    if (error || (data as any)?.error) {
      return toast.error((data as any)?.error ?? error?.message ?? "Falha ao enviar convite.");
    }
    toast.success("Convite enviado ao gestor de ciclos.");
  }



  useEffect(() => {
    document.title = "Painel da empresa — Cuidar+ Trabalho";
    if (!loading && !user) navigate("/trabalho");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: co } = await supabase
        .from("companies")
        .select(
          "id,name,slug,status,cnpj,sector,size_range,contact_name,contact_role,contact_email,contact_phone,wave_manager_name,wave_manager_email,wave_manager_role,wave_manager_whatsapp,created_at,approved_at",
        )
        .eq("owner_user_id", user.id)
        .maybeSingle();
      if (!co) {
        setBusy(false);
        return;
      }
      setCompany(co as any);
      setWm({
        name: (co as any).wave_manager_name ?? "",
        role: (co as any).wave_manager_role ?? "",
        email: (co as any).wave_manager_email ?? "",
        whatsapp: (co as any).wave_manager_whatsapp ?? "",
      });


      const [invRes, pRes, { data: sess }] = await Promise.all([
        supabase
          .from("company_invoices")
          .select(
            "id,invoice_number,competencia,description,amount_cents,currency,status,issued_at,due_date,paid_at,file_path",
          )
          .eq("company_id", co.id)
          .order("issued_at", { ascending: false }),
        supabase
          .from("wellness_participants")
          .select("id", { count: "exact", head: true })
          .eq("company_id", co.id),
        supabase.auth.getSession(),
      ]);
      setInvoices((invRes.data as any) ?? []);
      setParticipants(pRes.count ?? 0);

      try {
        const base = import.meta.env.VITE_SUPABASE_URL;
        const res = await fetch(
          `${base}/functions/v1/wellness-company-stats?company_id=${co.id}&period=all`,
          {
            headers: {
              Authorization: `Bearer ${sess.session?.access_token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          },
        );
        const json = await res.json();
        setRounds(json?.rounds ?? []);
      } catch {
        setRounds([]);
      }
      setBusy(false);
    })();
  }, [user]);

  const adherence = useMemo(() => {
    const map: Record<number, { sent: number; completed: number }> = {};
    rounds.forEach((r) => {
      let sent = 0;
      let completed = 0;
      Object.values(r.waves ?? {}).forEach((w) => {
        sent += w.sent ?? 0;
        completed += w.completed ?? 0;
      });
      map[r.round_no] = { sent, completed };
    });
    return map;
  }, [rounds]);

  async function downloadInvoice(inv: Invoice) {
    if (!inv.file_path) return toast.error("Esta nota ainda não tem arquivo anexado.");
    const { data, error } = await supabase.storage
      .from("company-invoices")
      .createSignedUrl(inv.file_path, 60);
    if (error || !data) return toast.error("Não foi possível gerar o link de download.");
    window.open(data.signedUrl, "_blank", "noopener");
  }

  if (loading || busy)
    return <main className="container py-20 text-center text-muted-foreground">Carregando…</main>;

  if (!company)
    return (
      <main className="container max-w-2xl py-20">
        <Card className="p-6 space-y-3 text-center">
          <p className="text-muted-foreground">
            Sua conta não está associada a nenhuma empresa. Cadastre-se ou fale com o administrador.
          </p>
          <Button onClick={() => navigate("/trabalho")}>Voltar ao Cuidar+ Trabalho</Button>
        </Card>
      </main>
    );

  const multiCycle = rounds.length > 1;

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader variant="trabalho" onSignOut={signOut} />


      <div className="container max-w-5xl py-8 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <Button variant="ghost" size="sm" className="-ml-2 mb-1" onClick={() => navigate("/trabalho")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> {company.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Painel da empresa · cadastro em {dt(company.created_at)}
            </p>
          </div>
          <Badge variant={company.status === "approved" ? "default" : "secondary"}>
            {company.status === "approved" ? "Aprovada" : company.status === "rejected" ? "Rejeitada" : "Pendente"}
          </Badge>
        </div>

        <Tabs defaultValue="perfil">
          <TabsList className="flex flex-wrap h-auto justify-start">
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="contrato">Contrato</TabsTrigger>
            <TabsTrigger value="notas">Notas fiscais</TabsTrigger>
            <TabsTrigger value="colaboradores">Colaboradores</TabsTrigger>
            <TabsTrigger value="ciclos">Ciclos</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="perfil" className="mt-4 space-y-4">
            <Card className="p-5 space-y-4">
              <h2 className="font-display text-lg font-semibold">Dados da empresa</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Razão social / nome" value={company.name} />
                <Field label="CNPJ" value={company.cnpj} />
                <Field label="Porte (nº de trabalhadores)" value={company.size_range} />
                <Field label="Setor" value={company.sector} />
                <Field label="Identificador do link" value={`/trabalho/r/${company.slug}`} />
                <Field label="Aprovação" value={dt(company.approved_at)} />
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <h2 className="font-display text-lg font-semibold">Contato principal</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Nome" value={company.contact_name} />
                <Field label="Cargo" value={company.contact_role} />
                <Field label="E-mail" value={company.contact_email} />
                <Field label="Telefone" value={company.contact_phone} />
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold">Gestor de ciclos</h2>
                <p className="text-xs text-muted-foreground">
                  Pessoa responsável por revisar a lista de e-mails dos colaboradores e aprovar o envio do 1º ciclo.
                  Recebe notificações dos ciclos seguintes e <strong>não</strong> tem acesso a respostas individuais.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Nome</Label>
                  <Input value={wm.name} onChange={(e) => setWm({ ...wm, name: e.target.value })} />
                </div>
                <div>
                  <Label>Cargo</Label>
                  <Input value={wm.role} onChange={(e) => setWm({ ...wm, role: e.target.value })} placeholder="Ex.: Coord. de RH" />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input type="email" value={wm.email} onChange={(e) => setWm({ ...wm, email: e.target.value })} />
                </div>
                <div>
                  <Label>WhatsApp</Label>
                  <Input value={wm.whatsapp} onChange={(e) => setWm({ ...wm, whatsapp: e.target.value })} placeholder="(11) 90000-0000" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={saveWaveManager} disabled={savingWm}>
                  {savingWm ? "Salvando…" : "Salvar gestor de ciclos"}
                </Button>
                <Button variant="outline" onClick={sendWmInvite} disabled={sendingWm || !company.wave_manager_email}>
                  {sendingWm ? "Enviando…" : "Enviar convite ao gestor"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Para alterar outros dados cadastrais, fale com o suporte em{" "}
                <a href="/trabalho/contato" className="underline">
                  /trabalho/contato
                </a>
                .
              </p>
            </Card>

          </TabsContent>

          <TabsContent value="contrato" className="mt-4">
            <ContractSignCard
              companyId={company.id}
              companyName={company.name}
              cnpj={company.cnpj}
              sizeRange={company.size_range}
            />
          </TabsContent>

          <TabsContent value="notas" className="mt-4">
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                <h2 className="font-display text-lg font-semibold">Notas fiscais</h2>
              </div>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma nota fiscal emitida até o momento.
                </p>
              ) : (
                <div className="space-y-2">
                  {invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium">
                          NF {inv.invoice_number ?? "—"}
                          {inv.competencia ? ` · ${inv.competencia}` : ""}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {inv.description ?? "Serviços Cuidar+ Trabalho"} · emissão {dt(inv.issued_at)} ·
                          vencimento {dt(inv.due_date)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">{brl(inv.amount_cents)}</span>
                        <Badge
                          variant={
                            inv.status === "paga" ? "default" : inv.status === "cancelada" ? "destructive" : "secondary"
                          }
                        >
                          {inv.status}
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => downloadInvoice(inv)}>
                          <Download className="h-4 w-4 mr-1" /> Baixar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="colaboradores" className="mt-4">
            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h2 className="font-display text-lg font-semibold">Cadastro de colaboradores</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {participants} colaborador(es) cadastrado(s) com e-mail, área, setor e departamento. O
                cadastro e a aprovação do 1º disparo ficam na área de gestão de ciclos.
              </p>
              <Button onClick={() => navigate("/trabalho/ondas")}>Gerenciar colaboradores e disparos</Button>
            </Card>
          </TabsContent>

          <TabsContent value="ciclos" className="mt-4 space-y-4">
            {rounds.length === 0 ? (
              <Card className="p-5">
                <p className="text-sm text-muted-foreground">Nenhum ciclo iniciado até o momento.</p>
              </Card>
            ) : (
              rounds.map((r) => {
                const a = adherence[r.round_no] ?? { sent: 0, completed: 0 };
                const pct = a.sent ? Math.round((a.completed / a.sent) * 100) : 0;
                return (
                  <Card key={r.round_no} className="p-5 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="font-display font-semibold">Ciclo {r.round_no}</h3>
                      <Badge variant={r.status === "open" ? "secondary" : "default"}>
                        {r.status === "open"
                          ? "Em andamento"
                          : r.status === "closed"
                            ? "Encerrado"
                            : "Devolutiva comunicada"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <Field label="Abertura" value={dt(r.opened_at)} />
                      <Field label="Encerramento" value={dt(r.closed_at)} />
                      <Field label="Devolutiva" value={dt(r.devolutiva_communicated_at)} />
                      <Field label="Adesão" value={`${pct}% (${a.completed}/${a.sent})`} />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/admin/aep/${company.id}/${r.round_no}`)}>
                        <FileText className="h-4 w-4 mr-1" /> Relatório geral
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/admin/nr1/${company.id}/${r.round_no}`)}>
                        <FileText className="h-4 w-4 mr-1" /> Relatório NR-1 / PGR
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
            {multiCycle && (
              <Card className="p-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display font-semibold flex items-center gap-2">
                    <GitCompareArrows className="h-4 w-4 text-primary" /> Comparação entre ciclos
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Sua empresa tem {rounds.length} ciclos. Veja a evolução das dimensões entre eles.
                  </p>
                </div>
                <Button onClick={() => navigate("/trabalho/comparativo")}>Comparar ciclos</Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="relatorios" className="mt-4 space-y-4">
            <Card className="p-5 space-y-3">
              <h2 className="font-display text-lg font-semibold">Relatórios por ciclo</h2>
              {rounds.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ainda não há ciclos com relatório disponível.</p>
              ) : (
                <div className="space-y-2">
                  {rounds.map((r) => (
                    <div
                      key={r.round_no}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 p-3"
                    >
                      <span className="text-sm font-medium">Ciclo {r.round_no}</span>
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/admin/aep/${company.id}/${r.round_no}`)}>
                          Relatório geral
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/admin/nr1/${company.id}/${r.round_no}`)}>
                          NR-1 / PGR
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {multiCycle && (
                <Button variant="secondary" onClick={() => navigate("/trabalho/comparativo")}>
                  <GitCompareArrows className="h-4 w-4 mr-1" /> Comparar ciclos
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                Os relatórios são agregados e respeitam o mínimo de respondentes por recorte para
                preservar o anonimato.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
