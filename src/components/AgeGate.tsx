import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ShieldCheck } from "lucide-react";

interface AgeGateProps {
  onConfirm: (age: number) => void;
  onCancel: () => void;
}

export const AgeGate = ({ onConfirm, onCancel }: AgeGateProps) => {
  const [age, setAge] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    const n = parseInt(age, 10);
    if (!Number.isFinite(n) || n < 1 || n > 120) {
      setError("Informe uma idade válida.");
      return;
    }
    if (n < 18) {
      setError(
        "Este teste foi validado apenas para adultos (≥18 anos). Para adolescentes existem instrumentos específicos (PHQ-A). Procure um profissional ou ligue 188 (CVV)."
      );
      return;
    }
    onConfirm(n);
  };

  return (
    <section className="container py-12 md:py-16">
      <div className="mx-auto max-w-xl">
        <Card className="p-6 md:p-8 shadow-card border-border/60 space-y-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-hero flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display text-xl md:text-2xl font-semibold">
                Antes de começar
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                O PHQ-9 é validado cientificamente para adultos. Por favor,
                confirme sua idade.
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="age" className="text-sm">
              Sua idade
            </Label>
            <Input
              id="age"
              type="number"
              min={1}
              max={120}
              inputMode="numeric"
              placeholder="Ex: 28"
              value={age}
              onChange={(e) => {
                setAge(e.target.value.slice(0, 3));
                setError(null);
              }}
              className="mt-1"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
            <Button variant="outline" onClick={onCancel}>
              Voltar
            </Button>
            <Button
              onClick={handleConfirm}
              className="bg-gradient-hero text-primary-foreground hover:opacity-90 transition-smooth"
            >
              Continuar para o teste
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Sua idade é usada para validar a elegibilidade do instrumento e,
            de forma anônima, para estatísticas agregadas por faixa etária.
          </p>
        </Card>
      </div>
    </section>
  );
};
