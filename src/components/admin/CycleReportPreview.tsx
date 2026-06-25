import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEditableText } from "@/hooks/useEditableText";
import { Link } from "react-router-dom";

/**
 * Preview do relatório consolidado do ciclo (5 ondas).
 * Usa dados fictícios para visualização. Os textos narrativos vêm de
 * wellness_editable_texts (editáveis na aba "Textos editáveis" do admin).
 */

type Band = "Saudável" | "Atenção" | "Risco";

const MOCK = {
  company: "Empresa Demonstração Ltda",
  cycle: { number: 3, start: "2026-03-25", end: "2026-06-25" },
  participants: { invited: 120, completed_all: 87, partial: 21 },
  waves: {
    phq9: {
      n: 108,
      mean: 7.4,
      dist: { minimal: 38, mild: 41, moderate: 18, moderately_severe: 8, severe: 3 },
      functional_impact_high: 14,
      // tags por categoria de severidade
      bands: {
        minimal: "Saudável" as Band,
        mild: "Atenção" as Band,
        moderate: "Risco" as Band,
        moderately_severe: "Risco" as Band,
        severe: "Risco" as Band,
      },
      overall: "Atenção" as Band, // resumo da onda
    },
    ecig: {
      n: 102,
      // escala 1-5: ≤2 saudável | 2-3 atenção | >3 risco
      scales: [
        { key: "conflito_tarefa", label: "Conflito de tarefa", mean: 2.8, band: "Atenção" as Band },
        { key: "conflito_relacionamento", label: "Conflito de relacionamento", mean: 2.1, band: "Atenção" as Band },
        { key: "conflito_processo", label: "Conflito de processo", mean: 1.6, band: "Saudável" as Band },
      ],
      overall: "Atenção" as Band,
    },
    copsoq: {
      n: 98,
      scales: [
        { name: "Exigências quantitativas", type: "negative", mean: 62, band: "Risco" as Band },
        { name: "Ritmo de trabalho", type: "negative", mean: 58, band: "Risco" as Band },
        { name: "Influência no trabalho", type: "positive", mean: 48, band: "Risco" as Band },
        { name: "Apoio social colegas", type: "positive", mean: 71, band: "Atenção" as Band },
        { name: "Qualidade da liderança", type: "positive", mean: 64, band: "Atenção" as Band },
        { name: "Reconhecimento", type: "positive", mean: 78, band: "Saudável" as Band },
      ],
    },
    psicossocial: {
      n: 95,
      IGAP: 0.42,
      NEAP: 7.1,
      flagged: 9,
      // IGAP: <0.5 saudável | 0.5-1.0 atenção | >1.0 risco
      bands: {
        IGAP: "Saudável" as Band,
        NEAP: "Atenção" as Band,
        flagged: "Atenção" as Band,
      },
      overall: "Atenção" as Band,
      // 6 estratégias clássicas do LIPT-60 (Leymann/Zapf adaptado)
      subscales: [
        { key: "desprestigio", label: "Desprestígio profissional", mean: 1.12, band: "Risco" as Band,
          detail: "Críticas injustas ao trabalho realizado, atribuição de tarefas humilhantes ou abaixo da qualificação, supervisão exagerada." },
        { key: "ampliacao_es", label: "Bloqueio / ampliação do escopo", mean: 0.78, band: "Atenção" as Band,
          detail: "Sobrecarga deliberada, prazos impossíveis, interrupções recorrentes; sinais de pressão organizada por chefias/pares." },
        { key: "desacreditacao", label: "Desacreditação pessoal", mean: 0.55, band: "Atenção" as Band,
          detail: "Boatos, ridicularização de aspectos pessoais, imitação caricata; expõe pessoas a constrangimento público." },
        { key: "comunicacao", label: "Limitação da comunicação", mean: 0.41, band: "Saudável" as Band,
          detail: "Acesso a informação e canais de fala preservados; mantenha rituais de reunião e feedback." },
        { key: "contato_social", label: "Isolamento social", mean: 0.34, band: "Saudável" as Band,
          detail: "Convivência preservada; ações de integração estão funcionando." },
        { key: "saude", label: "Violência física / ameaças à saúde", mean: 0.05, band: "Saudável" as Band,
          detail: "Nenhum indício relevante de agressões físicas, ameaças ou imposição de condições insalubres." },
      ],
      flagged_areas: ["Comercial", "Operações — turno noturno"],
    },
    assedio_sexual: {
      n: 92,
      MDiSH_total: 1.6,
      SHRAS_total: 1.4,
      any_endorsed: 11,
      bands: {
        MDiSH_total: "Atenção" as Band,
        SHRAS_total: "Saudável" as Band,
        any_endorsed: "Atenção" as Band,
      },
      overall: "Atenção" as Band,
      // 8 mecanismos de desengajamento moral (Bandura) aplicados a AS
      mdish_dims: [
        { key: "moral_justification", label: "Justificação moral", mean: 1.9, band: "Atenção" as Band,
          detail: "Há quem justifique comportamentos com base em 'tradição' ou 'cultura da equipe'. Treinamento de cultura e código de conduta com exemplos concretos." },
        { key: "euphemistic_labeling", label: "Rotulação eufemística", mean: 2.1, band: "Atenção" as Band,
          detail: "Uso de termos como 'brincadeira', 'paquera', 'descontração' para descrever condutas inadequadas. Glossário interno + campanha 'isto não é brincadeira'." },
        { key: "advantageous_comparison", label: "Comparação vantajosa", mean: 1.4, band: "Saudável" as Band, detail: "Pouco endosso a 'em outros lugares é pior'." },
        { key: "displacement_responsibility", label: "Deslocamento da responsabilidade", mean: 1.7, band: "Atenção" as Band,
          detail: "Atribuição da culpa a chefias ou ao 'clima geral'. Reforce responsabilização individual via política disciplinar e exemplos públicos." },
        { key: "diffusion_responsibility", label: "Difusão da responsabilidade", mean: 1.5, band: "Saudável" as Band, detail: "'Todo mundo faz' tem pouco apoio." },
        { key: "distortion_consequences", label: "Distorção das consequências", mean: 1.8, band: "Atenção" as Band,
          detail: "Subestimação do impacto sobre a vítima. Trabalhar relatos reais (anonimizados) e dados de afastamento em treinamentos obrigatórios." },
        { key: "dehumanization", label: "Desumanização", mean: 1.3, band: "Saudável" as Band, detail: "Baixa adesão a discursos que coisificam a vítima." },
        { key: "attribution_blame", label: "Atribuição de culpa à vítima", mean: 2.2, band: "Atenção" as Band,
          detail: "Endosso preocupante a 'ela provocou' / 'o jeito de vestir'. Prioridade: treinamento antivitimização + revisão de comitê de ética." },
      ],
      // SHRAS: atitudes de denúncia (quanto MAIOR melhor — usamos como recurso)
      shras_dims: [
        { key: "trust_channel", label: "Confiança no canal de denúncia", mean: 3.9, band: "Atenção" as Band,
          detail: "Pessoas relatam dúvida sobre confidencialidade. Publicar tempo médio de resposta e número de casos tratados (sem identificação)." },
        { key: "fear_retaliation", label: "Ausência de medo de retaliação", mean: 3.2, band: "Risco" as Band,
          detail: "Medo de represálias por parte de chefias diretas. Garantir canal externo + política antiretaliação explícita." },
        { key: "leadership_support", label: "Apoio percebido da liderança", mean: 4.2, band: "Saudável" as Band,
          detail: "Lideranças seniores são vistas como aliadas. Capilarizar postura entre líderes intermediários." },
      ],
    },
  },
  cross: [
    {
      label: "PHQ-9 moderado+ E COPSOQ exigências quantitativas em risco",
      pct: 12,
      band: "Risco" as Band,
      action:
        "Revisar carga e prazos das equipes mais afetadas; pactuar metas realistas com gestores; oferecer canal de acolhimento psicológico (EAP/parceria SUS) com encaminhamento ativo para PHQ-9 ≥ 10.",
    },
    {
      label: "Conflito alto (e-CIG) E LIPT-60 positivo",
      pct: 6,
      band: "Risco" as Band,
      action:
        "Mediação de conflitos por RH/psicologia organizacional, oficinas de comunicação não-violenta e revisão do canal de denúncia (anonimato + prazo de resposta). Avaliar mudança de líder direto quando indicado.",
    },
    {
      label: "Baixo apoio social E PHQ-9 moderado+",
      pct: 9,
      band: "Atenção" as Band,
      action:
        "Programa de mentoria entre pares, rituais de equipe (check-ins semanais), treinamento de liderança em escuta ativa e feedback de suporte.",
    },
    {
      label: "Reconhecimento saudável (COPSOQ) em toda a empresa",
      pct: 78,
      band: "Saudável" as Band,
      action:
        "Parabéns! Manter práticas de reconhecimento já consolidadas; documentar como referência interna e estender para áreas com menor pontuação.",
    },
    {
      label: "Conflito de processo baixo (e-CIG)",
      pct: 84,
      band: "Saudável" as Band,
      action:
        "Excelente clareza de processos. Use isto como base para escalar squads/áreas em risco — padronize e compartilhe os ritos atuais.",
    },
  ],
};

