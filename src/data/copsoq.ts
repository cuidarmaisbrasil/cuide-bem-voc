// COPSOQ II — Versões Curta, Média e Longa
// Tradução portuguesa: Silva, C. et al., 2011 (Universidade de Aveiro)
// Original: Kristensen, T. et al., 2001 (Danish National Institute for Occupational Health)
//
// Escala de resposta: 1=Nunca/quase nunca ... 5=Sempre  (ou 1=Nada/quase nada ... 5=Extremamente)
// Pontuação COPSOQ II padrão: 1→0, 2→25, 3→50, 4→75, 5→100
//
// Cada pergunta pertence a uma "escala". As escalas são classificadas como:
//   - "positive" (recurso): valor alto = bom (ex: apoio social, influência)
//   - "negative" (exigência/risco): valor alto = ruim (ex: stress, exigências)
// Itens com `reverse: true` invertem antes da média da escala.

export type CopsoqVersion = "short" | "medium" | "long";

export type CopsoqScaleType = "positive" | "negative";

export interface CopsoqScale {
  id: string;
  name: string;
  type: CopsoqScaleType;
  /** Faixa "Risco / Atenção / Saudável" — valores 0-100 normalizados */
  description?: string;
}

export interface CopsoqQuestion {
  n: number;
  text: string;
  scale: string;
  reverse?: boolean;
  /** "freq" = 1-Nunca…5-Sempre | "intens" = 1-Nada…5-Extremamente | "saude" = 1-Excelente…5-Deficitária */
  responseSet: "freq" | "intens" | "saude";
}

export const responseLabels = {
  freq: ["Nunca / quase nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"],
  intens: ["Nada / quase nada", "Um pouco", "Moderadamente", "Muito", "Extremamente"],
  saude: ["Excelente", "Muito boa", "Boa", "Razoável", "Deficitária"],
} as const;

/** Escalas usadas em qualquer das versões. */
export const copsoqScales: Record<string, CopsoqScale> = {
  quantitative_demands: { id: "quantitative_demands", name: "Exigências quantitativas", type: "negative" },
  work_pace: { id: "work_pace", name: "Ritmo de trabalho", type: "negative" },
  cognitive_demands: { id: "cognitive_demands", name: "Exigências cognitivas", type: "negative" },
  emotional_demands: { id: "emotional_demands", name: "Exigências emocionais", type: "negative" },
  hide_emotions: { id: "hide_emotions", name: "Exigência de esconder emoções", type: "negative" },
  influence: { id: "influence", name: "Influência no trabalho", type: "positive" },
  development: { id: "development", name: "Possibilidades de desenvolvimento", type: "positive" },
  variation: { id: "variation", name: "Variação no trabalho", type: "positive" },
  meaning: { id: "meaning", name: "Significado do trabalho", type: "positive" },
  commitment: { id: "commitment", name: "Compromisso com o local de trabalho", type: "positive" },
  predictability: { id: "predictability", name: "Previsibilidade", type: "positive" },
  recognition: { id: "recognition", name: "Reconhecimento (recompensa)", type: "positive" },
  role_clarity: { id: "role_clarity", name: "Clareza do papel", type: "positive" },
  role_conflict: { id: "role_conflict", name: "Conflito de papéis", type: "negative" },
  leadership_quality: { id: "leadership_quality", name: "Qualidade da liderança", type: "positive" },
  social_support_colleagues: { id: "social_support_colleagues", name: "Apoio social de colegas", type: "positive" },
  social_support_supervisors: { id: "social_support_supervisors", name: "Apoio social do superior", type: "positive" },
  community: { id: "community", name: "Sentido de comunidade", type: "positive" },
  job_satisfaction: { id: "job_satisfaction", name: "Satisfação no trabalho", type: "positive" },
  insecurity: { id: "insecurity", name: "Insegurança laboral", type: "negative" },
  vertical_trust: { id: "vertical_trust", name: "Confiança vertical", type: "positive" },
  horizontal_trust: { id: "horizontal_trust", name: "Confiança horizontal", type: "positive" },
  justice: { id: "justice", name: "Justiça e respeito", type: "positive" },
  self_efficacy: { id: "self_efficacy", name: "Auto-eficácia", type: "positive" },
  general_health: { id: "general_health", name: "Saúde geral", type: "positive" },
  work_family_conflict: { id: "work_family_conflict", name: "Conflito trabalho–família", type: "negative" },
  family_work_conflict: { id: "family_work_conflict", name: "Conflito família–trabalho", type: "negative" },
  sleep: { id: "sleep", name: "Problemas de sono", type: "negative" },
  burnout: { id: "burnout", name: "Burnout", type: "negative" },
  stress: { id: "stress", name: "Stress", type: "negative" },
  depressive: { id: "depressive", name: "Sintomas depressivos", type: "negative" },
  somatic: { id: "somatic", name: "Sintomas somáticos de stress", type: "negative" },
  cognitive_stress: { id: "cognitive_stress", name: "Sintomas cognitivos de stress", type: "negative" },
  offensive: { id: "offensive", name: "Comportamentos ofensivos", type: "negative" },
};

