import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, CheckCircle2, Handshake, Send } from "lucide-react";
import { AgendarReuniaoDialog } from "@/components/AgendarReuniaoDialog";
import { SiteHeader } from "@/components/SiteHeader";

const TITLE = "Programa de parceiros — Cuidar+ Trabalho";
const DESC =
  "Para consultorias de SST, clínicas de medicina ocupacional e escritórios de ergonomia: ofereça medição de riscos psicossociais NR-1 aos seus clientes, com relatório anexável à AEP.";

const PartnerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(120),
  email: z.string().trim().email("E-mail inválido.").max(255),
  company: z.string().trim().min(2, "Informe o nome da consultoria.").max(160),
  role: z.string().trim().min(2, "Informe seu cargo.").max(120),
  clients: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

const TrabalhoParceiros = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [clients, setClients] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.title = TITLE;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", DESC);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = PartnerSchema.safeParse({ name, email, company, role, clients, message });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Verifique os campos.");
      return;
    }
    setSending(true);
    try {
      const d = parsed.data;
      const idempotencyKey = `parceiro-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const { data, error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "trabalho-contact",
          idempotencyKey,
          templateData: {
            name: d.name,
            email: d.email,
            company: d.company,
            subject: `[PARCEIRO] ${d.company} — ${d.role}`,
            message:
              `Cargo: ${d.role}\n` +
              `Carteira estimada de clientes: ${d.clients || "não informado"}\n\n` +
              `${d.message || "(sem mensagem adicional)"}`,
          },
        },
      });
      if (error) throw error;
      if (data && (data as any).success === false) {
        throw new Error((data as any).reason || "Falha no envio.");
      }
      setSent(true);
      toast.success("Cadastro enviado. Retornaremos por e-mail.");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível enviar agora. Tente novamente em instantes.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader variant="trabalho" />

      <section className="container py-10 md:py-14">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-3">
            <Badge variant="secondary">Para consultorias de SST e medicina ocupacional</Badge>
            <h1 className="font-serif-editorial text-3xl md:text-4xl font-semibold flex items-start gap-3">
              <span className="h-10 w-10 shrink-0 rounded-xl bg-gradient-hero flex items-center justify-center mt-1">
                <Handshake className="h-5 w-5 text-primary-foreground" />
              </span>
              Programa de parceiros
            </h1>
            <p className="text-muted-foreground">
              Seus clientes precisam registrar riscos psicossociais no PGR e na AEP desde 2025. O
              Cuidar+ Trabalho entrega a parte operacional dessa exigência — coleta anônima, cálculo por
              dimensão e relatório comparável entre ciclos — para você assinar o laudo técnico.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { t: "Você mantém a relação", d: "O contrato e a assinatura técnica seguem com a sua consultoria. Somos a camada de medição." },
              { t: "Relatório anexável", d: "Saída pronta para compor a AEP da NR-17 e o inventário de riscos do PGR." },
              { t: "Primeiro ciclo gratuito", d: "Cada cliente indicado roda o primeiro ciclo sem custo até 100 colaboradores." },
            ].map((c) => (
              <Card key={c.t} className="p-4 border-border/60">
                <p className="font-medium text-sm mb-1">{c.t}</p>
                <p className="text-sm text-muted-foreground">{c.d}</p>
              </Card>
            ))}
          </div>

          <Card className="p-5 md:p-6 border-border/60 bg-muted/30 space-y-3">
            <h2 className="font-medium">Como funciona</h2>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Você cadastra a empresa cliente e indica o gestor responsável pela aprovação dos envios.</li>
              <li>O gestor revisa a lista de colaboradores por área, setor e departamento antes do primeiro disparo.</li>
              <li>O ciclo roda em ondas, com coleta anônima e corte mínimo de respondentes por recorte.</li>
              <li>Você recebe o relatório agregado, classificado por dimensão, para compor a documentação técnica.</li>
              <li>A cada três meses um novo ciclo gera a série histórica que comprova eficácia das ações.</li>
            </ol>
          </Card>

          <Card className="p-5 md:p-6 border-border/60 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div>
              <h2 className="font-medium">Prefere conversar antes de se cadastrar?</h2>
              <p className="text-sm text-muted-foreground">15 minutos por videochamada, sem compromisso.</p>
            </div>
            <AgendarReuniaoDialog label="Agendar conversa" className="shrink-0" />
          </Card>

          <Card className="p-6 md:p-8 shadow-card border-border/60">
            {sent ? (
              <div className="text-center py-8 space-y-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-7 w-7 text-primary" />
                </div>
                <h2 className="font-serif-editorial text-2xl font-semibold">Cadastro enviado</h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Vamos analisar e retornar pelo e-mail informado com os próximos passos e o material de
                  apoio comercial.
                </p>
                <div className="flex gap-3 justify-center pt-2">
                  <Button variant="outline" asChild>
                    <Link to="/trabalho/amostra-relatorio">Ver amostra do relatório</Link>
                  </Button>
                  <Button asChild><Link to="/trabalho">Voltar</Link></Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="font-medium">Quero ser parceiro</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="p-name">Nome*</Label>
                    <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-email">E-mail profissional*</Label>
                    <Input id="p-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} required />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="p-company">Consultoria / clínica*</Label>
                    <Input id="p-company" value={company} onChange={(e) => setCompany(e.target.value)} maxLength={160} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-role">Cargo*</Label>
                    <Input id="p-role" value={role} onChange={(e) => setRole(e.target.value)} maxLength={120} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-clients">Quantas empresas você atende hoje?</Label>
                  <Input id="p-clients" value={clients} onChange={(e) => setClients(e.target.value)} maxLength={120} placeholder="Ex.: cerca de 40" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-msg">Observações</Label>
                  <Textarea
                    id="p-msg"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    maxLength={2000}
                    placeholder="Setores predominantes da sua carteira, formato de parceria desejado, dúvidas."
                  />
                </div>
                <Button type="submit" disabled={sending} className="w-full bg-gradient-hero text-primary-foreground hover:opacity-90 h-12">
                  {sending ? "Enviando..." : (<>Enviar cadastro <Send className="ml-2 h-4 w-4" /></>)}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Ao enviar, você concorda com os{" "}
                  <Link to="/trabalho/termos" className="text-primary hover:underline">Termos e Condições</Link>.
                </p>
              </form>
            )}
          </Card>
        </div>
      </section>
    </main>
  );
};

export default TrabalhoParceiros;
