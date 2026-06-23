import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { FileText, ArrowLeft } from "lucide-react";

const TrabalhoTermos = () => {
  useEffect(() => {
    document.title = "Termos e Condições — Cuidar+ Trabalho";
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="container flex items-center justify-between h-14">
          <Link to="/trabalho" className="flex items-center gap-2 font-display font-semibold text-lg">
            <span className="h-7 w-7 rounded-lg bg-gradient-hero flex items-center justify-center text-primary-foreground text-sm">❤</span>
            Cuidar+ Trabalho
          </Link>
          <Link to="/trabalho" className="text-sm text-primary hover:underline flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </header>

      <section className="container py-10 md:py-14">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-hero flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-serif-editorial text-3xl md:text-4xl font-semibold">Termos e Condições — Cuidar+ Trabalho</h1>
          </div>
          <p className="text-sm text-muted-foreground">Última atualização: {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>

          <Card className="p-6 md:p-8 space-y-6 shadow-card border-border/60 text-sm leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-serif-editorial text-xl font-semibold">1. Objeto</h2>
              <p>
                O <strong>Cuidar+ Trabalho</strong> é um programa preventivo de avaliação de riscos psicossociais
                no ambiente corporativo, baseado em psicometrias com padrões internacionais e contemplando os
                requisitos da NR-1. O serviço é oferecido a empresas para aplicação anônima de instrumentos
                validados e geração de relatórios agregados.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif-editorial text-xl font-semibold">2. Gratuidade*</h2>
              <p>
                A versão gratuita do Cuidar+ Trabalho está disponível para empresas com <strong>até 20
                colaboradores</strong>. Acima deste limite, condições comerciais específicas serão acordadas
                entre as partes. O relatório NR-1 gratuito* refere-se ao primeiro ciclo de avaliação.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif-editorial text-xl font-semibold">3. Anonimato e confidencialidade</h2>
              <p>
                As respostas individuais dos colaboradores são <strong>anônimas</strong>. A empresa contratante
                recebe apenas dados <strong>agregados</strong>, sem qualquer identificação individual. O
                colaborador pode acessar seu relatório individual exclusivamente através de um código mestre
                único, gerado no final da primeira resposta e não recuperável.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif-editorial text-xl font-semibold">4. Conformidade LGPD</h2>
              <p>
                O tratamento dos dados segue a Lei Geral de Proteção de Dados (Lei 13.709/2018). Adotamos
                criptografia, controles de acesso e sigilo profissional. O colaborador pode solicitar a exclusão
                de seus dados a qualquer momento.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif-editorial text-xl font-semibold">5. Natureza preventiva</h2>
              <p>
                O Cuidar+ Trabalho é uma ferramenta <strong>educativa e preventiva</strong>, não realiza
                diagnóstico clínico nem substitui acompanhamento profissional. Em situações de risco, o programa
                orienta sobre canais de apoio (CVV 188, CAPS, SAMU 192).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif-editorial text-xl font-semibold">6. Propriedade intelectual</h2>
              <p>
                Os instrumentos psicométricos utilizados (COPSOQ II, PHQ-9, ECIG, LIPT-60, MDiSH, SHRAS) são de
                domínio público ou licenciados conforme suas respectivas regras de uso acadêmico. Os relatórios,
                templates, conteúdos editoriais e código do Cuidar+ são protegidos por direito autoral.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif-editorial text-xl font-semibold">7. Responsabilidade</h2>
              <p>
                O Cuidar+ Trabalho é oferecido "como está". Os mantenedores não se responsabilizam por decisões
                de gestão de pessoas, clínicas ou jurídicas tomadas exclusivamente com base nos resultados.
                A interpretação e a aplicação dos resultados são de responsabilidade da empresa contratante e de
                seus profissionais de RH, SESMT e saúde ocupacional.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif-editorial text-xl font-semibold">8. Alterações</h2>
              <p>
                Estes Termos podem ser atualizados para refletir melhorias no serviço ou exigências legais. A
                data da última revisão estará sempre no topo desta página.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif-editorial text-xl font-semibold">9. Contato</h2>
              <p>
                Para dúvidas, use nosso{" "}
                <Link to="/trabalho/contato" className="text-primary hover:underline font-medium">
                  formulário de contato
                </Link>
                . Veja também as{" "}
                <Link to="/trabalho/faq" className="text-primary hover:underline font-medium">
                  Perguntas Frequentes (Q&amp;A)
                </Link>
                .
              </p>
            </section>

            <p className="text-xs text-muted-foreground pt-2">
              * Gratuito até 20 colaboradores.
            </p>
          </Card>

          <p className="text-xs text-muted-foreground text-center">
            Veja também a{" "}
            <Link to="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>
            {" "}e os{" "}
            <Link to="/termos" className="text-primary hover:underline">Termos gerais</Link>.
          </p>
        </div>
      </section>
    </main>
  );
};

export default TrabalhoTermos;
