import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Wave = "phq9" | "ecig" | "copsoq" | "psicossocial";

interface Q { n: number; text: string; scale?: string; reverse?: boolean; response_set?: string }
interface TatImage { id: string; label: string; url: string; sort_order: number }

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

const TAT_LIMIT_MS = 10 * 60 * 1000;

const WellnessResponder = () => {
  const { token, wave } = useParams<{ token: string; wave: Wave }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<{ name: string } | null>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [step, setStep] = useState<"intro" | "tat" | "form" | "done">("intro");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [latencies, setLatencies] = useState<Record<number, number>>({});
  const shownAtRef = useRef<Record<number, number>>({});
  const [demo, setDemo] = useState({ age_range: "", gender: "", department: "", tenure_range: "" });
  const [submitting, setSubmitting] = useState(false);

  // Projective test (TAT for phq9 wave, Rorschach for ecig wave)
  const [tatImage, setTatImage] = useState<TatImage | null>(null);
  const [tatNarrative, setTatNarrative] = useState("");
  const [tatStartedAt, setTatStartedAt] = useState<number | null>(null);
  const [tatRemaining, setTatRemaining] = useState<number>(TAT_LIMIT_MS);
  const [tatSubmitting, setTatSubmitting] = useState(false);
  const tatAutoSubmittedRef = useRef(false);

  const isTatWave = wave === "phq9";
  const isRorschachWave = wave === "ecig";
  const hasProjective = isTatWave || isRorschachWave;
  const projectiveTable = isRorschachWave ? "rorschach_images" : "tat_images";
  const projectiveFn = isRorschachWave ? "rorschach-submit" : "tat-submit";

  useEffect(() => {
    if (!token || !wave) return;
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

  // Load a projective plate (random among active) for PHQ-9 (TAT) or ECIG (Rorschach)
  useEffect(() => {
    if (!hasProjective) return;
    supabase
      .from(projectiveTable as "tat_images" | "rorschach_images")
      .select("id,label,url,sort_order")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        const pick = data[Math.floor(Math.random() * data.length)];
        setTatImage(pick as TatImage);
      });
  }, [hasProjective, projectiveTable]);

  // TAT countdown
  useEffect(() => {
    if (step !== "tat" || !tatStartedAt) return;
    const id = window.setInterval(() => {
      const left = Math.max(0, TAT_LIMIT_MS - (Date.now() - tatStartedAt));
      setTatRemaining(left);
      if (left === 0 && !tatAutoSubmittedRef.current) {
        tatAutoSubmittedRef.current = true;
        submitTat(true);
      }
    }, 250);
    return () => window.clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, tatStartedAt]);

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
    shownAtRef.current[q.n] = Date.now();
  };

  const startFlow = () => {
    if (hasProjective && tatImage) {
      setTatStartedAt(Date.now());
      setTatRemaining(TAT_LIMIT_MS);
      setStep("tat");
    } else {
      setStep("form");
      shownAtRef.current = {};
    }
  };

  async function submitTat(auto = false) {
    if (tatSubmitting) return;
    const text = tatNarrative.trim();
    if (!auto && text.length < 10) {
      toast.error("Escreva pelo menos uma breve história (mín. 10 caracteres).");
      return;
    }
    setTatSubmitting(true);
    try {
      const time_ms = tatStartedAt ? Date.now() - tatStartedAt : 0;
      const { data, error } = await supabase.functions.invoke(projectiveFn, {
        body: {
          token,
          image_id: tatImage?.id ?? null,
          narrative: text || "(em branco — tempo esgotado)",
          time_ms,
          started_at: tatStartedAt ? new Date(tatStartedAt).toISOString() : null,
          demographics: demo,
        },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      setStep("form");
      shownAtRef.current = {};
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar TAT");
    } finally {
      setTatSubmitting(false);
    }
  }

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

  const mm = Math.floor(tatRemaining / 60000);
  const ss = Math.floor((tatRemaining % 60000) / 1000).toString().padStart(2, "0");
  const lowTime = tatRemaining <= 2 * 60 * 1000;

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
            {isTatWave && tatImage && (
              <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                Esta etapa inclui uma breve atividade narrativa (TAT) antes do questionário. Você terá até <strong>10 minutos</strong> para escrever.
              </div>
            )}
            <Button className="w-full" onClick={startFlow}>
              Começar{isTatWave && tatImage ? " (atividade + questionário)" : ` (${questions.length} perguntas)`}
            </Button>
          </Card>
        )}

        {step === "tat" && tatImage && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="font-display text-lg font-semibold">Atividade narrativa</h2>
                <p className="text-xs text-muted-foreground">Tempo total: 10 minutos · imagem única</p>
              </div>
              <div className={`font-mono text-lg px-3 py-1 rounded-md border ${lowTime ? "bg-red-50 border-red-300 text-red-700" : "bg-muted"}`}>
                {mm}:{ss}
              </div>
            </div>

            <div className="rounded-md overflow-hidden border bg-black/5 flex items-center justify-center">
              <img
                src={tatImage.url}
                alt={tatImage.label}
                className="max-h-80 w-auto object-contain"
                loading="eager"
              />
            </div>

            <div className="text-sm space-y-1">
              <p className="font-medium">Olhe a imagem e escreva uma história sobre ela:</p>
              <ul className="list-disc pl-5 text-muted-foreground text-xs space-y-0.5">
                <li>O que está acontecendo na cena?</li>
                <li>O que levou a essa situação?</li>
                <li>O que as pessoas estão pensando e sentindo?</li>
                <li>Como a história termina?</li>
              </ul>
              <p className="text-[11px] text-muted-foreground pt-1">Não há resposta certa ou errada. Escreva à vontade — você tem até 10 minutos.</p>
            </div>

            <Textarea
              rows={6}
              placeholder="Comece a sua história aqui…"
              value={tatNarrative}
              onChange={(e) => setTatNarrative(e.target.value)}
              className="resize-y"
            />

            <Button className="w-full" onClick={() => submitTat(false)} disabled={tatSubmitting}>
              {tatSubmitting ? "Enviando…" : "Concluir atividade e seguir para o questionário"}
            </Button>
          </Card>
        )}

        {step === "tat" && !tatImage && (
          <Card className="p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Atividade indisponível no momento. Seguindo para o questionário…</p>
            <Button onClick={() => { setStep("form"); shownAtRef.current = {}; }}>Continuar</Button>
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
