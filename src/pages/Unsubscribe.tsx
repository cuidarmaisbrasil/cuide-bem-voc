import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State =
  | { kind: "loading" }
  | { kind: "valid" }
  | { kind: "already" }
  | { kind: "invalid" }
  | { kind: "submitting" }
  | { kind: "done" }
  | { kind: "error"; message: string };

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ kind: "invalid" });
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${FUNCTION_URL}?token=${encodeURIComponent(token)}`, {
          headers: { apikey: ANON_KEY },
        });
        const data = await res.json();
        if (!res.ok) {
          setState({ kind: "invalid" });
          return;
        }
        if (data.valid === false && data.reason === "already_unsubscribed") {
          setState({ kind: "already" });
        } else if (data.valid === true) {
          setState({ kind: "valid" });
        } else {
          setState({ kind: "invalid" });
        }
      } catch {
        setState({ kind: "invalid" });
      }
    })();
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setState({ kind: "submitting" });
    const { data, error } = await supabase.functions.invoke(
      "handle-email-unsubscribe",
      { body: { token } },
    );
    if (error) {
      setState({ kind: "error", message: error.message });
      return;
    }
    if ((data as any)?.success || (data as any)?.reason === "already_unsubscribed") {
      setState({ kind: "done" });
    } else {
      setState({ kind: "error", message: "Não foi possível processar." });
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 shadow-soft border-border/60">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <span className="h-12 w-12 rounded-xl bg-gradient-hero flex items-center justify-center text-primary-foreground text-xl">
              ❤
            </span>
          </div>

          {state.kind === "loading" && (
            <>
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Validando link...</p>
            </>
          )}

          {state.kind === "valid" && (
            <>
              <h1 className="font-display text-2xl font-semibold">
                Cancelar lembretes por e-mail?
              </h1>
              <p className="text-sm text-muted-foreground">
                Você não receberá mais e-mails do Cuidar+ neste endereço.
              </p>
              <Button
                onClick={handleConfirm}
                className="w-full bg-gradient-hero text-primary-foreground hover:opacity-90"
              >
                Confirmar cancelamento
              </Button>
            </>
          )}

          {state.kind === "submitting" && (
            <>
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Processando...</p>
            </>
          )}

          {state.kind === "done" && (
            <>
              <CheckCircle2 className="h-10 w-10 mx-auto text-success" />
              <h1 className="font-display text-2xl font-semibold">
                Cancelamento confirmado
              </h1>
              <p className="text-sm text-muted-foreground">
                Você não receberá mais e-mails do Cuidar+.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/">Voltar ao Cuidar+</Link>
              </Button>
            </>
          )}

          {state.kind === "already" && (
            <>
              <CheckCircle2 className="h-10 w-10 mx-auto text-muted-foreground" />
              <h1 className="font-display text-2xl font-semibold">
                Você já cancelou
              </h1>
              <p className="text-sm text-muted-foreground">
                Este e-mail já foi removido da nossa lista de lembretes.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/">Voltar ao Cuidar+</Link>
              </Button>
            </>
          )}

          {state.kind === "invalid" && (
            <>
              <AlertCircle className="h-10 w-10 mx-auto text-destructive" />
              <h1 className="font-display text-2xl font-semibold">Link inválido</h1>
              <p className="text-sm text-muted-foreground">
                O link de cancelamento expirou ou não é válido.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/">Voltar ao Cuidar+</Link>
              </Button>
            </>
          )}

          {state.kind === "error" && (
            <>
              <AlertCircle className="h-10 w-10 mx-auto text-destructive" />
              <h1 className="font-display text-2xl font-semibold">
                Algo deu errado
              </h1>
              <p className="text-sm text-muted-foreground">{state.message}</p>
            </>
          )}
        </div>
      </Card>
    </main>
  );
};

export default Unsubscribe;
