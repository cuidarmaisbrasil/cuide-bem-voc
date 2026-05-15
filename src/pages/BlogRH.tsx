import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const URL = "https://cuidarmaisbrasil.life/blog/rh-saude-mental-trabalho";
const TITLE = "NR-1 e saúde mental no trabalho: o que o RH precisa medir em 2026";
const DESC = "Guia prático para RH brasileiro sobre fatores psicossociais, NR-1 e como aplicar o COPSOQ II de forma anônima na sua empresa — sem custo.";
const PUBLISHED = "2026-05-15";

const BlogRH = () => {
  useEffect(() => {
    document.title = `${TITLE} — Cuidar+ Brasil`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", DESC);

    const old = document.querySelector('script[data-page="blog-rh"]');
    if (old) old.remove();
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.page = "blog-rh";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: TITLE,
      description: DESC,
      datePublished: PUBLISHED,
      author: { "@type": "Organization", name: "Cuidar+ Brasil" },
      publisher: {
        "@type": "Organization",
        name: "Cuidar+ Brasil",
        url: "https://cuidarmaisbrasil.life",
      },
      mainEntityOfPage: URL,
    });
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="container py-4 flex items-center justify-between">
          <Link to="/" className="font-display font-semibold">Cuidar+ Brasil</Link>
          <Link to="/trabalho" className="text-sm text-muted-foreground hover:text-foreground">Cuidar+ Trabalho →</Link>
        </div>
      </header>

      <article className="container max-w-3xl py-10 space-y-6">
        <header className="space-y-3">
          <Badge variant="secondary">Para RH · Guia prático</Badge>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">{TITLE}</h1>
          <p className="text-sm text-muted-foreground">
            Publicado em {new Date(PUBLISHED).toLocaleDateString("pt-BR")} · 6 min de leitura
          </p>
        </header>

        <div className="prose prose-sm max-w-none text-foreground space-y-5
                        [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8
                        [&_h3]:font-semibold [&_h3]:mt-6
                        [&_p]:leading-relaxed [&_p]:text-foreground
                        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
                        [&_strong]:text-foreground">
          <p>
            A atualização da <strong>NR-1</strong> (Norma Regulamentadora nº 1) trouxe ao centro do PGR
            (Programa de Gerenciamento de Riscos) a obrigação de identificar, avaliar e controlar
            <strong> riscos psicossociais</strong> — algo que historicamente o RH brasileiro tratava
            como "clima", sem método. Burnout, assédio, sobrecarga e baixo apoio social não são mais
            só "problemas de cultura": são riscos ocupacionais auditáveis.
          </p>

          <h2>1. O que conta como risco psicossocial?</h2>
          <p>
            A literatura ocupacional (OMS, EU-OSHA, NRCWE) converge em seis grandes domínios que
            qualquer RH precisa medir:
          </p>
          <ul>
            <li><strong>Demandas</strong> quantitativas, emocionais e cognitivas.</li>
            <li><strong>Influência e controle</strong> sobre o próprio trabalho.</li>
            <li><strong>Apoio social</strong> de colegas e liderança.</li>
            <li><strong>Reconhecimento e justiça organizacional</strong>.</li>
            <li><strong>Conflito trabalho–família</strong>.</li>
            <li><strong>Comportamentos ofensivos</strong> (assédio, bullying, violência).</li>
          </ul>

          <h2>2. Por que o COPSOQ II é a escolha defensável</h2>
          <p>
            O <strong>Copenhagen Psychosocial Questionnaire (COPSOQ II)</strong> foi desenvolvido pelo
            NRCWE (Dinamarca) e adaptado para o português por Silva et al. (2011). Cobre os seis domínios
            acima com escalas validadas e faixas internacionalmente reconhecidas:
          </p>
          <ul>
            <li><strong>Saudável</strong> · <strong>Atenção</strong> · <strong>Risco</strong></li>
            <li>Permite comparação com outras empresas e benchmarks setoriais.</li>
            <li>Existe em três versões: curta (~24 itens), média (~80) e longa (~120).</li>
            <li>É <strong>livre para uso não comercial</strong>, ao contrário de muitas alternativas pagas.</li>
          </ul>
          <p>
            Para a maioria das empresas brasileiras, a versão <strong>média</strong> é o ponto ideal:
            cobre todos os domínios da NR-1 sem fadiga de respondente.
          </p>

          <h2>3. Como rodar uma medição que o jurídico vai aprovar</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li><strong>Anonimato real.</strong> Nada de e-mail nominal, login, IP visível. Use links anônimos por empresa.</li>
            <li><strong>n mínimo por recorte.</strong> Não publique resultados de departamentos com menos de 5–7 respondentes — risco de identificação.</li>
            <li><strong>Comunicação prévia.</strong> Explique para que serve, o que será feito com os dados e o que <em>não</em> será feito (avaliação individual, demissão, etc.).</li>
            <li><strong>Retorno em até 30 dias.</strong> Sem devolução, a próxima rodada terá adesão zero.</li>
            <li><strong>Plano de ação por escala em "Risco"</strong>, não por pessoa.</li>
          </ol>

          <h2>4. Erros comuns do RH brasileiro</h2>
          <ul>
            <li>Misturar <strong>pesquisa de clima</strong> (engajamento) com <strong>avaliação de risco psicossocial</strong> — são instrumentos diferentes com finalidades diferentes.</li>
            <li>Comprar dashboards proprietários sem validação científica publicada.</li>
            <li>Tratar burnout como "performance baixa" — burnout é diagnóstico ocupacional (CID-11 QD85).</li>
            <li>Medir e não agir. Pior do que não medir.</li>
          </ul>

          <h2>5. Como o Cuidar+ Trabalho ajuda</h2>
          <p>
            O <Link to="/trabalho" className="underline">Cuidar+ Trabalho</Link> roda o COPSOQ II nas três
            versões, gera um link anônimo único por empresa e devolve o painel agregado já classificado
            em <strong>Saudável / Atenção / Risco</strong>, com filtros por departamento e faixa etária.
            Sem custo, sem cadastro de funcionário, sem acesso individual a respostas.
          </p>

          <Card className="p-5 my-6 bg-muted/40 not-prose">
            <p className="text-sm mb-3">
              Em poucos minutos sua empresa tem um link anônimo e um painel pronto para auditoria NR-1.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button asChild><Link to="/trabalho">Cadastrar empresa</Link></Button>
              <Button variant="outline" asChild><Link to="/imprensa">Press kit</Link></Button>
            </div>
          </Card>

          <h2>Referências</h2>
          <ul className="text-xs text-muted-foreground">
            <li>Silva, C. et al. (2011). <em>COPSOQ II — Adaptação portuguesa</em>. Universidade de Aveiro.</li>
            <li>Pejtersen, J. H. et al. (2010). The second version of the Copenhagen Psychosocial Questionnaire. <em>Scand J Public Health</em>, 38(3 Suppl).</li>
            <li>Ministério do Trabalho e Emprego. <em>NR-1 — Disposições gerais e gerenciamento de riscos ocupacionais</em>.</li>
            <li>OMS / OIT. <em>Mental health at work: policy brief</em>, 2022.</li>
          </ul>
        </div>
      </article>
    </main>
  );
};

export default BlogRH;
