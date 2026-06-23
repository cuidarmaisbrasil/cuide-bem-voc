import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mail, ArrowLeft, CheckCircle2, Send } from "lucide-react";

const ContactSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(120),
  email: z.string().trim().email("E-mail inválido.").max(255),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  subject: z.string().trim().min(3, "Informe um assunto.").max(160),
  message: z.string().trim().min(10, "Escreva uma mensagem com pelo menos 10 caracteres.").max(2000),
});

const TrabalhoContato = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.title = "Contato — Cuidar+ Trabalho";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = ContactSchema.safeParse({ name, email, company, subject, message });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast.error(first?.message ?? "Verifique os campos do formulário.");
      return;
    }
    setSending(true);
    try {
      const idempotencyKey = `trabalho-contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const { data, error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "trabalho-contact",
          idempotencyKey,
          templateData: parsed.data,
        },
      });
      if (error) throw error;
      if (data && (data as any).success === false) {
        throw new Error((data as any).reason || "Falha no envio.");
      }
      setSent(true);
      toast.success("Mensagem enviada! Retornaremos em breve.");
    } catch (err: any) {
      console.error(err);
      toast.error("Não foi possível enviar agora. Tente novamente em instantes.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="container flex items-center justify-between h-14">
          <Link to="/trabalho" className="flex items-center gap-2 font-display font-semibold text-lg">
            <span className="h-7 w-7 rounded-lg bg-gradient-hero flex items-center justify-center text-primary-foreground text-sm">❤</span>
            Cuidar+ Trabalho
          </Link>
          <Link to="/trabalho" className="text-sm text-primary hover:underline flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </header>

      <section className="container py-10 md:py-14">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-hero flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-serif-editorial text-3xl md:text-4xl font-semibold">Fale com a gente</h1>
          </div>
          <p className="text-muted-foreground">
            Envie sua mensagem pelo formulário abaixo. Retornaremos por e-mail assim que possível.
          </p>

          <Card className="p-6 md:p-8 shadow-card border-border/60">
            {sent ? (
              <div className="text-center py-8 space-y-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-7 w-7 text-primary" />
                </div>
                <h2 className="font-serif-editorial text-2xl font-semibold">Mensagem enviada!</h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Obrigado pelo contato. Responderemos no e-mail que você informou em até alguns dias úteis.
                </p>
                <div className="flex gap-3 justify-center pt-2">
                  <Button variant="outline" onClick={() => { setSent(false); setName(""); setEmail(""); setCompany(""); setSubject(""); setMessage(""); }}>
                    Enviar outra
                  </Button>
                  <Link to="/trabalho">
                    <Button>Voltar para Trabalho</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Nome*</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-mail*</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} required />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="company">Empresa</Label>
                    <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} maxLength={160} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="subject">Assunto*</Label>
                    <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={160} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message">Mensagem*</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={7}
                    maxLength={2000}
                    required
                    placeholder="Conte brevemente como podemos ajudar."
                  />
                  <p className="text-xs text-muted-foreground text-right">{message.length}/2000</p>
                </div>
                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-gradient-hero text-primary-foreground hover:opacity-90 h-12"
                >
                  {sending ? "Enviando..." : (
                    <>
                      Enviar mensagem
                      <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Ao enviar, você concorda com nossos{" "}
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

export default TrabalhoContato;
