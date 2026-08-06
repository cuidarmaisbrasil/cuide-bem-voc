import { Link } from "react-router-dom";
import ArticleLayout from "@/components/ArticleLayout";

const SaudeMentalTrabalho = () => (
  <ArticleLayout
    meta={{
      slug: "/blog/saude-mental-no-trabalho-guia-empresas",
      title: "Saúde mental no trabalho: guia prático para empresas brasileiras",
      description:
        "O que é saúde mental no trabalho, quais fatores organizacionais mais adoecem, o que a empresa pode fazer e como medir resultado sem invadir a privacidade do colaborador.",
      published: "2026-06-30",
      updated: "2026-08-06",
      readingMinutes: 8,
      badge: "Guia · Saúde mental no trabalho",
    }}
    related={[
      { to: "/blog/nr-1-saude-mental-fiscalizacao", label: "NR-1 e saúde mental: o que a fiscalização verifica" },
      { to: "/blog/copsoq-ii-o-que-e-como-aplicar", label: "COPSOQ II: o que é e como aplicar" },
      { to: "/blog/plano-de-acao-riscos-psicossociais", label: "Plano de ação para riscos psicossociais" },
    ]}
  >
    <p>
      Saúde mental no trabalho não é o mesmo que saúde mental do trabalhador. A primeira trata do que a
      <strong> organização do trabalho</strong> produz: carga, ritmo, autonomia, previsibilidade, apoio,
      justiça, exposição a agressão. A segunda é história de vida, contexto e cuidado clínico. A empresa
      responde pela primeira — e é sobre ela que a regulação brasileira passou a cobrar evidência.
    </p>

    <h2>Por que virou pauta de gestão, e não só de benefício</h2>
    <ul>
      <li>Transtornos mentais e comportamentais estão entre as principais causas de afastamento previdenciário no Brasil, com crescimento consistente na última década.</li>
      <li>O burnout é reconhecido pela OMS na CID-11 (QD85) como fenômeno ocupacional — resultado de estresse crônico no trabalho não gerenciado com sucesso.</li>
      <li>Desde 2025 a NR-1 inclui expressamente os fatores psicossociais no gerenciamento de riscos ocupacionais.</li>
    </ul>

    <h2>Os fatores organizacionais que mais aparecem</h2>
    <ol>
      <li><strong>Sobrecarga sustentada</strong> — volume incompatível com o tempo disponível, de forma contínua.</li>
      <li><strong>Baixa influência</strong> — pessoa executa sem qualquer margem de decisão sobre método ou ritmo.</li>
      <li><strong>Apoio social insuficiente</strong> — ausência de suporte de colegas e de chefia diante da dificuldade.</li>
      <li><strong>Falta de clareza de papel</strong> — expectativas contraditórias entre lideranças.</li>
      <li><strong>Injustiça percebida</strong> — critérios opacos de promoção, reconhecimento e punição.</li>
      <li><strong>Comportamentos ofensivos</strong> — assédio moral, assédio sexual, agressão de público.</li>
      <li><strong>Conflito trabalho–família</strong> — jornada e disponibilidade que invadem a vida pessoal.</li>
    </ol>
    <p>
      A combinação clássica que mais adoece é <em>alta exigência + baixa influência + baixo apoio</em>.
      Ela pode ser medida e monitorada.
    </p>

    <h2>O que funciona (e o que só parece que funciona)</h2>
    <table>
      <thead>
        <tr><th>Ação</th><th>Efeito esperado</th></tr>
      </thead>
      <tbody>
        <tr><td>Redimensionar carga e escala</td><td>Alto — atua na fonte</td></tr>
        <tr><td>Ampliar autonomia sobre método e ritmo</td><td>Alto</td></tr>
        <tr><td>Formar liderança em apoio e feedback</td><td>Médio-alto</td></tr>
        <tr><td>Protocolo antiassédio com apuração real</td><td>Alto onde há exposição</td></tr>
        <tr><td>Canal de acolhimento e encaminhamento</td><td>Médio — atua no efeito</td></tr>
        <tr><td>Palestra pontual, ginástica laboral, app de meditação</td><td>Baixo isoladamente</td></tr>
      </tbody>
    </table>
    <p>
      Nada disso invalida ações de apoio individual. O erro é usá-las como resposta única a um problema
      que nasce da organização do trabalho.
    </p>

    <h2>Como medir sem invadir a privacidade</h2>
    <ul>
      <li><strong>Anonimato real</strong>: sem login nominal, sem cruzamento com cadastro de RH.</li>
      <li><strong>Agregação mínima</strong>: nenhum resultado publicado com menos de 5 a 7 respondentes no recorte.</li>
      <li><strong>Devolutiva individual separada</strong>: se a pessoa recebe um retorno próprio, que seja acessível apenas por código anônimo que só ela possui.</li>
      <li><strong>Transparência prévia</strong>: comunicar finalidade, uso e limites antes da coleta.</li>
    </ul>

    <h2>Um ciclo mínimo viável</h2>
    <p>
      Rastreio de sintomas → avaliação de clima psicossocial → leitura de conduta e relações → reteste
      comparativo. Feito trimestralmente, produz série histórica e permite separar efeito de ação de
      ruído sazonal. É essa lógica que estrutura o{" "}
      <Link to="/trabalho" className="underline">Cuidar+ Trabalho</Link>, gratuito até 100 colaboradores.
    </p>

    <h2>Se um colaborador precisa de ajuda agora</h2>
    <p>
      Empresa não faz diagnóstico. Encaminha. Estão disponíveis o CVV (188, 24h), os CAPS da rede pública
      e o agendamento de atendimento psicológico ou psiquiátrico pelo SUS. A{" "}
      <Link to="/" className="underline">página inicial do Cuidar+</Link> oferece autoavaliação gratuita
      e anônima com orientação de encaminhamento.
    </p>

    <h2>Referências</h2>
    <ul className="text-xs text-muted-foreground">
      <li>OMS. <em>CID-11</em>, QD85 — Burnout como fenômeno ocupacional.</li>
      <li>OMS/OIT. <em>Mental health at work: policy brief</em>, 2022.</li>
      <li>NR-1 — Portaria MTE nº 1.419/2024.</li>
      <li>Karasek, R. &amp; Theorell, T. <em>Healthy Work</em> — modelo demanda-controle-apoio.</li>
    </ul>
  </ArticleLayout>
);

export default SaudeMentalTrabalho;
