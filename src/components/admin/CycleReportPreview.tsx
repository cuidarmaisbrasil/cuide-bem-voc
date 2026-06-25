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

const MOCK = {
  company: "Empresa Demonstração Ltda",
  cycle: { number: 3, start: "2026-03-25", end: "2026-06-25" },
  participants: { invited: 120, completed_all: 87, partial: 21 },
  waves: {
    phq9: {
      n: 108,
      mean: 7.4,
      dist: { minimal: 38, mild: 41, moderate: 18, moderately_severe: 8, severe: 3 },
      functional_impact_high: 14, // % com impacto "muito difícil"
    },
    ecig: {
      n: 102,
      scales: { conflito_tarefa: 2.8, conflito_relacionamento: 2.1, conflito_processo: 2.4 },
    },
    copsoq: {
      n: 98,
      scales: [
        { name: "Exigências quantitativas", type: "negative", mean: 62, band: "Risco" },
        { name: "Ritmo de trabalho", type: "negative", mean: 58, band: "Risco" },
        { name: "Influência no trabalho", type: "positive", mean: 48, band: "Risco" },
        { name: "Apoio social colegas", type: "positive", mean: 71, band: "Atenção" },
        { name: "Qualidade da liderança", type: "positive", mean: 64, band: "Atenção" },
        { name: "Reconhecimento", type: "positive", mean: 78, band: "Saudável" },
      ],
    },
    psicossocial: {
      n: 95,
      IGAP: 0.42,
      NEAP: 7.1,
      flagged: 9, // % com indicativo
    },
    assedio_sexual: {
      n: 92,
      MDiSH_total: 1.6,
      SHRAS_total: 1.4,
      any_endorsed: 11, // % que marcou ao menos 1 item > 0
    },
  },
  cross: {
    phq9_mod_and_copsoq_quant_risk: 12, // % colaboradores
    high_conflict_and_lipt_positive: 6,
    low_support_and_phq9_mod: 9,
  },
};

const bandColor = (band: string) =>
  band === "Risco" ? "bg-red-100 text-red-800" : band === "Atenção" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800";

function Pct({ n, total }: { n: number; total: number }) {
  return <span className="text-muted-foreground">({Math.round((n / total) * 100)}%)</span>;
}

