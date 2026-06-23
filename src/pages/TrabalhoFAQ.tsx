import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, ArrowLeft } from "lucide-react";

const FAQS: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: "O Cuidar+ Trabalho é realmente gratuito?",
    a: (
      <>
        Sim — <strong>gratuito* para empresas com até 20 colaboradores</strong>. Isso inclui o relatório NR-1
        gratuito* do primeiro ciclo. Acima de 20 colaboradores, conversamos sobre condições específicas.
      </>
    ),
  },
  {
    q: "O que é entregue no relatório?",
    a: (
      <>
        Um relatório agregado por área, departamento e faixa etária, com dimensões em risco (demanda, controle,
        suporte, justiça, violência), sugestões práticas por dimensão, comparação entre ciclos e os requisitos
        exigidos pela NR-1. O anonimato individual é sempre preservado.
      </>
    ),
  },
  {
    q: "Como é garantido o anonimato dos colaboradores?",
    a: (
      <>
        A empresa <strong>nunca vê respostas individuais</strong>. Os dados são agregados por critérios mínimos
        de grupo. Cada colaborador recebe ao final do primeiro ciclo um <strong>código mestre único</strong> que
        dá acesso apenas ao seu próprio relatório individual — e esse código não é recuperável, garantindo que
        nem mesmo a plataforma consegue vincular respostas a pessoas.
      </>
    ),
  },
  {
    q: "O que são os 3 ciclos?",
    a: (
      <>
        O programa é estruturado em <strong>3 ciclos</strong> ao longo do tempo, permitindo acompanhar a evolução
        dos indicadores e a efetividade das ações preventivas adotadas pela empresa.
      </>
    ),
  },
  {
    q: "Quais instrumentos científicos são usados?",
    a: (
      <>
        Utilizamos psicometrias testadas e aprovadas internacionalmente: COPSOQ II, PHQ-9, ECIG, LIPT-60 (Inventário
        de Leymann), MDiSH e SHRAS — combinando avaliação de fatores psicossociais, clima de equipe, humor,
        assédio moral e percepções sobre assédio sexual.
      </>
    ),
  },
  {
    q: "O programa atende à NR-1?",
    a: (
      <>
        Sim. O relatório entrega <strong>todos os requisitos exigidos pela NR-1</strong> para gestão de riscos
        psicossociais e ainda estabelece uma cultura de cuidado, escuta e prevenção.
      </>
    ),
  },
  {
    q: "Quanto tempo o colaborador leva para responder?",
    a: (
      <>
        Cada etapa leva entre 3 e 15 minutos, dependendo do instrumento. O envio é por link individual e pode ser
        feito em qualquer dispositivo.
      </>
    ),
  },
  {
    q: "E se o colaborador perder o código de acesso individual?",
    a: (
      <>
        Por razões de anonimato, <strong>o código não pode ser recuperado</strong>. Por isso ele é apresentado
        com um aviso claro para ser salvo no momento da geração. Isso é o que garante que ninguém — nem a empresa,
        nem nós — consiga vincular respostas a uma pessoa específica.
      </>
    ),
  },
  {
    q: "Como contratar para uma empresa com mais de 20 colaboradores?",
    a: (
      <>
        Entre em contato pelo nosso{" "}
        <Link to="/trabalho/contato" className="text-primary hover:underline font-medium">
          formulário
        </Link>{" "}
        — retornamos com uma proposta sob medida.
      </>
    ),
  },
];

const TrabalhoFAQ = () => {
  useEffect(() => {
    document.title = "Perguntas Frequentes — Cuidar+ Trabalho";
  }, []);

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
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-hero flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-serif-editorial text-3xl md:text-4xl font-semibold">Perguntas Frequentes</h1>
          </div>
          <p className="text-muted-foreground">
            Respostas rápidas para as dúvidas mais comuns sobre o Cuidar+ Trabalho.
          </p>

          <Card className="p-2 md:p-4 shadow-card border-border/60">
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left font-medium px-4">{f.q}</AccordionTrigger>
                  <AccordionContent className="px-4 text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>

          <p className="text-xs text-muted-foreground pt-2">
            * Gratuito até 20 colaboradores.
          </p>

          <div className="text-center pt-4">
            <Link
              to="/trabalho/contato"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              Não encontrou sua resposta? Fale com a gente →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default TrabalhoFAQ;
