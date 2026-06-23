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
import { ShieldCheck, TrendingDown, HeartPulse, ArrowRight, CheckCircle2, Lock, FlaskConical, Briefcase, FileText } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";
import heroPhoto from "@/assets/trabalho-hero.jpg";
import loungePhoto from "@/assets/trabalho-lounge.jpg";


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
        if (!companyName.trim() || !contactName.trim() || !contactRole.trim() || !cnpj.trim() || !phone.trim()) {
          toast.error("Preencha empresa, responsável, cargo, CNPJ e telefone."); return;
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
            <span className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center"><Briefcase className="h-4 w-4 text-destructive" /></span>
            Cuidar+ Trabalho
          </button>
          {user && <Button variant="ghost" size="sm" onClick={signOut}>Sair</Button>}
        </div>
      </header>

      {!user && <PublicLanding onCadastrar={() => { setAuthMode("signup"); document.getElementById("cadastro")?.scrollIntoView({ behavior: "smooth", block: "start" }); setTimeout(() => document.getElementById("signup-company")?.focus(), 600); }} onEntrar={() => { setAuthMode("login"); document.getElementById("cadastro")?.scrollIntoView({ behavior: "smooth" }); }} />}


      <div className="container max-w-3xl py-10 space-y-6">
        {!user && (
          <Card className="p-6 shadow-soft border-border/60 scroll-mt-20 animate-in fade-in slide-in-from-bottom-4 duration-500" id="cadastro">
            <div className="mb-4">
              <h2 className="font-display text-2xl font-semibold mb-1">Cadastre sua empresa</h2>
              <p className="text-sm text-muted-foreground">
                Gratuito* até 20 colaboradores. Aprovação em até 1 dia útil e seu painel é liberado.
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
                    <div><Label>CNPJ *</Label><Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} required /></div>
                    <div><Label>Telefone *</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} required /></div>
                  </div>
                  <div><Label>E-mail *</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                  <div><Label>Senha *</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
                  <Button type="submit" className="w-full bg-gradient-hero text-primary-foreground hover:opacity-90" disabled={submitting}>
                    {submitting ? "Enviando…" : "Solicitar cadastro gratuito*"}
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

function Reveal({ as: As = "div", className = "", variant = "up", delay = 0, children }: { as?: any; className?: string; variant?: "up" | "zoom" | "left"; delay?: number; children: React.ReactNode }) {
  const { ref, visible } = useReveal();
  const base = variant === "zoom" ? "reveal-zoom" : variant === "left" ? "reveal-left" : "reveal";
  return (
    <As ref={ref as any} className={`${base} ${visible ? "is-visible" : ""} ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </As>
  );
}

function PublicLanding({ onCadastrar, onEntrar }: { onCadastrar: () => void; onEntrar: () => void }) {
  return (
    <>
      {/* HERO */}
      <section className="relative bg-[hsl(var(--background))] overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-32 -right-20 h-[28rem] w-[28rem] rounded-full bg-primary/5 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute top-1/2 -left-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

        <div className="container max-w-7xl py-12 md:py-24 relative">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-7">
              <Reveal>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 backdrop-blur px-3 py-1 text-xs font-medium text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Programa gratuito* de prevenção
                </div>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="font-serif-editorial text-5xl md:text-7xl font-medium leading-[0.95] tracking-tight text-foreground">
                  <span className="italic text-primary">Presença</span> com cuidado, <br />
                  <span className="whitespace-nowrap"><span className="font-normal text-foreground">Ação</span> <span className="italic text-primary">com resultado.</span></span>
                </h1>
              </Reveal>
              <Reveal delay={160}>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                  Cuidar + para você ser mais. Escuta e prevenção inteligente ao seu alcance — para empresas que sabem o valor do capital humano.
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="flex flex-wrap gap-3 pt-1">
                  <Button size="lg" onClick={onCadastrar} className="bg-gradient-hero text-primary-foreground hover:opacity-90 shadow-soft group h-12 px-6">
                    Cadastrar empresa agora
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}>
                    Como funciona
                  </Button>
                </div>
              </Reveal>
              <Reveal delay={320}>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground pt-2">
                  <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Gratuito*</span>
                  <span className="inline-flex items-center gap-1.5"><Lock className="h-4 w-4 text-primary" /> Anonimato garantido</span>
                  <span className="inline-flex items-center gap-1.5"><FlaskConical className="h-4 w-4 text-primary" /> Base científica: psicometria testada e aprovada</span>
                  <span className="inline-flex items-center gap-1.5"><FileText className="h-4 w-4 text-primary" /> Relatório gratuito* NR1</span>
                </div>
                <p className="text-xs text-muted-foreground/80 pt-1">* Gratuito até 20 colaboradores.</p>
              </Reveal>
            </div>

            {/* Photo + floating card */}
            <div className="lg:col-span-5 relative">
              <Reveal variant="zoom" delay={150}>
                <div className="rounded-3xl overflow-hidden shadow-soft relative aspect-[4/5] bg-muted">
                  <img
                    src={heroPhoto}
                    alt="Equipe diversa em reunião colaborativa em escritório moderno e acolhedor"
                    width={1024}
                    height={1280}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 via-transparent to-transparent" />
                </div>
              </Reveal>
              <Reveal variant="left" delay={500} className="absolute -bottom-10 -left-6 md:-left-16 max-w-xs">
                <Card className="p-6 shadow-soft border-border/60 bg-card/95 backdrop-blur">
                  <h2 className="font-serif-editorial text-xl font-medium mb-1">Comece em 30 segundos</h2>
                  <p className="text-xs text-muted-foreground mb-5 leading-snug">Cadastro gratuito* · aprovação em até 1 dia útil.</p>
                  <Button onClick={onCadastrar} className="w-full bg-gradient-hero text-primary-foreground hover:opacity-90 group">
                    Cadastrar minha empresa
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <button onClick={onEntrar} className="block mx-auto mt-3 text-xs text-muted-foreground hover:text-primary transition-smooth underline-offset-4 hover:underline">
                    Já tenho conta · entrar
                  </button>
                </Card>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="border-t border-border/40">
        <div className="container max-w-6xl py-24 md:py-28">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { Icon: HeartPulse, t: "Prevenção real", d: "Detecta sobrecarga e exaustão antes de virar licença médica. Inteligência preventiva no dia a dia." },
              { Icon: TrendingDown, t: "Custo evitado", d: "Cada afastamento custa milhares. Prevenir sai muito mais barato para a empresa e o colaborador." },
              { Icon: ShieldCheck, t: "Engajamento", d: "Reduz turnover, melhora o clima e fortalece a marca empregadora. Pessoas saudáveis, resultados saudáveis." },
            ].map((b, i) => (
              <Reveal key={b.t} delay={i * 120} className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-primary">
                  <b.Icon className="h-5 w-5" />
                </div>
                <h3 className="font-serif-editorial text-2xl font-medium text-foreground">{b.t}</h3>
                <p className="text-muted-foreground leading-relaxed">{b.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 3 ONDAS — dark editorial */}
      <section id="como-funciona" className="bg-[hsl(210_30%_12%)] text-[hsl(200_15%_90%)] overflow-hidden">
        <div className="container max-w-7xl py-24 md:py-32">
          <Reveal className="max-w-2xl mb-16">
            <h2 className="font-serif-editorial text-5xl md:text-6xl mb-6 italic">3 ciclos de rastreio</h2>
            <p className="text-[hsl(200_15%_70%)] text-lg leading-relaxed">
              Acompanhamos a jornada de transformação cultural em três etapas científicas que garantem resultados duradouros.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-0 border-t border-white/10">
            {[
              { n: "01 / DIAGNÓSTICO", t: "Linha de base", d: "Mapeia demandas, controle, suporte, reconhecimento e violência. O primeiro passo para a escuta ativa." },
              { n: "02 / EVOLUÇÃO", t: "Reaplicação", d: "Mede a sensibilidade às intervenções realizadas e identifica áreas que ainda exigem atenção." },
              { n: "03 / MATURIDADE", t: "Consolidação", d: "Valida resultados e orienta o próximo ciclo. Transformamos dados brutos em cultura de cuidado." },
            ].map((s, i) => (
              <Reveal
                key={s.n}
                delay={i * 150}
                className={`group py-12 transition-colors hover:bg-white/5 ${
                  i === 0 ? "md:pr-12 md:border-r" : i === 1 ? "md:px-12 md:border-r" : "md:pl-12"
                } border-white/10 ${i < 2 ? "border-b md:border-b-0" : ""}`}
              >
                <div className="text-accent font-mono text-xs mb-8 italic tracking-widest">{s.n}</div>
                <h3 className="font-serif-editorial text-3xl mb-4">{s.t}</h3>
                <p className="text-[hsl(200_15%_70%)] leading-relaxed">{s.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* RELATÓRIO */}
      <section className="border-b border-border/40">
        <div className="container max-w-6xl py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <Reveal variant="left">
              <h2 className="font-serif-editorial text-4xl md:text-5xl font-medium text-foreground mb-6 leading-tight">
                Relatório gratuito* por ciclo
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Dimensões em risco, comparação entre ciclos e sugestões práticas — direto ao ponto, para você agir antes que o custo cresça.
              </p>
              <Button onClick={onCadastrar} className="bg-gradient-hero text-primary-foreground hover:opacity-90 group h-12 px-6">
                Quero o relatório da minha empresa
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Reveal>
            <div className="space-y-3">
              {[
                "Agregado por área, departamento e faixa etária",
                "Dimensões em risco: demanda, controle, suporte, justiça, violência",
                "Sugestões práticas por dimensão",
                "Comparação entre ondas",
                "Anonimato individual preservado",
              ].map((i, idx) => (
                <Reveal key={i} delay={idx * 80} className="flex gap-3 text-sm rounded-xl border border-border/60 bg-card p-4 hover:border-primary/40 transition-smooth">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-foreground font-medium">{i}</span>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SEGURANÇA / DEPOIMENTO */}
      <section className="bg-muted/30 border-b border-border/40">
        <div className="container max-w-6xl py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal variant="zoom" className="rounded-3xl overflow-hidden shadow-card aspect-[4/3] bg-muted">
              <img
                src={loungePhoto}
                alt="Colegas de trabalho conversando em ambiente acolhedor"
                width={1024}
                height={640}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </Reveal>
            <div className="space-y-6">
              {[
                { Icon: FlaskConical, t: "Cientificamente validado", d: "Baseado em psicometrias com padrões internacionais para avaliação de riscos psicossociais (NR1 contemplada)." },
                { Icon: Lock, t: "Anonimato garantido", d: "A empresa nunca vê respostas individuais — apenas dados agregados." },
                { Icon: ShieldCheck, t: "Conformidade LGPD", d: "Criptografia, controles de acesso e sigilo profissional." },
              ].map((s, i) => (
                <Reveal key={s.t} delay={i * 120} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary shrink-0">
                    <s.Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-serif-editorial text-xl font-medium mb-1 text-foreground">{s.t}</h3>
                    <p className="text-muted-foreground leading-relaxed">{s.d}</p>
                  </div>
                </Reveal>
              ))}
              <Reveal delay={400} className="pt-4 border-t border-border/60">
                <p className="font-serif-editorial italic text-xl text-foreground leading-snug">
                  “A saúde mental deixou de ser um benefício para se tornar a base da produtividade moderna.”
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Trabalho;
