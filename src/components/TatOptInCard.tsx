import { useState } from "react";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const emailSchema = z
  .string()
  .trim()
  .email({ message: "E-mail inválido" })
  .max(255, { message: "E-mail muito longo" });

export const TatOptInCard = ({
  phq9Score,
  symptomCount,
  severityLevel,
  age,
}: TatOptInCardProps) => {
  const { toast } = useToast();
  const [accepted, setAccepted] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
    const { error } = await supabase.from("tat_public_requests").insert({
      email: parsed.data,
      phq9_score: phq9Score,
      symptom_count: symptomCount,
      severity_level: severityLevel,
      age: age ?? null,
    });
    setLoading(false);

    if (error) {
      toast({
        title: "Não foi possível registrar",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
      return;
    }

    track({
      type: "click",
      payload: {
        link_type: "platform",
        target_id: "tat-optin-submit",
        target_label: "Solicitar TAT",
      },
    });
    setDone(true);
  };

  if (done) {
    return (
      <Card className="p-6 border-success/40 bg-success/5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />
          <div>
            <h3 className="font-display text-lg font-semibold mb-1">
              Solicitação recebida
            </h3>
            <p className="text-sm text-foreground/80">
              Você receberá o teste TAT gratuitamente no e-mail informado em até{" "}
              <strong>48 horas</strong>. Verifique também a caixa de spam.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!accepted) {
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
              avaliação projetiva clássica que ajuda a compreender melhor seus
              sentimentos, conflitos e necessidades emocionais — um complemento
              qualitativo ao PHQ-9 e ao DSM-5.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => {
              track({
                type: "click",
                payload: {
                  link_type: "platform",
                  target_id: "tat-optin-accept",
                  target_label: "Aceitar TAT",
                },
              });
              setAccepted(true);
            }}
            className="flex-1"
          >
            Sim, quero receber
          </Button>
          <Button
            variant="outline"
            onClick={() => setDone(false)}
            className="sm:w-auto"
            type="button"
            asChild
          >
            <a
              href="#feedback"
              onClick={() =>
                track({
                  type: "click",
                  payload: {
                    link_type: "platform",
                    target_id: "tat-optin-decline",
                    target_label: "Recusar TAT",
                  },
                })
              }
            >
              Agora não
            </a>
          </Button>
        </div>
      </Card>
    );
  }

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
            Enviaremos a avaliação gratuita em até <strong>48 horas</strong>.
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
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
          Usamos seu e-mail apenas para enviar o TAT e dar continuidade ao seu
          rastreio. Você pode descadastrar-se a qualquer momento.
        </p>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando…
            </>
          ) : (
            "Solicitar TAT gratuito"
          )}
        </Button>
      </form>
    </Card>
  );
};
