import { Heart, ShieldCheck, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReliabilityBadge } from "./ReliabilityBadge";

interface HeroProps {
  onStart: () => void;
}

export const Hero = ({ onStart }: HeroProps) => {
  return (
    <section className="relative overflow-hidden bg-gradient-soft">
      <div className="container py-10 md:py-20">
        <div className="mx-auto max-w-3xl text-center space-y-5 animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card px-4 py-1.5 text-xs font-medium text-primary shadow-card">
            <Sparkles className="h-3.5 w-3.5" />
            Avaliação confidencial e gratuita
          </div>

          <h1 className="font-display text-3xl md:text-6xl font-semibold leading-tight text-foreground">
            Você não está sozinho(a).{" "}
            <span className="text-accent">
              Vamos entender juntos o que você está sentindo.
            </span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Uma autoavaliação acolhedora baseada nos critérios da OMS (PHQ-9) e
            DSM-5. Em poucos minutos, você entende seus sintomas e descobre
            onde buscar ajuda no Brasil.
          </p>

          <div className="pt-2">
            <Button
              size="lg"
              onClick={onStart}
              className="bg-gradient-hero text-primary-foreground hover:opacity-90 transition-smooth shadow-soft text-base h-12 px-8 w-full sm:w-auto"
            >
              Fazer meu teste agora
            </Button>
            <p className="text-xs text-muted-foreground mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> ~3 minutos
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> 100% anônimo
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" /> Grátis
              </span>
            </p>
          </div>

          {totalTests && totalTests > 10 && (
            <div className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 text-sm text-muted-foreground shadow-card animate-fade-in">
              <Users className="h-4 w-4 text-primary" />
              <span>
                <strong className="text-foreground">
                  {totalTests.toLocaleString("pt-BR")}
                </strong>{" "}
                pessoas já se avaliaram aqui
              </span>
            </div>
          )}

          <div className="flex justify-center pt-2">
            <ReliabilityBadge variant="compact" />
          </div>

          <div className="pt-2">
            <a
              href="#sobre"
              className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
            >
              Como funciona →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
