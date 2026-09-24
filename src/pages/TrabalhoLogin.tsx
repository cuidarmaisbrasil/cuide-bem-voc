import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { toast } from "sonner";

export default function TrabalhoLogin() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  useEffect(() => {
    document.title = "Acesso da empresa — Cuidar+ Trabalho";
  }, []);

  useEffect(() => {
    if (loading || !user) return;
    void (async () => {
      const [ownerResult, managerResult] = await Promise.all([
        supabase.from("companies").select("id").eq("owner_user_id", user.id).maybeSingle(),
        supabase.from("company_wave_managers").select("company_id").eq("user_id", user.id).limit(1),
      ]);
      navigate(ownerResult.data ? "/trabalho/painel" : managerResult.data?.length ? "/trabalho/ondas" : "/trabalho/painel", { replace: true });
    })();
  }, [user, loading, navigate]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) toast.error("E-mail ou senha inválidos.");
  }

  async function requestReset() {
    if (!email.trim()) return toast.error("Informe seu e-mail para recuperar a senha.");
    setResetBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetBusy(false);
    if (error) return toast.error("Não foi possível enviar o e-mail agora.");
    toast.success("Se o e-mail estiver cadastrado, você receberá as instruções.");
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <SiteHeader variant="trabalho" />
      <section className="container flex-1 grid place-items-center py-10 sm:py-16">
        <Card className="w-full max-w-md p-5 sm:p-7 border-border/70 shadow-card">
          <div className="mb-6 text-center">
            <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-lg bg-secondary text-secondary-foreground">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <h1 className="font-display text-2xl font-semibold">Acesso da empresa</h1>
            <p className="mt-1 text-sm text-muted-foreground">Entre para acompanhar ciclos, documentos e relatórios.</p>
          </div>
          <form onSubmit={signIn} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="company-email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="company-email" className="pl-9" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-password">Senha</Label>
              <div className="relative">
                <Input id="company-password" className="pr-10" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Entrando…" : "Entrar no painel"}</Button>
            <Button type="button" variant="link" className="w-full" disabled={resetBusy} onClick={requestReset}>{resetBusy ? "Enviando…" : "Esqueci minha senha"}</Button>
          </form>
          <div className="mt-5 border-t border-border/60 pt-4 text-center text-sm text-muted-foreground">
            Ainda não tem cadastro? <Link to="/trabalho#cadastro" className="font-medium text-primary hover:underline">Cadastrar empresa</Link>
          </div>
          <Button asChild variant="outline" className="mt-3 w-full"><Link to="/trabalho/painel/previa">Ver prévia do painel</Link></Button>
        </Card>
      </section>
      <SiteFooter variant="trabalho" />
    </main>
  );
}