import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

const Privacidade = () => {
  useEffect(() => {
    document.title = "Política de Privacidade — Cuidar+ e Cuidar+ Trabalho";
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
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold">Política de Privacidade</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Esta política cobre tanto o <strong>Cuidar+</strong> (autoavaliação pública individual em <Link to="/" className="text-primary hover:underline">cuidarmaisbrasil.life</Link>)
            quanto o <strong>Cuidar+ Trabalho</strong> (programa preventivo de riscos psicossociais para empresas, conforme NR-1).
          </p>
          <p className="text-sm text-muted-foreground">Última atualização: 25 de junho de 2026</p>

          <Card className="p-6 md:p-8 space-y-6 shadow-card border-border/60 text-sm leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">1. Quem somos</h2>
              <p>
                O <strong>Cuidar+</strong> é uma plataforma educativa baseada em instrumentos cientificamente
                validados. Atua em duas frentes:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Cuidar+ (home pública):</strong> autoavaliação gratuita e anônima de saúde mental (PHQ-9, checklist DSM-5, CID-11) para qualquer pessoa adulta.</li>
                <li><strong>Cuidar+ Trabalho:</strong> programa preventivo de riscos psicossociais (COPSOQ II, ECIG, LIPT-60, MDiSH/SHRAS, entre outros) para empresas, com relatórios agregados aderentes à NR-1 e NR-17.</li>
              </ul>
              <p>Nenhuma das frentes substitui diagnóstico clínico ou atendimento profissional.</p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">2. Compromisso com o anonimato</h2>
              <p>
                <strong>Home pública:</strong> você não precisa criar conta nem informar nome, e-mail, telefone
                ou qualquer dado pessoal identificável para realizar o teste. Não usamos cookies de rastreamento
                publicitário cross-site.
              </p>
              <p>
                <strong>Cuidar+ Trabalho:</strong> as respostas dos colaboradores são anônimas. A empresa
                contratante recebe apenas dados <strong>agregados</strong>, com critério mínimo de grupo
                (n-mínimo configurável, por padrão n≥5) para impedir reidentificação. O colaborador acessa seu
                relatório individual exclusivamente por um <strong>código mestre único</strong> gerado ao final
                do primeiro ciclo — não recuperável nem pela plataforma.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">3. Quais dados coletamos</h2>
              <p><strong>3.1. Home pública (autoavaliação individual)</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Pontuação e classificação do teste (ex.: leve, moderada);</li>
                <li>Sintomas marcados no checklist;</li>
                <li>Idade informada (apenas o número);</li>
                <li>País, estado e cidade aproximados (derivados do IP, sem armazenar o IP);</li>
                <li>Hash irreversível do IP (apenas para evitar duplicidades);</li>
                <li>Origem da visita (UTM, site referenciador);</li>
                <li>Cliques em links de ajuda (CVV, SAMU, SUS, profissionais);</li>
                <li>Feedback voluntário, se enviado;</li>
                <li>E-mail informado apenas se o usuário <em>optar</em> por solicitar a avaliação narrativa (TAT) gratuita — usado exclusivamente para devolver o parecer e depois descartado.</li>
              </ul>
              <p className="pt-2"><strong>3.2. Cuidar+ Trabalho (empresas)</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>E-mail corporativo do colaborador, usado apenas para envio dos convites de cada onda e desvinculado das respostas após registro;</li>
                <li>Respostas aos instrumentos psicométricos das ondas/ciclos, armazenadas com identificador pseudonimizado;</li>
                <li>Metadados do ciclo (datas, ondas respondidas, adesão);</li>
                <li>Hash do código mestre individual (não permite recuperar o código);</li>
                <li>Dados da empresa contratante (razão social, responsável, e-mail, tamanho do quadro).</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">4. Para que usamos esses dados</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Gerar estatísticas <strong>agregadas e anônimas</strong> sobre saúde mental no Brasil;</li>
                <li>Produzir relatórios corporativos agregados para a empresa contratante, aderentes à NR-1/NR-17;</li>
                <li>Disponibilizar, ao colaborador, seu próprio relatório individual via código mestre;</li>
                <li>Melhorar a ferramenta, os encaminhamentos e os instrumentos oferecidos;</li>
                <li>Pesquisas acadêmicas em saúde pública e saúde ocupacional (sempre com dados agregados).</li>
              </ul>
              <p>
                <strong>Nunca</strong> vendemos, alugamos ou compartilhamos dados individuais com terceiros,
                anunciantes, planos de saúde, seguradoras ou empregadores. A empresa contratante do Cuidar+
                Trabalho <strong>não</strong> tem acesso a respostas individuais em nenhuma hipótese.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">5. Base legal (LGPD)</h2>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Home pública:</strong> consentimento do titular e legítimo interesse para estatísticas agregadas anonimizadas (art. 7º, I e IX da LGPD).</li>
                <li><strong>Cuidar+ Trabalho:</strong> cumprimento de obrigação legal/regulatória do empregador (NR-1 — gerenciamento de riscos psicossociais), execução de contrato com a empresa e consentimento do colaborador para participação nas ondas.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">6. Ferramentas de terceiros</h2>
              <p>
                Usamos <strong>Google Analytics 4</strong> com IP anonimizado e sinais de publicidade desativados,
                apenas para entender volume e navegação. A infraestrutura de banco de dados, autenticação e
                envio de e-mails é provida pela Lovable Cloud, com criptografia em trânsito e em repouso.
                E-mails transacionais (convites de onda, devolutivas) são enviados por provedor terceirizado
                contratualmente obrigado ao sigilo.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">7. Seus direitos (LGPD)</h2>
              <p>
                <strong>Home pública:</strong> como não armazenamos dados pessoais identificáveis, não há
                cadastro individual a ser consultado, retificado ou excluído. Caso tenha enviado feedback ou
                solicitado a devolutiva TAT com informações pessoais, escreva para o canal abaixo.
              </p>
              <p>
                <strong>Cuidar+ Trabalho:</strong> o colaborador pode solicitar, a qualquer momento, a exclusão
                do seu e-mail da base de convites e a anonimização definitiva de suas respostas. Como o vínculo
                entre código mestre e respostas só existe via hash, a exclusão do código torna o relatório
                individual irrecuperável.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">8. Retenção</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Dados agregados estatísticos: retidos por prazo indeterminado, sem reidentificação possível.</li>
                <li>E-mails de convite (Trabalho): mantidos enquanto durar o contrato com a empresa e excluídos em até 90 dias após o encerramento.</li>
                <li>Respostas individuais pseudonimizadas (Trabalho): mantidas por até 5 anos para fins de comparação entre ciclos, conforme prática recomendada em vigilância em saúde do trabalhador.</li>
                <li>Solicitações TAT: e-mail descartado após o envio da devolutiva.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">9. Conteúdo sensível</h2>
              <p>
                Esta plataforma trata de saúde mental. Se você está em sofrimento agudo, ligue imediatamente
                para o <a className="text-destructive font-semibold" href="tel:188">CVV 188</a> (24h, gratuito) ou
                <a className="text-destructive font-semibold ml-1" href="tel:192">SAMU 192</a>.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">10. Contato</h2>
              <p>
                Dúvidas sobre privacidade da home pública: <a className="text-primary hover:underline" href="mailto:contato@cuidarmaisbrasil.life">contato@cuidarmaisbrasil.life</a>.
                <br />
                Dúvidas sobre o Cuidar+ Trabalho: use o <Link to="/trabalho/contato" className="text-primary hover:underline">formulário de contato corporativo</Link>.
              </p>
            </section>
          </Card>

          <p className="text-xs text-muted-foreground text-center">
            Veja também os <Link to="/termos" className="text-primary hover:underline">Termos de Uso</Link>.
          </p>
        </div>
      </section>
    </main>
  );
};

export default Privacidade;