const bandColor = (band: Band) =>
  band === "Risco"
    ? "bg-red-100 text-red-800 border-red-200"
    : band === "Atenção"
    ? "bg-amber-100 text-amber-800 border-amber-200"
    : "bg-emerald-100 text-emerald-800 border-emerald-200";

function BandPill({ band }: { band: Band }) {
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${bandColor(band)}`}>
      {band}
    </span>
  );
}

function Pct({ n, total }: { n: number; total: number }) {
  return <span className="text-muted-foreground">({Math.round((n / total) * 100)}%)</span>;
}

const PHQ_LABEL: Record<string, string> = {
  minimal: "Mínimo (0-4)",
  mild: "Leve (5-9)",
  moderate: "Moderado (10-14)",
  moderately_severe: "Mod. grave (15-19)",
  severe: "Grave (20-27)",
};

export const CycleReportPreview = () => {
  const execSummary = useEditableText("cycle.exec_summary", "");
  const method = useEditableText(
    "cycle.method",
    "Em todas as ondas usamos as mesmas faixas de leitura: Saudável (verde), Atenção (âmbar) e Risco (vermelho). Para escalas positivas (recursos), quanto maior melhor; para escalas negativas (exigências/sintomas), quanto menor melhor.",
  );
  const phq9Txt = useEditableText("cycle.phq9_narrative", "");
  const ecigTxt = useEditableText("cycle.ecig_narrative", "");
  const copsoqTxt = useEditableText("cycle.copsoq_narrative", "");
  const psicoTxt = useEditableText("cycle.psicossocial_narrative", "");
  const asxTxt = useEditableText("cycle.assedio_narrative", "");
  const crossTxt = useEditableText(
    "cycle.cross_findings",
    "Os cruzamentos abaixo combinam respostas das diferentes ondas pelo mesmo código anônimo. Para itens em Risco, listamos ações sugeridas; para itens Saudáveis, parabéns à empresa pelo resultado obtido.",
  );
  const recCompany = useEditableText("cycle.recommendations_company", "");
  const recWorker = useEditableText("cycle.recommendations_worker", "");

  const w = MOCK.waves;
  const totalPhq = Object.values(w.phq9.dist).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-muted/30">
        <p className="text-sm">
          Esta é uma <b>prévia com dados fictícios</b> do relatório consolidado de ciclo (5 ondas).
          Todos os textos narrativos abaixo são editáveis em{" "}
          <Link to="#" className="underline">Textos editáveis</Link> (chaves <code>cycle.*</code>).
        </p>
      </Card>

      <Tabs defaultValue="company">
        <div className="overflow-x-auto -mx-2 px-2">
          <TabsList className="inline-flex w-max min-w-full">
            <TabsTrigger value="company">Visão empresa (agregada)</TabsTrigger>
            <TabsTrigger value="worker">Visão colaborador (individual)</TabsTrigger>
          </TabsList>
        </div>

        {/* =========== VISÃO EMPRESA =========== */}
        <TabsContent value="company" className="space-y-4 pt-4">
          <Card className="p-5 space-y-2">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-semibold">{MOCK.company}</h2>
                <p className="text-sm text-muted-foreground">
                  Ciclo #{MOCK.cycle.number} ·{" "}
                  {new Date(MOCK.cycle.start).toLocaleDateString("pt-BR")} a{" "}
                  {new Date(MOCK.cycle.end).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <Badge variant="outline">Trimestral · NR-1</Badge>
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="font-semibold">Resumo executivo</h3>
            <p className="text-sm whitespace-pre-wrap">{execSummary}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <Stat label="Convidados" value={MOCK.participants.invited} />
              <Stat label="Completaram as 5 ondas" value={MOCK.participants.completed_all} />
              <Stat label="Parcial (1–4 ondas)" value={MOCK.participants.partial} />
            </div>
          </Card>

          <Card className="p-5 space-y-2">
            <h3 className="font-semibold">Como interpretamos as pontuações</h3>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">{method}</p>
            <div className="flex gap-2 flex-wrap pt-1">
              <BandPill band="Saudável" />
              <BandPill band="Atenção" />
              <BandPill band="Risco" />
            </div>
          </Card>

          {/* PHQ-9 */}
          <Card className="p-5 space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="font-semibold">Onda 1 — PHQ-9 (humor)</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>n = {w.phq9.n} · média {w.phq9.mean}</span>
                <BandPill band={w.phq9.overall} />
              </div>
            </div>
            <p className="text-sm whitespace-pre-wrap">{phq9Txt}</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              {Object.entries(w.phq9.dist).map(([k, n]) => (
                <div key={k} className="rounded border p-2 space-y-1">
                  <div className="text-muted-foreground">{PHQ_LABEL[k]}</div>
                  <div className="text-sm font-semibold">
                    {n} <Pct n={n} total={totalPhq} />
                  </div>
                  <BandPill band={(w.phq9.bands as any)[k]} />
                </div>
              ))}
            </div>
            <div className="text-xs text-amber-700">
              ⚠ {w.phq9.functional_impact_high}% relataram impacto funcional "muito difícil".
            </div>
          </Card>

          {/* ECIG */}
          <Card className="p-5 space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="font-semibold">Onda 2 — e-CIG (clima da equipe)</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>n = {w.ecig.n}</span>
                <BandPill band={w.ecig.overall} />
              </div>
            </div>
            <p className="text-sm whitespace-pre-wrap">{ecigTxt}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {w.ecig.scales.map((s) => (
                <div key={s.key} className="rounded border p-2 space-y-1">
                  <div className="text-muted-foreground">{s.label}</div>
                  <div className="text-sm font-semibold">
                    {s.mean.toFixed(2)} <span className="text-muted-foreground">/ 5</span>
                  </div>
                  <BandPill band={s.band} />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Critério: ≤ 2,0 Saudável · 2,1–3,0 Atenção · &gt; 3,0 Risco (escala negativa).
            </p>
          </Card>

          {/* COPSOQ */}
          <Card className="p-5 space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="font-semibold">Onda 3 — COPSOQ II (fatores psicossociais)</h3>
              <span className="text-xs text-muted-foreground">n = {w.copsoq.n}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{copsoqTxt}</p>
            <div className="space-y-1 text-xs">
              {w.copsoq.scales.map((s) => (
                <div key={s.name} className="flex items-center justify-between border-b py-1 gap-2">
                  <span>
                    {s.name}{" "}
                    <span className="text-muted-foreground">
                      ({s.type === "positive" ? "recurso" : "exigência"})
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold">{s.mean}</span>
                    <BandPill band={s.band} />
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* LIPT-60 */}
          <Card className="p-5 space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="font-semibold">Onda 4 — LIPT-60 (assédio moral)</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>n = {w.psicossocial.n}</span>
                <BandPill band={w.psicossocial.overall} />
              </div>
            </div>
            <p className="text-sm whitespace-pre-wrap">{psicoTxt}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <StatBand label="IGAP (média geral)" value={w.psicossocial.IGAP} band={w.psicossocial.bands.IGAP} />
              <StatBand label="NEAP (nº itens > 0)" value={w.psicossocial.NEAP} band={w.psicossocial.bands.NEAP} />
              <StatBand label="% com indicativo" value={`${w.psicossocial.flagged}%`} band={w.psicossocial.bands.flagged} />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Critério IGAP: &lt; 0,5 Saudável · 0,5–1,0 Atenção · &gt; 1,0 Risco.
            </p>
          </Card>

          {/* Assédio sexual */}
          <Card className="p-5 space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="font-semibold">Onda 5 — Assédio sexual (MDiSH + SHRAS)</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>n = {w.assedio_sexual.n}</span>
                <BandPill band={w.assedio_sexual.overall} />
              </div>
            </div>
            <p className="text-sm whitespace-pre-wrap">{asxTxt}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <StatBand label="MDiSH (desengajamento moral)" value={w.assedio_sexual.MDiSH_total} band={w.assedio_sexual.bands.MDiSH_total} />
              <StatBand label="SHRAS (atitudes de denúncia)" value={w.assedio_sexual.SHRAS_total} band={w.assedio_sexual.bands.SHRAS_total} />
              <StatBand label="% com ao menos 1 item endossado" value={`${w.assedio_sexual.any_endorsed}%`} band={w.assedio_sexual.bands.any_endorsed} />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Critério: ≤ 1,5 Saudável · 1,6–2,5 Atenção · &gt; 2,5 Risco (média de itens).
            </p>
          </Card>

          {/* Cruzamentos */}
          <Card className="p-5 space-y-3 border-amber-300">
            <h3 className="font-semibold">Cruzamentos entre ondas — leitura final</h3>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">{crossTxt}</p>
            <div className="space-y-3 text-xs">
              {MOCK.cross.map((c, i) => (
                <div
                  key={i}
                  className={`rounded border p-3 ${
                    c.band === "Risco"
                      ? "border-red-200 bg-red-50"
                      : c.band === "Atenção"
                      ? "border-amber-200 bg-amber-50"
                      : "border-emerald-200 bg-emerald-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-medium pr-2">{c.label}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-semibold">{c.pct}%</span>
                      <BandPill band={c.band} />
                    </span>
                  </div>
                  <p className="mt-2">
                    <b>
                      {c.band === "Saudável"
                        ? "🎉 Parabéns: "
                        : c.band === "Risco"
                        ? "🛠 Ação recomendada: "
                        : "💡 Sugestão: "}
                    </b>
                    {c.action}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 space-y-2 bg-primary/5">
            <h3 className="font-semibold">Recomendações à empresa</h3>
            <p className="text-sm whitespace-pre-wrap">{recCompany}</p>
          </Card>
        </TabsContent>

        {/* =========== VISÃO COLABORADOR =========== */}
        <TabsContent value="worker" className="space-y-4 pt-4">
          <Card className="p-5">
            <h2 className="text-xl font-semibold">Seu ciclo de avaliação</h2>
            <p className="text-sm text-muted-foreground">
              Acessado com seu código pessoal. Suas respostas são anônimas para a empresa.
            </p>
          </Card>

          <Card className="p-5 space-y-2">
            <h3 className="font-semibold">Mensagem</h3>
            <p className="text-sm whitespace-pre-wrap">{recWorker}</p>
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="font-semibold">Suas pontuações por onda</h3>
            <ul className="text-sm space-y-2">
              <li className="flex items-center gap-2 flex-wrap">
                • <b>PHQ-9:</b> 11 pontos <BandPill band="Risco" />
              </li>
              <li className="flex items-center gap-2 flex-wrap">
                • <b>e-CIG:</b> conflito de relacionamento 2,3 / 5 <BandPill band="Atenção" />
              </li>
              <li className="flex items-center gap-2 flex-wrap">
                • <b>COPSOQ:</b> exigências quantitativas 70 <BandPill band="Risco" />; apoio social 65{" "}
                <BandPill band="Atenção" />
              </li>
              <li className="flex items-center gap-2 flex-wrap">
                • <b>LIPT-60:</b> IGAP 0,4 <BandPill band="Saudável" />
              </li>
              <li className="flex items-center gap-2 flex-wrap">
                • <b>Assédio sexual:</b> nenhum item endossado <BandPill band="Saudável" />
              </li>
            </ul>
          </Card>

          <Card className="p-5 space-y-2 bg-primary/5">
            <h3 className="font-semibold">O que considerar</h3>
            <p className="text-sm whitespace-pre-wrap">{recCompany}</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function StatBand({ label, value, band }: { label: string; value: any; band: Band }) {
  return (
    <div className="rounded border p-3 space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
      <BandPill band={band} />
    </div>
  );
}
