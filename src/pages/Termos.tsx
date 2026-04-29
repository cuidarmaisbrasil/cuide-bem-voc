import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

const Termos = () => {
  useEffect(() => {
    document.title = "Termos de Uso — Cuidar+";
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="container flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 font-display font-semibold text-lg">
            <span className="h-7 w-7 rounded-lg bg-gradient-hero flex items-center justify-center text-primary-foreground text-sm">❤</span>
            Cuidar+
          </Link>
          <Link to="/" className="text-sm text-primary hover:underline">Voltar</Link>
        </div>
      </header>

      <section className="container py-10 md:py-14">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-hero flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold">Termos de Uso</h1>
          </div>
          <p className="text-sm text-muted-foreground">Última atualização: 29 de abril de 2026</p>

          <Card className="p-6 md:p-8 space-y-6 shadow-card border-border/60 text-sm leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">1. Natureza educativa</h2>
              <p>
                O <strong>Cuidar+</strong> é uma ferramenta <strong>educativa de rastreio</strong>,
                <strong> não realiza diagnóstico médico</strong> nem oferece tratamento. Os
                resultados são informativos e devem ser discutidos com um profissional de saúde
                qualificado (médico psiquiatra ou psicólogo).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">2. Quem pode usar</h2>
              <p>
                A autoavaliação foi validada para <strong>adultos a partir de 18 anos</strong>.
                Adolescentes devem usar instrumentos específicos (PHQ-A) com orientação
                profissional.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">3. Limitações</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Não substitui anamnese clínica nem diagnóstico diferencial;</li>
                <li>Pode haver viés de autoreferência;</li>
                <li>Não detecta transtorno bipolar, hipotireoidismo, luto patológico e outras condições;</li>
                <li>Não deve ser usado em situações de emergência clínica.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">4. Emergências</h2>
              <p>
                Se você ou alguém próximo estiver em risco, ligue imediatamente para o
                <a className="text-destructive font-semibold mx-1" href="tel:188">CVV 188</a>
                (24h, gratuito) ou
                <a className="text-destructive font-semibold mx-1" href="tel:192">SAMU 192</a>.
                Em caso de risco iminente à vida, vá ao pronto-socorro mais próximo.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">5. Propriedade intelectual</h2>
              <p>
                O PHQ-9 é um instrumento de domínio público. Os textos educativos, layout e
                código do Cuidar+ são protegidos por direito autoral. É permitido compartilhar o
                link da ferramenta livremente; reprodução parcial deve creditar a fonte.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">6. Responsabilidade</h2>
              <p>
                O Cuidar+ é oferecido "como está", sem garantias. Os mantenedores não se
                responsabilizam por decisões clínicas tomadas exclusivamente com base no
                resultado da autoavaliação. Sempre procure orientação profissional.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">7. Alterações</h2>
              <p>
                Podemos atualizar estes termos para refletir melhorias na ferramenta ou exigências
                legais. A data da última revisão estará sempre no topo desta página.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">8. Contato</h2>
              <p>
                <a className="text-primary hover:underline" href="mailto:contato@cuidarmaisbrasil.life">contato@cuidarmaisbrasil.life</a>
              </p>
            </section>
          </Card>

          <p className="text-xs text-muted-foreground text-center">
            Veja também a <Link to="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.
          </p>
        </div>
      </section>
    </main>
  );
};

export default Termos;