// --------- VERSÃO CURTA (41 itens) ---------
export const copsoqShort: CopsoqQuestion[] = [
  { n: 1, text: "A sua carga de trabalho acumula-se por ser mal distribuída?", scale: "quantitative_demands", responseSet: "freq" },
  { n: 2, text: "Com que frequência não tem tempo para completar todas as tarefas do seu trabalho?", scale: "quantitative_demands", responseSet: "freq" },
  { n: 3, text: "Precisa trabalhar muito rapidamente?", scale: "work_pace", responseSet: "freq" },
  { n: 4, text: "O seu trabalho exige a sua atenção constante?", scale: "cognitive_demands", responseSet: "freq" },
  { n: 5, text: "O seu trabalho exige que tome decisões difíceis?", scale: "cognitive_demands", responseSet: "freq" },
  { n: 6, text: "O seu trabalho exige emocionalmente de si?", scale: "emotional_demands", responseSet: "freq" },
  { n: 7, text: "Tem um elevado grau de influência no seu trabalho?", scale: "influence", responseSet: "freq" },
  { n: 8, text: "O seu trabalho exige que tenha iniciativa?", scale: "development", responseSet: "freq" },
  { n: 9, text: "O seu trabalho permite-lhe aprender coisas novas?", scale: "development", responseSet: "freq" },
  { n: 10, text: "No seu local de trabalho, é informado com antecedência sobre decisões importantes, mudanças ou planos para o futuro?", scale: "predictability", responseSet: "freq" },
  { n: 11, text: "Recebe toda a informação de que necessita para fazer bem o seu trabalho?", scale: "predictability", responseSet: "freq" },
  { n: 12, text: "Sabe exactamente quais as suas responsabilidades?", scale: "role_clarity", responseSet: "freq" },
  { n: 13, text: "O seu trabalho é reconhecido e apreciado pela gerência?", scale: "recognition", responseSet: "freq" },
  { n: 14, text: "É tratado de forma justa no seu local de trabalho?", scale: "justice", responseSet: "freq" },
  { n: 15, text: "Com que frequência tem ajuda e apoio do seu superior imediato?", scale: "social_support_supervisors", responseSet: "freq" },
  { n: 16, text: "Existe um bom ambiente de trabalho entre si e os seus colegas?", scale: "community", responseSet: "freq" },
  { n: 17, text: "A chefia oferece aos indivíduos e ao grupo boas oportunidades de desenvolvimento?", scale: "leadership_quality", responseSet: "freq" },
  { n: 18, text: "A chefia é boa no planeamento do trabalho?", scale: "leadership_quality", responseSet: "freq" },
  { n: 19, text: "A gerência confia nos seus funcionários para fazerem o seu trabalho bem?", scale: "vertical_trust", responseSet: "freq" },
  { n: 20, text: "Confia na informação que lhe é transmitida pela gerência?", scale: "vertical_trust", responseSet: "freq" },
  { n: 21, text: "Os conflitos são resolvidos de uma forma justa?", scale: "justice", responseSet: "freq" },
  { n: 22, text: "O trabalho é igualmente distribuído pelos funcionários?", scale: "justice", responseSet: "freq" },
  { n: 23, text: "Sou sempre capaz de resolver problemas, se tentar o suficiente.", scale: "self_efficacy", responseSet: "freq" },
  { n: 24, text: "O seu trabalho tem algum significado para si?", scale: "meaning", responseSet: "intens" },
  { n: 25, text: "Sente que o seu trabalho é importante?", scale: "meaning", responseSet: "intens" },
  { n: 26, text: "Sente que os problemas do seu local de trabalho são seus também?", scale: "commitment", responseSet: "intens" },
  { n: 27, text: "Quão satisfeito está com o seu trabalho de uma forma global?", scale: "job_satisfaction", responseSet: "intens" },
  { n: 28, text: "Sente-se preocupado em ficar desempregado?", scale: "insecurity", responseSet: "intens" },
  { n: 29, text: "Em geral, sente que a sua saúde é:", scale: "general_health", responseSet: "saude", reverse: true },
  { n: 30, text: "Sente que o seu trabalho lhe exige muita energia que acaba por afectar a sua vida privada negativamente?", scale: "work_family_conflict", responseSet: "intens" },
  { n: 31, text: "Sente que o seu trabalho lhe exige muito tempo que acaba por afectar a sua vida privada negativamente?", scale: "work_family_conflict", responseSet: "intens" },
  { n: 32, text: "Acordou várias vezes durante a noite e depois não conseguia adormecer novamente?", scale: "sleep", responseSet: "freq" },
  { n: 33, text: "Sentiu-se fisicamente exausto?", scale: "burnout", responseSet: "freq" },
  { n: 34, text: "Sentiu-se emocionalmente exausto?", scale: "burnout", responseSet: "freq" },
  { n: 35, text: "Sentiu-se irritado?", scale: "stress", responseSet: "freq" },
  { n: 36, text: "Sentiu-se ansioso?", scale: "stress", responseSet: "freq" },
  { n: 37, text: "Sentiu-se triste?", scale: "depressive", responseSet: "freq" },
  { n: 38, text: "Tem sido alvo de insultos ou provocações verbais no trabalho?", scale: "offensive", responseSet: "freq" },
  { n: 39, text: "Tem sido exposto a assédio sexual indesejado no trabalho?", scale: "offensive", responseSet: "freq" },
  { n: 40, text: "Tem sido exposto a ameaças de violência no trabalho?", scale: "offensive", responseSet: "freq" },
  { n: 41, text: "Tem sido exposto a violência física no trabalho?", scale: "offensive", responseSet: "freq" },
];

