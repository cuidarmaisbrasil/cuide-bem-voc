import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

/**
 * Admin-only preview of:
 *  - The 5 employee response pages (intro / projective / form / done)
 *  - The transactional emails sent to employees + the contact-notification email
 *
 * Read-only — nothing is submitted. Questions are pulled live from
 * instrument_questions so the preview matches what employees will see.
 */

type Wave = "phq9" | "ecig" | "copsoq" | "psicossocial" | "assedio_sexual";

const WAVE_META: Record<Wave, { title: string; instrument: string; projective?: "tat" | "rorschach"; minutes: string; intro: string; emailSubject: string }> = {
  phq9: {
    title: "Onda 1 — PHQ-9 (humor)",
    instrument: "phq9",
    projective: "tat",
    minutes: "3 a 5 minutos",
    intro: "Esta primeira avaliação foca em sintomas de humor e bem-estar emocional. É anônima — sua empresa só verá resultados agregados.",
    emailSubject: "Avaliação de bem-estar — etapa 1 (humor)",
  },
  ecig: {
    title: "Onda 2 — ECIG (clima da equipe)",
    instrument: "ecig",
    projective: "rorschach",
    minutes: "3 a 4 minutos",
    intro: "Esta etapa avalia conflitos e tensões dentro do grupo de trabalho. É anônima e leva poucos minutos.",
    emailSubject: "Avaliação de bem-estar — etapa 2 (clima da equipe)",
  },
  copsoq: {
    title: "Onda 3 — COPSOQ (trabalho)",
    instrument: "copsoq_short_br",
    minutes: "8 a 15 minutos",
    intro: "Esta etapa avalia fatores psicossociais do seu trabalho (exigências, autonomia, apoio, reconhecimento). É anônima.",
    emailSubject: "Avaliação de bem-estar — etapa 3 (trabalho)",
  },
  psicossocial: {
    title: "Onda 4 — LIPT-60 (clima psicossocial)",
    instrument: "lipt60",
    minutes: "6 a 10 minutos",
    intro: "Esta etapa avalia a frequência de situações de assédio moral, hostilidade e exclusão (Inventário de Leymann — LIPT-60). É anônima e estritamente confidencial.",
    emailSubject: "Avaliação de bem-estar — etapa 4 (clima psicossocial)",
  },
  assedio_sexual: {
    title: "Onda 5 — MDiSH + SHRAS (assédio sexual)",
    instrument: "assedio_sexual",
    minutes: "6 a 10 minutos",
    intro: "Esta etapa avalia atitudes e percepções sobre assédio sexual e sobre o clima da empresa para denúncias (MDiSH + SHRAS). É anônima e estritamente confidencial.",
    emailSubject: "Avaliação de bem-estar — etapa 5 (assédio sexual)",
  },
};

const RESPONSE_SETS: Record<string, { value: number; label: string }[]> = {
  phq9_freq: [
    { value: 0, label: "Nenhuma vez" }, { value: 1, label: "Vários dias" },
    { value: 2, label: "Mais da metade" }, { value: 3, label: "Quase todos os dias" },
  ],
  phq9_impact: [
    { value: 0, label: "Nada difícil" }, { value: 1, label: "Um pouco" },
    { value: 2, label: "Muito" }, { value: 3, label: "Extremamente" },
  ],
  ecig_5: [
    { value: 1, label: "Nunca" }, { value: 2, label: "Raramente" }, { value: 3, label: "Às vezes" },
    { value: 4, label: "Frequentemente" }, { value: 5, label: "Sempre" },
  ],
  copsoq_5_freq: [
    { value: 1, label: "Nunca" }, { value: 2, label: "Raramente" }, { value: 3, label: "Às vezes" },
    { value: 4, label: "Frequentemente" }, { value: 5, label: "Sempre" },
  ],
  lipt_5: [
    { value: 0, label: "Nunca" }, { value: 1, label: "Raramente" }, { value: 2, label: "Algumas vezes/mês" },
    { value: 3, label: "Várias vezes/semana" }, { value: 4, label: "Diariamente" },
  ],
  asx_5: [
    { value: 1, label: "Discordo totalmente" }, { value: 2, label: "Discordo" }, { value: 3, label: "Neutro" },
    { value: 4, label: "Concordo" }, { value: 5, label: "Concordo totalmente" },
  ],
};

interface Q { n: number; text: string; response_set?: string }

