import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

const Privacidade = () => {
  useEffect(() => {
    document.title = "Política de Privacidade — Cuidar+";
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
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold">Política de Privacidade</h1>
          </div>
          <p className="text-sm text-muted-foreground">Última atualização: 29 de abril de 2026</p>

          <Card className="p-6 md:p-8 space-y-6 shadow-card border-border/60 text-sm leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">1. Quem somos</h2>
              <p>
                O <strong>Cuidar+</strong> é uma plataforma educativa, gratuita e sem fins lucrativos
                que oferece uma autoavaliação de saúde mental baseada em instrumentos
                cientificamente validados (PHQ-9, DSM-5 e CID-11). Não substitui diagnóstico
                clínico nem atendimento profissional.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">2. Compromisso com o anonimato</h2>
              <p>
                Você <strong>não precisa criar conta</strong> nem informar nome, e-mail, telefone
                ou qualquer dado pessoal identificável para realizar o teste. Não usamos cookies
                de rastreamento publicitário cross-site.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">3. Quais dados coletamos</h2>
              <p>Para fins estatísticos agregados, registramos:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Pontuação e classificação do teste (ex.: leve, moderada);</li>
                <li>Sintomas marcados no checklist;</li>
                <li>Idade informada (apenas o número);</li>
                <li>País, estado e cidade aproximados (derivados do endereço de IP, sem armazenar o IP);</li>
                <li>Hash irreversível do IP (apenas para evitar duplicidades, não permite identificá-lo);</li>
                <li>Origem da visita (UTM, site referenciador) para sabermos quais canais de divulgação funcionam;</li>
                <li>Cliques em links de ajuda (CVV, SAMU, SUS, profissionais);</li>
                <li>Feedback voluntário, se você optar por enviar.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">4. Para que usamos esses dados</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Gerar estatísticas <strong>agregadas e anônimas</strong> sobre saúde mental no Brasil;</li>
                <li>Melhorar a ferramenta e os encaminhamentos oferecidos;</li>
                <li>Avaliar a eficácia das campanhas de divulgação;</li>
                <li>Pesquisas acadêmicas em saúde pública (sempre com dados agregados).</li>
              </ul>
              <p>
                <strong>Nunca</strong> vendemos, alugamos ou compartilhamos dados individuais com
                terceiros, anunciantes, planos de saúde ou empregadores.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">5. Ferramentas de terceiros</h2>
              <p>
                Usamos <strong>Google Analytics 4</strong> com IP anonimizado e sinais de
                publicidade desativados, apenas para entender o volume e a navegação no site.
                A infraestrutura de banco de dados é provida pela Lovable Cloud (sediada em
                ambientes seguros, com criptografia em trânsito e em repouso).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">6. Seus direitos (LGPD)</h2>
              <p>
                Como não armazenamos dados pessoais identificáveis, não há um cadastro individual
                que possa ser consultado, retificado ou excluído. Caso tenha enviado feedback com
                informações pessoais e queira removê-lo, escreva para o canal abaixo.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">7. Conteúdo sensível</h2>
              <p>
                Esta plataforma trata de saúde mental. Se você está em sofrimento agudo, ligue
                imediatamente para o <a className="text-destructive font-semibold" href="tel:188">CVV 188</a> (24h, gratuito) ou
                <a className="text-destructive font-semibold ml-1" href="tel:192">SAMU 192</a>.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-semibold">8. Contato</h2>
              <p>
                Dúvidas sobre privacidade: <a className="text-primary hover:underline" href="mailto:contato@cuidarmaisbrasil.life">contato@cuidarmaisbrasil.life</a>.
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
