import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PRESS_EMAIL = "imprensa@cuidarmaisbrasil.life";
const URL = "https://cuidarmaisbrasil.life/imprensa";

const FACTS = [
  { label: "Lançamento", value: "2025" },
  { label: "Cobertura", value: "Brasil — todas as regiões" },
  { label: "Instrumentos", value: "PHQ-9 (clínico) · COPSOQ II (organizacional)" },
  { label: "Custo para o usuário", value: "Gratuito e anônimo" },
];

const BOILERPLATE = `Cuidar+ Brasil é uma plataforma gratuita e anônima de triagem em saúde mental. Oferece o PHQ-9 (Patient Health Questionnaire-9) para o público geral e o COPSOQ II (Copenhagen Psychosocial Questionnaire) para empresas via Cuidar+ Trabalho, redirecionando usuários ao SUS, ao CVV e a profissionais qualificados quando necessário. O projeto não substitui avaliação clínica — funciona como porta de entrada para cuidado.`;

const Imprensa = () => {
  useEffect(() => {
    document.title = "Imprensa & Press Kit — Cuidar+ Brasil";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Press kit do Cuidar+ Brasil: dados, boilerplate, contato e materiais para imprensa, RH e parcerias.");

    const existing = document.querySelector('script[data-page="imprensa"]');
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.page = "imprensa";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "Imprensa — Cuidar+ Brasil",
      url: URL,
      description: "Press kit, dados e contato para imprensa do Cuidar+ Brasil.",
      publisher: {
        "@type": "Organization",
        name: "Cuidar+ Brasil",
        url: "https://cuidarmaisbrasil.life",
        email: PRESS_EMAIL,
      },
    });
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="container py-4 flex items-center justify-between">
          <Link to="/" className="font-display font-semibold">Cuidar+ Brasil</Link>
          <Link to="/trabalho" className="text-sm text-muted-foreground hover:text-foreground">Cuidar+ Trabalho →</Link>
        </div>
      </header>

      <article className="container max-w-3xl py-10 space-y-8">
        <header className="space-y-3">
          <Badge variant="secondary">Press kit</Badge>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">Imprensa &amp; Parcerias</h1>
          <p className="text-muted-foreground">
            Materiais, dados e contato para jornalistas, pesquisadores, RH e parceiros institucionais
            que queiram cobrir ou colaborar com o Cuidar+ Brasil.
          </p>
        </header>

        <Card className="p-6 space-y-3">
          <h2 className="font-display text-xl font-semibold">Sobre o projeto</h2>
          <p className="text-sm leading-relaxed">{BOILERPLATE}</p>
          <p className="text-xs text-muted-foreground">
            <strong>Aviso:</strong> os instrumentos disponibilizados são ferramentas de triagem validadas
            internacionalmente e não substituem avaliação clínica. Em emergência, ligue 188 (CVV) ou 192 (SAMU).
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-xl font-semibold mb-4">Fatos rápidos</h2>
          <dl className="grid sm:grid-cols-2 gap-4">
            {FACTS.map((f) => (
              <div key={f.label}>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{f.label}</dt>
                <dd className="text-sm font-medium mt-0.5">{f.value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="font-display text-xl font-semibold">Instrumentos utilizados</h2>
          <div>
            <h3 className="font-medium text-sm">PHQ-9 — Patient Health Questionnaire-9</h3>
            <p className="text-sm text-muted-foreground">
              Triagem de sintomas depressivos validada para o português brasileiro
              (Santos et al., 2013; sensibilidade ≈ 77%, especificidade ≈ 88% para corte ≥ 10).
            </p>
          </div>
          <div>
            <h3 className="font-medium text-sm">COPSOQ II — Copenhagen Psychosocial Questionnaire</h3>
            <p className="text-sm text-muted-foreground">
              Avaliação de fatores psicossociais no trabalho, desenvolvida pelo NRCWE (Dinamarca)
              e adaptada para o português (Silva et al., 2011). Disponível nas versões curta, média e longa
              dentro do Cuidar+ Trabalho.
            </p>
          </div>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="font-display text-xl font-semibold">Para RH e empresas</h2>
          <p className="text-sm">
            O Cuidar+ Trabalho disponibiliza um link anônimo da empresa para colaboradores responderem
            o COPSOQ II. O painel agregado mostra escalas em faixa <strong>Saudável / Atenção / Risco</strong>,
            com filtros por departamento e faixa etária. Empresas passam por aprovação manual.
          </p>
          <div className="flex gap-2">
            <Button asChild><Link to="/trabalho">Cadastrar empresa</Link></Button>
            <Button variant="outline" asChild><Link to="/blog/rh-saude-mental-trabalho">Ler guia para RH</Link></Button>
          </div>
        </Card>

        <Card className="p-6 space-y-2">
          <h2 className="font-display text-xl font-semibold">Contato</h2>
          <p className="text-sm">
            <strong>Imprensa &amp; parcerias:</strong>{" "}
            <a className="underline" href={`mailto:${PRESS_EMAIL}`}>{PRESS_EMAIL}</a>
          </p>
          <p className="text-xs text-muted-foreground">
            Atendemos pedidos de entrevista, dados agregados anonimizados e participação em pautas
            sobre saúde mental, SUS e bem-estar no trabalho.
          </p>
        </Card>
      </article>
    </main>
  );
};

export default Imprensa;
