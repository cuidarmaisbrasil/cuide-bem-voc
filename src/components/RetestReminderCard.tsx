import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarClock, CheckCircle2 } from "lucide-react";

interface Props {
  severity: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const RetestReminderCard = ({ severity }: Props) => {
  const [wantsReminder, setWantsReminder] = useState<null | boolean>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!EMAIL_REGEX.test(trimmed) || trimmed.length > 254) {
      setError("Por favor, verifique se o e-mail está correto.");
      return;
    }
    setLoading(true);
    const { error: invokeError } = await supabase.functions.invoke(
      "schedule-retest-reminder",
      { body: { email: trimmed, severity } },
    );
    setLoading(false);
    if (invokeError) {
      setError("Não foi possível agendar o lembrete. Tente novamente em instantes.");
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <Card className="p-5 border-success/40 bg-success/5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-foreground">Lembrete agendado!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Em 15 dias enviaremos um e-mail para <strong>{email}</strong> sugerindo
              que você refaça a avaliação.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (wantsReminder === null) {
    return (
      <Card className="p-5 border-primary/30 bg-primary/5">
        <div className="flex items-start gap-3 mb-3">
          <CalendarClock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-foreground">
              Quer um lembrete em 15 dias?
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Acompanhar a evolução é importante. Podemos enviar um e-mail
              sugerindo que você refaça este teste em duas semanas.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => setWantsReminder(true)}
            className="bg-gradient-hero text-primary-foreground hover:opacity-90"
          >
            Sim, quero ser avisado
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setWantsReminder(false)}
          >
            Agora não
          </Button>
        </div>
      </Card>
    );
  }

  if (wantsReminder === false) return null;

  return (
    <Card className="p-5 border-primary/30 bg-primary/5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="reminder-email" className="text-sm font-medium">
            Seu e-mail
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            Confira com atenção — enviaremos o lembrete só para este endereço.
          </p>
          <Input
            id="reminder-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button
            type="submit"
            size="sm"
            disabled={loading}
            className="bg-gradient-hero text-primary-foreground hover:opacity-90"
          >
            {loading ? "Agendando..." : "Agendar lembrete"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setWantsReminder(null)}
            disabled={loading}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
};