function ResponderPreview({ wave }: { wave: Wave }) {
  const meta = WAVE_META[wave];
  const [questions, setQuestions] = useState<Q[]>([]);
  const [view, setView] = useState<"intro" | "projective" | "form" | "done">("intro");

  useEffect(() => {
    supabase.from("instrument_questions")
      .select("n,text,response_set")
      .eq("instrument", meta.instrument)
      .eq("active", true)
      .order("n")
      .then(({ data }) => setQuestions((data as Q[]) || []));
  }, [meta.instrument]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={view === "intro" ? "default" : "outline"} onClick={() => setView("intro")}>Tela 1 — intro</Button>
        {meta.projective && (
          <Button size="sm" variant={view === "projective" ? "default" : "outline"} onClick={() => setView("projective")}>
            Tela 2 — {meta.projective === "tat" ? "TAT" : "Rorschach"}
          </Button>
        )}
        <Button size="sm" variant={view === "form" ? "default" : "outline"} onClick={() => setView("form")}>Tela {meta.projective ? 3 : 2} — questionário</Button>
        <Button size="sm" variant={view === "done" ? "default" : "outline"} onClick={() => setView("done")}>Tela final — código pessoal</Button>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="mx-auto max-w-2xl bg-background rounded-md border p-4 space-y-4">
          <div className="text-center">
            <h3 className="font-display text-xl font-semibold">Empresa Exemplo S.A.</h3>
            <p className="text-xs text-muted-foreground">{meta.title}</p>
          </div>

          {view === "intro" && (
            <Card className="p-5 space-y-3">
              <p className="text-sm">Suas respostas são <strong>anônimas</strong>. Sua empresa só verá dados agregados.</p>
              <p className="text-xs text-muted-foreground">{meta.intro}</p>
              <p className="text-xs"><strong>Tempo estimado:</strong> {meta.minutes}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="border rounded p-2">Faixa etária</div>
                <div className="border rounded p-2">Gênero</div>
                <div className="border rounded p-2">Departamento</div>
                <div className="border rounded p-2">Tempo de empresa</div>
              </div>
              {meta.projective && (
                <div className="rounded-md border bg-muted/40 p-2 text-xs text-muted-foreground">
                  Esta etapa inclui uma atividade {meta.projective === "tat" ? "narrativa (TAT)" : "projetiva (Rorschach)"} de até <strong>10 minutos</strong> antes do questionário.
                </div>
              )}
              <Button className="w-full" disabled>Começar ({questions.length} perguntas)</Button>
            </Card>
          )}

          {view === "projective" && meta.projective && (
            <Card className="p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">
                  {meta.projective === "tat" ? "Atividade narrativa (TAT)" : "Atividade projetiva (Rorschach)"}
                </h4>
                <span className="font-mono text-sm border rounded px-2 py-1 bg-muted">10:00</span>
              </div>
              <div className="h-48 bg-black/5 border rounded flex items-center justify-center text-xs text-muted-foreground">
                [imagem {meta.projective === "tat" ? "TAT" : "Rorschach"} aleatória do banco]
              </div>
              <p className="text-sm font-medium">
                {meta.projective === "tat"
                  ? "Olhe a imagem e escreva uma história sobre ela:"
                  : "Olhe a mancha e descreva: o que isto poderia ser?"}
              </p>
              <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-0.5">
                {meta.projective === "tat" ? (
                  <>
                    <li>O que está acontecendo na cena?</li>
                    <li>O que levou a essa situação?</li>
                    <li>O que as pessoas estão pensando e sentindo?</li>
                    <li>Como a história termina?</li>
                  </>
                ) : (
                  <>
                    <li>O que você enxerga na mancha?</li>
                    <li>Quais detalhes chamam mais sua atenção?</li>
                    <li>O que mais poderia ser?</li>
                    <li>Como você se sente ao olhar para ela?</li>
                  </>
                )}
              </ul>
              <div className="h-24 border rounded bg-muted/40 p-2 text-xs text-muted-foreground italic">
                [campo de texto livre — até 10 minutos]
              </div>
              <Button className="w-full" disabled>Concluir atividade e seguir para o questionário</Button>
            </Card>
          )}

          {view === "form" && (
            <>
              <div className="sticky top-0 bg-background/95 py-1">
                <Progress value={15} />
                <p className="text-xs text-muted-foreground text-center mt-1">
                  {questions.length ? `0 / ${questions.length}` : "carregando…"}
                </p>
              </div>
              {questions.length === 0 ? (
                <Card className="p-4 text-xs text-muted-foreground">Sem perguntas cadastradas para este instrumento ainda.</Card>
              ) : (
                questions.slice(0, 5).map((q) => {
                  const opts = RESPONSE_SETS[q.response_set || "copsoq_5_freq"] || RESPONSE_SETS.copsoq_5_freq;
                  return (
                    <Card key={q.n} className="p-3">
                      <p className="text-sm font-medium mb-2"><span className="text-muted-foreground mr-2">{q.n}.</span>{q.text}</p>
                      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${opts.length}, minmax(0,1fr))` }}>
                        {opts.map((opt) => (
                          <div key={opt.value} className="p-1.5 rounded border text-center text-[10px] bg-background">
                            <div className="font-mono font-semibold">{opt.value}</div>
                            <div className="leading-tight">{opt.label}</div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  );
                })
              )}
              {questions.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  …mostrando 5 de {questions.length} perguntas (a página real mostra todas).
                </p>
              )}
            </>
          )}

          {view === "done" && (
            <Card className="p-6 text-center space-y-3">
              <div className="text-3xl">✓</div>
              <h4 className="font-semibold">Obrigado pela colaboração</h4>
              <p className="text-xs text-muted-foreground">Sua resposta anônima foi registrada.</p>
              <div className="text-left bg-muted/40 border rounded p-3 space-y-2">
                <p className="text-xs font-semibold">Seu código pessoal de acesso ao relatório individual</p>
                <div className="font-mono text-base text-center bg-background border rounded px-3 py-2 tracking-wider">
                  AB12-CD34-EF56-GH78
                </div>
                <p className="text-[11px] text-muted-foreground">
                  <strong>Guarde agora.</strong> Não armazenamos em claro — se perder, não há recuperação.
                  Use o mesmo código em todas as ondas em <code>/meu-resultado</code>. A empresa não tem acesso.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function EmailFrame({ subject, children }: { subject: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="text-xs text-muted-foreground mb-2">
        <strong>Assunto:</strong> {subject}
      </div>
      <div className="mx-auto max-w-[600px] bg-white border rounded shadow-sm" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        {children}
      </div>
    </div>
  );
}

const inviteCopy: Record<Wave, { title: string; intro: string; minutes: string }> = {
  phq9: { title: "Etapa 1: como você tem se sentido?", intro: WAVE_META.phq9.intro, minutes: WAVE_META.phq9.minutes },
  ecig: { title: "Etapa 2: como está o clima na sua equipe?", intro: WAVE_META.ecig.intro, minutes: WAVE_META.ecig.minutes },
  copsoq: { title: "Etapa 3: como está o seu trabalho?", intro: WAVE_META.copsoq.intro, minutes: WAVE_META.copsoq.minutes },
  psicossocial: { title: "Etapa 4: clima psicossocial e situações no trabalho", intro: WAVE_META.psicossocial.intro, minutes: WAVE_META.psicossocial.minutes },
  assedio_sexual: { title: "Etapa 5: percepções sobre assédio sexual no trabalho", intro: WAVE_META.assedio_sexual.intro, minutes: WAVE_META.assedio_sexual.minutes },
};

function InviteEmail({ wave }: { wave: Wave }) {
  const c = inviteCopy[wave];
  return (
    <EmailFrame subject={WAVE_META[wave].emailSubject}>
      <div style={{ padding: "24px", color: "#334155" }}>
        <h1 style={{ fontSize: "22px", color: "#0f172a", margin: "0 0 20px" }}>{c.title}</h1>
        <p style={{ fontSize: "15px", lineHeight: 1.6, margin: "0 0 16px" }}>
          Você foi convidado(a) pela <strong>Empresa Exemplo</strong> a participar de um programa de avaliação preventiva de bem-estar no trabalho.
        </p>
        <p style={{ fontSize: "15px", lineHeight: 1.6, margin: "0 0 16px" }}>{c.intro}</p>
        <p style={{ fontSize: "15px", margin: "0 0 16px" }}><strong>Tempo estimado:</strong> {c.minutes}.</p>
        <div style={{ textAlign: "center", margin: "32px 0" }}>
          <span style={{ background: "#2563eb", color: "#fff", padding: "12px 24px", borderRadius: 8, fontWeight: 600, fontSize: 15 }}>
            Responder agora
          </span>
        </div>
        <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>
          Suas respostas são confidenciais. A empresa recebe apenas estatísticas agregadas, sem identificação individual.
        </p>
        <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>
          Recomendamos reservar alguns minutos do seu <strong>horário de trabalho</strong> para responder com tranquilidade.
        </p>
        <div style={{ background: "#fef2f2", color: "#b91c1c", padding: 12, borderRadius: 6, fontSize: 13, margin: "24px 0 16px" }}>
          <strong>Em emergência:</strong> ligue 188 (CVV) ou 192 (SAMU).
        </div>
        <p style={{ fontSize: "12px", color: "#94a3b8", margin: "32px 0 0" }}>Equipe Cuidar+</p>
      </div>
    </EmailFrame>
  );
}

function ContactEmail() {
  return (
    <EmailFrame subject="[Cuidar+ Trabalho] Quero saber mais">
      <div style={{ padding: 24, color: "#334155" }}>
        <h1 style={{ fontSize: 22, color: "#0f172a", margin: "0 0 16px" }}>Novo contato — Cuidar+ Trabalho</h1>
        <p style={{ fontSize: 14, lineHeight: 1.6 }}>Você recebeu uma nova mensagem pelo formulário de contato.</p>
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 20, margin: "16px 0" }}>
          {[
            ["Nome", "Maria Souza"],
            ["E-mail de contato", "maria@empresa.com"],
            ["Empresa", "Empresa Exemplo"],
            ["Assunto", "Quero saber mais"],
          ].map(([l, v]) => (
            <div key={l}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b", margin: "12px 0 4px", fontWeight: 600 }}>{l}</div>
              <div style={{ fontSize: 15, color: "#0f172a" }}>{v}</div>
            </div>
          ))}
          <hr style={{ borderColor: "#e2e8f0", margin: "16px 0" }} />
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b", margin: "12px 0 4px", fontWeight: 600 }}>Mensagem</div>
          <div style={{ fontSize: 15, color: "#0f172a", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            Gostaria de agendar uma conversa sobre o programa.
          </div>
        </div>
        <p style={{ fontSize: 12, color: "#94a3b8" }}>
          Cuidar+ — formulário de contato (página /trabalho). Enviado para <code>everojas@proton.me</code>.
        </p>
      </div>
    </EmailFrame>
  );
}

function RetestEmail() {
  return (
    <EmailFrame subject="Lembrete: refaça sua avaliação no Cuidar+">
      <div style={{ padding: 24, color: "#334155" }}>
        <h1 style={{ fontSize: 22, color: "#0f172a", margin: "0 0 20px" }}>Como você está se sentindo agora?</h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 16px" }}>
          Olá! Há cerca de 15 dias você fez uma autoavaliação no Cuidar+ com resultado classificado como "Moderada".
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 16px" }}>
          Acompanhar a evolução dos sintomas é parte importante do cuidado com a saúde mental. Refaça o teste e compare como você está agora.
        </p>
        <div style={{ textAlign: "center", margin: "32px 0" }}>
          <span style={{ background: "#2563eb", color: "#fff", padding: "12px 24px", borderRadius: 8, fontWeight: 600 }}>
            Refazer minha avaliação
          </span>
        </div>
        <div style={{ background: "#fef2f2", color: "#b91c1c", padding: 12, borderRadius: 6, fontSize: 13, margin: "24px 0 16px" }}>
          <strong>Em emergência:</strong> ligue 188 (CVV) ou 192 (SAMU).
        </div>
        <p style={{ fontSize: 12, color: "#94a3b8" }}>Com cuidado, equipe Cuidar+</p>
      </div>
    </EmailFrame>
  );
}

export const WellnessPreviewAdmin = () => {
  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-2">
        <h2 className="font-display text-lg font-semibold">Prévia do colaborador</h2>
        <p className="text-sm text-muted-foreground">
          Veja exatamente o que o colaborador encontrará em cada onda — telas das páginas de resposta e
          conteúdo de cada e-mail enviado. Tudo aqui é estático (nada é gravado ou disparado).
        </p>
      </Card>

      <Tabs defaultValue="pages">
        <TabsList>
          <TabsTrigger value="pages">Páginas de resposta</TabsTrigger>
          <TabsTrigger value="emails">E-mails enviados</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="pt-4">
          <Tabs defaultValue="phq9">
            <TabsList className="flex flex-wrap h-auto">
              {(Object.keys(WAVE_META) as Wave[]).map((w) => (
                <TabsTrigger key={w} value={w}>{WAVE_META[w].title}</TabsTrigger>
              ))}
            </TabsList>
            {(Object.keys(WAVE_META) as Wave[]).map((w) => (
              <TabsContent key={w} value={w} className="pt-4">
                <ResponderPreview wave={w} />
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        <TabsContent value="emails" className="pt-4">
          <Tabs defaultValue="invite_phq9">
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="invite_phq9">Convite — Onda 1</TabsTrigger>
              <TabsTrigger value="invite_ecig">Convite — Onda 2</TabsTrigger>
              <TabsTrigger value="invite_copsoq">Convite — Onda 3</TabsTrigger>
              <TabsTrigger value="invite_psicossocial">Convite — Onda 4</TabsTrigger>
              <TabsTrigger value="invite_assedio_sexual">Convite — Onda 5</TabsTrigger>
              <TabsTrigger value="retest">Lembrete (retestagem)</TabsTrigger>
              <TabsTrigger value="contact">Contato (recebido por você)</TabsTrigger>
            </TabsList>
            {(["phq9", "ecig", "copsoq", "psicossocial", "assedio_sexual"] as Wave[]).map((w) => (
              <TabsContent key={w} value={`invite_${w}`} className="pt-4">
                <InviteEmail wave={w} />
              </TabsContent>
            ))}
            <TabsContent value="retest" className="pt-4"><RetestEmail /></TabsContent>
            <TabsContent value="contact" className="pt-4"><ContactEmail /></TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};
