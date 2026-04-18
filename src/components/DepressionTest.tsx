import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  phq9Questions,
  phq9Options,
  tenSymptoms,
  functionalImpactQuestion,
  functionalImpactOptions,
} from "@/data/symptoms";
import { EmergencyBanner } from "./EmergencyBanner";

export interface TestAnswers {
  phq9: number[];
  symptoms: string[];
  functionalImpact: number; // 0-3 (critério B do DSM-5)
}

interface DepressionTestProps {
  onComplete: (answers: TestAnswers) => void;
}

export const DepressionTest = ({ onComplete }: DepressionTestProps) => {
  // PHQ-9 (9) + impacto funcional + checklist
  const totalSteps = phq9Questions.length + 2;
  const [step, setStep] = useState(0);
  const [phq9, setPhq9] = useState<(number | null)[]>(Array(phq9Questions.length).fill(null));
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [functionalImpact, setFunctionalImpact] = useState<number | null>(null);

  const isPhq9Step = step < phq9Questions.length;
  const isFunctionalStep = step === phq9Questions.length;
  const isChecklistStep = step === phq9Questions.length + 1;

  const currentPhqAnswer = isPhq9Step ? phq9[step] : null;
  const canAdvance = isPhq9Step
    ? currentPhqAnswer !== null
    : isFunctionalStep
      ? functionalImpact !== null
      : true;

  const handlePhq9 = (value: number) => {
    const next = [...phq9];
    next[step] = value;
    setPhq9(next);
  };

  const toggleSymptom = (id: string) => {
    setSymptoms((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      onComplete({
        phq9: phq9.map((v) => v ?? 0),
        symptoms,
        functionalImpact: functionalImpact ?? 0,
      });
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const progress = ((step + (canAdvance ? 1 : 0)) / totalSteps) * 100;

  return (
    <section className="container py-12 md:py-16">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Etapa {step + 1} de {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="p-6 md:p-8 shadow-card border-border/60">
          {isPhq9Step ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-primary mb-3">
                  PHQ-9 · Pergunta {step + 1}
                </p>
                <h2 className="font-display text-xl md:text-2xl font-semibold leading-snug">
                  Nas últimas 2 semanas, com que frequência você foi incomodado(a) por:
                </h2>
                <p className="text-lg text-foreground/90 mt-3">
                  {phq9Questions[step]}
                </p>
              </div>

              <div className="space-y-2">
                {phq9Options.map((opt) => {
                  const selected = currentPhqAnswer === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handlePhq9(opt.value)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-smooth ${
                        selected
                          ? "border-primary bg-primary/5 shadow-soft"
                          : "border-border hover:border-primary/40 hover:bg-muted/40"
                      }`}
                    >
                      <span className="font-medium">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : isFunctionalStep ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-primary mb-3">
                  PHQ-9 · Impacto funcional
                </p>
                <h2 className="font-display text-xl md:text-2xl font-semibold leading-snug">
                  {functionalImpactQuestion}
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Esta pergunta faz parte do PHQ-9 oficial e avalia o critério
                  de prejuízo funcional (DSM-5).
                </p>
              </div>

              <div className="space-y-2">
                {functionalImpactOptions.map((opt) => {
                  const selected = functionalImpact === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setFunctionalImpact(opt.value)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-smooth ${
                        selected
                          ? "border-primary bg-primary/5 shadow-soft"
                          : "border-border hover:border-primary/40 hover:bg-muted/40"
                      }`}
                    >
                      <span className="font-medium">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">
                  Checklist · 10 sintomas (DSM-5 / CID-11)
                </p>
                <h2 className="font-display text-xl md:text-2xl font-semibold leading-snug">
                  Quais destes sintomas você tem sentido nas últimas 2 semanas?
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Marque todos que se aplicam. Não há resposta certa ou errada.
                </p>
              </div>

              <div className="space-y-2">
                {tenSymptoms.map((s) => {
                  const checked = symptoms.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSymptom(s.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-smooth ${
                        checked
                          ? "border-accent bg-accent/5"
                          : "border-border hover:border-accent/40 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-smooth ${
                            checked ? "border-accent bg-accent text-accent-foreground" : "border-border"
                          }`}
                        >
                          {checked && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-medium leading-snug">{s.title}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{s.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {isChecklistStep && <EmergencyBanner />}

        <div className="flex justify-between gap-3">
          <Button variant="outline" onClick={handleBack} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canAdvance}
            className="bg-gradient-hero text-primary-foreground hover:opacity-90 transition-smooth"
          >
            {step === totalSteps - 1 ? "Ver resultado" : "Próxima"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};
