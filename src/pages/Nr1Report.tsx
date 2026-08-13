import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { copsoqScales, type CopsoqScaleType } from "@/data/copsoq";

// ============================================================================
// Relatório NR-1 — módulo psicossocial do Inventário de Riscos do PGR.
// NÃO é Avaliação Ergonômica Preliminar (NR-17): os instrumentos do ciclo não
// coletam dados físicos, ambientais nem biomecânicos exigidos pela AEP.
// Documento estruturado nas seções obrigatórias, alimentado exclusivamente
// por dados reais das rodadas de rastreio (wellness-company-stats).
// ============================================================================

interface DeptRow {
  department: string;
  n_copsoq: number;
  n_phq9: number;
  n_psicossocial: number;
  n_assedio_sexual: number;
  hidden: boolean;
  copsoq_scales: Record<string, { mean: number; n: number }>;
  phq9_severity_dist: Record<string, number>;
  lipt_igap: number;
  lipt_flagged_pct: number;
  mdish_total: number;
  mdish_endorsed_pct: number;
}

interface RoundData {
  round_no: number;
  opened_at: string;
  closed_at: string | null;
  devolutiva_communicated_at: string | null;
  devolutiva_notes: string | null;
  status: "open" | "closed" | "devolutiva_communicated";
  waves: Record<string, { scheduled: number; sent: number; completed: number }>;
  copsoq: { n: number; hidden: boolean; scales: Record<string, { mean: number; n: number }> };
  phq9: { n: number; hidden: boolean; severity_dist: Record<string, number> };
  psicossocial: {
    n: number; hidden: boolean;
    IGAP: number; NEAP: number; flagged_pct: number;
    subscales: Record<string, number>;
    flagged_departments: string[];
  };
  assedio_sexual: {
    n: number; hidden: boolean;
    MDiSH_total: number; SHRAS_total: number; any_endorsed_pct: number;
    subscales: Record<string, number>;
  };
  by_department?: DeptRow[];
}
interface StatsResp { rounds: RoundData[]; min_recorte: number; min_recorte_department?: number }
interface Company { id: string; name: string; cnpj?: string | null; sector?: string | null; size_range?: string | null }

type Band = "Saudável" | "Atenção" | "Risco";

function copsoqBand(type: CopsoqScaleType, mean: number): Band {
  if (type === "positive") return mean >= 75 ? "Saudável" : mean >= 50 ? "Atenção" : "Risco";
  return mean <= 25 ? "Saudável" : mean <= 50 ? "Atenção" : "Risco";
}
function liptBand(mean: number): Band { return mean < 0.5 ? "Saudável" : mean <= 1.0 ? "Atenção" : "Risco"; }
function mdishBand(mean: number): Band { return mean <= 1.5 ? "Saudável" : mean <= 2.5 ? "Atenção" : "Risco"; }
function shrasBand(mean: number): Band { return mean >= 4 ? "Saudável" : mean >= 3.3 ? "Atenção" : "Risco"; }
function bandColor(b: Band) { return b === "Saudável" ? "#0d7a5f" : b === "Atenção" ? "#d97706" : "#b91c1c"; }
function fmtDate(s: string | null | undefined) { return s ? new Date(s).toLocaleDateString("pt-BR") : "—"; }

// --------------------------------------------------------------------------
// Matriz de classificação (NR-1, item 1.5.4.4.3): severidade x probabilidade
// Probabilidade é derivada do % de respondentes na faixa desfavorável quando
// disponível; na ausência, da distância da média em relação ao ponto de corte.
// --------------------------------------------------------------------------
type Sev = 1 | 2 | 3;   // 1 Leve · 2 Moderada · 3 Alta
type Prob = 1 | 2 | 3;  // 1 Baixa · 2 Média · 3 Alta
const SEV_LABEL: Record<Sev, string> = { 1: "Leve", 2: "Moderada", 3: "Alta" };
const PROB_LABEL: Record<Prob, string> = { 1: "Baixa", 2: "Média", 3: "Alta" };

function riskLevel(sev: Sev, prob: Prob): { label: string; color: string; priority: number } {
  const score = sev * prob;
  if (score >= 6) return { label: "Alto", color: "#b91c1c", priority: 0 };
  if (score >= 3) return { label: "Moderado", color: "#d97706", priority: 1 };
  return { label: "Baixo", color: "#0d7a5f", priority: 2 };
}

interface InvRow {
  id: string;
  fator: string;               // perigo / fator de risco psicossocial
  origem: string;              // fonte geradora / circunstância
  instrumento: string;
  indicador: string;           // resultado real medido
  band: Band;
  lesoes: string;              // possíveis lesões ou agravos
  sev: Sev;
  prob: Prob;
  eliminacao: string;          // medidas na hierarquia NR-1 1.4.1 "g"
  organizacional: string;
  administrativa: string;
  prazo: string;
  grupos: string;              // grupos homogêneos expostos (setor / função)
}

