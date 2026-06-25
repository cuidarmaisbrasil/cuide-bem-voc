import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

const Termos = () => {
  useEffect(() => {
    document.title = "Termos de Uso — Cuidar+ e Cuidar+ Trabalho";
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="container flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 font-display font-semibold text-lg">
            <span className="h-7 w-7 rounded-lg bg-gradient-hero flex items-center justify-center text-primary-foreground text-sm">❤</span>
            Cuidar+
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/" className="text-primary hover:underline">Home</Link>
            <Link to="/trabalho" className="text-primary hover:underline">Trabalho</Link>
          </div>
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
          <p className="text-sm text-muted-foreground">
            Estes Termos cobrem o <strong>Cuidar+</strong> (autoavaliação pública individual) e o
            <strong> Cuidar+ Trabalho</strong> (programa preventivo de riscos psicossociais para empresas, NR-1).
          </p>
          <p className="text-sm text-muted-foreground">Última atualização: 25 de junho de 2026</p>

          <Card className="p-6 md:p-8 space-y-6 shadow-card border-border/60 text-sm leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">1. Natureza educativa e preventiva</h2>
              <p>
                O <strong>Cuidar+</strong> é uma ferramenta <strong>educativa de rastreio</strong> e o
                <strong> Cuidar+ Trabalho</strong> é um programa <strong>preventivo</strong> de avaliação de
                riscos psicossociais. Nenhum dos dois <strong>realiza diagnóstico clínico</strong> nem oferece
                tratamento. Os resultados são informativos e devem ser interpretados por profissionais de
                saúde qualificados (médico psiquiatra, médico do trabalho, psicólogo).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">2. Quem pode usar</h2>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Home pública:</strong> autoavaliação validada para adultos a partir de 18 anos. Adolescentes devem usar instrumentos específicos (PHQ-A) com orientação profissional.</li>
                <li><strong>Cuidar+ Trabalho:</strong> destinado a empresas que desejam cumprir a NR-1 (gerenciamento de riscos psicossociais) e a NR-17 (ergonomia). Os colaboradores convidados devem ser maiores de 18 anos.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">3. Modalidades e gratuidade</h2>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Home pública:</strong> 100% gratuita, sem cadastro.</li>
                <li><strong>Cuidar+ Trabalho:</strong> gratuito para empresas com até 20 colaboradores no primeiro ciclo de avaliação. Acima desse limite, condições comerciais específicas serão acordadas entre as partes.</li>
                <li><strong>Devolutiva narrativa (TAT) opcional:</strong> oferecida gratuitamente na home pública, com prazo de até 48h, mediante consentimento expresso e envio de e-mail.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">4. Anonimato e relatórios</h2>
              <p>
                <strong>Home pública:</strong> nenhuma resposta é vinculada a uma identidade.
              </p>
              <p>
                <strong>Cuidar+ Trabalho:</strong> a empresa recebe apenas relatórios <strong>agregados</strong>
                (respeitando o n-mínimo configurado). Cada colaborador recebe, ao final do primeiro ciclo, um
                <strong> código mestre único e não recuperável</strong> que dá acesso exclusivo ao seu próprio
                relatório individual. Nem a empresa nem a plataforma conseguem vincular respostas a pessoas.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">5. Limitações</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Não substitui anamnese clínica, exame ocupacional ou diagnóstico diferencial;</li>
                <li>Pode haver viés de autoreferência;</li>
                <li>Não detecta transtorno bipolar, hipotireoidismo, luto patológico e outras condições;</li>
                <li>Não deve ser usado em situações de emergência clínica;</li>
                <li>O relatório corporativo é insumo para o PGR/PCMSO, não substitui a atuação do SESMT, RH e profissionais habilitados.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">6. Emergências</h2>
              <p>
                Se você ou alguém próximo estiver em risco, ligue imediatamente para o
                <a className="text-destructive font-semibold mx-1" href="tel:188">CVV 188</a>
                (24h, gratuito) ou
                <a className="text-destructive font-semibold mx-1" href="tel:192">SAMU 192</a>.
                Em caso de risco iminente à vida, vá ao pronto-socorro mais próximo.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">7. Propriedade intelectual</h2>
              <p>
                Os instrumentos psicométricos utilizados (PHQ-9, COPSOQ II, ECIG, LIPT-60, MDiSH, SHRAS, entre
                outros) são de domínio público ou licenciados conforme suas respectivas regras de uso acadêmico,
                com versões em português validadas e devidamente referenciadas. As imagens TAT e pranchas
                Rorschach utilizadas são de domínio público. Os textos educativos, templates de relatório,
                catálogo de intervenções, layout e código do Cuidar+/Cuidar+ Trabalho são protegidos por direito
                autoral. É permitido compartilhar o link da ferramenta livremente; reprodução parcial deve
                creditar a fonte.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">8. Responsabilidade</h2>
              <p>
                O serviço é oferecido "como está", sem garantias. Os mantenedores não se responsabilizam por
                decisões clínicas, de gestão de pessoas, ocupacionais ou jurídicas tomadas exclusivamente com
                base nos resultados. A interpretação e a aplicação dos relatórios corporativos são de
                responsabilidade da empresa contratante e de seus profissionais de RH, SESMT e saúde
                ocupacional. Sempre procure orientação profissional.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">9. Alterações</h2>
              <p>
                Podemos atualizar estes termos para refletir melhorias na ferramenta ou exigências legais. A
                data da última revisão estará sempre no topo desta página.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">10. Contato</h2>
              <p>
                Home pública: <a className="text-primary hover:underline" href="mailto:contato@cuidarmaisbrasil.life">contato@cuidarmaisbrasil.life</a>.
                <br />
                Cuidar+ Trabalho: <Link to="/trabalho/contato" className="text-primary hover:underline">formulário de contato corporativo</Link> · <Link to="/trabalho/faq" className="text-primary hover:underline">Perguntas frequentes</Link>.
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
