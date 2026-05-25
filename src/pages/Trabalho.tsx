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
        if (!companyName.trim() || !contactName.trim()) {
          toast.error("Preencha nome da empresa e responsável."); return;
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
          <section className="border-b border-border/60 bg-gradient-soft">
            <div className="container max-w-5xl py-16 md:py-24">
              <div className="max-w-3xl space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card px-3 py-1 text-xs font-medium text-primary">
                  Programa gratuito de prevenção
                </div>
                <h1 className="font-display text-3xl md:text-5xl font-semibold leading-tight text-foreground">
                  Antecipe-se ao adoecimento.<br />
                  <span className="text-primary">Reduza custos, eleve o bem-estar.</span>
                </h1>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  O Cuidar+ Trabalho oferece monitoramento psicossocial contínuo e gratuito para sua empresa.
                  Identificamos áreas de risco <strong className="text-foreground">antes</strong> que se tornem
                  afastamentos, processos ou intervenções clínicas caras.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button size="lg" onClick={() => document.getElementById("cadastro")?.scrollIntoView({ behavior: "smooth" })} className="bg-gradient-hero text-primary-foreground hover:opacity-90">
                    Cadastrar minha empresa
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}>
                    Como funciona
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  100% gratuito · Anonimato garantido aos colaboradores · Metodologia científica validada
                </p>
              </div>
            </div>
          </section>

          {/* BENEFÍCIOS */}
          <section className="border-b border-border/60">
            <div className="container max-w-5xl py-16">
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { t: "Prevenção real", d: "Detectamos sinais precoces de sobrecarga, conflito e exaustão antes que se tornem licença médica." },
                  { t: "Custo evitado", d: "Cada afastamento por saúde mental custa milhares em produtividade, reposição e encargos. Prevenir é mais barato." },
                  { t: "Engajamento", d: "Empresas que cuidam ativamente reduzem turnover, melhoram o clima e fortalecem a marca empregadora." },
                ].map((b) => (
                  <div key={b.t} className="rounded-lg border border-border bg-card p-6 shadow-card">
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
                  Monitoramento em 3 ondas
                </h2>
                <p className="text-muted-foreground">
                  Os testes de rastreio de bem-estar psicossocial são aplicados em três ondas sequenciais de disparo,
                  permitindo acompanhar a evolução do clima e identificar tendências ao longo do tempo.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { n: "01", t: "Onda inicial", d: "Diagnóstico de linha de base. Mapeamos demandas, controle, suporte, reconhecimento e exposição a violência no trabalho." },
                  { n: "02", t: "Onda intermediária", d: "Reaplicação focada após ações iniciais. Mede sensibilidade às intervenções e identifica áreas resistentes." },
                  { n: "03", t: "Onda de consolidação", d: "Fechamento do ciclo. Compara evolução, valida resultados e orienta o próximo ciclo de cuidado." },
                ].map((s) => (
                  <div key={s.n} className="rounded-lg border border-border bg-card p-6">
                    <div className="text-xs font-mono text-primary mb-2">{s.n}</div>
                    <h3 className="font-display text-lg font-semibold mb-2 text-foreground">{s.t}</h3>
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
                <div className="space-y-4">
                  <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground">
                    Relatório gratuito com áreas de atenção
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Ao final de cada onda, sua empresa recebe — também gratuitamente — um relatório agregado e anônimo
                    apontando quais dimensões exigem atenção e sugestões práticas de atuação.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    O foco é direcionar pequenas mudanças que reduzem custos com afastamentos, rotatividade e processos,
                    enquanto elevam o bem-estar antes que intervenções clínicas caras se tornem necessárias.
                  </p>
                </div>
                <ul className="space-y-3">
                  {[
                    "Dados agregados por área, departamento e faixa etária",
                    "Identificação de dimensões em risco (demanda, controle, suporte, justiça, violência)",
                    "Sugestões práticas de atuação por dimensão",
                    "Comparação entre ondas e evolução do clima",
                    "Total preservação do anonimato individual",
                  ].map((i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
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
                  { t: "Cientificamente aprovado", d: "Baseado no COPSOQ II (Copenhagen Psychosocial Questionnaire), instrumento validado internacionalmente para riscos psicossociais." },
                  { t: "Anonimato garantido", d: "Colaboradores respondem por link único. A empresa nunca vê respostas individuais — apenas dados agregados." },
                  { t: "Avaliação segura", d: "Infraestrutura com criptografia, controles de acesso e conformidade com a LGPD. Sigilo profissional." },
                ].map((s) => (
                  <div key={s.t} className="rounded-lg border border-border bg-card p-6">
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
          <Card className="p-6" id="cadastro">
            <div className="mb-4">
              <h2 className="font-display text-2xl font-semibold mb-1">Cadastre sua empresa</h2>
              <p className="text-sm text-muted-foreground">
                Acesso restrito a empresas aprovadas. Após o cadastro, nossa equipe valida e libera o painel
                gratuito de monitoramento.
              </p>
            </div>
            <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as any)}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="signup">Cadastrar empresa</TabsTrigger>
                <TabsTrigger value="login">Entrar</TabsTrigger>
              </TabsList>
              <TabsContent value="signup">
                <form onSubmit={handleAuth} className="space-y-3 mt-4">
                  <div><Label>Nome da empresa *</Label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required /></div>
                  <div><Label>Nome do responsável *</Label><Input value={contactName} onChange={(e) => setContactName(e.target.value)} required /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>CNPJ (opcional)</Label><Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} /></div>
                    <div><Label>Telefone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                  </div>
                  <div><Label>E-mail *</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                  <div><Label>Senha *</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
                  <Button type="submit" className="w-full" disabled={submitting}>Solicitar cadastro gratuito</Button>
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
