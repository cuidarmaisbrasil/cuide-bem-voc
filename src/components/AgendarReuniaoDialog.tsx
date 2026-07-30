import { useEffect, useState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface EventType {
  name: string;
  duration: number;
  scheduling_url: string;
  description: string | null;
}

interface CalendlyInfo {
  scheduling_url: string;
  timezone: string;
  event_types: EventType[];
}

export const AGENDA_FALLBACK_URL = "https://calendly.com/comercial-cuidarmaisbrasil";

export function AgendarReuniaoDialog({
  label = "Agendar reunião",
  variant = "default",
  size = "default",
  className = "",
}: {
  label?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<CalendlyInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!open || info || loading) return;
    setLoading(true);
    supabase.functions
      .invoke("calendly-event-types")
      .then(({ data, error }) => {
        if (error || (data as any)?.error) {
          setInfo({ scheduling_url: AGENDA_FALLBACK_URL, timezone: "America/Sao_Paulo", event_types: [] });
          setSelected(AGENDA_FALLBACK_URL);
          return;
        }
        const d = data as CalendlyInfo;
        setInfo(d);
        setSelected(d.event_types[0]?.scheduling_url ?? d.scheduling_url);
      })
      .finally(() => setLoading(false));
  }, [open, info, loading]);

  const embedUrl = selected
    ? `${selected}?hide_gdpr_banner=1&background_color=ffffff&primary_color=0f766e`
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <CalendarDays className="h-4 w-4 mr-2" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3">
          <DialogTitle className="font-display">Agendar uma conversa</DialogTitle>
          <DialogDescription>
            Escolha um horário livre com o time comercial do Cuidar+ Trabalho. Você recebe a confirmação e o link da
            reunião por e-mail.
          </DialogDescription>
        </DialogHeader>

        {info && info.event_types.length > 1 && (
          <div className="px-5 pb-3 flex flex-wrap gap-2">
            {info.event_types.map((e) => (
              <Button
                key={e.scheduling_url}
                size="sm"
                variant={selected === e.scheduling_url ? "default" : "outline"}
                onClick={() => setSelected(e.scheduling_url)}
              >
                {e.name} · {e.duration} min
              </Button>
            ))}
          </div>
        )}

        <div className="h-[620px] bg-muted/30">
          {loading || !embedUrl ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando agenda…
            </div>
          ) : (
            <iframe
              src={embedUrl}
              title="Agenda Cuidar+ Trabalho"
              className="w-full h-full border-0"
              loading="lazy"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
