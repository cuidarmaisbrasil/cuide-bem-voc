import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Brain, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { track } from "@/lib/tracking";

interface TatOptInCardProps {
  phq9Score: number;
  symptomCount: number;
  severityLevel: string;
  age?: number | null;
}

interface TatImage {
  id: string;
  label: string;
  url: string;
}

type Step = "ask" | "test" | "email" | "done";

const TAT_LIMIT_MS = 10 * 60 * 1000;

const emailSchema = z
  .string()
  .trim()
  .email({ message: "E-mail inválido" })
  .max(255, { message: "E-mail muito longo" });

const countWords = (s: string) =>
  s.trim().length === 0 ? 0 : s.trim().split(/\s+/).length;

export const TatOptInCard = ({
  phq9Score,
  symptomCount,
  severityLevel,
  age,
}: TatOptInCardProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("ask");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // TAT state
  const [image, setImage] = useState<TatImage | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [narrative, setNarrative] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number>(TAT_LIMIT_MS);
  const autoSubmittedRef = useRef(false);

  // Load image when user accepts
  const handleAccept = async () => {
    track({
      type: "click",
      payload: {
        link_type: "platform",
        target_id: "tat-optin-accept",
        target_label: "Aceitar TAT",
      },
    });
    setImageLoading(true);
    const { data, error } = await supabase
      .from("tat_images")
      .select("id,label,url")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    setImageLoading(false);
    if (error || !data || data.length === 0) {
      toast({
        title: "Indisponível no momento",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
      return;
    }
    const pick = data[Math.floor(Math.random() * data.length)] as TatImage;
    setImage(pick);
    setStartedAt(Date.now());
    setRemaining(TAT_LIMIT_MS);
    setStep("test");
  };

  // Timer
  useEffect(() => {
    if (step !== "test" || !startedAt) return;
    const id = window.setInterval(() => {
      const left = Math.max(0, TAT_LIMIT_MS - (Date.now() - startedAt));
      setRemaining(left);
      if (left === 0 && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        setStep("email");
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [step, startedAt]);

  const handleGoToEmail = () => {
    if (narrative.trim().length < 10) {
      toast({
        title: "Escreva um pouco mais",
        description: "Conte brevemente a história (mín. 10 caracteres).",
        variant: "destructive",
      });
      return;
    }
    setStep("email");
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast({
        title: "E-mail inválido",
        description: parsed.error.issues[0]?.message ?? "Verifique seu e-mail.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { data: reqRow, error: reqErr } = await supabase
      .from("tat_public_requests")
      .insert({
        email: parsed.data,
        phq9_score: phq9Score,
        symptom_count: symptomCount,
        severity_level: severityLevel,
        age: age ?? null,
        status: "submitted",
      })
      .select("id")
      .single();

    if (reqErr || !reqRow) {
      setLoading(false);
      toast({
        title: "Não foi possível registrar",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
      return;
    }

    const text = narrative.trim() || "(em branco — tempo esgotado)";
    const time_ms = startedAt ? Date.now() - startedAt : 0;
    const { error: respErr } = await supabase
      .from("tat_public_responses")
      .insert({
        request_id: reqRow.id,
        image_id: image?.id ?? null,
        narrative: text,
        time_ms,
        word_count: countWords(text),
        user_agent:
          typeof navigator !== "undefined" ? navigator.userAgent : null,
        status: "submitted",
      });
    setLoading(false);

    if (respErr) {
      toast({
        title: "Erro ao salvar resposta",
        description: "Sua solicitação foi registrada, mas houve problema ao salvar a narrativa.",
        variant: "destructive",
      });
      return;
    }

    track({
      type: "click",
      payload: {
        link_type: "platform",
        target_id: "tat-optin-submit",
        target_label: "TAT enviado",
      },
    });
    setStep("done");
  };

  if (step === "done") {
    return (
      <Card className="p-6 border-success/40 bg-success/5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />
          <div>
            <h3 className="font-display text-lg font-semibold mb-1">
              Resposta enviada
            </h3>
            <p className="text-sm text-foreground/80">
              Sua avaliação será feita por um analista habilitado e enviada
              gratuitamente ao e-mail informado em até <strong>48 horas</strong>.
              Verifique também a caixa de spam.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (step === "ask") {
    return (
      <Card className="p-6 border-primary/30 bg-primary/5">
        <div className="flex items-start gap-3 mb-4">
          <Brain className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <Badge variant="outline" className="mb-2 bg-background">
              Avaliação complementar gratuita
            </Badge>
            <h3 className="font-display text-lg font-semibold mb-1">
              Quer aprofundar seu rastreio?
            </h3>
            <p className="text-sm text-foreground/80">
              O <strong>TAT (Teste de Apercepção Temática)</strong> é uma
              avaliação projetiva clássica. Você verá uma imagem e terá até{" "}
              <strong>10 minutos</strong> para escrever uma breve história
              sobre ela. Em seguida, informará seu e-mail para receber a
              avaliação por um analista habilitado.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleAccept} disabled={imageLoading} className="flex-1">
            {imageLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Carregando…
              </>
            ) : (
              "Sim, quero fazer"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              track({
                type: "click",
                payload: {
                  link_type: "platform",
                  target_id: "tat-optin-decline",
                  target_label: "Recusar TAT",
                },
              });
              setStep("done");
              // overwrite done view to a soft dismissal
              setEmail("dismissed");
            }}
            className="sm:w-auto"
            type="button"
          >
            Não, obrigado
          </Button>
        </div>
      </Card>
    );
  }

  if (step === "test" && image) {
    const mm = Math.floor(remaining / 60000);
    const ss = Math.floor((remaining % 60000) / 1000)
      .toString()
      .padStart(2, "0");
    const lowTime = remaining <= 2 * 60 * 1000;

    return (
      <Card className="p-6 border-primary/30 bg-primary/5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-display text-lg font-semibold">
              Atividade narrativa (TAT)
            </h3>
            <p className="text-xs text-muted-foreground">
              Olhe a imagem e escreva uma história. Tempo: 10 minutos.
            </p>
          </div>
          <div
            className={`font-mono text-base px-2.5 py-1 rounded-md border ${
              lowTime
                ? "bg-red-50 border-red-300 text-red-700"
                : "bg-background"
            }`}
          >
            <Clock className="h-3.5 w-3.5 inline mr-1 -mt-0.5" />
            {mm}:{ss}
          </div>
        </div>

        <div className="rounded-md overflow-hidden border bg-black/5 flex items-center justify-center">
          <img
            src={image.url}
            alt={image.label}
            className="max-h-72 w-auto object-contain"
            loading="eager"
          />
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground/80">Considere:</p>
          <ul className="list-disc pl-5 space-y-0.5">
            <li>O que está acontecendo na cena?</li>
            <li>O que levou a essa situação?</li>
            <li>O que as pessoas pensam e sentem?</li>
            <li>Como a história termina?</li>
          </ul>
        </div>

        <Textarea
          rows={6}
          placeholder="Comece a sua história aqui…"
          value={narrative}
          onChange={(e) => setNarrative(e.target.value.slice(0, 20000))}
          className="resize-y"
        />

        <Button onClick={handleGoToEmail} className="w-full">
          Enviar resposta
        </Button>
      </Card>
    );
  }

  // email step
  return (
    <Card className="p-6 border-primary/30 bg-primary/5">
      <div className="flex items-start gap-3 mb-4">
        <Brain className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div>
          <h3 className="font-display text-lg font-semibold mb-1">
            Informe seu e-mail
          </h3>
          <p className="text-sm text-foreground/80 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Sua avaliação gratuita, feita por analista habilitado, será enviada
            em até <strong>48 horas</strong>.
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmitEmail} className="space-y-3">
        <div>
          <Label htmlFor="tat-email" className="text-xs">
            E-mail
          </Label>
          <Input
            id="tat-email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value.slice(0, 255))}
            maxLength={255}
            required
            autoComplete="email"
          />
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Usamos seu e-mail apenas para enviar a avaliação do TAT. Você pode
          descadastrar-se a qualquer momento.
        </p>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando…
            </>
          ) : (
            "Confirmar e solicitar avaliação"
          )}
        </Button>
      </form>
    </Card>
  );
};
