import { Heart, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  onStart: () => void;
}

export const Hero = ({ onStart }: HeroProps) => (
  <section className="relative overflow-hidden bg-gradient-soft">
    <div className="container py-16 md:py-24">
      <div className="mx-auto max-w-3xl text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card px-4 py-1.5 text-xs font-medium text-primary shadow-card">
          <Sparkles className="h-3.5 w-3.5" />
          Avaliação confidencial e gratuita
        </div>
        <h1 className="font-display text-4xl md:text-6xl font-semibold leading-tight text-foreground">
          Depressão? Será?{" "}
          <span className="text-accent">
            Descubra se você precisa de ajuda profissional
          </span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Faça uma autoavaliação baseada nos critérios das principais instituições
          psiquiátricas internacionais (DSM-5 e PHQ-9, validado pela OMS) e receba
          orientações sobre onde buscar ajuda no Brasil.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button size="lg" onClick={onStart} className="bg-gradient-hero text-primary-foreground hover:opacity-90 transition-smooth shadow-soft">
            Iniciar autoavaliação
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#sobre">Como funciona</a>
          </Button>
        </div>
        <div className="flex flex-wrap justify-center gap-6 pt-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            100% anônimo
          </span>
          <span className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-accent" />
            Baseado em ciência
          </span>
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Leva ~5 minutos
          </span>
        </div>
      </div>
    </div>
  </section>
);
