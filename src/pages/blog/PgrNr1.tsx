import { Link } from "react-router-dom";
import ArticleLayout from "@/components/ArticleLayout";

const PgrNr1 = () => (
  <ArticleLayout
    meta={{
      slug: "/blog/pgr-nr-1-o-que-mudou",
      title: "PGR e NR-1: o que mudou com a inclusão dos fatores psicossociais",
      description:
        "O que muda no PGR com a NR-1 atualizada: inventário de riscos, plano de ação, relação com a AEP da NR-17 e obrigações de ME e EPP.",
      published: "2026-06-23",
      updated: "2026-08-06",
      readingMinutes: 6,
      badge: "PGR · GRO",
    }}
    related={[
      { to: "/blog/nr-1-riscos-psicossociais-passo-a-passo", label: "NR-1 e riscos psicossociais: como cumprir passo a passo" },
      { to: "/blog/aep-nr-17-fatores-psicossociais", label: "AEP da NR-17 com fatores psicossociais: o que precisa constar" },
    ]}
  >
    <p>
      O <strong>PGR (Programa de Gerenciamento de Riscos)</strong> continua sendo o documento central do
      GRO. O que mudou com a NR-1 atualizada não foi a estrutura, e sim o <strong>escopo</strong>: os
      fatores de risco psicossociais passaram a ser fonte de risco de registro obrigatório, ao lado dos
      físicos, químicos, biológicos, ergonômicos e de acidentes.
    </p>

    <h2>1. O inventário de riscos ganhou uma nova família de fontes</h2>
    <p>
      O inventário precisa descrever a fonte psicossocial (por exemplo: ritmo imposto por sistema de
      fila, jornada em turnos com revezamento rápido, exposição a agressão verbal de público), os
      grupos expostos, a avaliação e a gradação. Um inventário que declara ausência total de risco
      psicossocial tende a ser questionado pelo Auditor Fiscal do Trabalho.
    </p>

    <h2>2. O plano de ação passou a exigir medidas organizacionais</h2>
    <p>
      Não basta oferecer apoio psicológico. O plano precisa mostrar intervenção sobre a organização do
      trabalho quando a fonte está lá. Veja a estrutura recomendada no artigo sobre{" "}
      <Link to="/blog/plano-de-acao-riscos-psicossociais" className="underline">plano de ação</Link>.
    </p>

    <h2>3. A relação com a AEP da NR-17</h2>
    <p>
      A Avaliação Ergonômica Preliminar da NR-17 é onde os fatores psicossociais e cognitivos são
      analisados em detalhe. O fluxo prático é: medição → AEP → inventário do PGR → plano de ação. A AEP
      não substitui o PGR, e o PGR não dispensa a AEP.
    </p>

    <h2>4. ME e EPP de grau de risco 1 e 2</h2>
    <p>
      Empresas dispensadas da elaboração do PGR (ME e EPP graus 1 e 2, conforme condições da própria
      NR-1) <strong>não estão dispensadas da AEP</strong>. Para elas, a AEP contemplando fatores
      psicossociais é o documento que comprova a gestão.
    </p>

    <h2>5. Trabalho remoto, híbrido e teletrabalho</h2>
    <p>
      Entram na avaliação. Isolamento, indisponibilidade de suporte, dificuldade de desconexão e
      ambiguidade de expectativa são fontes reconhecidas — e frequentemente ausentes de PGRs elaborados
      antes de 2025.
    </p>

    <h2>6. Periodicidade</h2>
    <p>
      O PGR deve ser revisto ao menos a cada dois anos (ou anualmente, conforme o caso e o modelo de
      gestão adotado), mas o dado psicossocial envelhece rápido: mudança de liderança, reestruturação ou
      pico sazonal alteram o cenário em semanas. Ciclos trimestrais de medição produzem a série histórica
      que sustenta a revisão do PGR com evidência, não com impressão.
    </p>

    <h2>Erros que aparecem em auditoria</h2>
    <ul>
      <li>Pesquisa de clima anexada como se fosse avaliação de risco psicossocial.</li>
      <li>Resultado de questionário sem análise técnica e sem migração para o inventário.</li>
      <li>Plano de ação sem responsável nominal, sem prazo ou sem verificação de eficácia.</li>
      <li>Recortes por área com n muito pequeno, criando risco de identificação do respondente.</li>
    </ul>

    <h2>Referências</h2>
    <ul className="text-xs text-muted-foreground">
      <li>NR-1 — Disposições Gerais e Gerenciamento de Riscos Ocupacionais. Portaria MTE nº 1.419/2024.</li>
      <li>NR-17 — Ergonomia. Avaliação Ergonômica Preliminar.</li>
      <li>MTE/CGNOR/DSST/SIT. <em>NR-1 — Perguntas e Respostas (1ª rodada)</em>.</li>
    </ul>
  </ArticleLayout>
);

export default PgrNr1;
