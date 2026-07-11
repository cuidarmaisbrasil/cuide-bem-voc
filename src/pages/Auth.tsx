import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const wmCompanyId = params.get("wm");
  const prefilledEmail = params.get("email") ?? "";
  const { user, loading } = useAuth();
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = wmCompanyId
      ? "Criar conta de gestor de ondas — Cuidar+"
      : "Entrar — Cuidar+";
  }, [wmCompanyId]);

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      if (wmCompanyId) {
        // Claim wave manager link
        const { data, error } = await supabase.functions.invoke("wave-manager-claim", {
          body: { company_id: wmCompanyId },
        });
        if (error || (data as any)?.error) {
          toast.error((data as any)?.error ?? error?.message ?? "Falha ao vincular");
        } else {
          toast.success("Conta vinculada à empresa!");
        }
        navigate("/trabalho/ondas");
      } else {
        navigate("/admin");
      }
    })();
  }, [user, loading, wmCompanyId, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const redirect = wmCompanyId
      ? `${window.location.origin}/auth?wm=${wmCompanyId}&email=${encodeURIComponent(email)}`
      : `${window.location.origin}/admin`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirect },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Conta criada. Verifique seu email para confirmar.");
  };

  const isWaveManagerFlow = Boolean(wmCompanyId);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-6 shadow-card">
        <h1 className="font-display text-2xl font-semibold text-center mb-1">
          {isWaveManagerFlow ? "Gestor de ondas" : "Cuidar+ Admin"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {isWaveManagerFlow
            ? "Crie sua conta com o e-mail cadastrado pela empresa para gerenciar as ondas de bem-estar."
            : "Acesso restrito ao administrador da plataforma"}
        </p>
        <Tabs defaultValue={isWaveManagerFlow ? "signup" : "signin"}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar conta</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-3 pt-4">
              <div>
                <Label htmlFor="email-in">Email</Label>
                <Input id="email-in" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pw-in">Senha</Label>
                <Input id="pw-in" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-3 pt-4">
              <div>
                <Label htmlFor="email-up">Email</Label>
                <Input id="email-up" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pw-up">Senha</Label>
                <Input id="pw-up" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Criando..." : "Criar conta"}
              </Button>
              {!isWaveManagerFlow && (
                <p className="text-xs text-muted-foreground">
                  Após criar a conta, peça ao administrador para conceder o papel <code>admin</code>.
                </p>
              )}
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </main>
  );
};

export default Auth;
