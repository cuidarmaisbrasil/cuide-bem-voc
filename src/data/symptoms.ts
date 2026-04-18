// Os 10 sintomas clássicos de depressão/transtorno depressivo maior (baseado em DSM-5 / CID-11)
export const tenSymptoms = [
  {
    id: "humor",
    title: "Humor deprimido na maior parte do dia",
    description: "Sentimento persistente de tristeza, vazio ou desesperança por quase todos os dias.",
  },
  {
    id: "anedonia",
    title: "Perda de interesse ou prazer",
    description: "Diminuição acentuada do prazer em atividades que antes eram agradáveis.",
  },
  {
    id: "peso",
    title: "Alterações no apetite ou peso",
    description: "Perda ou ganho significativo de peso sem dieta, ou mudança importante no apetite.",
  },
  {
    id: "sono",
    title: "Alterações no sono",
    description: "Insônia ou sono em excesso (hipersonia) quase todos os dias.",
  },
  {
    id: "psicomotor",
    title: "Agitação ou lentidão psicomotora",
    description: "Inquietação visível ou movimentos/pensamento mais lentos que o habitual.",
  },
  {
    id: "fadiga",
    title: "Fadiga ou perda de energia",
    description: "Cansaço persistente, sensação de não ter energia mesmo após descanso.",
  },
  {
    id: "culpa",
    title: "Sentimentos de inutilidade ou culpa excessiva",
    description: "Auto-crítica intensa, culpa desproporcional ou sensação de ser um fardo.",
  },
  {
    id: "concentracao",
    title: "Dificuldade de concentração",
    description: "Problemas para pensar, concentrar-se ou tomar decisões cotidianas.",
  },
  {
    id: "morte",
    title: "Pensamentos sobre morte ou suicídio",
    description: "Pensamentos recorrentes sobre morte, ideação suicida ou planos.",
  },
  {
    id: "sintomas-fisicos",
    title: "Sintomas físicos sem causa clara",
    description: "Dores de cabeça, dores no corpo, problemas digestivos sem explicação médica.",
  },
] as const;

// PHQ-9 — instrumento validado internacionalmente (OMS / Pfizer)
export const phq9Questions = [
  "Pouco interesse ou prazer em fazer as coisas",
  "Sentir-se para baixo, deprimido(a) ou sem perspectiva",
  "Dificuldade para pegar no sono, permanecer dormindo, ou dormir demais",
  "Sentir-se cansado(a) ou com pouca energia",
  "Falta de apetite ou comendo demais",
  "Sentir-se mal consigo mesmo(a) — ou achar que é um fracasso ou que decepcionou sua família",
  "Dificuldade de concentrar-se nas coisas (ler o jornal, ver TV)",
  "Lentidão para se movimentar ou falar a ponto das pessoas perceberem — ou o oposto, estar muito agitado(a)",
  "Pensar em se ferir de alguma forma ou que seria melhor estar morto(a)",
] as const;

export const phq9Options = [
  { label: "Nenhuma vez", value: 0 },
  { label: "Vários dias", value: 1 },
  { label: "Mais da metade dos dias", value: 2 },
  { label: "Quase todos os dias", value: 3 },
] as const;

export function interpretPhq9(score: number) {
  if (score <= 4) return { level: "Mínima", color: "success", description: "Sintomas mínimos ou ausentes." };
  if (score <= 9) return { level: "Leve", color: "primary", description: "Depressão leve — observação recomendada." };
  if (score <= 14) return { level: "Moderada", color: "warning", description: "Depressão moderada — busca de avaliação profissional recomendada." };
  if (score <= 19) return { level: "Moderadamente grave", color: "warning", description: "Depressão moderadamente grave — tratamento ativo recomendado." };
  return { level: "Grave", color: "destructive", description: "Depressão grave — buscar atendimento profissional o quanto antes." };
}
