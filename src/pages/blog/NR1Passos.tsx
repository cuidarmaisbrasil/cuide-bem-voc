import { Link } from "react-router-dom";
import ArticleLayout from "@/components/ArticleLayout";

const NR1Passos = () => (
  <ArticleLayout
    meta={{
      slug: "/blog/nr-1-riscos-psicossociais-passo-a-passo",
      title: "NR-1 e riscos psicossociais: como cumprir passo a passo",
      description:
        "Roteiro em 7 etapas para atender à NR-1 em riscos psicossociais: inventário, medição, plano de ação e documentos que a fiscalização pede.",
      published: "2026-06-02",
      updated: "2026-08-06",
      readingMinutes: 8,
      badge: "Conformidade · NR-1",
    }}
    related={[
      { to: "/blog/copsoq-ii-o-que-e-como-aplicar", label: "COPSOQ II: o que é e como aplicar na sua empresa" },
      { to: "/blog/plano-de-acao-riscos-psicossociais", label: "Plano de ação para riscos psicossociais: estrutura e exemplo" },
      { to: "/blog/pgr-nr-1-o-que-mudou", label: "PGR e NR-1: o que mudou com os fatores psicossociais" },
    ]}
  >
    <p>
      Desde 26/05/2025, com a <strong>Portaria MTE nº 1.419/2024</strong>, os fatores de risco
      psicossociais relacionados ao trabalho passaram a integrar expressamente o Gerenciamento de
      Riscos Ocupacionais (GRO) previsto na <strong>NR-1</strong>. Na prática, isso significa que a
      empresa precisa <em>identificar, avaliar, controlar e documentar</em> esses riscos com o mesmo
      rigor aplicado a ruído, calor ou agentes químicos.
    </p>
    <p>
      Este roteiro organiza o que precisa existir, em que ordem, e qual documento comprova cada etapa.
    </p>

    <h2>Etapa 1 — Definir o escopo e os critérios</h2>
    <p>
      O GRO exige um <strong>documento de critérios</strong>: quais fontes de risco serão consideradas,
      qual método de avaliação, qual escala de gradação e qual o gatilho para ação. Sem esse documento,
      qualquer medição posterior fica sem lastro metodológico.
    </p>
    <ul>
      <li>Liste setores, funções e regimes (presencial, híbrido, teletrabalho — todos entram).</li>
      <li>Defina a periodicidade mínima de reavaliação.</li>
      <li>Registre quem responde tecnicamente pela avaliação.</li>
    </ul>

    <h2>Etapa 2 — Levantamento preliminar de perigos</h2>
    <p>
      Antes do instrumento, faça o levantamento por observação e escuta: entrevistas com lideranças,
      análise de indicadores já existentes (afastamentos por CID F, rotatividade, horas extras,
      absenteísmo, denúncias no canal de ética, ações trabalhistas por assédio).
    </p>

    <h2>Etapa 3 — Medir com instrumento validado</h2>
    <p>
      A NR-1 não obriga um questionário específico, mas exige método reconhecido. O
      {" "}<Link to="/blog/copsoq-ii-o-que-e-como-aplicar" className="underline">COPSOQ II</Link>{" "}
      é a referência mais defensável no Brasil por cobrir os seis domínios psicossociais com faixas
      internacionais de corte e adaptação para o português.
    </p>
    <p>
      Três cuidados inegociáveis: <strong>anonimato real</strong>, <strong>n mínimo por recorte</strong>{" "}
      (não publique resultado de área com menos de 5 a 7 respondentes) e{" "}
      <strong>comunicação prévia</strong> explicando finalidade e uso dos dados.
    </p>

    <h2>Etapa 4 — Classificar e priorizar</h2>
    <p>
      Cada dimensão deve terminar com uma classificação de gradação — por exemplo Saudável / Atenção /
      Risco. A priorização combina severidade e alcance: uma dimensão em Risco que afeta 40% do quadro
      vem antes de uma em Atenção que afeta 5%.
    </p>

    <h2>Etapa 5 — Registrar no inventário de riscos</h2>
    <p>
      O resultado precisa migrar para o <strong>inventário de riscos</strong> do PGR e para a
      <strong> Avaliação Ergonômica Preliminar (AEP)</strong> da NR-17. O MTE já sinalizou, na 1ª rodada
      de Perguntas e Respostas (CGNOR/DSST/SIT), que <em>questionário isolado não comprova gestão</em>:
      ele é insumo, não entrega final.
    </p>
    <p>
      Atenção às microempresas e empresas de pequeno porte de grau de risco 1 e 2 dispensadas de PGR: para
      elas a AEP contemplando fatores psicossociais permanece obrigatória.
    </p>

    <h2>Etapa 6 — Plano de ação rastreável</h2>
    <p>
      Cada dimensão em Atenção ou Risco precisa de ação com responsável, prazo e forma de verificação de
      eficácia. Ações organizacionais (carga, escala, autonomia, liderança) vêm antes de ações
      individuais (palestra, aplicativo de meditação) — a hierarquia de controle vale aqui também.
    </p>

    <h2>Etapa 7 — Reavaliar e comparar</h2>
    <p>
      O que diferencia gestão de evento pontual é a <strong>série histórica</strong>. Duas ou três
      medições comparáveis mostram se a ação funcionou. É esse comparativo que sustenta a defesa em
      fiscalização e em litígio trabalhista.
    </p>

    <h2>Checklist de documentos</h2>
    <ul>
      <li>Documento de critérios do GRO.</li>
      <li>Registro do levantamento preliminar (entrevistas, indicadores).</li>
      <li>Relatório da medição com metodologia, n, período e classificação por dimensão.</li>
      <li>Inventário de riscos atualizado com as fontes psicossociais.</li>
      <li>AEP (NR-17) contemplando os fatores psicossociais.</li>
      <li>Plano de ação com responsáveis, prazos e verificação de eficácia.</li>
      <li>Evidência de devolutiva aos trabalhadores.</li>
    </ul>

    <h2>Referências</h2>
    <ul className="text-xs text-muted-foreground">
      <li>Ministério do Trabalho e Emprego. <em>Portaria MTE nº 1.419/2024</em> — NR-1 atualizada, vigência 26/05/2025.</li>
      <li>MTE/CGNOR/DSST/SIT. <em>NR-1 — Perguntas e Respostas (1ª rodada)</em>.</li>
      <li>MTE. <em>Guia de informações sobre os Fatores de Riscos Psicossociais Relacionados ao Trabalho</em>. Brasília, 2025.</li>
      <li>NR-17 — Ergonomia. Avaliação Ergonômica Preliminar.</li>
    </ul>
  </ArticleLayout>
);

export default NR1Passos;