// --------- VERSÃO MÉDIA (76 itens) ---------
// (extraídos do manual COPSOQ II PT — Silva et al., 2011)
export const copsoqMedium: CopsoqQuestion[] = [
  { n: 1, text: "A sua carga de trabalho acumula-se por ser mal distribuída?", scale: "quantitative_demands", responseSet: "freq" },
  { n: 2, text: "Com que frequência não tem tempo para completar todas as tarefas do seu trabalho?", scale: "quantitative_demands", responseSet: "freq" },
  { n: 3, text: "Precisa fazer horas-extra?", scale: "quantitative_demands", responseSet: "freq" },
  { n: 4, text: "Precisa trabalhar muito rapidamente?", scale: "work_pace", responseSet: "freq" },
  { n: 5, text: "O seu trabalho exige a sua atenção constante?", scale: "cognitive_demands", responseSet: "freq" },
  { n: 6, text: "O seu trabalho requer que seja bom a propor novas ideias?", scale: "cognitive_demands", responseSet: "freq" },
  { n: 7, text: "O seu trabalho exige que tome decisões difíceis?", scale: "cognitive_demands", responseSet: "freq" },
  { n: 8, text: "O seu trabalho exige emocionalmente de si?", scale: "emotional_demands", responseSet: "freq" },
  { n: 9, text: "Tem um elevado grau de influência no seu trabalho?", scale: "influence", responseSet: "freq" },
  { n: 10, text: "Participa na escolha das pessoas com quem trabalha?", scale: "influence", responseSet: "freq" },
  { n: 11, text: "Pode influenciar a quantidade de trabalho que lhe compete a si?", scale: "influence", responseSet: "freq" },
  { n: 12, text: "Tem alguma influência sobre o tipo de tarefas que faz?", scale: "influence", responseSet: "freq" },
  { n: 13, text: "O seu trabalho exige que tenha iniciativa?", scale: "development", responseSet: "freq" },
  { n: 14, text: "O seu trabalho permite-lhe aprender coisas novas?", scale: "development", responseSet: "freq" },
  { n: 15, text: "O seu trabalho permite-lhe usar as suas habilidades ou perícias?", scale: "development", responseSet: "freq" },
  { n: 16, text: "É informado com antecedência sobre decisões importantes, mudanças ou planos para o futuro?", scale: "predictability", responseSet: "freq" },
  { n: 17, text: "Recebe toda a informação de que necessita para fazer bem o seu trabalho?", scale: "predictability", responseSet: "freq" },
  { n: 18, text: "O seu trabalho apresenta objectivos claros?", scale: "role_clarity", responseSet: "freq" },
  { n: 19, text: "Sabe exactamente quais as suas responsabilidades?", scale: "role_clarity", responseSet: "freq" },
  { n: 20, text: "Sabe exactamente o que é esperado de si?", scale: "role_clarity", responseSet: "freq" },
  { n: 21, text: "O seu trabalho é reconhecido e apreciado pela gerência?", scale: "recognition", responseSet: "freq" },
  { n: 22, text: "A gerência do seu local de trabalho respeita-o?", scale: "recognition", responseSet: "freq" },
  { n: 23, text: "É tratado de forma justa no seu local de trabalho?", scale: "justice", responseSet: "freq" },
  { n: 24, text: "Faz coisas no seu trabalho que uns concordam mas outros não?", scale: "role_conflict", responseSet: "freq" },
  { n: 25, text: "Por vezes tem que fazer coisas que deveriam ser feitas de outra maneira?", scale: "role_conflict", responseSet: "freq" },
  { n: 26, text: "Por vezes tem que fazer coisas que considera desnecessárias?", scale: "role_conflict", responseSet: "freq" },
  { n: 27, text: "Com que frequência tem ajuda e apoio dos seus colegas de trabalho?", scale: "social_support_colleagues", responseSet: "freq" },
  { n: 28, text: "Com que frequência os seus colegas estão dispostos a ouvi-lo(a) sobre os seus problemas de trabalho?", scale: "social_support_colleagues", responseSet: "freq" },
  { n: 29, text: "Com que frequência os seus colegas falam consigo acerca do seu desempenho laboral?", scale: "social_support_colleagues", responseSet: "freq" },
  { n: 30, text: "Com que frequência o seu superior imediato fala consigo sobre como está a decorrer o seu trabalho?", scale: "social_support_supervisors", responseSet: "freq" },
  { n: 31, text: "Com que frequência tem ajuda e apoio do seu superior imediato?", scale: "social_support_supervisors", responseSet: "freq" },
  { n: 32, text: "Com que frequência o seu superior imediato fala consigo em relação ao seu desempenho laboral?", scale: "social_support_supervisors", responseSet: "freq" },
  { n: 33, text: "Existe um bom ambiente de trabalho entre si e os seus colegas?", scale: "community", responseSet: "freq" },
  { n: 34, text: "Existe uma boa cooperação entre os colegas de trabalho?", scale: "community", responseSet: "freq" },
  { n: 35, text: "No seu local de trabalho sente-se parte de uma comunidade?", scale: "community", responseSet: "freq" },
  { n: 36, text: "A chefia oferece aos indivíduos e ao grupo boas oportunidades de desenvolvimento?", scale: "leadership_quality", responseSet: "freq" },
  { n: 37, text: "A chefia dá prioridade à satisfação no trabalho?", scale: "leadership_quality", responseSet: "freq" },
  { n: 38, text: "A chefia é boa no planeamento do trabalho?", scale: "leadership_quality", responseSet: "freq" },
  { n: 39, text: "A chefia é boa a resolver conflitos?", scale: "leadership_quality", responseSet: "freq" },
  { n: 40, text: "Os funcionários ocultam informações uns dos outros?", scale: "horizontal_trust", responseSet: "freq", reverse: true },
  { n: 41, text: "Os funcionários ocultam informação à gerência?", scale: "vertical_trust", responseSet: "freq", reverse: true },
  { n: 42, text: "Os funcionários confiam uns nos outros de um modo geral?", scale: "horizontal_trust", responseSet: "freq" },
  { n: 43, text: "A gerência confia nos seus funcionários para fazerem o seu trabalho bem?", scale: "vertical_trust", responseSet: "freq" },
  { n: 44, text: "Confia na informação que lhe é transmitida pela gerência?", scale: "vertical_trust", responseSet: "freq" },
  { n: 45, text: "A gerência oculta informação aos seus funcionários?", scale: "vertical_trust", responseSet: "freq", reverse: true },
  { n: 46, text: "Os conflitos são resolvidos de uma forma justa?", scale: "justice", responseSet: "freq" },
  { n: 47, text: "As sugestões dos funcionários são tratadas de forma séria pela gerência?", scale: "justice", responseSet: "freq" },
  { n: 48, text: "O trabalho é igualmente distribuído pelos funcionários?", scale: "justice", responseSet: "freq" },
  { n: 49, text: "Sou sempre capaz de resolver problemas, se tentar o suficiente.", scale: "self_efficacy", responseSet: "freq" },
  { n: 50, text: "É-me fácil seguir os meus planos e atingir os meus objectivos.", scale: "self_efficacy", responseSet: "freq" },
  { n: 51, text: "O seu trabalho tem algum significado para si?", scale: "meaning", responseSet: "intens" },
  { n: 52, text: "Sente que o seu trabalho é importante?", scale: "meaning", responseSet: "intens" },
  { n: 53, text: "Sente-se motivado e envolvido com o seu trabalho?", scale: "commitment", responseSet: "intens" },
  { n: 54, text: "Gosta de falar com os outros sobre o seu local de trabalho?", scale: "commitment", responseSet: "intens" },
  { n: 55, text: "Sente que os problemas do seu local de trabalho são seus também?", scale: "commitment", responseSet: "intens" },
  { n: 56, text: "Quão satisfeito está com as suas perspectivas de trabalho?", scale: "job_satisfaction", responseSet: "intens" },
  { n: 57, text: "Quão satisfeito está com as condições físicas do seu local de trabalho?", scale: "job_satisfaction", responseSet: "intens" },
  { n: 58, text: "Quão satisfeito está com a forma como as suas capacidades são utilizadas?", scale: "job_satisfaction", responseSet: "intens" },
  { n: 59, text: "Quão satisfeito está com o seu trabalho de uma forma global?", scale: "job_satisfaction", responseSet: "intens" },
  { n: 60, text: "Sente-se preocupado em ficar desempregado?", scale: "insecurity", responseSet: "intens" },
  { n: 61, text: "Em geral, sente que a sua saúde é:", scale: "general_health", responseSet: "saude", reverse: true },
  { n: 62, text: "Sente que o seu trabalho lhe exige muita energia que acaba por afectar a sua vida privada negativamente?", scale: "work_family_conflict", responseSet: "intens" },
  { n: 63, text: "Sente que o seu trabalho lhe exige muito tempo que acaba por afectar a sua vida privada negativamente?", scale: "work_family_conflict", responseSet: "intens" },
  { n: 64, text: "A sua família e os seus amigos dizem-lhe que trabalha demais?", scale: "work_family_conflict", responseSet: "intens" },
  { n: 65, text: "Teve dificuldade em adormecer?", scale: "sleep", responseSet: "freq" },
  { n: 66, text: "Acordou várias vezes durante a noite e depois não conseguia adormecer novamente?", scale: "sleep", responseSet: "freq" },
  { n: 67, text: "Sentiu-se fisicamente exausto?", scale: "burnout", responseSet: "freq" },
  { n: 68, text: "Sentiu-se emocionalmente exausto?", scale: "burnout", responseSet: "freq" },
  { n: 69, text: "Sentiu-se irritado?", scale: "stress", responseSet: "freq" },
  { n: 70, text: "Sentiu-se ansioso?", scale: "stress", responseSet: "freq" },
  { n: 71, text: "Sentiu-se triste?", scale: "depressive", responseSet: "freq" },
  { n: 72, text: "Sentiu falta de interesse por coisas quotidianas?", scale: "depressive", responseSet: "freq" },
  { n: 73, text: "Tem sido alvo de insultos ou provocações verbais no trabalho?", scale: "offensive", responseSet: "freq" },
  { n: 74, text: "Tem sido exposto a assédio sexual indesejado no trabalho?", scale: "offensive", responseSet: "freq" },
  { n: 75, text: "Tem sido exposto a ameaças de violência no trabalho?", scale: "offensive", responseSet: "freq" },
  { n: 76, text: "Tem sido exposto a violência física no trabalho?", scale: "offensive", responseSet: "freq" },
];

