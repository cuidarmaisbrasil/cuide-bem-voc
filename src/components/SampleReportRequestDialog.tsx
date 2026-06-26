import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().email("E-mail inválido").max(255),
  company: z.string().trim().min(2, "Informe a empresa").max(160),
  role: z.string().trim().min(2, "Informe o cargo").max(120),
  age: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || (/^\d+$/.test(v) && +v > 0 && +v < 120), {
      message: "Idade inválida",
    }),
  phone: z.string().trim().min(8, "Telefone inválido").max(40),
});

interface Props {
  trigger?: React.ReactNode;
  className?: string;
}

export const SampleReportRequestDialog = ({ trigger, className }: Props) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    age: "",
    phone: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({
        title: "Verifique os dados",
        description: parsed.error.errors[0]?.message ?? "Campos inválidos",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("sample_report_leads").insert({
      name: form.name || null,
      email: form.email.toLowerCase(),
      company: form.company,
      role: form.role,
      age: form.age ? parseInt(form.age, 10) : null,
      phone: form.phone,
      user_agent: navigator.userAgent.slice(0, 500),
      referrer: document.referrer?.slice(0, 500) || null,
    });
    setLoading(false);
    if (error) {
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    try {
      sessionStorage.setItem("sample_report_unlock", "1");
      sessionStorage.setItem("sample_report_lead_email", form.email);
    } catch {}
    setOpen(false);
    toast({ title: "Pronto!", description: "Liberando a amostra do relatório…" });
    navigate("/trabalho/amostra-relatorio");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className={
              className ??
              "inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
            }
          >
            <FileText className="h-4 w-4" />
            Peça uma amostra do nosso relatório
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Amostra do relatório Cuidar+ Trabalho</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para liberar a visualização da amostra completa em PDF.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="srl-name">Nome</Label>
            <Input
              id="srl-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={120}
            />
          </div>
          <div>
            <Label htmlFor="srl-email">E-mail *</Label>
            <Input
              id="srl-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              maxLength={255}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="srl-company">Empresa *</Label>
              <Input
                id="srl-company"
                required
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                maxLength={160}
              />
            </div>
            <div>
              <Label htmlFor="srl-role">Cargo *</Label>
              <Input
                id="srl-role"
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                maxLength={120}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="srl-age">Idade</Label>
              <Input
                id="srl-age"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value.replace(/\D/g, "") })}
                maxLength={3}
              />
            </div>
            <div>
              <Label htmlFor="srl-phone">Telefone *</Label>
              <Input
                id="srl-phone"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                maxLength={40}
                placeholder="(11) 90000-0000"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Ao enviar você concorda com nossos{" "}
            <a href="/trabalho/termos" className="underline" target="_blank" rel="noreferrer">
              Termos
            </a>{" "}
            e a{" "}
            <a href="/privacidade" className="underline" target="_blank" rel="noreferrer">
              Política de Privacidade
            </a>
            .
          </p>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
              </>
            ) : (
              "Liberar amostra"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
