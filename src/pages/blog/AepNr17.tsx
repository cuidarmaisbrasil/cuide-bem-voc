import { Link } from "react-router-dom";
import ArticleLayout from "@/components/ArticleLayout";

const AepNr17 = () => (
  <ArticleLayout
    meta={{
      slug: "/blog/aep-nr-17-fatores-psicossociais",
      title: "AEP da NR-17 com fatores psicossociais: o que precisa constar",
      description:
        "Estrutura da Avaliação Ergonômica Preliminar contemplando fatores psicossociais e cognitivos: seções obrigatórias, fontes de dado e relação com o PGR.",
      published: "2026-07-14",
      updated: "2026-08-06",
      readingMinutes: 6,
      badge: "AEP · NR-17",
    }}
    related={[
      { to: "/blog/pgr-nr-1-o-que-mudou", label: "PGR e NR-1: o que mudou" },
      { to: "/blog/nr-1-saude-mental-fiscalizacao", label: "NR-1 e saúde mental: o que a fiscalização verifica" },
    ]}
  >
    <p>
      A <strong>Avaliação Ergonômica Preliminar (AEP)</strong> da NR-17 é o documento onde os fatores
      psicossociais e cognitivos são efetivamente analisados. Com a NR-1 atualizada, ela deixou de ser um
      anexo técnico de conforto postural e passou a ser peça central da conformidade em saúde mental
      ocupacional.
    </p>

    <h2>Quem precisa ter AEP</h2>
    <p>
      Todas as organizações. Inclusive microempresas e empresas de pequeno porte de grau de risco 1 e 2
      que estejam dispensadas de elaborar PGR — para essas, a AEP é justamente o documento que comprova a
      gestão.
    </p>

    <h2>Seções que a AEP deve conter</h2>
    <ol>
      <li><strong>Identificação</strong> — empresa, CNAE, grau de risco, unidades, responsável técnico.</li>
      <li><strong>Descrição das situações de trabalho</strong> — por função e por regime (presencial, híbrido, teletrabalho, turnos).</li>
      <li><strong>Fatores biomecânicos e ambientais</strong> — o escopo clássico da NR-17.</li>
      <li><strong>Fatores cognitivos</strong> — demanda de atenção, memória de trabalho, interrupções, multitarefa, complexidade de decisão.</li>
      <li><strong>Fatores psicossociais</strong> — exigências, influência, apoio social, clareza de papel, reconhecimento, justiça, conflito trabalho–família, comportamentos ofensivos.</li>
      <li><strong>Método e evidências</strong> — observação, entrevistas, indicadores e instrumento estruturado, com período e número de respondentes.</li>
      <li><strong>Resultados por dimensão</strong> — escore e classificação em faixas.</li>
      <li><strong>Conclusão e encaminhamentos</strong> — o que segue para plano de ação e o que exige Análise Ergonômica do Trabalho (AET) aprofundada.</li>
    </ol>

    <h2>Como preencher a seção psicossocial sem improviso</h2>
    <p>
      É aqui que a maioria das AEPs fica frágil. O que sustenta a seção é a tríade{" "}
      <strong>observação + escuta + instrumento validado</strong>. O MTE é explícito que questionário
      isolado não comprova gestão — mas também não se sustenta uma avaliação de risco baseada apenas em
      impressão da liderança.
    </p>
    <p>
      Ao usar instrumento estruturado, registre na AEP: nome e versão do instrumento, referência da
      adaptação para o português, período de coleta, número de respondentes por recorte, critério de
      anonimato e regra de corte mínimo de n.
    </p>

    <h2>Quando a AEP dispara uma AET</h2>
    <ul>
      <li>Dimensões classificadas em Risco que a AEP não consegue explicar pela descrição do posto.</li>
      <li>Concentração de afastamentos por transtornos mentais em uma função específica.</li>
      <li>Denúncias reiteradas de comportamentos ofensivos em uma unidade.</li>
      <li>Divergência entre indicadores objetivos e percepção medida.</li>
    </ul>

    <h2>Relação com o PGR</h2>
    <p>
      A AEP alimenta o <Link to="/blog/pgr-nr-1-o-que-mudou" className="underline">inventário de riscos
      do PGR</Link>, e o inventário alimenta o{" "}
      <Link to="/blog/plano-de-acao-riscos-psicossociais" className="underline">plano de ação</Link>. Os
      três documentos precisam ser coerentes entre si: dimensões em Risco na AEP devem aparecer no
      inventário e ter linha correspondente no plano.
    </p>

    <h2>Referências</h2>
    <ul className="text-xs text-muted-foreground">
      <li>NR-17 — Ergonomia. Avaliação Ergonômica Preliminar e Análise Ergonômica do Trabalho.</li>
      <li>NR-1 — Portaria MTE nº 1.419/2024.</li>
      <li>MTE/CGNOR/DSST/SIT. <em>NR-1 — Perguntas e Respostas (1ª rodada)</em>.</li>
    </ul>
  </ArticleLayout>
);

export default AepNr17;
