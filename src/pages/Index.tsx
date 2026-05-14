import { useEffect, useState } from "react";
import { Hero } from "@/components/Hero";
import { DepressionTest, TestAnswers } from "@/components/DepressionTest";
import { Results } from "@/components/Results";
import { EmergencyBanner } from "@/components/EmergencyBanner";
import { DonateCard } from "@/components/DonateCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { interpretPhq9 } from "@/data/symptoms";
import { track } from "@/lib/tracking";

type Stage = "intro" | "test" | "result";

const FAQ_ITEMS = [
  {
    q: "O teste de depressão do Cuidar+ é confiável?",
    a: "Sim. Usamos o PHQ-9, instrumento validado pela OMS com α de Cronbach 0,89, combinado com os critérios diagnósticos do DSM-5 e CID-11. É um rastreio educativo, não substitui diagnóstico clínico.",
  },
  {
    q: "O teste é gratuito e anônimo?",
    a: "Sim. 100% gratuito, anônimo e sem cadastro. Leva cerca de 5 minutos.",
  },
  {
    q: "Onde encontro ajuda gratuita para depressão no Brasil?",
    a: "Pelo SUS você pode procurar a UBS mais próxima ou um CAPS (Centro de Atenção Psicossocial). Em emergência ligue CVV 188 (24h, gratuito) ou SAMU 192.",
  },
  {
    q: "Estou em crise. O que fazer agora?",
    a: "Ligue imediatamente para o CVV 188 (gratuito, 24 horas) ou SAMU 192. Se houver risco imediato à vida, vá ao pronto-socorro mais próximo.",
  },
];

