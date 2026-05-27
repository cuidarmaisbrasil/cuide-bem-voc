import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { aggregateScales, bandLabel, type ScaleScore } from "@/lib/copsoqScoring";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, TrendingDown, HeartPulse, ArrowRight, CheckCircle2, Lock, FlaskConical } from "lucide-react";


interface Company {
  id: string; name: string; slug: string; status: string;
  default_version: string; allowed_versions: string[];
  contact_email: string; contact_name: string;
  created_at: string; approved_at: string | null;
}

const Trabalho = () => {
  const { user, loading, signOut } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState(""); const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [phone, setPhone] = useState(""); const [cnpj, setCnpj] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [reportBlocks, setReportBlocks] = useState<Array<{ id: string; title: string; body: string }>>([]);
  const [adminNotes, setAdminNotes] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { setCompany(null); return; }
    supabase.from("companies").select("*").eq("owner_user_id", user.id).maybeSingle()
      .then(({ data }) => setCompany(data as any));
  }, [user]);

  useEffect(() => {
    if (!company) return;
    supabase.from("copsoq_responses").select("*").eq("company_id", company.id).order("created_at", { ascending: false })
      .then(({ data }) => setResponses(data ?? []));
    supabase.from("copsoq_report_template").select("blocks").eq("id", 1).maybeSingle()
      .then(({ data }) => setReportBlocks((data?.blocks as any) ?? []));
    supabase.from("copsoq_company_notes").select("notes").eq("company_id", company.id).maybeSingle()
      .then(({ data }) => setAdminNotes(data?.notes ?? ""));
  }, [company]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      if (authMode === "signup") {
        if (!companyName.trim() || !contactName.trim() || !contactRole.trim()) {
          toast.error("Preencha empresa, responsável e cargo."); return;
        }
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/trabalho` },
        });
        if (error) throw error;
        if (data.user) {
          const slug = `${companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 32)}-${Math.random().toString(36).slice(2, 7)}`;
          const { error: cErr } = await supabase.from("companies").insert({
            owner_user_id: data.user.id, name: companyName, contact_name: contactName,
            contact_role: contactRole,
            contact_email: email, contact_phone: phone || null, cnpj: cnpj || null, slug,
          });
          if (cErr) throw cErr;
          toast.success("Cadastro recebido! Aguarde aprovação do admin.");

        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar.");
    } finally { setSubmitting(false); }
  };

  const [filterDept, setFilterDept] = useState<string>("__all");
  const [filterAge, setFilterAge] = useState<string>("__all");

  const departments = useMemo(
    () => Array.from(new Set(responses.map((r) => r.department).filter(Boolean))) as string[],
    [responses],
  );
  const ageRanges = useMemo(
    () => Array.from(new Set(responses.map((r) => r.age_range).filter(Boolean))) as string[],
    [responses],
  );

  const filteredResponses = useMemo(() => {
    return responses.filter((r) => {
      if (filterDept !== "__all" && r.department !== filterDept) return false;
      if (filterAge !== "__all" && r.age_range !== filterAge) return false;
      return true;
    });
  }, [responses, filterDept, filterAge]);

  const aggregates = useMemo(() => {
    if (!filteredResponses.length) return [];
    const all: ScaleScore[][] = filteredResponses.map((r) => {
      const sc = r.scores || {};
      return Object.entries(sc).map(([scaleId, v]: [string, any]) => ({
        scaleId, name: scaleId, type: "negative" as const,
        mean: v.mean ?? 0, band: "warning" as const, itemCount: v.n ?? 1,
      }));
    });
    return aggregateScales(all);
  }, [filteredResponses]);

  if (loading) return <div className="container py-20 text-center text-muted-foreground">Carregando…</div>;

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 font-display font-semibold">
            <span className="h-7 w-7 rounded-lg bg-gradient-hero flex items-center justify-center text-primary-foreground text-sm">💼</span>
            Cuidar+ Trabalho
          </button>
          {user && <Button variant="ghost" size="sm" onClick={signOut}>Sair</Button>}
        </div>
      </header>

      {!user && (
        <>
          {/* HERO */}
          <section className="relative overflow-hidden border-b border-border/60 bg-gradient-soft">
            {/* decorative orbs */}
            <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-pulse" />
            <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-accent/10 blur-3xl animate-pulse [animation-delay:1.5s]" />

            <div className="container max-w-6xl py-16 md:py-24 relative">
              <div className="grid lg:grid-cols-5 gap-10 items-center">
                <div className="lg:col-span-3 space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 backdrop-blur px-3 py-1 text-xs font-medium text-primary shadow-card">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    Programa gratuito de prevenção
                  </div>
                  <h1 className="font-display text-4xl md:text-6xl font-semibold leading-[1.05] tracking-tight text-foreground">
                    Cuide antes que{" "}
                    <span className="bg-gradient-hero bg-clip-text text-transparent">vire afastamento.</span>
                  </h1>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl">
                    Monitoramento psicossocial gratuito da sua empresa, em 3 ondas.
                    Relatório com áreas de risco e o que fazer — sem custo.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <Button
                      size="lg"
                      onClick={() => document.getElementById("cadastro")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      className="bg-gradient-hero text-primary-foreground hover:opacity-90 shadow-soft group h-12 px-6"
                    >
                      Cadastrar empresa agora
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                    <Button size="lg" variant="ghost" onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}>
                      Como funciona
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> 100% gratuito</span>
                    <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-primary" /> Anonimato garantido</span>
                    <span className="inline-flex items-center gap-1.5"><FlaskConical className="h-3.5 w-3.5 text-primary" /> Base científica COPSOQ II</span>
                  </p>
                </div>

                {/* Inline quick-signup card — cadastro imediato */}
                <div className="lg:col-span-2 animate-in fade-in slide-in-from-bottom-8 duration-700 [animation-delay:150ms] fill-mode-both">
                  <Card className="p-6 shadow-soft border-border/60 backdrop-blur bg-card/95">
                    <div className="mb-3">
                      <h2 className="font-display text-lg font-semibold">Comece em 30 segundos</h2>
                      <p className="text-xs text-muted-foreground">Cadastro gratuito · aprovação em até 1 dia útil.</p>
                    </div>
                    <Button
                      size="lg"
                      className="w-full bg-gradient-hero text-primary-foreground hover:opacity-90 group"
                      onClick={() => { setAuthMode("signup"); document.getElementById("cadastro")?.scrollIntoView({ behavior: "smooth", block: "start" }); setTimeout(() => document.getElementById("signup-company")?.focus(), 600); }}
                    >
                      Cadastrar minha empresa
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                    <button
                      onClick={() => { setAuthMode("login"); document.getElementById("cadastro")?.scrollIntoView({ behavior: "smooth" }); }}
                      className="block mx-auto mt-3 text-xs text-muted-foreground hover:text-primary transition-smooth underline-offset-4 hover:underline"
                    >
                      Já tenho conta · entrar
                    </button>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          {/* BENEFÍCIOS */}
          <section className="border-b border-border/60">
            <div className="container max-w-5xl py-16">
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { Icon: HeartPulse, t: "Prevenção real", d: "Detecta sobrecarga e exaustão antes de virar licença médica." },
                  { Icon: TrendingDown, t: "Custo evitado", d: "Cada afastamento custa milhares. Prevenir sai muito mais barato." },
                  { Icon: ShieldCheck, t: "Engajamento", d: "Reduz turnover, melhora o clima e fortalece a marca empregadora." },
                ].map((b, i) => (
                  <div
                    key={b.t}
                    className="group rounded-xl border border-border bg-card p-6 shadow-card hover:shadow-soft hover:-translate-y-1 transition-smooth animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                    style={{ animationDelay: `${i * 100}ms`, animationDuration: "600ms" }}
                  >
                    <div className="h-10 w-10 rounded-lg bg-gradient-hero flex items-center justify-center mb-4 text-primary-foreground group-hover:scale-110 transition-smooth">
                      <b.Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-lg font-semibold mb-2 text-foreground">{b.t}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{b.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* COMO FUNCIONA — 3 ONDAS */}
          <section id="como-funciona" className="border-b border-border/60 bg-muted/30">
            <div className="container max-w-5xl py-16">
              <div className="max-w-2xl mb-10">
                <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-3">
                  3 ondas de rastreio
                </h2>
                <p className="text-muted-foreground">
                  Três disparos sequenciais que medem evolução do clima e o efeito das ações.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-6 relative">
                {[
                  { n: "01", t: "Linha de base", d: "Mapeia demandas, controle, suporte, reconhecimento e violência." },
                  { n: "02", t: "Reaplicação", d: "Mede sensibilidade às intervenções e áreas resistentes." },
                  { n: "03", t: "Consolidação", d: "Valida resultados e orienta o próximo ciclo de cuidado." },
                ].map((s, i) => (
                  <div
                    key={s.n}
                    className="relative rounded-xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-card transition-smooth animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                    style={{ animationDelay: `${i * 120}ms`, animationDuration: "600ms" }}
                  >
                    <div className="absolute -top-3 left-6 text-xs font-mono font-semibold bg-gradient-hero text-primary-foreground px-2.5 py-1 rounded-full">
                      {s.n}
                    </div>
                    <h3 className="font-display text-lg font-semibold mb-2 text-foreground mt-2">{s.t}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* RELATÓRIO */}
          <section className="border-b border-border/60">
            <div className="container max-w-5xl py-16">
              <div className="grid md:grid-cols-2 gap-10 items-start">
                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both">
                  <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground">
                    Relatório gratuito por onda
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Dimensões em risco, comparação entre ondas e sugestões práticas — direto ao ponto,
                    para você agir antes que o custo cresça.
                  </p>
                  <Button
                    onClick={() => document.getElementById("cadastro")?.scrollIntoView({ behavior: "smooth" })}
                    className="bg-gradient-hero text-primary-foreground hover:opacity-90 group"
                  >
                    Quero o relatório da minha empresa
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
                <ul className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-700 fill-mode-both">
                  {[
                    "Agregado por área, departamento e faixa etária",
                    "Dimensões em risco: demanda, controle, suporte, justiça, violência",
                    "Sugestões práticas por dimensão",
                    "Comparação entre ondas",
                    "Anonimato individual preservado",
                  ].map((i, idx) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm rounded-lg border border-border/60 bg-card p-3 hover:border-primary/40 transition-smooth animate-in fade-in fill-mode-both"
                      style={{ animationDelay: `${idx * 80}ms`, animationDuration: "500ms" }}
                    >
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-foreground">{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* SEGURANÇA / CIÊNCIA */}
          <section className="border-b border-border/60 bg-muted/30">
            <div className="container max-w-5xl py-16">
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { Icon: FlaskConical, t: "Cientificamente validado", d: "Baseado no COPSOQ II, padrão internacional para riscos psicossociais." },
                  { Icon: Lock, t: "Anonimato garantido", d: "Empresa nunca vê respostas individuais — apenas dados agregados." },
                  { Icon: ShieldCheck, t: "Conformidade LGPD", d: "Criptografia, controles de acesso e sigilo profissional." },
                ].map((s, i) => (
                  <div
                    key={s.t}
                    className="rounded-xl border border-border bg-card p-6 hover:shadow-card transition-smooth animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                    style={{ animationDelay: `${i * 100}ms`, animationDuration: "600ms" }}
                  >
                    <s.Icon className="h-5 w-5 text-primary mb-3" />
                    <h3 className="font-display text-base font-semibold mb-2 text-foreground">{s.t}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}


      <div className="container max-w-3xl py-10 space-y-6">
        {!user && (
          <Card className="p-6 shadow-soft border-border/60 scroll-mt-20 animate-in fade-in slide-in-from-bottom-4 duration-500" id="cadastro">
            <div className="mb-4">
              <h2 className="font-display text-2xl font-semibold mb-1">Cadastre sua empresa</h2>
              <p className="text-sm text-muted-foreground">
                Gratuito. Aprovação em até 1 dia útil e seu painel é liberado.
              </p>
            </div>
            <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as any)}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="signup">Cadastrar empresa</TabsTrigger>
                <TabsTrigger value="login">Entrar</TabsTrigger>
              </TabsList>
              <TabsContent value="signup">
                <form onSubmit={handleAuth} className="space-y-3 mt-4">
                  <div><Label htmlFor="signup-company">Nome da empresa *</Label><Input id="signup-company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><Label>Nome do responsável *</Label><Input value={contactName} onChange={(e) => setContactName(e.target.value)} required /></div>
                    <div><Label>Cargo do responsável *</Label><Input value={contactRole} onChange={(e) => setContactRole(e.target.value)} placeholder="Ex.: Gerente de RH" required /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>CNPJ (opcional)</Label><Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} /></div>
                    <div><Label>Telefone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                  </div>
                  <div><Label>E-mail *</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                  <div><Label>Senha *</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
                  <Button type="submit" className="w-full bg-gradient-hero text-primary-foreground hover:opacity-90" disabled={submitting}>
                    {submitting ? "Enviando…" : "Solicitar cadastro gratuito"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="login">
                <form onSubmit={handleAuth} className="space-y-3 mt-4">
                  <div><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                  <div><Label>Senha</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                  <Button type="submit" className="w-full" disabled={submitting}>Entrar</Button>
                </form>
              </TabsContent>
            </Tabs>
          </Card>
        )}

        {user && !company && (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Conta sem empresa associada. Contate o admin.</p>
          </Card>
        )}

        {user && company && (
          <>
            <Card className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h1 className="font-display text-xl font-semibold">{company.name}</h1>
                  <p className="text-xs text-muted-foreground">Cadastrado em {new Date(company.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <Badge variant={company.status === "approved" ? "default" : "secondary"}>
                  {company.status === "approved" ? "Aprovada" : company.status === "pending" ? "Aguardando aprovação" : "Rejeitada"}
                </Badge>
              </div>
            </Card>

            {company.status === "pending" && (
              <Card className="p-6 bg-muted/40">
                <p className="text-sm">Seu cadastro está em análise. Você receberá acesso ao painel e ao link público quando o admin aprovar.</p>
              </Card>
            )}

            {company.status === "approved" && (
              <>
                <Card className="p-6 space-y-3">
                  <h2 className="font-display text-lg font-semibold">Link público para colaboradores</h2>
                  <p className="text-sm text-muted-foreground">Compartilhe este link. As respostas são anônimas. Você verá apenas dados agregados.</p>
                  <div className="flex gap-2">
                    {(["short_br","medium_br","long_br","short_pt","medium_pt","long_pt","short","medium","long"] as const).filter(v => company.allowed_versions.includes(v)).map(v => {
                      const url = `${window.location.origin}/trabalho/r/${company.slug}?v=${v}`;
                      const labels: Record<string,string> = {
                        short_br: "curta (PT-BR)", medium_br: "média (PT-BR)", long_br: "longa (PT-BR)",
                        short_pt: "curta (PT-PT)", medium_pt: "média (PT-PT)", long_pt: "longa (PT-PT)",
                        short: "curta (PT-PT)", medium: "média (PT-PT)", long: "longa (PT-PT)",
                      };
                      return (
                        <Button key={v} variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(url); toast.success("Link copiado"); }}>
                          Copiar link · versão {labels[v]}
                        </Button>
                      );
                    })}
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h2 className="font-display text-lg font-semibold">Resultados agregados</h2>
                    <Badge variant="secondary">
                      {filteredResponses.length} de {responses.length} resposta{responses.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  {responses.length > 0 && (departments.length > 0 || ageRanges.length > 0) && (
                    <div className="grid sm:grid-cols-2 gap-3 mb-4">
                      {departments.length > 0 && (
                        <div>
                          <Label className="text-xs">Departamento</Label>
                          <Select value={filterDept} onValueChange={setFilterDept}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__all">Todos</SelectItem>
                              {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {ageRanges.length > 0 && (
                        <div>
                          <Label className="text-xs">Faixa etária</Label>
                          <Select value={filterAge} onValueChange={setFilterAge}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__all">Todas</SelectItem>
                              {ageRanges.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}

                  {responses.length === 0 && <p className="text-sm text-muted-foreground">Ainda não há respostas.</p>}
                  {responses.length > 0 && filteredResponses.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhuma resposta corresponde aos filtros selecionados.</p>
                  )}
                  {filteredResponses.length > 0 && (
                    <div className="space-y-2">
                      {aggregates.map((row) => (
                        <div key={row.scaleId} className="flex items-center justify-between border-b border-border/40 pb-2">
                          <span className="text-sm">{row.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-mono">{row.mean.toFixed(1)}</span>
                            <Badge variant={row.band === "risk" ? "destructive" : row.band === "warning" ? "secondary" : "default"}>
                              {bandLabel(row.band)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {(reportBlocks.length > 0 || adminNotes) && (
                  <Card className="p-6 space-y-4">
                    <h2 className="font-display text-lg font-semibold">Relatório</h2>
                    {reportBlocks.map((b) => (
                      <section key={b.id} className="space-y-1">
                        <h3 className="font-semibold text-foreground text-sm">{b.title}</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{b.body}</p>
                      </section>
                    ))}
                    {adminNotes && (
                      <section className="space-y-1 border-t pt-3">
                        <h3 className="font-semibold text-foreground text-sm">Observações do consultor</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{adminNotes}</p>
                      </section>
                    )}
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default Trabalho;
