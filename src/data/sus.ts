// Canais nacionais de apoio em saúde mental no Brasil
export const nationalChannels = [
  {
    name: "CVV — Centro de Valorização da Vida",
    phone: "188",
    description: "Apoio emocional e prevenção do suicídio. Ligação gratuita 24h, todos os dias.",
    site: "https://www.cvv.org.br",
    emergency: true,
  },
  {
    name: "SAMU — Emergências médicas",
    phone: "192",
    description: "Acione em caso de risco imediato à vida. Atendimento gratuito 24h.",
    site: null,
    emergency: true,
  },
  {
    name: "Disque 100 — Direitos Humanos",
    phone: "100",
    description: "Atendimento para situações de violência e violação de direitos.",
    site: null,
    emergency: false,
  },
  {
    name: "Disque Saúde",
    phone: "136",
    description: "Informações sobre serviços do SUS, incluindo saúde mental.",
    site: null,
    emergency: false,
  },
];

// Tipos de unidades do SUS para saúde mental
export const susUnits = [
  {
    name: "CAPS — Centro de Atenção Psicossocial",
    description:
      "Unidades especializadas em saúde mental do SUS. Atendimento gratuito por equipe multiprofissional (psiquiatras, psicólogos, terapeutas). Existem CAPS para adultos (CAPS I, II, III), infantojuvenil (CAPSi) e álcool/drogas (CAPS-AD).",
    howTo:
      "Procure o CAPS mais próximo da sua casa. Não é necessário encaminhamento — você pode chegar por demanda espontânea.",
  },
  {
    name: "UBS — Unidade Básica de Saúde (Posto de Saúde)",
    description:
      "Porta de entrada do SUS. Médicos da família podem fazer avaliação inicial, prescrever tratamento e encaminhar para o CAPS quando necessário.",
    howTo: "Vá à UBS do seu bairro com um documento com foto e o cartão SUS.",
  },
  {
    name: "NASF — Núcleo Ampliado de Saúde da Família",
    description:
      "Equipes multiprofissionais que atuam junto às UBS, incluindo psicólogos para apoio matricial.",
    howTo: "Solicite o atendimento na sua UBS de referência.",
  },
];

// Busca telefones de CAPS / UBS para agendar consulta psicológica/psiquiátrica
export function buildPhoneSearchUrl(city: string, state: string) {
  const query = encodeURIComponent(
    `telefone CAPS OR "Centro de Atenção Psicossocial" OR "secretaria de saúde" agendamento psicólogo psiquiatra ${city} ${state}`
  );
  return `https://www.google.com/search?q=${query}`;
}

// Mapa com telefones reais (clicáveis no celular) das unidades próximas
export function buildGoogleMapsUrl(city: string, state: string) {
  const query = encodeURIComponent(`CAPS Centro de Atenção Psicossocial ${city} ${state}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

// Telefone da Secretaria Municipal de Saúde (busca direcionada)
export function buildSecretariaSearchUrl(city: string, state: string) {
  const query = encodeURIComponent(`telefone Secretaria Municipal de Saúde ${city} ${state} agendamento`);
  return `https://www.google.com/search?q=${query}`;
}
