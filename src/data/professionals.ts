// Lista de profissionais parceiros (placeholder — edite conforme parcerias reais)
export interface Professional {
  name: string;
  title: string;
  specialty: string;
  modality: string;
  city: string;
  priceFrom: string;
  contact: string;
  whatsapp?: string;
  bio: string;
}

export const professionals: Professional[] = [
  {
    name: "Espaço Acolher Psicologia",
    title: "Clínica social",
    specialty: "Depressão, ansiedade e luto",
    modality: "Presencial e online",
    city: "São Paulo, SP",
    priceFrom: "R$ 60",
    contact: "(11) 0000-0000",
    whatsapp: "5511000000000",
    bio: "Atendimento por psicólogos clínicos formados, com valores sociais a partir de R$ 60 por sessão.",
  },
  {
    name: "Coletivo Mente Sã",
    title: "Coletivo de psicólogos",
    specialty: "Transtorno depressivo maior, distimia",
    modality: "Online (Brasil todo)",
    city: "Atendimento nacional",
    priceFrom: "R$ 80",
    contact: "contato@exemplo.com",
    whatsapp: "5511000000000",
    bio: "Coletivo focado em democratizar o acesso à psicoterapia. Sessões online com valores acessíveis.",
  },
  {
    name: "Instituto Equilíbrio",
    title: "Clínica popular",
    specialty: "Depressão e prevenção do suicídio",
    modality: "Presencial",
    city: "Rio de Janeiro, RJ",
    priceFrom: "R$ 70",
    contact: "(21) 0000-0000",
    whatsapp: "5521000000000",
    bio: "Equipe de psicólogos e psiquiatras com atendimentos a preços populares e plantão semanal.",
  },
  {
    name: "Unolife",
    title: "Plataforma de saúde mental",
    specialty: "Depressão, ansiedade e bem-estar emocional",
    modality: "Online (Brasil todo)",
    city: "Atendimento nacional",
    priceFrom: "R$ 70",
    contact: "https://www.unolife.com.br",
    bio: "Plataforma online que conecta pacientes a psicólogos com valores acessíveis e agendamento flexível.",
  },
];
