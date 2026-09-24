import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/SiteHeader";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const isRecovery = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";

  useEffect(() => { document.title = "Redefinir senha — Cuidar+ Trabalho"; }, []);

  async function updatePassword(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8) return toast.error("Use uma senha com pelo menos 8 caracteres.");
    if (password !== confirm) return toast.error("As senhas não coincidem.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error("O link expirou ou não é válido. Solicite um novo.");
    toast.success("Senha atualizada com sucesso.");
    navigate("/trabalho/login", { replace: true });
  }

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader variant="trabalho" />
      <div className="container grid place-items-center py-16">
        <Card className="w-full max-w-md p-6 space-y-5">
          <div className="text-center"><KeyRound className="mx-auto mb-3 h-8 w-8 text-primary" /><h1 className="font-display text-2xl font-semibold">Crie uma nova senha</h1></div>
          {!isRecovery ? (
            <div className="space-y-4 text-center"><p className="text-sm text-muted-foreground">Abra esta página pelo link enviado ao seu e-mail.</p><Button asChild variant="outline"><Link to="/trabalho/login">Voltar ao acesso</Link></Button></div>
          ) : (
            <form onSubmit={updatePassword} className="space-y-4">
              <div className="space-y-1.5"><Label htmlFor="new-password">Nova senha</Label><div className="relative"><Input id="new-password" type={show ? "text" : "password"} minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /><Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" onClick={() => setShow((value) => !value)} aria-label={show ? "Ocultar senha" : "Mostrar senha"}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div></div>
              <div className="space-y-1.5"><Label htmlFor="confirm-password">Confirmar nova senha</Label><Input id="confirm-password" type={show ? "text" : "password"} minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Atualizando…" : "Atualizar senha"}</Button>
            </form>
          )}
        </Card>
      </div>
    </main>
  );
}