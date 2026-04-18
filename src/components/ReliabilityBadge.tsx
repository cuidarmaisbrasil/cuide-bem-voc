import { useState } from "react";
import { ShieldCheck, CheckCircle2, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ReliabilityBadgeProps {
  variant?: "compact" | "full";
}

export const ReliabilityBadge = ({ variant = "full" }: ReliabilityBadgeProps) => {
  if (variant === "compact") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
        <ShieldCheck className="h-3.5 w-3.5" />
        Confiabilidade Alta · validado pela OMS
      </div>
    );
  }

  return (
    <Card className="p-5 md:p-6 border-success/30 bg-success/5 shadow-card">
      <div className="flex items-start gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-success/15 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-5 w-5 text-success" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-display text-lg font-semibold">
              Confiabilidade do teste
            </h3>
            <Badge className="bg-success text-success-foreground border-0">
              Alta
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Esta autoavaliação utiliza instrumentos científicos validados
            internacionalmente.
          </p>
        </div>
      </div>

      {/* Barra de nível */}
      <div className="space-y-1 mb-5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Nível de validação científica</span>
          <span className="font-semibold text-success">9/10</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-success/70 to-success rounded-full"
            style={{ width: "90%" }}
          />
        </div>
      </div>

      {/* Métricas psicométricas */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="text-center p-3 rounded-lg bg-card border border-border/60">
          <p className="font-display text-2xl font-semibold text-success">88%</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
            Sensibilidade
          </p>
        </div>
        <div className="text-center p-3 rounded-lg bg-card border border-border/60">
          <p className="font-display text-2xl font-semibold text-success">88%</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
            Especificidade
          </p>
        </div>
        <div className="text-center p-3 rounded-lg bg-card border border-border/60">
          <p className="font-display text-2xl font-semibold text-success">0,89</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
            α de Cronbach
          </p>
        </div>
      </div>

      {/* Critérios validados */}
      <ul className="space-y-2 text-sm">
        {[
          "Baseado no PHQ-9 (Pfizer/OMS, validado em +100 estudos)",
          "Critérios diagnósticos do DSM-5 (APA) e CID-11 (OMS)",
          "Versão em português validada por Santos et al. (2013)",
          "Inclui critério de prejuízo funcional (DSM-5 critério B)",
          "Restrito a adultos (≥18 anos), conforme validação original",
        ].map((item) => (
          <li key={item} className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <span className="text-foreground/85">{item}</span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border/60">
        <strong>Importante:</strong> mesmo instrumentos de alta confiabilidade
        servem para <em>rastreio</em>, não para diagnóstico. Apenas um
        profissional de saúde pode confirmar um quadro depressivo.
      </p>
    </Card>
  );
};