// --------- VERSÃO LONGA (119 itens) ---------
export const copsoqLong: CopsoqQuestion[] = [
  // Demands (1-14)
  { n: 1, text: "A sua carga de trabalho acumula-se por ser mal distribuída?", scale: "quantitative_demands", responseSet: "freq" },
  { n: 2, text: "Com que frequência não tem tempo para completar todas as tarefas do seu trabalho?", scale: "quantitative_demands", responseSet: "freq" },
  { n: 3, text: "Precisa fazer horas-extra?", scale: "quantitative_demands", responseSet: "freq" },
  { n: 4, text: "Precisa trabalhar muito rapidamente?", scale: "work_pace", responseSet: "freq" },
  { n: 5, text: "O seu trabalho exige a sua atenção constante?", scale: "cognitive_demands", responseSet: "freq" },
  { n: 6, text: "O seu trabalho requer que seja bom a propor novas ideias?", scale: "cognitive_demands", responseSet: "freq" },
  { n: 7, text: "O seu trabalho exige que tome decisões difíceis?", scale: "cognitive_demands", responseSet: "freq" },
  { n: 8, text: "O seu trabalho coloca-o em situações emocionalmente perturbadoras?", scale: "emotional_demands", responseSet: "freq" },
  { n: 9, text: "O seu trabalho exige emocionalmente de si?", scale: "emotional_demands", responseSet: "freq" },
  { n: 10, text: "Sente-se emocionalmente envolvido com o seu trabalho?", scale: "emotional_demands", responseSet: "freq" },
  { n: 11, text: "O seu trabalho requer que não manifeste a sua opinião?", scale: "hide_emotions", responseSet: "freq" },
  { n: 12, text: "O seu trabalho requer que esconda os seus sentimentos?", scale: "hide_emotions", responseSet: "freq" },
  { n: 13, text: "É-lhe exigido que trate todas as pessoas de forma igual embora não se sinta satisfeito com isso?", scale: "hide_emotions", responseSet: "freq" },
  { n: 14, text: "É-lhe exigido que seja simpático com todos, embora sinta que o mesmo não lhe é retribuído?", scale: "hide_emotions", responseSet: "freq" },
  // Work organization (15-22)
  { n: 15, text: "Tem um elevado grau de influência no seu trabalho?", scale: "influence", responseSet: "freq" },
  { n: 16, text: "Participa na escolha das pessoas com quem trabalha?", scale: "influence", responseSet: "freq" },
  { n: 17, text: "Pode influenciar a quantidade de trabalho que lhe compete a si?", scale: "influence", responseSet: "freq" },
  { n: 18, text: "Tem alguma influência sobre o tipo de tarefas que faz?", scale: "influence", responseSet: "freq" },
  { n: 19, text: "O seu trabalho exige que tenha iniciativa?", scale: "development", responseSet: "freq" },
  { n: 20, text: "O seu trabalho permite-lhe aprender coisas novas?", scale: "development", responseSet: "freq" },
  { n: 21, text: "O seu trabalho permite-lhe usar as suas habilidades ou perícias?", scale: "development", responseSet: "freq" },
  { n: 22, text: "O seu trabalho é variado?", scale: "variation", responseSet: "freq" },
  // Information / role (23-31)
  { n: 23, text: "É informado com antecedência sobre decisões importantes, mudanças ou planos para o futuro?", scale: "predictability", responseSet: "freq" },
  { n: 24, text: "Recebe toda a informação de que necessita para fazer bem o seu trabalho?", scale: "predictability", responseSet: "freq" },
  { n: 25, text: "O seu trabalho apresenta objectivos claros?", scale: "role_clarity", responseSet: "freq" },
  { n: 26, text: "Sabe exactamente quais as suas responsabilidades?", scale: "role_clarity", responseSet: "freq" },
  { n: 27, text: "Sabe exactamente o que é esperado de si?", scale: "role_clarity", responseSet: "freq" },
  { n: 28, text: "O seu trabalho é reconhecido e apreciado pela gerência?", scale: "recognition", responseSet: "freq" },
  { n: 29, text: "Há boas perspectivas no seu emprego?", scale: "recognition", responseSet: "freq" },
  { n: 30, text: "A gerência do seu local de trabalho respeita-o?", scale: "recognition", responseSet: "freq" },
  { n: 31, text: "É tratado de forma justa no seu local de trabalho?", scale: "justice", responseSet: "freq" },
  // Role conflict (32-35)
  { n: 32, text: "Faz coisas no seu trabalho que uns concordam mas outros não?", scale: "role_conflict", responseSet: "freq" },
  { n: 33, text: "No seu trabalho são-lhe colocadas exigências contraditórias?", scale: "role_conflict", responseSet: "freq" },
  { n: 34, text: "Por vezes tem que fazer coisas que deveriam ser feitas de outra maneira?", scale: "role_conflict", responseSet: "freq" },
  { n: 35, text: "Por vezes tem que fazer coisas que considera desnecessárias?", scale: "role_conflict", responseSet: "freq" },
  // Social support (36-44)
  { n: 36, text: "Com que frequência tem ajuda e apoio dos seus colegas de trabalho?", scale: "social_support_colleagues", responseSet: "freq" },
  { n: 37, text: "Com que frequência os seus colegas estão dispostos a ouvi-lo(a) sobre os seus problemas de trabalho?", scale: "social_support_colleagues", responseSet: "freq" },
  { n: 38, text: "Com que frequência os seus colegas falam consigo acerca do seu desempenho laboral?", scale: "social_support_colleagues", responseSet: "freq" },
  { n: 39, text: "Com que frequência o seu superior imediato fala consigo sobre como está a decorrer o seu trabalho?", scale: "social_support_supervisors", responseSet: "freq" },
  { n: 40, text: "Com que frequência tem ajuda e apoio do seu superior imediato?", scale: "social_support_supervisors", responseSet: "freq" },
  { n: 41, text: "Com que frequência o seu superior imediato fala consigo em relação ao seu desempenho laboral?", scale: "social_support_supervisors", responseSet: "freq" },
  { n: 42, text: "Existe um bom ambiente de trabalho entre si e os seus colegas?", scale: "community", responseSet: "freq" },
  { n: 43, text: "Existe uma boa cooperação entre os colegas de trabalho?", scale: "community", responseSet: "freq" },
  { n: 44, text: "No seu local de trabalho sente-se parte de uma comunidade?", scale: "community", responseSet: "freq" },
  // Leadership (45-48)
  { n: 45, text: "A chefia oferece aos indivíduos e ao grupo boas oportunidades de desenvolvimento?", scale: "leadership_quality", responseSet: "freq" },
  { n: 46, text: "A chefia dá prioridade à satisfação no trabalho?", scale: "leadership_quality", responseSet: "freq" },
  { n: 47, text: "A chefia é boa no planeamento do trabalho?", scale: "leadership_quality", responseSet: "freq" },
  { n: 48, text: "A chefia é boa a resolver conflitos?", scale: "leadership_quality", responseSet: "freq" },
  // Trust / justice (49-62)
  { n: 49, text: "Os funcionários ocultam informações uns dos outros?", scale: "horizontal_trust", responseSet: "freq", reverse: true },
  { n: 50, text: "Os funcionários ocultam informação à gerência?", scale: "vertical_trust", responseSet: "freq", reverse: true },
  { n: 51, text: "Os funcionários confiam uns nos outros de um modo geral?", scale: "horizontal_trust", responseSet: "freq" },
  { n: 52, text: "A gerência confia nos seus funcionários para fazerem o seu trabalho bem?", scale: "vertical_trust", responseSet: "freq" },
  { n: 53, text: "Confia na informação que lhe é transmitida pela gerência?", scale: "vertical_trust", responseSet: "freq" },
  { n: 54, text: "A gerência oculta informação aos seus funcionários?", scale: "vertical_trust", responseSet: "freq", reverse: true },
  { n: 55, text: "Os conflitos são resolvidos de uma forma justa?", scale: "justice", responseSet: "freq" },
  { n: 56, text: "Os funcionários são apreciados quando fazem um bom trabalho?", scale: "justice", responseSet: "freq" },
  { n: 57, text: "As sugestões dos funcionários são tratadas de forma séria pela gerência?", scale: "justice", responseSet: "freq" },
  { n: 58, text: "O trabalho é igualmente distribuído pelos funcionários?", scale: "justice", responseSet: "freq" },
  { n: 59, text: "Os homens e as mulheres são tratados da mesma forma?", scale: "justice", responseSet: "freq" },
  { n: 60, text: "Existe lugar para funcionários de diferentes raças e religiões?", scale: "community", responseSet: "freq" },
  { n: 61, text: "Existe lugar para funcionários com doenças ou deficiências?", scale: "community", responseSet: "freq" },
  { n: 62, text: "Existe lugar para funcionários da terceira idade?", scale: "community", responseSet: "freq" },
  // Meaning / commitment / satisfaction (63-72)
  { n: 63, text: "O seu trabalho tem significado?", scale: "meaning", responseSet: "intens" },
  { n: 64, text: "Sente que o seu trabalho é importante?", scale: "meaning", responseSet: "intens" },
  { n: 65, text: "Sente-se motivado e envolvido com o seu trabalho?", scale: "commitment", responseSet: "intens" },
  { n: 66, text: "Gosta de falar com os outros sobre o seu local de trabalho?", scale: "commitment", responseSet: "intens" },
  { n: 67, text: "Sente que os problemas do seu local de trabalho são seus também?", scale: "commitment", responseSet: "intens" },
  { n: 68, text: "O seu local de trabalho é de grande importância pessoal para si?", scale: "commitment", responseSet: "intens" },
  { n: 69, text: "Quão satisfeito está com as suas perspectivas de trabalho?", scale: "job_satisfaction", responseSet: "intens" },
  { n: 70, text: "Quão satisfeito está com as condições físicas do seu local de trabalho?", scale: "job_satisfaction", responseSet: "intens" },
  { n: 71, text: "Quão satisfeito está com a forma como as suas capacidades são utilizadas?", scale: "job_satisfaction", responseSet: "intens" },
  { n: 72, text: "Quão satisfeito está com o seu trabalho de uma forma global?", scale: "job_satisfaction", responseSet: "intens" },
  // Insecurity (73-76)
  { n: 73, text: "Sente-se preocupado em ficar desempregado?", scale: "insecurity", responseSet: "intens" },
  { n: 74, text: "Sente-se preocupado que uma nova tecnologia o torne dispensável?", scale: "insecurity", responseSet: "intens" },
  { n: 75, text: "Sente-se preocupado com a dificuldade em conseguir outro trabalho caso ficasse desempregado?", scale: "insecurity", responseSet: "intens" },
  { n: 76, text: "Sente-se preocupado em ser transferido para outro local de trabalho contra a sua vontade?", scale: "insecurity", responseSet: "intens" },
  // Health (77)
  { n: 77, text: "Em geral, sente que a sua saúde é:", scale: "general_health", responseSet: "saude", reverse: true },
  // Work-life (78-82)
  { n: 78, text: "Sente que o seu trabalho lhe exige muita energia que acaba por afectar a sua vida privada negativamente?", scale: "work_family_conflict", responseSet: "intens" },
  { n: 79, text: "Sente que o seu trabalho lhe exige muito tempo que acaba por afectar a sua vida privada negativamente?", scale: "work_family_conflict", responseSet: "intens" },
  { n: 80, text: "A sua família e os seus amigos dizem-lhe que trabalha demais?", scale: "work_family_conflict", responseSet: "intens" },
  { n: 81, text: "Sente que a sua vida privada lhe exige muita energia e que acaba por afectar o seu trabalho negativamente?", scale: "family_work_conflict", responseSet: "intens" },
  { n: 82, text: "Sente que a sua vida privada lhe exige muito tempo e que acaba por afectar o seu trabalho negativamente?", scale: "family_work_conflict", responseSet: "intens" },
  // Sleep (83-86)
  { n: 83, text: "Teve dificuldade em adormecer?", scale: "sleep", responseSet: "freq" },
  { n: 84, text: "Dormiu mal e de forma sobressaltada?", scale: "sleep", responseSet: "freq" },
  { n: 85, text: "Acordou demasiado cedo e depois teve dificuldade em adormecer novamente?", scale: "sleep", responseSet: "freq" },
  { n: 86, text: "Acordou várias vezes durante a noite e depois não conseguia adormecer novamente?", scale: "sleep", responseSet: "freq" },
  // Burnout / stress (87-95)
  { n: 87, text: "Sentiu-se cansado?", scale: "burnout", responseSet: "freq" },
  { n: 88, text: "Sentiu-se esgotado?", scale: "burnout", responseSet: "freq" },
  { n: 89, text: "Sentiu-se fisicamente exausto?", scale: "burnout", responseSet: "freq" },
  { n: 90, text: "Sentiu-se emocionalmente exausto?", scale: "burnout", responseSet: "freq" },
  { n: 91, text: "Teve dificuldades em relaxar?", scale: "stress", responseSet: "freq" },
  { n: 92, text: "Sentiu-se irritado?", scale: "stress", responseSet: "freq" },
  { n: 93, text: "Sentiu-se tenso?", scale: "stress", responseSet: "freq" },
  { n: 94, text: "Sentiu-se ansioso?", scale: "stress", responseSet: "freq" },
  { n: 95, text: "Sentiu-se triste?", scale: "depressive", responseSet: "freq" },
  // Depressive (96-98)
  { n: 96, text: "Sentiu falta de auto-confiança?", scale: "depressive", responseSet: "freq" },
  { n: 97, text: "Sentiu peso na consciência ou sentimento de culpa?", scale: "depressive", responseSet: "freq" },
  { n: 98, text: "Sentiu falta de interesse por coisas quotidianas?", scale: "depressive", responseSet: "freq" },
  // Somatic (99-103)
  { n: 99, text: "Teve dores de barriga?", scale: "somatic", responseSet: "freq" },
  { n: 100, text: "Teve aperto ou dor no peito?", scale: "somatic", responseSet: "freq" },
  { n: 101, text: "Teve dores de cabeça?", scale: "somatic", responseSet: "freq" },
  { n: 102, text: "Teve palpitações?", scale: "somatic", responseSet: "freq" },
  { n: 103, text: "Teve tensão em vários músculos?", scale: "somatic", responseSet: "freq" },
  // Cognitive stress (104-107)
  { n: 104, text: "Teve dificuldade em concentrar-se?", scale: "cognitive_stress", responseSet: "freq" },
  { n: 105, text: "Teve dificuldade em tomar decisões?", scale: "cognitive_stress", responseSet: "freq" },
  { n: 106, text: "Teve dificuldade em lembrar-se de algo?", scale: "cognitive_stress", responseSet: "freq" },
  { n: 107, text: "Teve dificuldade em pensar claramente?", scale: "cognitive_stress", responseSet: "freq" },
  // Self-efficacy (108-113)
  { n: 108, text: "Sou sempre capaz de resolver problemas, se tentar o suficiente.", scale: "self_efficacy", responseSet: "freq" },
  { n: 109, text: "Mesmo que as pessoas trabalhem contra mim, encontro sempre forma de atingir o que pretendo.", scale: "self_efficacy", responseSet: "freq" },
  { n: 110, text: "É-me fácil seguir os meus planos e atingir os meus objectivos.", scale: "self_efficacy", responseSet: "freq" },
  { n: 111, text: "Sinto-me confiante em lidar com acontecimentos inesperados.", scale: "self_efficacy", responseSet: "freq" },
  { n: 112, text: "Quando tenho um problema, usualmente tenho várias maneiras de lidar com o mesmo.", scale: "self_efficacy", responseSet: "freq" },
  { n: 113, text: "Independentemente do que acontecer, costumo encontrar soluções para os meus problemas.", scale: "self_efficacy", responseSet: "freq" },
  // Offensive behavior (114-119)
  { n: 114, text: "Tem-se envolvido em conflitos ou discussões no trabalho?", scale: "offensive", responseSet: "freq" },
  { n: 115, text: "Tem sido alvo de rumores ou calúnias no trabalho?", scale: "offensive", responseSet: "freq" },
  { n: 116, text: "Tem sido alvo de insultos ou provocações verbais no trabalho?", scale: "offensive", responseSet: "freq" },
  { n: 117, text: "Tem sido exposto a assédio sexual indesejado no trabalho?", scale: "offensive", responseSet: "freq" },
  { n: 118, text: "Tem sido exposto a ameaças de violência no trabalho?", scale: "offensive", responseSet: "freq" },
  { n: 119, text: "Tem sido exposto a violência física no trabalho?", scale: "offensive", responseSet: "freq" },
];

export function getCopsoq(version: CopsoqVersion): CopsoqQuestion[] {
  if (version === "short") return copsoqShort;
  if (version === "medium") return copsoqMedium;
  return copsoqLong;
}

export const versionMeta: Record<CopsoqVersion, { label: string; minutes: string; count: number }> = {
  short: { label: "Curta", minutes: "5–7 min", count: copsoqShort.length },
  medium: { label: "Média", minutes: "12–15 min", count: copsoqMedium.length },
  long: { label: "Longa", minutes: "20–25 min", count: copsoqLong.length },
};