// Catálogo de medidas por dimensão COPSOQ (hierarquia de prevenção)
const COPSOQ_MEASURES: Record<string, { origem: string; lesoes: string; elim: string; org: string; adm: string }> = {
  quantitative_demands: {
    origem: "Dimensionamento de quadro, metas e prazos; acúmulo de tarefas por vacância.",
    lesoes: "Fadiga crônica, transtornos de ansiedade, episódios depressivos, erro operacional.",
    elim: "Redimensionar carga por posto; suprimir tarefas redundantes.",
    org: "Revisar metas e prazos com a área; escalonar picos de demanda; ampliar quadro nos setores críticos.",
    adm: "Pausas programadas, limite de horas extras, monitoramento mensal de backlog.",
  },
  work_pace: {
    origem: "Ritmo imposto por sistema, fila de atendimento ou linha de produção.",
    lesoes: "Estresse ocupacional, distúrbios do sono, aumento de acidentes.",
    elim: "Rever parametrização de ritmo automático do sistema.",
    org: "Rodízio entre postos de ritmo alto e baixo.",
    adm: "Micro-pausas obrigatórias; monitoramento de tempo médio de tarefa.",
  },
  emotional_demands: {
    origem: "Contato com público em sofrimento, conflito ou situações críticas.",
    lesoes: "Esgotamento emocional, Burnout (CID-11 QD85), afastamentos.",
    elim: "Não aplicável — risco inerente à atividade.",
    org: "Limitar tempo contínuo de exposição; duplas de atendimento em casos críticos.",
    adm: "Supervisão clínica/grupos de apoio, debriefing pós-evento crítico, canal de apoio psicológico.",
  },
  influence_at_work: {
    origem: "Baixa autonomia decisória sobre método, sequência e ritmo.",
    lesoes: "Desmotivação, sintomas depressivos, rotatividade.",
    elim: "—",
    org: "Delegar decisão sobre ordem de execução e método ao trabalhador.",
    adm: "Reuniões periódicas de melhoria de processo com participação direta.",
  },
  possibilities_development: {
    origem: "Tarefas repetitivas sem aprendizagem; ausência de trilha de desenvolvimento.",
    lesoes: "Desengajamento, sofrimento por esvaziamento profissional.",
    elim: "—",
    org: "Ampliação e enriquecimento de tarefas; rodízio qualificante.",
    adm: "Plano de capacitação anual documentado.",
  },
  meaning_of_work: {
    origem: "Fragmentação do processo; desconexão entre tarefa e resultado.",
    lesoes: "Desengajamento, sofrimento ético.",
    elim: "—",
    org: "Comunicar impacto do trabalho; devolutiva de resultados às equipes.",
    adm: "Rituais de reconhecimento e feedback estruturado.",
  },
  predictability: {
    origem: "Mudanças comunicadas em cima da hora; reestruturações sem informação prévia.",
    lesoes: "Ansiedade antecipatória, insegurança, conflito interpessoal.",
    elim: "—",
    org: "Protocolo de comunicação prévia de mudanças (prazo mínimo definido).",
    adm: "Boletim periódico de mudanças e cronograma público.",
  },
  role_clarity: {
    origem: "Descrição de cargo desatualizada; sobreposição de atribuições.",
    lesoes: "Estresse, conflito de papel, erro operacional.",
    elim: "—",
    org: "Rever e publicar descrição de atribuições por posto.",
    adm: "Alinhamento de expectativas na integração e em cada mudança de função.",
  },
  role_conflicts: {
    origem: "Ordens contraditórias entre chefias; exigências incompatíveis com valores.",
    lesoes: "Sofrimento ético, ansiedade, absenteísmo.",
    elim: "—",
    org: "Definir instância única de priorização; matriz de responsabilidade.",
    adm: "Fórum de resolução de conflitos de demanda.",
  },
  quality_leadership: {
    origem: "Liderança sem preparo para gestão de pessoas e de riscos psicossociais.",
    lesoes: "Clima adoecedor, assédio moral, rotatividade.",
    elim: "—",
    org: "Rever critérios de promoção a cargos de gestão.",
    adm: "Capacitação obrigatória de lideranças em fatores psicossociais e NR-1.",
  },
  social_support_supervisor: {
    origem: "Ausência de suporte da chefia imediata em situações de dificuldade.",
    lesoes: "Isolamento, sofrimento psíquico, queda de desempenho.",
    elim: "—",
    org: "Definir rotina de 1:1 e canal de escalonamento.",
    adm: "Treinamento de escuta e encaminhamento.",
  },
  social_support_colleagues: {
    origem: "Trabalho isolado, competição interna, alta rotatividade na equipe.",
    lesoes: "Isolamento social, sofrimento psíquico.",
    elim: "—",
    org: "Trabalho em duplas/células; integração de novos.",
    adm: "Espaços coletivos de troca (reuniões de equipe periódicas).",
  },
  sense_community: {
    origem: "Fragmentação de equipes, terceirização não integrada.",
    lesoes: "Isolamento, desengajamento.",
    elim: "—",
    org: "Integração formal de equipes próprias e terceirizadas.",
    adm: "Ações de convivência e comunicação interna.",
  },
  job_insecurity: {
    origem: "Contratos instáveis, reestruturações, ameaça de demissão.",
    lesoes: "Ansiedade, insônia, sintomas depressivos.",
    elim: "—",
    org: "Comunicação transparente sobre situação e planos da organização.",
    adm: "Programa de recolocação/transição quando houver reestruturação.",
  },
  work_family_conflict: {
    origem: "Jornada extensa, escala imprevisível, conectividade fora do horário.",
    lesoes: "Exaustão, conflito familiar, adoecimento mental.",
    elim: "Suprimir demandas fora da jornada.",
    org: "Política de desconexão; previsibilidade de escala com antecedência mínima.",
    adm: "Monitoramento de horas extras e de acessos fora do expediente.",
  },
  justice_respect: {
    origem: "Critérios pouco claros de distribuição de trabalho, promoção e punição.",
    lesoes: "Sentimento de injustiça, conflito, adoecimento mental.",
    elim: "—",
    org: "Publicar critérios objetivos de avaliação e promoção.",
    adm: "Canal de recurso e revisão de decisões.",
  },
  recognition: {
    origem: "Ausência de reconhecimento formal e informal do trabalho realizado.",
    lesoes: "Desmotivação, sintomas depressivos.",
    elim: "—",
    org: "Programa de reconhecimento vinculado a critérios claros.",
    adm: "Feedback estruturado periódico.",
  },
  burnout: {
    origem: "Exposição prolongada a exigências elevadas sem recursos compensatórios.",
    lesoes: "Burnout (CID-11 QD85), afastamento previdenciário.",
    elim: "—",
    org: "Reduzir exigências nas áreas com maior escore; revisar dimensionamento.",
    adm: "Encaminhamento ao serviço de saúde ocupacional; reavaliação no próximo ciclo.",
  },
  stress: {
    origem: "Acúmulo de exigências e baixo controle sobre o trabalho.",
    lesoes: "Transtornos de ansiedade, hipertensão, distúrbios do sono.",
    elim: "—",
    org: "Atuar sobre as dimensões de exigência e influência com maior escore.",
    adm: "Acompanhamento por medicina do trabalho.",
  },
  sleeping_troubles: {
    origem: "Turnos, ruminação relacionada ao trabalho, conectividade noturna.",
    lesoes: "Distúrbios do sono, fadiga, risco de acidente.",
    elim: "Rever escalas noturnas e rotatividade de turno.",
    org: "Política de desconexão noturna.",
    adm: "Orientação sobre higiene do sono; avaliação médica.",
  },
  offensive_behaviours: {
    origem: "Tolerância organizacional a condutas ofensivas; canal de denúncia frágil.",
    lesoes: "Assédio moral/sexual, transtorno de estresse pós-traumático, afastamentos.",
    elim: "Afastar imediatamente situações de violência identificadas.",
    org: "Canal de denúncia independente com política antirretaliação.",
    adm: "Apuração formal, treinamento obrigatório e código de conduta.",
  },
};

const LIPT_LABELS: Record<string, string> = {
  desprestigio: "Desprestígio profissional",
  ampliacao_es: "Bloqueio / sobrecarga deliberada",
  desacreditacao: "Desacreditação pessoal",
  comunicacao: "Limitação da comunicação",
  contato_social: "Isolamento social",
  saude: "Ameaças à integridade física",
};
const MDISH_LABELS: Record<string, string> = {
  mdish_moral_justification: "Justificação moral do assédio",
  mdish_euphemistic_labeling: "Rotulação eufemística ('brincadeira')",
  mdish_advantageous_comparison: "Comparação vantajosa",
  mdish_displacement_responsibility: "Deslocamento da responsabilidade",
  mdish_diffusion_responsibility: "Difusão da responsabilidade",
  mdish_distortion_consequences: "Distorção das consequências",
  mdish_dehumanization: "Desumanização da vítima",
  mdish_attribution_blame: "Culpabilização da vítima",
};

