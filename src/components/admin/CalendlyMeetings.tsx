import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CalendarDays, RefreshCw, Video, ExternalLink } from "lucide-react";

interface Invitee {
  name: string | null;
  email: string | null;
  status: string | null;
  cancel_url?: string | null;
  reschedule_url?: string | null;
}
interface Ev {
  uri: string;
  name: string;
  status: string;
  start_time: string;
  end_time: string;
  location: string | null;
  invitees: Invitee[];
}

export const CalendlyMeetings = () => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("active");
  const [events, setEvents] = useState<Ev[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [schedulingUrl, setSchedulingUrl] = useState<string | null>(null);

  async function load(s = status) {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.functions.invoke("calendly-scheduled-events", {
      body: { status: s },
    });
    setLoading(false);
    if (error || (data as any)?.error) {
      setError((data as any)?.details || (data as any)?.error || error?.message || "Falha ao carregar agenda");
      return;
    }
    setEvents((data as any).events ?? []);
    setSchedulingUrl((data as any).scheduling_url ?? null);
  }

  useEffect(() => { void load("active"); /* eslint-disable-next-line */ }, []);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <CalendarDays className="h-4 w-4" />
        <h3 className="font-medium">Reuniões agendadas (Calendly)</h3>
        <div className="ml-auto flex items-center gap-2">
          <Select value={status} onValueChange={(v) => { setStatus(v); void load(v); }}>
            <SelectTrigger className="h-8 w-[150px] text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="canceled">Canceladas</SelectItem>
              <SelectItem value="all">Todas</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {schedulingUrl && (
        <a href={schedulingUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
          <ExternalLink className="h-3 w-3" /> {schedulingUrl}
        </a>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && !error && events.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma reunião nesse filtro.</p>
      )}

      <div className="space-y-2">
        {events.map((e) => (
          <div key={e.uri} className="rounded border border-border/60 p-3 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{e.name}</span>
              <Badge variant={e.status === "active" ? "default" : "secondary"}>{e.status}</Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                {fmt(e.start_time)} → {new Date(e.end_time).toLocaleTimeString("pt-BR", { timeStyle: "short" })}
              </span>
            </div>
            {e.invitees.map((i, idx) => (
              <div key={idx} className="text-xs text-muted-foreground">
                {i.name} · {i.email} {i.status ? `· ${i.status}` : ""}
              </div>
            ))}
            {e.location && (
              <a href={e.location} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                <Video className="h-3 w-3" /> {e.location}
              </a>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