export const CycleReportPreview = () => {
  const execSummary = useEditableText("cycle.exec_summary", "");
  const method = useEditableText("cycle.method", "");
  const phq9Txt = useEditableText("cycle.phq9_narrative", "");
  const ecigTxt = useEditableText("cycle.ecig_narrative", "");
  const copsoqTxt = useEditableText("cycle.copsoq_narrative", "");
  const psicoTxt = useEditableText("cycle.psicossocial_narrative", "");
  const asxTxt = useEditableText("cycle.assedio_narrative", "");
  const crossTxt = useEditableText("cycle.cross_findings", "");
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
                  Ciclo #{MOCK.cycle.number} · {new Date(MOCK.cycle.start).toLocaleDateString("pt-BR")} a{" "}
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
          </Card>

          {/* PHQ-9 */}
          <Card className="p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Onda 1 — PHQ-9 (humor)</h3>
              <span className="text-xs text-muted-foreground">n = {w.phq9.n} · média {w.phq9.mean}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{phq9Txt}</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              {Object.entries(w.phq9.dist).map(([k, n]) => (
                <div key={k} className="rounded border p-2">
                  <div className="text-muted-foreground capitalize">{k.replace("_", " ")}</div>
                  <div className="text-sm font-semibold">
                    {n} <Pct n={n} total={totalPhq} />
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-amber-700">
              ⚠ {w.phq9.functional_impact_high}% relataram impacto funcional "muito difícil".
            </div>
          </Card>

          {/* ECIG */}
          <Card className="p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Onda 2 — e-CIG (clima da equipe)</h3>
              <span className="text-xs text-muted-foreground">n = {w.ecig.n}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{ecigTxt}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {Object.entries(w.ecig.scales).map(([k, v]) => (
                <div key={k} className="rounded border p-2">
                  <div className="text-muted-foreground">{k.replace(/_/g, " ")}</div>
                  <div className="text-sm font-semibold">{v.toFixed(2)} <span className="text-muted-foreground">/ 5</span></div>
                </div>
              ))}
            </div>
          </Card>

          {/* COPSOQ */}
          <Card className="p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Onda 3 — COPSOQ II (fatores psicossociais)</h3>
              <span className="text-xs text-muted-foreground">n = {w.copsoq.n}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{copsoqTxt}</p>
            <div className="space-y-1 text-xs">
              {w.copsoq.scales.map((s) => (
                <div key={s.name} className="flex items-center justify-between border-b py-1">
                  <span>{s.name} <span className="text-muted-foreground">({s.type === "positive" ? "recurso" : "exigência"})</span></span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold">{s.mean}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${bandColor(s.band)}`}>{s.band}</span>
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* LIPT-60 */}
          <Card className="p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Onda 4 — LIPT-60 (assédio moral)</h3>
              <span className="text-xs text-muted-foreground">n = {w.psicossocial.n}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{psicoTxt}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <Stat label="IGAP (média geral)" value={w.psicossocial.IGAP} />
              <Stat label="NEAP (nº itens > 0)" value={w.psicossocial.NEAP} />
              <Stat label="% com indicativo" value={`${w.psicossocial.flagged}%`} />
            </div>
          </Card>

          {/* Assédio sexual */}
          <Card className="p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Onda 5 — Assédio sexual (MDiSH + SHRAS)</h3>
              <span className="text-xs text-muted-foreground">n = {w.assedio_sexual.n}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{asxTxt}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <Stat label="MDiSH total" value={w.assedio_sexual.MDiSH_total} />
              <Stat label="SHRAS total" value={w.assedio_sexual.SHRAS_total} />
              <Stat label="% com ao menos 1 item" value={`${w.assedio_sexual.any_endorsed}%`} />
            </div>
          </Card>

          {/* Cruzamentos */}
          <Card className="p-5 space-y-3 border-amber-300">
            <h3 className="font-semibold">Cruzamentos entre ondas</h3>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">{crossTxt}</p>
            <div className="space-y-1 text-xs">
              <CrossRow label="PHQ-9 moderado+ E COPSOQ exigências quantitativas em risco" pct={MOCK.cross.phq9_mod_and_copsoq_quant_risk} />
              <CrossRow label="Conflito alto (e-CIG) E LIPT-60 positivo" pct={MOCK.cross.high_conflict_and_lipt_positive} />
              <CrossRow label="Baixo apoio social E PHQ-9 moderado+" pct={MOCK.cross.low_support_and_phq9_mod} />
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
            <p className="text-sm text-muted-foreground">Acessado com seu código pessoal. Suas respostas são anônimas para a empresa.</p>
          </Card>

          <Card className="p-5 space-y-2">
            <h3 className="font-semibold">Mensagem</h3>
            <p className="text-sm whitespace-pre-wrap">{recWorker}</p>
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="font-semibold">Suas pontuações por onda</h3>
            <ul className="text-sm space-y-2">
              <li>• <b>PHQ-9:</b> 11 pontos — <span className="text-amber-700">moderado</span></li>
              <li>• <b>e-CIG:</b> conflito de relacionamento 2,3 / 5</li>
              <li>• <b>COPSOQ:</b> exigências quantitativas 70 (risco); apoio social 65 (atenção)</li>
              <li>• <b>LIPT-60:</b> IGAP 0,4 — sem indicativo</li>
              <li>• <b>Assédio sexual:</b> nenhum item endossado</li>
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

function CrossRow({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex items-center justify-between border-b py-1">
      <span className="pr-2">{label}</span>
      <span className="font-semibold">{pct}%</span>
    </div>
  );
}