// --------------------------------------------------------------------------
// Amostra demonstrativa (rota /admin/nr1/amostra/1). Dados SINTÉTICOS,
// declarados como exemplo, processados pelo MESMO pipeline de classificação
// usado em produção. Nunca exibidos sem o aviso da seção 0.
// --------------------------------------------------------------------------
const SAMPLE_COMPANY: Company = {
  id: "amostra",
  name: "Empresa Exemplo Ltda. (dados sintéticos)",
  cnpj: "00.000.000/0001-00",
  sector: "Call center / teleatendimento (CNAE 8220-2)",
  size_range: "100–249 trabalhadores",
};

const SAMPLE_STATS: StatsResp = {
  min_recorte: 5,
  rounds: [
    {
      round_no: 1,
      opened_at: "2025-09-01T00:00:00Z",
      closed_at: "2025-11-30T00:00:00Z",
      devolutiva_communicated_at: "2025-12-10T00:00:00Z",
      devolutiva_notes: null,
      status: "devolutiva_communicated",
      waves: {
        "1": { scheduled: 140, sent: 140, completed: 96 },
        "2": { scheduled: 140, sent: 140, completed: 88 },
        "3": { scheduled: 140, sent: 140, completed: 81 },
        "4": { scheduled: 140, sent: 140, completed: 77 },
        "5": { scheduled: 140, sent: 140, completed: 74 },
      },
      copsoq: {
        n: 88, hidden: false,
        scales: {
          quantitative_demands: { mean: 62.4, n: 88 },
          work_pace: { mean: 68.1, n: 88 },
          emotional_demands: { mean: 59.7, n: 88 },
          influence_at_work: { mean: 41.2, n: 88 },
          predictability: { mean: 47.9, n: 88 },
          role_clarity: { mean: 71.3, n: 88 },
          quality_leadership: { mean: 44.6, n: 88 },
          social_support_supervisor: { mean: 46.8, n: 88 },
          recognition: { mean: 43.5, n: 88 },
          job_insecurity: { mean: 55.2, n: 88 },
          work_family_conflict: { mean: 51.0, n: 88 },
          burnout: { mean: 57.9, n: 88 },
          stress: { mean: 54.3, n: 88 },
          sleeping_troubles: { mean: 49.6, n: 88 },
          offensive_behaviours: { mean: 28.4, n: 88 },
        },
      },
      phq9: {
        n: 96, hidden: false,
        severity_dist: { minimal: 31, mild: 33, moderate: 19, moderately_severe: 9, severe: 4 },
      },
      psicossocial: {
        n: 77, hidden: false, IGAP: 0.71, NEAP: 12.4, flagged_pct: 14,
        subscales: {
          desprestigio: 0.86,
          ampliacao_es: 0.62,
          desacreditacao: 0.41,
          comunicacao: 0.55,
          contato_social: 0.33,
          saude: 0.12,
        },
        flagged_departments: [],
      },
      assedio_sexual: {
        n: 74, hidden: false, MDiSH_total: 1.9, SHRAS_total: 3.6, any_endorsed_pct: 22,
        subscales: {
          mdish_moral_justification: 1.4,
          mdish_euphemistic_labeling: 2.3,
          mdish_advantageous_comparison: 1.6,
          mdish_displacement_responsibility: 1.8,
          mdish_diffusion_responsibility: 1.7,
          mdish_distortion_consequences: 2.1,
          mdish_dehumanization: 1.2,
          mdish_attribution_blame: 1.9,
          shras: 3.6,
        },
      },
      by_department: [
        {
          department: "Operação — Atendimento receptivo",
          n_copsoq: 38, n_phq9: 41, n_psicossocial: 34, n_assedio_sexual: 33, hidden: false,
          copsoq_scales: {
            quantitative_demands: { mean: 71.2, n: 38 },
            work_pace: { mean: 76.4, n: 38 },
            emotional_demands: { mean: 68.9, n: 38 },
            influence_at_work: { mean: 32.1, n: 38 },
            quality_leadership: { mean: 39.7, n: 38 },
            burnout: { mean: 66.3, n: 38 },
          },
          phq9_severity_dist: { minimal: 9, mild: 13, moderate: 11, moderately_severe: 6, severe: 2 },
          lipt_igap: 0.94, lipt_flagged_pct: 21, mdish_total: 2.1, mdish_endorsed_pct: 28,
        },
        {
          department: "Backoffice — Retaguarda e cobrança",
          n_copsoq: 27, n_phq9: 29, n_psicossocial: 26, n_assedio_sexual: 25, hidden: false,
          copsoq_scales: {
            quantitative_demands: { mean: 58.4, n: 27 },
            work_pace: { mean: 61.0, n: 27 },
            emotional_demands: { mean: 49.2, n: 27 },
            influence_at_work: { mean: 48.6, n: 27 },
            quality_leadership: { mean: 52.3, n: 27 },
            burnout: { mean: 51.1, n: 27 },
          },
          phq9_severity_dist: { minimal: 12, mild: 11, moderate: 5, moderately_severe: 1, severe: 0 },
          lipt_igap: 0.48, lipt_flagged_pct: 8, mdish_total: 1.7, mdish_endorsed_pct: 16,
        },
        {
          department: "Administrativo / RH",
          n_copsoq: 18, n_phq9: 21, n_psicossocial: 14, n_assedio_sexual: 13, hidden: false,
          copsoq_scales: {
            quantitative_demands: { mean: 51.8, n: 18 },
            work_pace: { mean: 55.2, n: 18 },
            emotional_demands: { mean: 44.1, n: 18 },
            influence_at_work: { mean: 61.4, n: 18 },
            quality_leadership: { mean: 58.9, n: 18 },
            burnout: { mean: 43.7, n: 18 },
          },
          phq9_severity_dist: { minimal: 11, mild: 7, moderate: 2, moderately_severe: 1, severe: 0 },
          lipt_igap: 0.31, lipt_flagged_pct: 5, mdish_total: 1.4, mdish_endorsed_pct: 11,
        },
        {
          department: "Liderança de operação (supervisão)",
          n_copsoq: 5, n_phq9: 5, n_psicossocial: 3, n_assedio_sexual: 3, hidden: true,
          copsoq_scales: {}, phq9_severity_dist: {},
          lipt_igap: 0, lipt_flagged_pct: 0, mdish_total: 0, mdish_endorsed_pct: 0,
        },
      ],
    },
  ],
};

