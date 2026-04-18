import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquareHeart, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const MAX = 140;

const schema = z.object({
  message: z.string().trim().min(1, "Escreva algo").max(MAX, `Máximo de ${MAX} caracteres`),
});

interface FeedbackFormProps {
  severity?: string;
  score?: number;
}

export const FeedbackForm = ({ severity, score }: FeedbackFormProps) => {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const remaining = MAX - message.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ message });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("feedback").insert({
      message: parsed.data.message,
      severity: severity ?? null,
      score: score ?? null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Não foi possível enviar agora. Tente novamente.");
      return;
    }
    setSent(true);
    toast.success("Obrigado pelo seu feedback!");
  }

  if (sent) {
    return (
      <Card className="p-5 border-success/30 bg-success/5 shadow-card">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
          <div>
            <h3 className="font-display font-semibold mb-1">Feedback enviado</h3>
            <p className="text-sm text-muted-foreground">
              Sua opinião ajuda a melhorar o Cuidar+ para outras pessoas. Obrigado.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 md:p-6 shadow-card border-border/60">
      <div className="flex items-start gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <MessageSquareHeart className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold">Deixe seu feedback</h3>
          <p className="text-sm text-muted-foreground">
            Em até 140 caracteres, conte como foi sua experiência com a avaliação.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX))}
          maxLength={MAX}
          rows={3}
          placeholder="O que achou? Ajudou? O que poderia melhorar?"
          className="resize-none"
        />
        <div className="flex items-center justify-between gap-3">
          <span
            className={`text-xs ${
              remaining < 20 ? "text-warning-foreground" : "text-muted-foreground"
            }`}
          >
            {remaining} caracteres restantes
          </span>
          <Button type="submit" disabled={submitting || message.trim().length === 0}>
            {submitting ? "Enviando..." : "Enviar feedback"}
          </Button>
        </div>
      </form>
    </Card>
  );
};
