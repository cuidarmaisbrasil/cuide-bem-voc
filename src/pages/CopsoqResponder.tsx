import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { getCopsoq, responseLabels, versionMeta, type CopsoqVersion } from "@/data/copsoq";

const CopsoqResponder = () => {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const version = (params.get("v") as CopsoqVersion) || "short";
  const questions = useMemo(() => getCopsoq(version), [version]);

  const [company, setCompany] = useState<{ id: string; name: string; allowed_versions: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"intro" | "form" | "done">("intro");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [demo, setDemo] = useState({ age_range: "", gender: "", department: "", tenure_range: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase.from("companies").select("id, name, allowed_versions, status").eq("slug", slug).maybeSingle()
      .then(({ data }) => { setCompany(data && data.status === "approved" ? data as any : null); setLoading(false); });
  }, [slug]);

  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / questions.length) * 100);

  const submit = async () => {
    if (answered < questions.length) { toast.error("Responda todas as perguntas."); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("submit-copsoq", {
        body: {
          slug, version, answers,
          questions: questions.map((q) => ({ n: q.n, scale: q.scale, reverse: q.reverse })),
          demographics: demo,
        },
      });
      if (error) throw error;
      setStep("done");
    } catch (e: any) { toast.error(e.message || "Erro ao enviar."); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="container py-20 text-center text-muted-foreground">Carregando…</div>;
  if (!company) return <div className="container py-20 text-center"><h1 className="font-display text-xl mb-2">Link inválido</h1><p className="text-sm text-muted-foreground">Empresa não encontrada ou não aprovada.</p></div>;

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="container max-w-2xl space-y-4">
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold">{company.name}</h1>
          <p className="text-sm text-muted-foreground">Questionário COPSOQ II — versão {versionMeta[version].label} · {versionMeta[version].minutes}</p>
        </div>

        {step === "intro" && (
          <Card className="p-6 space-y-4">
            <p className="text-sm">Suas respostas são <strong>anônimas</strong>. A empresa só verá dados agregados.</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Faixa etária</Label><Input placeholder="ex: 30-39" value={demo.age_range} onChange={(e) => setDemo({ ...demo, age_range: e.target.value })} /></div>
              <div><Label>Gênero</Label><Input value={demo.gender} onChange={(e) => setDemo({ ...demo, gender: e.target.value })} /></div>
              <div><Label>Departamento</Label><Input value={demo.department} onChange={(e) => setDemo({ ...demo, department: e.target.value })} /></div>
              <div><Label>Tempo de empresa</Label><Input placeholder="ex: 1-3 anos" value={demo.tenure_range} onChange={(e) => setDemo({ ...demo, tenure_range: e.target.value })} /></div>
            </div>
            <Button className="w-full" onClick={() => setStep("form")}>Começar ({questions.length} perguntas)</Button>
          </Card>
        )}

        {step === "form" && (
          <>
            <div className="sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground text-center mt-1">{answered} / {questions.length}</p>
            </div>
            <div className="space-y-3">
              {questions.map((q) => (
                <Card key={q.n} className="p-4">
                  <p className="text-sm font-medium mb-3"><span className="text-muted-foreground mr-2">{q.n}.</span>{q.text}</p>
                  <div className="grid grid-cols-5 gap-1">
                    {responseLabels[q.responseSet].map((label, idx) => {
                      const value = idx + 1;
                      const selected = answers[q.n] === value;
                      return (
                        <button key={value} type="button"
                          onClick={() => setAnswers({ ...answers, [q.n]: value })}
                          className={`p-2 rounded-md border text-xs leading-tight transition-colors ${selected ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-accent"}`}>
                          <div className="font-mono font-semibold">{value}</div>
                          <div className="text-[10px] mt-0.5">{label}</div>
                        </button>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
            <Button className="w-full" size="lg" onClick={submit} disabled={submitting || answered < questions.length}>
              {submitting ? "Enviando…" : `Enviar respostas (${answered}/${questions.length})`}
            </Button>
          </>
        )}

        {step === "done" && (
          <Card className="p-8 text-center space-y-3">
            <div className="text-4xl">✓</div>
            <h2 className="font-display text-xl font-semibold">Obrigado pela colaboração</h2>
            <p className="text-sm text-muted-foreground">Sua resposta anônima foi registrada.</p>
          </Card>
        )}
      </div>
    </main>
  );
};

export default CopsoqResponder;
