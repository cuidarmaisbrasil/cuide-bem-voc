import ArticleLayout from "@/components/ArticleLayout";

const PlanoAcao = () => (
  <ArticleLayout
    meta={{
      slug: "/blog/plano-de-acao-riscos-psicossociais",
      title: "Plano de ação para riscos psicossociais: estrutura e exemplo",
      description:
        "Como transformar o resultado da avaliação psicossocial em plano de ação exigível pela NR-1: estrutura, hierarquia de controle, prazos e verificação de eficácia.",
      published: "2026-06-16",
      updated: "2026-08-06",
      readingMinutes: 7,
      badge: "Gestão de riscos psicossociais",
    }}
    related={[
      { to: "/blog/nr-1-riscos-psicossociais-passo-a-passo", label: "NR-1 e riscos psicossociais: como cumprir passo a passo" },
      { to: "/blog/nr-1-saude-mental-fiscalizacao", label: "NR-1 e saúde mental: o que a fiscalização verifica" },
    ]}
  >
    <p>
      Medir é a parte fácil. O que a fiscalização cobra — e o que evita o passivo trabalhista — é o
      <strong> plano de ação</strong>: o documento que mostra o que a empresa fez com o resultado. Um
      plano genérico ("promover ações de bem-estar") não sustenta auditoria.
    </p>

    <h2>Regra 1: a ação segue a hierarquia de controle</h2>
    <p>
      Em risco psicossocial vale a mesma lógica dos demais riscos ocupacionais: primeiro elimina-se ou
      reduz-se a fonte organizacional; só depois vêm medidas de apoio individual.
    </p>
    <ol>
      <li><strong>Eliminar a fonte</strong> — encerrar prática de meta inatingível, revisar escala que impede descanso.</li>
      <li><strong>Reduzir na organização</strong> — redimensionar carga, redistribuir demanda, ampliar autonomia decisória.</li>
      <li><strong>Medidas administrativas</strong> — política de desconexão, protocolo de assédio, capacitação de liderança.</li>
      <li><strong>Apoio individual</strong> — canal de acolhimento, encaminhamento assistencial, psicoeducação.</li>
    </ol>
    <p>
      Planos que começam no nível 4 e ignoram os níveis 1 a 3 são o erro mais comum — e o mais fácil de
      um auditor apontar.
    </p>

    <h2>Regra 2: uma linha por dimensão em Atenção ou Risco</h2>
    <p>
      Não se faz plano por pessoa nem por sentimento geral. Faz-se por dimensão classificada. Estrutura
      mínima de cada linha:
    </p>
    <table>
      <thead>
        <tr><th>Campo</th><th>O que registrar</th></tr>
      </thead>
      <tbody>
        <tr><td>Dimensão / fonte</td><td>Ex.: exigências quantitativas — setor de atendimento</td></tr>
        <tr><td>Classificação</td><td>Risco (escore 74/100, n = 38)</td></tr>
        <tr><td>Ação</td><td>Revisão do dimensionamento de fila e limite de contatos simultâneos</td></tr>
        <tr><td>Nível de controle</td><td>Redução na organização</td></tr>
        <tr><td>Responsável</td><td>Nome e cargo (não "RH")</td></tr>
        <tr><td>Prazo</td><td>Data específica</td></tr>
        <tr><td>Recurso</td><td>Orçamento ou headcount necessário</td></tr>
        <tr><td>Verificação de eficácia</td><td>Reavaliação da dimensão no próximo ciclo + indicador operacional</td></tr>
      </tbody>
    </table>

    <h2>Regra 3: a eficácia precisa de comparação</h2>
    <p>
      A NR-1 fala em verificar a eficácia das medidas. Isso só existe com <strong>reavaliação
      comparável</strong>: mesmo instrumento, mesmo recorte, mesma forma de coleta. Um ciclo trimestral
      dá três pontos de série em um ano — suficiente para distinguir efeito de ação de flutuação sazonal.
    </p>

    <h2>Exemplo abreviado de plano</h2>
    <ul>
      <li><strong>Conflito de papel em Risco (logística noturna):</strong> redefinição de matriz de responsabilidade entre supervisão e coordenação; responsável: gerente de operações; prazo: 60 dias; verificação: reavaliação da dimensão + queda de retrabalho.</li>
      <li><strong>Apoio da liderança em Atenção (comercial):</strong> programa de rotinas de feedback quinzenal com registro; responsável: diretoria comercial; prazo: 90 dias; verificação: reavaliação + taxa de reuniões realizadas.</li>
      <li><strong>Comportamentos ofensivos em Risco (unidade B):</strong> apuração pelo canal de ética, revisão do protocolo antiassédio e treinamento obrigatório; responsável: compliance; prazo: 30 dias; verificação: reavaliação e número de denúncias tratadas dentro do SLA.</li>
    </ul>

    <h2>O que evita retrabalho</h2>
    <ul>
      <li>Vincule cada linha do plano ao item correspondente do inventário de riscos.</li>
      <li>Registre também as ações <em>não</em> adotadas e o motivo — decisão documentada protege.</li>
      <li>Guarde a evidência da devolutiva aos trabalhadores; ela costuma ser pedida.</li>
      <li>Não publique nada com n abaixo do corte de privacidade.</li>
    </ul>

    <h2>Referências</h2>
    <ul className="text-xs text-muted-foreground">
      <li>NR-1 — Disposições Gerais e Gerenciamento de Riscos Ocupacionais (Portaria MTE nº 1.419/2024).</li>
      <li>MTE. <em>Guia de informações sobre os Fatores de Riscos Psicossociais Relacionados ao Trabalho</em>, 2025.</li>
      <li>EU-OSHA. <em>Psychosocial risks and stress at work</em> — hierarquia de medidas preventivas.</li>
    </ul>
  </ArticleLayout>
);

export default PlanoAcao;
