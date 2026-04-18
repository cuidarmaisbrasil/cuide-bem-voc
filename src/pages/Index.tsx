import { useState } from "react";
import { Hero } from "@/components/Hero";
import { DepressionTest, TestAnswers } from "@/components/DepressionTest";
import { Results } from "@/components/Results";
import { EmergencyBanner } from "@/components/EmergencyBanner";
import { DonateCard } from "@/components/DonateCard";
import { AgeGate } from "@/components/AgeGate";
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

      {stage === "test" && <DepressionTest onComplete={handleComplete} />}
      {stage === "result" && answers && <Results answers={answers} onRestart={handleRestart} />}

      <footer className="border-t border-border/60 mt-16 py-8 bg-muted/30">
        <div className="container text-center space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Cuidar+</strong> · Plataforma educativa de
            autoavaliação. Não substitui diagnóstico médico.
          </p>
          <p>
            Em emergência ligue <a className="text-destructive font-semibold" href="tel:188">CVV 188</a> ou{" "}
            <a className="text-destructive font-semibold" href="tel:192">SAMU 192</a>.
          </p>
        </div>
      </footer>
    </main>
  );
};

export default Index;
