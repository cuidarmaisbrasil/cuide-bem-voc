import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

type Wave = "phq9" | "ecig" | "copsoq" | "psicossocial";

interface Q { n: number; text: string; scale?: string; reverse?: boolean; response_set?: string }

const RESPONSE_SETS: Record<string, { value: number; label: string }[]> = {
  phq9_freq: [
    { value: 0, label: "Nenhuma vez" },
    { value: 1, label: "Vários dias" },
    { value: 2, label: "Mais da metade" },
    { value: 3, label: "Quase todos os dias" },
  ],
  phq9_impact: [
    { value: 0, label: "Nada difícil" },
    { value: 1, label: "Um pouco" },
    { value: 2, label: "Muito" },
    { value: 3, label: "Extremamente" },
  ],
  ecig_5: [
    { value: 1, label: "Nunca" },
    { value: 2, label: "Raramente" },
    { value: 3, label: "Às vezes" },
    { value: 4, label: "Frequentemente" },
    { value: 5, label: "Sempre" },
  ],
  copsoq_5_freq: [
    { value: 1, label: "Nunca" },
    { value: 2, label: "Raramente" },
    { value: 3, label: "Às vezes" },
    { value: 4, label: "Frequentemente" },
    { value: 5, label: "Sempre" },
  ],
  lipt_5: [
    { value: 0, label: "Nunca" },
    { value: 1, label: "Raramente" },
    { value: 2, label: "Algumas vezes/mês" },
    { value: 3, label: "Várias vezes/semana" },
    { value: 4, label: "Diariamente" },
  ],
};

const WAVE_TITLES: Record<Wave, string> = {
  phq9: "Como você tem se sentido (PHQ-9)",
  ecig: "Clima no seu grupo de trabalho (ECIG)",
  copsoq: "Bem-estar no trabalho (COPSOQ)",
  psicossocial: "Clima psicossocial / situações no trabalho (LIPT-60)",
};

const WellnessResponder = () => {
  const { token, wave } = useParams<{ token: string; wave: Wave }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<{ name: string } | null>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [step, setStep] = useState<"intro" | "form" | "done">("intro");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [latencies, setLatencies] = useState<Record<number, number>>({});
  const shownAtRef = useRef<Record<number, number>>({});
  const [demo, setDemo] = useState({ age_range: "", gender: "", department: "", tenure_range: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token || !wave) return;
    supabase.functions.invoke("wellness-resolve-token", { method: "GET" as any, body: undefined as any })
      .then(async () => {})
      .catch(() => {});
    // Use fetch directly to pass query params
    const base = import.meta.env.VITE_SUPABASE_URL;
    fetch(`${base}/functions/v1/wellness-resolve-token?token=${encodeURIComponent(token)}&wave=${wave}`, {
      headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        if (data.status === "completed") { setStep("done"); setCompany(data.company); return; }
        setCompany(data.company);
        setQuestions(data.questions || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, wave]);

  // Mark shownAt for each question lazily as it renders into view
  useEffect(() => {
    if (step !== "form") return;
    const now = Date.now();
    questions.forEach((q) => { if (!shownAtRef.current[q.n]) shownAtRef.current[q.n] = now; });
  }, [step, questions]);

  const answered = Object.keys(answers).length;
  const progress = questions.length ? Math.round((answered / questions.length) * 100) : 0;

  const onAnswer = (q: Q, value: number) => {
    const shown = shownAtRef.current[q.n] || Date.now();
    const lat = Math.max(0, Math.min(600000, Date.now() - shown));
    setAnswers((a) => ({ ...a, [q.n]: value }));
    setLatencies((l) => ({ ...l, [q.n]: lat }));
    // Reset shownAt so editing the answer also captures a new latency
    shownAtRef.current[q.n] = Date.now();
  };

  const submit = async () => {
    if (answered < questions.length) { toast.error("Responda todas as perguntas."); return; }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("wellness-submit", {
        body: { token, wave, answers, latencies_ms: latencies, demographics: demo },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      setStep("done");
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar");
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="container py-20 text-center text-muted-foreground">Carregando…</div>;
  if (error) return (
    <div className="container py-20 text-center">
      <h1 className="font-display text-xl mb-2">Link inválido</h1>
      <p className="text-sm text-muted-foreground">{error}</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="container max-w-2xl space-y-4">
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold">{company?.name}</h1>
          <p className="text-sm text-muted-foreground">{WAVE_TITLES[wave as Wave]}</p>
        </div>

        {step === "intro" && questions.length > 0 && (
          <Card className="p-6 space-y-4">
            <p className="text-sm">Suas respostas são <strong>anônimas</strong>. Sua empresa só verá dados agregados.</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Faixa etária</Label><Input placeholder="ex: 30-39" value={demo.age_range} onChange={(e) => setDemo({ ...demo, age_range: e.target.value })} /></div>
              <div><Label>Gênero</Label><Input value={demo.gender} onChange={(e) => setDemo({ ...demo, gender: e.target.value })} /></div>
              <div><Label>Departamento</Label><Input value={demo.department} onChange={(e) => setDemo({ ...demo, department: e.target.value })} /></div>
              <div><Label>Tempo de empresa</Label><Input placeholder="ex: 1-3 anos" value={demo.tenure_range} onChange={(e) => setDemo({ ...demo, tenure_range: e.target.value })} /></div>
            </div>
            <Button className="w-full" onClick={() => { setStep("form"); shownAtRef.current = {}; }}>
              Começar ({questions.length} perguntas)
            </Button>
          </Card>
        )}

        {step === "form" && (
          <>
            <div className="sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground text-center mt-1">{answered} / {questions.length}</p>
            </div>
            <div className="space-y-3">
              {questions.map((q) => {
                const opts = RESPONSE_SETS[q.response_set || "copsoq_5_freq"] || RESPONSE_SETS.copsoq_5_freq;
                return (
                  <Card key={q.n} className="p-4">
                    <p className="text-sm font-medium mb-3"><span className="text-muted-foreground mr-2">{q.n}.</span>{q.text}</p>
                    <div className={`grid gap-1`} style={{ gridTemplateColumns: `repeat(${opts.length}, minmax(0,1fr))` }}>
                      {opts.map((opt) => {
                        const selected = answers[q.n] === opt.value;
                        return (
                          <button key={opt.value} type="button" onClick={() => onAnswer(q, opt.value)}
                            className={`p-2 rounded-md border text-xs leading-tight transition-colors ${selected ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-accent"}`}>
                            <div className="font-mono font-semibold">{opt.value}</div>
                            <div className="text-[10px] mt-0.5">{opt.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
            <Button className="w-full" size="lg" onClick={submit} disabled={submitting || answered < questions.length}>
              {submitting ? "Enviando…" : `Enviar (${answered}/${questions.length})`}
            </Button>
          </>
        )}

        {step === "done" && (
          <Card className="p-8 text-center space-y-3">
            <div className="text-4xl">✓</div>
            <h2 className="font-display text-xl font-semibold">Obrigado pela colaboração</h2>
            <p className="text-sm text-muted-foreground">Sua resposta anônima foi registrada. Você receberá a próxima etapa por e-mail.</p>
          </Card>
        )}
      </div>
    </main>
  );
};

export default WellnessResponder;