const Index = () => {
  const [stage, setStage] = useState<Stage>("intro");
  const [answers, setAnswers] = useState<TestAnswers | null>(null);

  // Inject MedicalWebPage + FAQPage JSON-LD only on the homepage (not on /auth, /admin, etc.)
  useEffect(() => {
    const medicalLd = {
      "@context": "https://schema.org",
      "@type": "MedicalWebPage",
      name: "Cuidar+ · Teste de depressão online",
      url: "https://cuidarmaisbrasil.life/",
      inLanguage: "pt-BR",
      description:
        "Autoavaliação gratuita de depressão baseada no PHQ-9 (validado pela OMS) e nos critérios do DSM-5. Receba orientações sobre atendimento gratuito no SUS.",
      audience: {
        "@type": "Audience",
        audienceType: "Adultos (18+)",
        geographicArea: { "@type": "Country", name: "Brasil" },
      },
      about: {
        "@type": "MedicalCondition",
        name: "Transtorno Depressivo Maior",
        code: { "@type": "MedicalCode", code: "6A70", codingSystem: "ICD-11" },
      },
      publisher: { "@type": "Organization", name: "Cuidar+", url: "https://cuidarmaisbrasil.life/" },
      lastReviewed: "2026-04-20",
    };

    const faqLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    };

    const scripts = [medicalLd, faqLd].map((data) => {
      const el = document.createElement("script");
      el.type = "application/ld+json";
      el.dataset.page = "home";
      el.text = JSON.stringify(data);
      document.head.appendChild(el);
      return el;
    });

    return () => {
      scripts.forEach((s) => s.remove());
    };
  }, []);

  const handleStart = () => {
    setStage("test");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleComplete = (a: TestAnswers) => {
    const score = a.phq9.reduce((sum, value) => sum + value, 0);
    const interpretation = interpretPhq9(score);
    track({
      type: "test",
      payload: {
        score,
        severity: interpretation.level,
        age: a.age,
        symptoms: a.symptoms,
        phq9_answers: a.phq9,
        functional_impact: a.functionalImpact,
      },
    });
    setAnswers(a);
    setStage("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleRestart = () => {
    setAnswers(null);
    setStage("intro");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <button onClick={handleRestart} className="flex items-center gap-2 font-display font-semibold text-lg">
            <span className="h-7 w-7 rounded-lg bg-gradient-hero flex items-center justify-center text-primary-foreground text-sm">
              ❤
            </span>
            Cuidar+
          </button>
          <a href="tel:188" className="text-sm font-medium text-destructive hover:underline">
            Emergência: 188
          </a>
        </div>
      </header>

      {stage === "intro" && (
        <>
          <Hero onStart={handleStart} />

          <section id="sobre" className="container py-12 md:py-16">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-center space-y-2">
                <h2 className="font-display text-2xl md:text-3xl font-semibold">Como funciona</h2>
                <p className="text-sm text-muted-foreground">
                  3 passos simples · feito por você, no seu tempo.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { n: "1", title: "Responda", text: "9 perguntas validadas pela OMS + checklist de sintomas." },
                  { n: "2", title: "Receba seu resultado", text: "Pontuação interpretada conforme critérios DSM-5/CID-11." },
                  { n: "3", title: "Encontre ajuda", text: "Onde buscar atendimento gratuito (SUS) ou acessível." },
                ].map((s) => (
                  <Card key={s.n} className="p-5 shadow-card border-border/60 text-left">
                    <div className="h-8 w-8 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground font-display font-semibold mb-3">
                      {s.n}
                    </div>
                    <h3 className="font-display text-base font-semibold mb-1">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
                  </Card>
                ))}
              </div>

              <div className="text-center pt-2">
                <Button
                  size="lg"
                  onClick={handleStart}
                  className="bg-gradient-hero text-primary-foreground hover:opacity-90 transition-smooth shadow-soft"
                >
                  Começar minha avaliação
                </Button>
              </div>

              <EmergencyBanner />

              <DonateCard />
            </div>
          </section>

          <section id="faq" className="container pb-12 md:pb-16">
            <div className="max-w-3xl mx-auto">
              <div className="text-center space-y-2 mb-6">
                <h2 className="font-display text-2xl md:text-3xl font-semibold">Perguntas frequentes</h2>
                <p className="text-sm text-muted-foreground">
                  O que as pessoas mais perguntam antes de fazer o teste.
                </p>
              </div>
              <div className="space-y-3">
                {FAQ_ITEMS.map((item) => (
                  <Card key={item.q} className="p-5 shadow-card border-border/60 text-left">
                    <h3 className="font-display text-base font-semibold mb-1.5">{item.q}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* CTA sticky mobile */}
          <div className="md:hidden fixed bottom-0 inset-x-0 z-50 p-3 bg-background/95 backdrop-blur border-t border-border shadow-soft">
            <Button
              onClick={handleStart}
              className="w-full h-12 bg-gradient-hero text-primary-foreground hover:opacity-90 transition-smooth"
            >
              Fazer meu teste agora · 3 min
            </Button>
          </div>
        </>
      )}

      {stage === "test" && <DepressionTest onComplete={handleComplete} />}
      {stage === "result" && answers && <Results answers={answers} age={answers.age} onRestart={handleRestart} />}

      <footer className="border-t border-border/60 mt-16 py-10 pb-28 md:pb-10 bg-muted/30">
        <div className="container max-w-3xl space-y-6 text-sm text-muted-foreground">
          <div className="text-center space-y-2">
            <p>
              <strong className="text-foreground">Cuidar+</strong> · Plataforma educativa de
              autoavaliação. Não substitui diagnóstico médico.
            </p>
            <p>
              Em emergência ligue <a className="text-destructive font-semibold" href="tel:188">CVV 188</a> ou{" "}
              <a className="text-destructive font-semibold" href="tel:192">SAMU 192</a>.
            </p>
            <p className="pt-1">
              <a className="text-primary hover:underline" href="/privacidade">Política de Privacidade</a>
              <span className="mx-2">·</span>
              <a className="text-primary hover:underline" href="/termos">Termos de Uso</a>
            </p>
          </div>

          <div className="border-t border-border/60 pt-6">
            <h3 className="font-display text-base font-semibold text-foreground mb-2">
              Metodologia e fontes
            </h3>
            <p className="leading-relaxed mb-3">
              Esta autoavaliação combina o <strong>PHQ-9</strong> (Patient Health
              Questionnaire-9), instrumento de rastreio de depressão validado
              internacionalmente pela OMS, com um checklist baseado nos
              critérios diagnósticos do <strong>DSM-5</strong> (APA) e da{" "}
              <strong>CID-11</strong> (OMS). O resultado é um <em>rastreio</em>,
              não um diagnóstico.
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>
                Kroenke K, Spitzer RL, Williams JBW. <em>The PHQ-9: Validity of
                a brief depression severity measure.</em> J Gen Intern Med.
                2001;16(9):606-613.
              </li>
              <li>
                Santos IS, Tavares BF, Munhoz TN, et al. <em>Sensibilidade e
                especificidade do PHQ-9 entre adultos da população geral.</em>{" "}
                Cad. Saúde Pública. 2013;29(8):1533-1543.
              </li>
              <li>
                American Psychiatric Association. <em>DSM-5: Manual Diagnóstico
                e Estatístico de Transtornos Mentais.</em> 5ª ed. 2014.
              </li>
              <li>
                Organização Mundial da Saúde. <em>CID-11 — Classificação
                Internacional de Doenças.</em> 2022.
              </li>
              <li>
                Fráguas R, Henriques SG, De Lucia MS, et al. <em>The detection
                of depression in medical setting: a study with PRIME-MD.</em> J
                Affect Disord. 2006;91(1):11-17.
              </li>
            </ul>
            <p className="text-xs mt-3">
              <strong>Limitações:</strong> autoavaliação tem viés de
              autoreferência, não substitui anamnese clínica, não realiza
              diagnóstico diferencial (luto, hipotireoidismo, transtorno
              bipolar etc.) e é validada apenas para adultos (≥18 anos).
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Index;
