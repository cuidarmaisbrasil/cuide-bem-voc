import { Link } from "react-router-dom";
import ArticleLayout from "@/components/ArticleLayout";

const Nr1Fiscalizacao = () => (
  <ArticleLayout
    meta={{
      slug: "/blog/nr-1-saude-mental-fiscalizacao",
      title: "NR-1 e saúde mental: o que a fiscalização verifica na empresa",
      description:
        "Quais documentos e evidências o Auditor Fiscal do Trabalho verifica sobre saúde mental e riscos psicossociais na NR-1, e como se preparar sem improviso.",
      published: "2026-07-07",
      updated: "2026-08-06",
      readingMinutes: 6,
      badge: "Fiscalização · NR-1",
    }}
    related={[
      { to: "/blog/nr-1-riscos-psicossociais-passo-a-passo", label: "NR-1 e riscos psicossociais: como cumprir passo a passo" },
      { to: "/blog/pgr-nr-1-o-que-mudou", label: "PGR e NR-1: o que mudou" },
      { to: "/blog/aep-nr-17-fatores-psicossociais", label: "AEP da NR-17 com fatores psicossociais" },
    ]}
  >
    <p>
      A pergunta que mais chega ao SESMT desde 2025 é direta: <em>o que exatamente o auditor vai pedir
      sobre saúde mental?</em> A resposta prática é que a fiscalização não avalia o bem-estar dos
      trabalhadores — avalia se existe <strong>gestão documentada de risco</strong>.
    </p>

    <h2>O que é verificado</h2>
    <ol>
      <li><strong>Documento de critérios do GRO</strong> — método de identificação e avaliação escolhido, com justificativa.</li>
      <li><strong>Inventário de riscos</strong> contendo fontes psicossociais, grupos expostos e gradação.</li>
      <li><strong>Avaliação Ergonômica Preliminar (NR-17)</strong> contemplando fatores psicossociais e cognitivos.</li>
      <li><strong>Plano de ação</strong> com medidas, responsáveis, prazos e verificação de eficácia.</li>
      <li><strong>Evidência de participação e devolutiva</strong> aos trabalhadores e à CIPA, quando aplicável.</li>
      <li><strong>Coerência com os indicadores da própria empresa</strong> — afastamentos, CAT, rotatividade, denúncias.</li>
    </ol>

    <h2>Cinco situações que geram apontamento</h2>
    <ul>
      <li><strong>Inventário sem nenhum risco psicossocial.</strong> Em qualquer atividade com metas, atendimento de público ou turnos, a ausência total costuma ser questionada.</li>
      <li><strong>Questionário sem análise.</strong> Planilha de respostas anexada não é avaliação; falta a interpretação técnica e a migração para o inventário.</li>
      <li><strong>Plano de ação genérico.</strong> "Promover qualidade de vida" sem responsável, prazo e verificação não é medida de controle.</li>
      <li><strong>Trabalho remoto ignorado.</strong> Home office e híbrido também devem ser avaliados.</li>
      <li><strong>Nenhuma reavaliação.</strong> Sem segunda medição não há como demonstrar eficácia.</li>
    </ul>

    <h2>Sobre o caráter orientativo do período inicial</h2>
    <p>
      O MTE indicou fase inicial de orientação, com foco em adequação antes de autuação. Isso reduz o
      risco imediato de multa, mas não afasta a obrigação nem protege a empresa em ação trabalhista
      individual — onde a ausência de gestão documentada costuma pesar mais do que a multa administrativa.
    </p>

    <h2>Como se preparar em 90 dias</h2>
    <table>
      <thead>
        <tr><th>Prazo</th><th>Entrega</th></tr>
      </thead>
      <tbody>
        <tr><td>Dias 1–15</td><td>Documento de critérios e levantamento preliminar por observação e indicadores</td></tr>
        <tr><td>Dias 16–45</td><td>Medição anônima com instrumento validado e fechamento do relatório</td></tr>
        <tr><td>Dias 46–60</td><td>Atualização do inventário e da AEP</td></tr>
        <tr><td>Dias 61–75</td><td>Plano de ação aprovado, com responsáveis e orçamento</td></tr>
        <tr><td>Dias 76–90</td><td>Devolutiva aos trabalhadores e agenda da reavaliação</td></tr>
      </tbody>
    </table>

    <h2>O papel de uma ferramenta de medição</h2>
    <p>
      Uma plataforma não cumpre a NR-1 sozinha — ela resolve a parte mais trabalhosa: coleta anônima,
      cálculo por dimensão, corte de privacidade e relatório comparável entre ciclos. O{" "}
      <Link to="/trabalho" className="underline">Cuidar+ Trabalho</Link> entrega esse conjunto em formato
      anexável à AEP e ao inventário, com primeiro ciclo gratuito até 100 colaboradores. Você pode{" "}
      <Link to="/trabalho/amostra-relatorio" className="underline">ver uma amostra do relatório</Link>{" "}
      antes de decidir.
    </p>

    <h2>Referências</h2>
    <ul className="text-xs text-muted-foreground">
      <li>MTE/CGNOR/DSST/SIT. <em>NR-1 — Perguntas e Respostas (1ª rodada)</em>.</li>
      <li>NR-1 — Portaria MTE nº 1.419/2024, vigência 26/05/2025.</li>
      <li>NR-17 — Ergonomia.</li>
    </ul>
  </ArticleLayout>
);

export default Nr1Fiscalizacao;
