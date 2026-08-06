import { Link } from "react-router-dom";
import ArticleLayout from "@/components/ArticleLayout";

const Copsoq = () => (
  <ArticleLayout
    meta={{
      slug: "/blog/copsoq-ii-o-que-e-como-aplicar",
      title: "COPSOQ II: o que é, quais dimensões mede e como aplicar",
      description:
        "Guia do Copenhagen Psychosocial Questionnaire (COPSOQ II): versões curta, média e longa, dimensões, faixas de corte e como aplicar de forma anônima em empresas brasileiras.",
      published: "2026-06-09",
      updated: "2026-08-06",
      readingMinutes: 7,
      badge: "Instrumento · COPSOQ II",
    }}
    related={[
      { to: "/blog/nr-1-riscos-psicossociais-passo-a-passo", label: "NR-1 e riscos psicossociais: como cumprir passo a passo" },
      { to: "/blog/plano-de-acao-riscos-psicossociais", label: "Plano de ação para riscos psicossociais: estrutura e exemplo" },
    ]}
  >
    <p>
      O <strong>COPSOQ (Copenhagen Psychosocial Questionnaire)</strong> foi desenvolvido pelo National
      Research Centre for the Working Environment (NRCWE), na Dinamarca, e é hoje um dos instrumentos
      mais usados no mundo para avaliar fatores psicossociais no trabalho. A segunda versão, o
      <strong> COPSOQ II</strong>, tem adaptação para o português (Silva et al., 2011) e é livre para uso
      não comercial — o que explica boa parte da sua adoção em programas de saúde ocupacional.
    </p>

    <h2>O que o COPSOQ II mede</h2>
    <p>Os itens se agrupam em dimensões que cobrem seis grandes domínios:</p>
    <ul>
      <li><strong>Exigências do trabalho</strong> — quantitativas, cognitivas, emocionais e de ritmo.</li>
      <li><strong>Organização e conteúdo</strong> — influência, possibilidades de desenvolvimento, significado, comprometimento.</li>
      <li><strong>Relações e liderança</strong> — previsibilidade, clareza de papel, conflitos de papel, qualidade da liderança, apoio social de colegas e da chefia, comunidade social.</li>
      <li><strong>Interface trabalho–indivíduo</strong> — insegurança laboral, satisfação, conflito trabalho–família.</li>
      <li><strong>Valores no local de trabalho</strong> — confiança horizontal e vertical, justiça e respeito.</li>
      <li><strong>Saúde e bem-estar</strong> — saúde geral, burnout, estresse, sono, sintomas depressivos.</li>
      <li><strong>Comportamentos ofensivos</strong> — assédio moral, assédio sexual, ameaças e violência.</li>
    </ul>

    <h2>Versões: curta, média e longa</h2>
    <table>
      <thead>
        <tr><th>Versão</th><th>Itens</th><th>Uso típico</th></tr>
      </thead>
      <tbody>
        <tr><td>Curta</td><td>~24</td><td>Empresas pequenas, pulso rápido, alta frequência</td></tr>
        <tr><td>Média</td><td>~80</td><td>Padrão para gestão de riscos em empresa de porte médio</td></tr>
        <tr><td>Longa</td><td>~120</td><td>Pesquisa acadêmica e diagnósticos aprofundados</td></tr>
      </tbody>
    </table>
    <p>
      Para a maioria das empresas brasileiras, a versão <strong>média</strong> é o ponto de equilíbrio:
      cobre todos os domínios exigidos pela NR-1 sem fadiga de respondente.
    </p>

    <h2>Como as pontuações funcionam</h2>
    <p>
      Cada item usa escala Likert de 5 pontos convertida para 0–100. A média dos itens de uma dimensão
      gera o escore da dimensão. Dimensões positivas (apoio social, influência) têm leitura invertida em
      relação às negativas (exigências, insegurança): escore alto em apoio social é bom, escore alto em
      exigências quantitativas é sinal de alerta.
    </p>
    <p>
      A classificação usual em três faixas — <strong>Saudável</strong>, <strong>Atenção</strong>,
      <strong> Risco</strong> — usa os terços da escala ajustados ao sentido de cada dimensão. É essa
      gradação que alimenta o inventário de riscos.
    </p>

    <h2>Como aplicar sem invalidar o resultado</h2>
    <ol>
      <li><strong>Anonimato verificável.</strong> Link anônimo por empresa, sem login nominal e sem cruzamento com RH.</li>
      <li><strong>Comunicação prévia.</strong> Quem verá os dados, em que nível de agregação, e o que não será feito com eles.</li>
      <li><strong>Janela definida.</strong> Duas a três semanas, com um lembrete no meio do período.</li>
      <li><strong>Corte mínimo de n.</strong> Não divulgue recortes com menos de 5 a 7 respondentes.</li>
      <li><strong>Devolutiva em até 30 dias.</strong> Sem retorno, a adesão da próxima rodada despenca.</li>
    </ol>

    <h2>Limites que vale reconhecer</h2>
    <ul>
      <li>É autorrelato: mede percepção, não condição objetiva. Deve ser combinado com observação e diálogo.</li>
      <li>Comparações entre empresas exigem cautela quanto a setor, porte e momento organizacional.</li>
      <li>Uma única aplicação não é gestão de risco — é fotografia. O valor está na série histórica.</li>
    </ul>

    <h2>Onde o COPSOQ entra no Cuidar+ Trabalho</h2>
    <p>
      No <Link to="/trabalho" className="underline">Cuidar+ Trabalho</Link> o COPSOQ II ocupa a segunda
      onda do ciclo, depois do rastreio de sintomas e antes das camadas de clima e conduta. O relatório
      sai já classificado por dimensão, com bloqueio automático de recortes com n insuficiente e formato
      pronto para anexar à AEP.
    </p>

    <h2>Referências</h2>
    <ul className="text-xs text-muted-foreground">
      <li>Pejtersen, J. H. et al. (2010). The second version of the Copenhagen Psychosocial Questionnaire. <em>Scandinavian Journal of Public Health</em>, 38(3 Suppl), 8–24.</li>
      <li>Silva, C. et al. (2011). <em>Copenhagen Psychosocial Questionnaire — Portugal e Países Africanos de Língua Oficial Portuguesa</em>. Universidade de Aveiro.</li>
      <li>Kristensen, T. S. et al. (2005). The Copenhagen Psychosocial Questionnaire — a tool for the assessment and improvement of the psychosocial work environment. <em>Scand J Work Environ Health</em>, 31(6).</li>
    </ul>
  </ArticleLayout>
);

export default Copsoq;
