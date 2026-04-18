import { useState } from "react";
import { Hero } from "@/components/Hero";
import { DepressionTest, TestAnswers } from "@/components/DepressionTest";
import { Results } from "@/components/Results";
import { EmergencyBanner } from "@/components/EmergencyBanner";
import { DonateCard } from "@/components/DonateCard";
import { AgeGate } from "@/components/AgeGate";
import { ReliabilityBadge } from "@/components/ReliabilityBadge";
import { Card } from "@/components/ui/card";
import { BookOpen, ClipboardList, HeartHandshake } from "lucide-react";

type Stage = "intro" | "age" | "test" | "result";

const Index = () => {
  const [stage, setStage] = useState<Stage>("intro");
  const [answers, setAnswers] = useState<TestAnswers | null>(null);

  const handleStart = () => setStage("age");
  const handleAgeConfirm = () => {
    setStage("test");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleComplete = (a: TestAnswers) => {
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

          <section id="sobre" className="container py-16">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <h2 className="font-display text-3xl md:text-4xl font-semibold">Como funciona</h2>
                <p className="text-muted-foreground">
                  Uma avaliação séria, baseada em instrumentos validados internacionalmente.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { icon: ClipboardList, title: "PHQ-9 + 10 sintomas", text: "Você responde 9 perguntas validadas pela OMS e marca quais dos 10 sintomas clássicos sente." },
                  { icon: BookOpen, title: "Resultado fundamentado", text: "Pontuação interpretada conforme critérios do DSM-5 / CID-11. Se você tem 4+ sintomas, recomendamos buscar ajuda." },
                  { icon: HeartHandshake, title: "Caminhos para ajuda", text: "Mostramos onde buscar atendimento gratuito pelo SUS na sua cidade e profissionais com valores acessíveis." },
                ].map((s) => (
                  <Card key={s.title} className="p-6 shadow-card border-border/60">
                    <div className="h-10 w-10 rounded-xl bg-gradient-hero flex items-center justify-center mb-4">
                      <s.icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <h3 className="font-display text-lg font-semibold mb-2">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
                  </Card>
                ))}
              </div>

              <EmergencyBanner />

              <DonateCard />
            </div>
          </section>
        </>
      )}

      {stage === "age" && <AgeGate onConfirm={handleAgeConfirm} onCancel={handleRestart} />}
      {stage === "test" && <DepressionTest onComplete={handleComplete} />}
      {stage === "result" && answers && <Results answers={answers} onRestart={handleRestart} />}

      <footer className="border-t border-border/60 mt-16 py-10 bg-muted/30">
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