const Nr1Report = () => {
  const { companyId, roundNo } = useParams<{ companyId: string; roundNo: string }>();
  const isSample = companyId === "amostra";
  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState<StatsResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = isSample
      ? "Amostra — Inventário de Riscos NR-1 + AEP NR-17 — Cuidar+ Trabalho"
      : "Inventário de Riscos NR-1 + AEP NR-17 — Cuidar+ Trabalho";
  }, [isSample]);

  useEffect(() => {
    (async () => {
      if (!companyId) return;
      if (isSample) {
        setCompany(SAMPLE_COMPANY);
        setStats(SAMPLE_STATS);
        setLoading(false);
        return;
      }
      const [{ data: co }, { data: { session } }] = await Promise.all([
        supabase.from("companies").select("id,name,cnpj,sector,size_range").eq("id", companyId).maybeSingle(),
        supabase.auth.getSession(),
      ]);
      setCompany(co as any);
      const base = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${base}/functions/v1/wellness-company-stats?company_id=${companyId}&period=all`, {
        headers: { Authorization: `Bearer ${session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      setStats(await res.json());
      setLoading(false);
    })();
  }, [companyId, isSample]);

  const target = stats?.rounds.find((r) => String(r.round_no) === String(roundNo)) || null;
  const prev = target ? stats?.rounds.find((r) => r.round_no === target.round_no - 1) || null : null;


  // ---- Construção do inventário a partir de dados reais -------------------
  const inventory = useMemo<InvRow[]>(() => {
    if (!target) return [];
    const rows: InvRow[] = [];

    // Grupos homogêneos de exposição (GHE) — recortes por setor/função com n suficiente
    const depts = (target.by_department ?? []).filter((d) => !d.hidden);
    const TODOS = "Todos os trabalhadores abrangidos pelo ciclo";
    const semRecorte = `${TODOS} (sem recorte por setor com n suficiente)`;
    const gruposCopsoq = (id: string, type: CopsoqScaleType) => {
      const hits = depts
        .filter((d) => {
          const s = d.copsoq_scales[id];
          return s && copsoqBand(type, s.mean) !== "Saudável";
        })
        .map((d) => `${d.department} (n=${d.copsoq_scales[id].n}; média ${d.copsoq_scales[id].mean.toFixed(0)})`);
      return hits.length ? hits.join(" · ") : semRecorte;
    };
    const gruposLipt = () => {
      const hits = depts.filter((d) => d.n_psicossocial > 0 && d.lipt_flagged_pct > 0)
        .map((d) => `${d.department} (n=${d.n_psicossocial}; ${d.lipt_flagged_pct}% com indicativo)`);
      return hits.length ? hits.join(" · ") : semRecorte;
    };
    const gruposAsx = () => {
      const hits = depts.filter((d) => d.n_assedio_sexual > 0 && d.mdish_total > 1.5)
        .map((d) => `${d.department} (n=${d.n_assedio_sexual}; MDiSH ${d.mdish_total.toFixed(2)})`);
      return hits.length ? hits.join(" · ") : semRecorte;
    };
    const gruposPhq = () => {
      const hits = depts.filter((d) => {
        if (!d.n_phq9) return false;
        const dd = d.phq9_severity_dist;
        const grave = (dd.moderate || 0) + (dd.moderately_severe || 0) + (dd.severe || 0);
        return Math.round((grave / d.n_phq9) * 100) >= 20;
      }).map((d) => {
        const dd = d.phq9_severity_dist;
        const grave = (dd.moderate || 0) + (dd.moderately_severe || 0) + (dd.severe || 0);
        return `${d.department} (n=${d.n_phq9}; ${Math.round((grave / d.n_phq9) * 100)}% moderado+)`;
      });
      return hits.length ? hits.join(" · ") : semRecorte;
    };


    // COPSOQ II
    if (!target.copsoq.hidden) {
      for (const [id, v] of Object.entries(target.copsoq.scales)) {
        const meta = copsoqScales[id];
        const type = (meta?.type ?? "negative") as CopsoqScaleType;
        const band = copsoqBand(type, v.mean);
        if (band === "Saudável") continue;
        const m = COPSOQ_MEASURES[id];
        // severidade: dimensões de sintoma/violência pesam mais
        const highSev = ["burnout", "stress", "offensive_behaviours", "sleeping_troubles", "emotional_demands"];
        const sev: Sev = highSev.includes(id) ? 3 : band === "Risco" ? 2 : 1;
        // probabilidade: distância da média ao corte
        const dist = type === "positive" ? 50 - v.mean : v.mean - 50;
        const prob: Prob = band === "Risco" ? (dist >= 15 ? 3 : 2) : 1;
        rows.push({
          id: `copsoq-${id}`,
          fator: meta?.name ?? id,
          origem: m?.origem ?? "Organização do trabalho.",
          instrumento: "COPSOQ II (n=" + v.n + ")",
          indicador: `Média ${v.mean.toFixed(1)}/100 (escala ${type === "positive" ? "positiva/recurso" : "negativa/exigência"})`,
          band,
          lesoes: m?.lesoes ?? "Sofrimento psíquico relacionado ao trabalho.",
          sev, prob,
          eliminacao: m?.elim ?? "—",
          organizacional: m?.org ?? "Rever organização do trabalho na dimensão avaliada.",
          administrativa: m?.adm ?? "Monitoramento no próximo ciclo de rastreio.",
          prazo: band === "Risco" ? "Imediato / 90 dias" : "180 dias",
          grupos: gruposCopsoq(id, type),
        });
      }
    }

    // LIPT-60 — assédio moral
    if (!target.psicossocial.hidden) {
      for (const [k, mean] of Object.entries(target.psicossocial.subscales)) {
        const band = liptBand(mean);
        if (band === "Saudável") continue;
        rows.push({
          grupos: gruposLipt(),
          id: `lipt-${k}`,
          fator: `Assédio moral — ${LIPT_LABELS[k] ?? k}`,
          origem: "Conduta de gestão e/ou de pares; ausência de apuração efetiva.",
          instrumento: `LIPT-60 (n=${target.psicossocial.n})`,
          indicador: `Média ${mean.toFixed(2)}/4 · IGAP ${target.psicossocial.IGAP} · ${target.psicossocial.flagged_pct}% com indicativo`,
          band,
          lesoes: "Transtorno de ansiedade, episódio depressivo, TEPT, afastamento previdenciário (Lei 14.457/2022).",
          sev: 3,
          prob: band === "Risco" ? 3 : 2,
          eliminacao: "Afastar imediatamente a situação de violência identificada.",
          organizacional: "Canal de denúncia independente, comissão de apuração e política antirretaliação (Lei 14.457/2022).",
          administrativa: "Capacitação obrigatória de lideranças; mediação de conflitos; acompanhamento em saúde mental.",
          prazo: "Imediato / 30 dias",
        });
      }
    }

    // MDiSH / SHRAS — assédio sexual
    if (!target.assedio_sexual.hidden) {
      for (const [k, mean] of Object.entries(target.assedio_sexual.subscales)) {
        if (!k.startsWith("mdish")) continue;
        const band = mdishBand(mean);
        if (band === "Saudável") continue;
        rows.push({
          grupos: gruposAsx(),
          id: `mdish-${k}`,
          fator: `Cultura permissiva a assédio sexual — ${MDISH_LABELS[k] ?? k}`,
          origem: "Normas informais do grupo; ausência de código de conduta aplicado.",
          instrumento: `MDiSH (n=${target.assedio_sexual.n})`,
          indicador: `Média ${mean.toFixed(2)}/5 · ${target.assedio_sexual.any_endorsed_pct}% endossam ao menos 1 item`,
          band,
          lesoes: "Assédio sexual, TEPT, afastamento, responsabilização civil e criminal da organização.",
          sev: 3,
          prob: band === "Risco" ? 3 : 2,
          eliminacao: "Apuração e afastamento de agentes identificados.",
          organizacional: "Comissão Interna de Prevenção (CIPA) com atribuições da Lei 14.457/2022; canal seguro de denúncia.",
          administrativa: "Treinamento obrigatório antiassédio a cada 12 meses; divulgação de código de conduta.",
          prazo: "Imediato / 60 dias",
        });
      }
      const shras = target.assedio_sexual.subscales.shras;
      if (typeof shras === "number") {
        const band = shrasBand(shras);
        if (band !== "Saudável") {
          rows.push({
            grupos: TODOS,
            id: "shras",
            fator: "Baixa confiança no canal de denúncia (atitudes de reporte)",
            origem: "Medo de retaliação; histórico de denúncias sem desfecho.",
            instrumento: `SHRAS (n=${target.assedio_sexual.n})`,
            indicador: `Média ${shras.toFixed(2)}/5 (escala positiva/recurso)`,
            band,
            lesoes: "Subnotificação de violência, cronificação do dano, litígio trabalhista.",
            sev: 2,
            prob: band === "Risco" ? 3 : 2,
            eliminacao: "—",
            organizacional: "Canal externo independente com sigilo garantido e prazo de resposta definido.",
            administrativa: "Comunicar publicamente estatísticas de apuração e desfechos (sem identificação).",
            prazo: "90 dias",
          });
        }
      }
    }

    // PHQ-9 agregado — indicador de agravo à saúde
    if (!target.phq9.hidden && target.phq9.n > 0) {
      const d = target.phq9.severity_dist;
      const grave = (d.moderate || 0) + (d.moderately_severe || 0) + (d.severe || 0);
      const pct = Math.round((grave / target.phq9.n) * 100);
      if (pct >= 20) {
        rows.push({
          grupos: gruposPhq(),
          id: "phq9",
          fator: "Indicador de agravo — sintomas depressivos moderados ou superiores",
          origem: "Resultante da exposição aos fatores psicossociais inventariados.",
          instrumento: `PHQ-9 agregado (n=${target.phq9.n})`,
          indicador: `${pct}% dos respondentes em faixa moderada ou superior`,
          band: pct >= 35 ? "Risco" : "Atenção",
          lesoes: "Episódio depressivo, afastamento previdenciário (CID F32/F33), risco de suicídio.",
          sev: 3,
          prob: pct >= 35 ? 3 : 2,
          eliminacao: "—",
          organizacional: "Priorizar as dimensões em Risco deste inventário como causa organizacional.",
          administrativa: "Encaminhamento a rede SUS/CAPS e CVV 188; acompanhamento pelo PCMSO; reavaliação no próximo ciclo.",
          prazo: "Imediato",
        });
      }
    }

    return rows.sort((a, b) => {
      const ra = riskLevel(a.sev, a.prob).priority;
      const rb = riskLevel(b.sev, b.prob).priority;
      return ra - rb || a.fator.localeCompare(b.fator, "pt");
    });
  }, [target]);

  if (loading) return <main className="container py-10 text-sm text-muted-foreground">Carregando…</main>;
  if (!stats || !company) return <main className="container py-10 text-sm">Dados indisponíveis.</main>;
  if (!target) return <main className="container py-10 text-sm">Rodada não encontrada.</main>;

  const totalScheduled = Object.values(target.waves).reduce((s, w) => s + w.scheduled, 0);
  const totalCompleted = Object.values(target.waves).reduce((s, w) => s + w.completed, 0);
  const adesao = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

  const altos = inventory.filter((r) => riskLevel(r.sev, r.prob).label === "Alto");
  const moderados = inventory.filter((r) => riskLevel(r.sev, r.prob).label === "Moderado");

  return (
    <main className="min-h-screen bg-white text-black">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 12mm; }
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .page-break { page-break-before: always; }
        }
        .nr1-table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .nr1-table th, .nr1-table td { border: 1px solid #d4d4d8; padding: 5px 6px; text-align: left; vertical-align: top; }
        .nr1-table th { background: #f5f5f4; font-weight: 600; }
        .nr1-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; color: #fff; white-space: nowrap; }
      `}</style>

      <div className="container max-w-6xl py-8 space-y-8">
        <div className="no-print flex justify-between items-center gap-2 border-b pb-3">
          <p className="text-xs text-neutral-500">
            Documento em formato de inventário (paisagem). Use o botão para gerar o PDF pela impressão do navegador.
          </p>
          <button onClick={() => window.print()}
            className="rounded bg-emerald-700 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-800">
            Imprimir / Salvar PDF
          </button>
        </div>

        {isSample && (
          <div style={{ border: "2px solid #b45309", background: "#fffbeb", color: "#7c2d12" }}
            className="rounded p-3 text-sm">
            <strong>AMOSTRA DEMONSTRATIVA — dados sintéticos.</strong> Esta é uma empresa fictícia criada
            apenas para demonstrar o formato do documento. Todos os números abaixo são{" "}
            <strong>simulados</strong> e não representam nenhuma organização real. A estrutura, a matriz
            severidade × probabilidade, o inventário e o plano de ação são gerados pelo mesmo mecanismo
            de cálculo usado nos relatórios reais.
          </div>
        )}

        <header className="space-y-2">

          <p className="text-xs uppercase tracking-wide text-neutral-600">
            NR-1 · Programa de Gerenciamento de Riscos (PGR) — Inventário de Riscos Psicossociais · NR-17 · Avaliação Ergonômica Preliminar (AEP)
          </p>
          <h1 className="text-2xl font-bold">Inventário de Riscos Psicossociais e Plano de Ação</h1>
          <p className="text-sm">
            Organização: <strong>{company.name}</strong>
            {company.cnpj ? <> · CNPJ {company.cnpj}</> : null}
            {company.sector ? <> · CNAE/Setor: {company.sector}</> : null}
            {company.size_range ? <> · Porte: {company.size_range}</> : null}
          </p>
          <p className="text-sm">
            Ciclo de avaliação: <strong>#{target.round_no}</strong> · Início {fmtDate(target.opened_at)} ·
            Encerramento {fmtDate(target.closed_at)} · Devolutiva aos trabalhadores {fmtDate(target.devolutiva_communicated_at)} ·
            Adesão {adesao}% ({totalCompleted}/{totalScheduled})
          </p>
          <p className="text-xs text-neutral-600">
            Documento válido como componente do PGR (NR-1, itens 1.5.4.4 e 1.5.5) e como seção psicossocial e cognitiva da
            AEP (NR-17, item 17.3). Não substitui a Análise Ergonômica do Trabalho (AET) quando esta for indicada.
          </p>
        </header>

        {/* 1. Identificação e escopo — obrigatório PGR */}
        <section>
          <h2 className="text-lg font-semibold mb-2">1. Identificação, escopo e responsabilidades</h2>
          <table className="nr1-table">
            <tbody>
              <tr><th style={{ width: "26%" }}>Organização avaliada</th><td>{company.name}{company.cnpj ? ` — CNPJ ${company.cnpj}` : ""}</td></tr>
              <tr><th>Setor econômico / porte</th><td>{company.sector || "A informar"} · {company.size_range || "A informar"}</td></tr>
              <tr><th>Abrangência</th><td>Todos os trabalhadores convidados ao ciclo #{target.round_no}, independentemente de vínculo, incluindo regimes presencial, híbrido e teletrabalho.</td></tr>
              <tr><th>Grupos homogêneos de exposição (GHE)</th><td>{(target.by_department ?? []).length > 0
                ? <>{(target.by_department ?? []).length} setor(es)/área(s) identificados no ciclo: {(target.by_department ?? []).map((d) => d.department).join("; ")}. Caracterização completa na seção 3.1.</>
                : <>Setor, área e função não informados no cadastro de participantes deste ciclo — inventário elaborado para grupo único. Registrar setor/função antes do próximo ciclo (seção 3.1).</>}</td></tr>
              <tr><th>Responsável técnico pela avaliação</th><td>_________________________________ (nome, formação e registro profissional)</td></tr>
              <tr><th>Responsável pelo PGR na organização</th><td>_________________________________</td></tr>
              <tr><th>Participação dos trabalhadores</th><td>Assegurada por meio de resposta anônima aos instrumentos e devolutiva coletiva (NR-1, item 1.5.3.3). CIPA/representação consultada na análise dos resultados.</td></tr>
              <tr><th>Data-base e validade</th><td>Emitido em {new Date().toLocaleDateString("pt-BR")}. Revisão obrigatória a cada ciclo de rastreio ou imediatamente após evento crítico, alteração de processo ou identificação de novo perigo (NR-1, item 1.5.4.4.5).</td></tr>
            </tbody>
          </table>
        </section>

        {/* 2. Metodologia — obrigatório PGR/AEP */}
        <section>
          <h2 className="text-lg font-semibold mb-2">2. Metodologia de identificação e avaliação</h2>
          <p className="text-sm leading-relaxed">
            A identificação de perigos combinou <strong>instrumento estruturado validado</strong>, <strong>dados de adesão e
            participação</strong> e <strong>indicadores de agravo à saúde</strong>. Instrumentos aplicados por link anônimo,
            sem identificação nominal: <strong>COPSOQ II</strong> (Pejtersen et al., 2010; adaptação PT de Silva et al., 2011),
            <strong> LIPT-60</strong> (assédio moral), <strong>MDiSH</strong> e <strong>SHRAS</strong> (assédio sexual e atitudes
            de denúncia) e <strong>PHQ-9</strong> (Santos et al., 2013) como indicador agregado de agravo.
          </p>
          <p className="text-sm leading-relaxed mt-2">
            A avaliação de nível de risco segue a matriz severidade × probabilidade prevista na NR-1 (item 1.5.4.4.3):
          </p>
          <table className="nr1-table mt-2" style={{ maxWidth: 620 }}>
            <thead><tr><th>Severidade \ Probabilidade</th><th>Baixa</th><th>Média</th><th>Alta</th></tr></thead>
            <tbody>
              {([3, 2, 1] as Sev[]).map((sev) => (
                <tr key={sev}>
                  <th>{SEV_LABEL[sev]}</th>
                  {([1, 2, 3] as Prob[]).map((p) => {
                    const lv = riskLevel(sev, p);
                    return <td key={p}><span className="nr1-badge" style={{ backgroundColor: lv.color }}>{lv.label}</span></td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-neutral-600 mt-2">
            Sigilo e n mínimo: nenhum recorte é publicado com menos de <strong>{stats.min_recorte}</strong> respondentes,
            evitando reidentificação (LGPD, art. 11). Dados clínicos individuais não são acessíveis à organização.
          </p>
        </section>

        {/* 3. Inventário de riscos — núcleo do PGR */}
        <section className="page-break">
          <h2 className="text-lg font-semibold mb-2">3. Inventário de riscos psicossociais</h2>
          {inventory.length === 0 ? (
            <p className="text-sm text-neutral-700">
              Nenhum fator psicossocial classificado em Atenção ou Risco com os dados disponíveis deste ciclo
              {target.copsoq.hidden || target.psicossocial.hidden || target.assedio_sexual.hidden
                ? " — há recortes ocultos por n abaixo do mínimo; reforçar adesão antes de concluir o inventário."
                : "."}
            </p>
          ) : (
            <>
              <p className="text-sm mb-2">
                {inventory.length} fatores identificados · <strong>{altos.length}</strong> em nível Alto ·{" "}
                <strong>{moderados.length}</strong> em nível Moderado.
              </p>
              <table className="nr1-table">
                <thead>
                  <tr>
                    <th style={{ width: "12%" }}>Perigo / fator de risco</th>
                    <th style={{ width: "12%" }}>Grupos expostos (setor / função — GHE)</th>
                    <th style={{ width: "12%" }}>Fonte geradora / circunstância</th>
                    <th style={{ width: "11%" }}>Evidência (instrumento e resultado)</th>
                    <th style={{ width: "12%" }}>Possíveis lesões ou agravos</th>
                    <th>Sev.</th>
                    <th>Prob.</th>
                    <th>Nível</th>
                    <th style={{ width: "11%" }}>Medidas existentes</th>
                    <th style={{ width: "16%" }}>Medidas necessárias (hierarquia NR-1 1.4.1 “g”)</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((r) => {
                    const lv = riskLevel(r.sev, r.prob);
                    return (
                      <tr key={r.id}>
                        <td><strong>{r.fator}</strong></td>
                        <td>{r.grupos}</td>
                        <td>{r.origem}</td>
                        <td>{r.instrumento}<br />{r.indicador}<br />
                          <span className="nr1-badge" style={{ backgroundColor: bandColor(r.band) }}>{r.band}</span>
                        </td>
                        <td>{r.lesoes}</td>
                        <td>{SEV_LABEL[r.sev]}</td>
                        <td>{PROB_LABEL[r.prob]}</td>
                        <td><span className="nr1-badge" style={{ backgroundColor: lv.color }}>{lv.label}</span></td>
                        <td>A preencher pela organização (controles já implantados)</td>
                        <td>
                          <div><em>1. Eliminação/redução na fonte:</em> {r.eliminacao}</div>
                          <div><em>2. Medidas organizacionais:</em> {r.organizacional}</div>
                          <div><em>3. Medidas administrativas:</em> {r.administrativa}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </section>

        {/* 3.1 GHE — caracterização por setor / função (NR-1 1.5.4.4.2 "b") */}
        <section className="page-break">
          <h2 className="text-lg font-semibold mb-2">
            3.1 Grupos homogêneos de exposição (GHE) — setores, áreas e funções
          </h2>
          <p className="text-sm mb-2">
            Caracterização dos grupos de trabalhadores expostos, conforme exige o inventário de riscos
            (NR-1, item 1.5.4.4.2) e a descrição das situações de trabalho da AEP (NR-17). O recorte por
            setor/função só é publicado quando o grupo tem pelo menos{" "}
            <strong>{stats.min_recorte_department ?? stats.min_recorte}</strong> respondentes; abaixo disso os
            resultados permanecem agregados para impedir reidentificação.
          </p>
          {(target.by_department ?? []).length === 0 ? (
            <p className="text-sm text-neutral-700">
              Este ciclo não possui setor/função informado nos cadastros de participantes. Para atender
              plenamente ao inventário, registrar setor, área e função no cadastro de colaboradores antes
              do próximo ciclo — sem esse dado o inventário fica restrito ao grupo único “todos os
              trabalhadores”.
            </p>
          ) : (
            <table className="nr1-table">
              <thead>
                <tr>
                  <th style={{ width: "18%" }}>Setor / área / função (GHE)</th>
                  <th>Respondentes por instrumento</th>
                  <th>Fatores COPSOQ em Atenção/Risco</th>
                  <th>Assédio moral (LIPT-60)</th>
                  <th>Assédio sexual (MDiSH)</th>
                  <th>PHQ-9 moderado ou superior</th>
                  <th>Prioridade do grupo</th>
                </tr>
              </thead>
              <tbody>
                {(target.by_department ?? []).map((d) => {
                  const emRisco = Object.entries(d.copsoq_scales)
                    .map(([id, v]) => {
                      const meta = copsoqScales[id];
                      const type = (meta?.type ?? "negative") as CopsoqScaleType;
                      return { name: meta?.name ?? id, band: copsoqBand(type, v.mean), mean: v.mean };
                    })
                    .filter((x) => x.band !== "Saudável")
                    .sort((a, b) => (a.band === "Risco" ? -1 : 1) - (b.band === "Risco" ? -1 : 1));
                  const nRisco = emRisco.filter((x) => x.band === "Risco").length;
                  const dd = d.phq9_severity_dist;
                  const grave = (dd.moderate || 0) + (dd.moderately_severe || 0) + (dd.severe || 0);
                  const phqPct = d.n_phq9 ? Math.round((grave / d.n_phq9) * 100) : 0;
                  const prioridade =
                    d.hidden ? { label: "Sem recorte", color: "#52525b" }
                      : nRisco >= 3 || d.lipt_flagged_pct >= 15 || phqPct >= 35
                        ? { label: "Alta", color: "#b91c1c" }
                        : emRisco.length > 0 || phqPct >= 20
                          ? { label: "Média", color: "#d97706" }
                          : { label: "Baixa", color: "#0d7a5f" };
                  return (
                    <tr key={d.department}>
                      <td><strong>{d.department}</strong></td>
                      <td>
                        COPSOQ {d.n_copsoq} · PHQ-9 {d.n_phq9} · LIPT-60 {d.n_psicossocial} · MDiSH/SHRAS {d.n_assedio_sexual}
                      </td>
                      <td>
                        {d.hidden
                          ? <em>Oculto — n abaixo do mínimo do recorte</em>
                          : emRisco.length === 0
                            ? "Nenhum"
                            : emRisco.map((x) => `${x.name} (${x.mean.toFixed(0)} — ${x.band})`).join("; ")}
                      </td>
                      <td>{d.hidden ? "—" : `IGAP ${d.lipt_igap} · ${d.lipt_flagged_pct}% com indicativo`}</td>
                      <td>{d.hidden ? "—" : `MDiSH ${d.mdish_total} · ${d.mdish_endorsed_pct}% endossam ≥1 item`}</td>
                      <td>{d.hidden || !d.n_phq9 ? "—" : `${phqPct}%`}</td>
                      <td><span className="nr1-badge" style={{ backgroundColor: prioridade.color }}>{prioridade.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <p className="text-xs text-neutral-600 mt-2">
            A coluna “Grupos expostos” do inventário (seção 3) e o plano de ação (seção 4) usam estes mesmos
            recortes. Funções e postos individuais devem ser detalhados pelo responsável técnico a partir da
            descrição de cargos vigente, vinculando cada GHE aos respectivos códigos CBO.
          </p>
        </section>


        {/* 4. Plano de ação — obrigatório NR-1 1.5.5.2 */}
        <section className="page-break">
          <h2 className="text-lg font-semibold mb-2">4. Plano de ação (NR-1, item 1.5.5.2)</h2>
          {inventory.length === 0 ? (
            <p className="text-sm text-neutral-700">Sem itens priorizados neste ciclo.</p>
          ) : (
            <table className="nr1-table">
              <thead>
                <tr>
                  <th style={{ width: "4%" }}>#</th>
                  <th style={{ width: "16%" }}>Risco priorizado</th>
                  <th style={{ width: "14%" }}>Setor / função alvo (GHE)</th>
                  <th style={{ width: "22%" }}>Ação de prevenção</th>
                  <th style={{ width: "9%" }}>Prazo</th>
                  <th style={{ width: "12%" }}>Responsável</th>
                  <th style={{ width: "13%" }}>Forma de aferição da eficácia</th>
                  <th style={{ width: "10%" }}>Situação</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td>{r.fator} <span className="nr1-badge" style={{ backgroundColor: riskLevel(r.sev, r.prob).color }}>{riskLevel(r.sev, r.prob).label}</span></td>
                    <td>{r.grupos}</td>
                    <td>{[r.eliminacao, r.organizacional, r.administrativa].filter((x) => x && x !== "—").join(" · ")}</td>
                    <td>{r.prazo}</td>
                    <td>_______________</td>
                    <td>Reavaliação do mesmo indicador no próximo ciclo ({r.instrumento.split(" (")[0]}), com meta de mudança de faixa.</td>
                    <td>☐ Não iniciada ☐ Em andamento ☐ Concluída</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-xs text-neutral-600 mt-2">
            As ações seguem a hierarquia obrigatória: eliminação do risco, minimização por medidas de proteção coletiva/
            organizacionais e, por último, medidas administrativas ou de caráter individual. Ações em nível Alto devem ter
            prazo imediato e acompanhamento formal (NR-1, item 1.5.5.2.1).
          </p>
        </section>

        {/* 5. AEP NR-17 */}
        <section className="page-break">
          <h2 className="text-lg font-semibold mb-2">5. Avaliação Ergonômica Preliminar (NR-17) — seção psicossocial e cognitiva</h2>
          <table className="nr1-table">
            <tbody>
              <tr><th style={{ width: "26%" }}>5.1 Situações de trabalho analisadas</th><td>Postos e funções abrangidos pelo ciclo #{target.round_no}, em regimes presencial, híbrido e teletrabalho, organizados por grupos homogêneos de exposição: {(target.by_department ?? []).length > 0 ? (target.by_department ?? []).map((d) => `${d.department} (n=${Math.max(d.n_copsoq, d.n_phq9, d.n_psicossocial, d.n_assedio_sexual)})`).join("; ") : "grupo único — setor/função não informados no cadastro"}. Descrição detalhada de cada posto e código CBO a ser complementada pelo responsável técnico com base na descrição de cargos vigente (seção 3.1).</td></tr>
              <tr><th>5.2 Fatores cognitivos</th><td>Demanda de atenção sustentada, interrupções, multitarefa e complexidade de decisão avaliadas pelas dimensões de exigências quantitativas, ritmo e previsibilidade do COPSOQ II — resultados na seção 3.</td></tr>
              <tr><th>5.3 Fatores psicossociais</th><td>Exigências, influência, apoio social, clareza e conflito de papel, reconhecimento, justiça, conflito trabalho–família e comportamentos ofensivos — inventariados na seção 3 com faixa e nível de risco.</td></tr>
              <tr><th>5.4 Método e evidências</th><td>Instrumentos validados, período de coleta {fmtDate(target.opened_at)} a {fmtDate(target.closed_at)}, adesão de {adesao}%, n mínimo por recorte de {stats.min_recorte}, anonimato assegurado.</td></tr>
              <tr><th>5.5 Resultados por dimensão</th><td>Vide seção 3 (escore, faixa e nível de risco por dimensão).</td></tr>
              <tr><th>5.6 Conclusão e encaminhamentos</th><td>
                {altos.length > 0
                  ? <>Há {altos.length} fator(es) em nível Alto que exigem ação imediata e <strong>indicam a realização de Análise Ergonômica do Trabalho (AET)</strong> nos setores envolvidos, por não serem plenamente explicáveis pela descrição do posto: {altos.slice(0, 5).map((a) => a.fator).join("; ")}.</>
                  : moderados.length > 0
                    ? <>Não há fatores em nível Alto. Os {moderados.length} fator(es) em nível Moderado são tratáveis por medidas organizacionais previstas na seção 4, com reavaliação no próximo ciclo.</>
                    : <>Não foram identificados fatores em nível Alto ou Moderado neste ciclo. Manter monitoramento periódico.</>}
              </td></tr>
              <tr><th>5.7 Necessidade de AET</th><td>{altos.length > 0 ? "Indicada" : "Não indicada com base nos achados deste ciclo"} — decisão registrada pelo responsável técnico.</td></tr>
            </tbody>
          </table>
        </section>

        {/* 6. Evolução entre ciclos */}
        {prev && !prev.copsoq.hidden && !target.copsoq.hidden && (
          <section>
            <h2 className="text-lg font-semibold mb-2">6. Acompanhamento da eficácia (comparação com o ciclo #{prev.round_no})</h2>
            <table className="nr1-table">
              <thead><tr><th>Dimensão</th><th>Ciclo #{prev.round_no}</th><th>Ciclo #{target.round_no}</th><th>Variação</th><th>Faixa atual</th></tr></thead>
              <tbody>
                {Object.entries(target.copsoq.scales).map(([id, v]) => {
                  const meta = copsoqScales[id];
                  const type = (meta?.type ?? "negative") as CopsoqScaleType;
                  const p = prev.copsoq.scales[id]?.mean;
                  const delta = typeof p === "number" ? +(v.mean - p).toFixed(1) : null;
                  const band = copsoqBand(type, v.mean);
                  const good = delta === null ? null : (type === "positive" ? delta > 0 : delta < 0);
                  return (
                    <tr key={id}>
                      <td>{meta?.name ?? id}</td>
                      <td>{typeof p === "number" ? p.toFixed(1) : "—"}</td>
                      <td>{v.mean.toFixed(1)}</td>
                      <td style={{ color: good === null ? "#52525b" : good ? "#0d7a5f" : "#b91c1c" }}>
                        {delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta}`}
                      </td>
                      <td><span className="nr1-badge" style={{ backgroundColor: bandColor(band) }}>{band}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}

        {/* 7. Devolutiva e registro */}
        <section>
          <h2 className="text-lg font-semibold mb-2">7. Comunicação aos trabalhadores e registro documental</h2>
          <p className="text-sm">
            Devolutiva coletiva comunicada em <strong>{fmtDate(target.devolutiva_communicated_at)}</strong>, em cumprimento ao
            dever de informação da NR-1 (item 1.4.1 “c”).
          </p>
          {target.devolutiva_notes && (
            <div className="mt-2 text-sm border-l-4 border-emerald-700 pl-3 whitespace-pre-wrap">{target.devolutiva_notes}</div>
          )}
          <p className="text-xs text-neutral-600 mt-2">
            Este documento e seus dados de origem devem ser mantidos por, no mínimo, 20 anos (NR-1, item 1.5.7.3.2) e ficar
            disponíveis à inspeção do trabalho, à CIPA e aos representantes dos trabalhadores.
          </p>
        </section>

        <footer className="text-xs text-neutral-500 border-t pt-3 mt-8">
          Documento gerado por Cuidar+ Trabalho · cuidarmaisbrasil.life · Instrumento de apoio técnico; a responsabilidade
          pela adoção das medidas e pela assinatura do PGR é da organização e de seu responsável técnico.
        </footer>

        <div className="grid grid-cols-2 gap-8 text-sm pt-12">
          <div className="space-y-3">
            <div className="border-b border-neutral-400 h-10" />
            <p>Responsável técnico (nome, registro e data)</p>
          </div>
          <div className="space-y-3">
            <div className="border-b border-neutral-400 h-10" />
            <p>Representante legal da organização (nome e data)</p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Nr1Report;
