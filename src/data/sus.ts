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

// Plataformas municipais oficiais de agendamento de consultas no SUS
// A correspondência é feita por (cidade normalizada, UF). Quando não houver
// plataforma municipal específica, usamos o fallback nacional "Meu SUS Digital".
export interface MunicipalPlatform {
  city: string;        // nome da cidade (referência humana)
  state: string;       // UF
  name: string;        // nome da plataforma
  url: string;         // link direto
  description: string; // o que oferece
}

export const municipalPlatforms: MunicipalPlatform[] = [
  {
    city: "Recife",
    state: "PE",
    name: "Conecta Recife — Saúde",
    url: "https://conecta-saude.recife.pe.gov.br",
    description:
      "Portal oficial da Prefeitura do Recife para marcação gratuita de consultas médicas nas unidades do SUS municipal.",
  },
  {
    city: "São Paulo",
    state: "SP",
    name: "Agenda Fácil — Prefeitura de SP",
    url: "https://agendafacil.prefeitura.sp.gov.br/saude",
    description:
      "Plataforma e app oficial da Prefeitura de São Paulo para agendar consultas e exames nas UBS do município.",
  },
  {
    city: "Rio de Janeiro",
    state: "RJ",
    name: "MinhaSaúde.Rio",
    url: "https://web2.smsrio.org/portalPaciente/",
    description:
      "Portal oficial da Prefeitura do Rio para marcação de consultas médicas e odontológicas nas unidades do SUS carioca.",
  },
  {
    city: "Belo Horizonte",
    state: "MG",
    name: "Agendamento SIGA — PBH",
    url: "https://agendamentoeletronico.pbh.gov.br/agendamento/",
    description:
      "Sistema oficial da Prefeitura de Belo Horizonte para agendamento eletrônico de serviços, incluindo saúde.",
  },
  {
    city: "Curitiba",
    state: "PR",
    name: "Saúde Já Curitiba",
    url: "https://saudeja.curitiba.pr.gov.br/",
    description:
      "Portal e app oficial da Prefeitura de Curitiba para agendar o primeiro atendimento nas Unidades Municipais de Saúde (SUS).",
  },
  {
    city: "Porto Alegre",
    state: "RS",
    name: "Saúde Cidadão — Porto Alegre",
    url: "https://prefeitura.poa.br/saudecidadao",
    description:
      "Portal oficial da Prefeitura de Porto Alegre para agendamento online de consultas e exames no SUS municipal.",
  },
];

// Fallback nacional: app do Ministério da Saúde, disponível em mais de 500 municípios
export const meuSusDigital = {
  name: "Meu SUS Digital (app nacional)",
  url: "https://meususdigital.saude.gov.br/",
  description:
    "App oficial do Ministério da Saúde. Permite agendar e gerenciar consultas em UBS de mais de 500 municípios brasileiros. Verifique se sua cidade já está integrada.",
};

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function findMunicipalPlatform(city: string, state: string): MunicipalPlatform | null {
  if (!city || !state) return null;
  const c = normalize(city);
  const uf = state.trim().toUpperCase();
  return (
    municipalPlatforms.find((p) => normalize(p.city) === c && p.state === uf) ?? null
  );
}
