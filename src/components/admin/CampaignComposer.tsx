import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Download, ExternalLink, Info } from "lucide-react";

// Default Search campaign tailored to Cuidar+ — based on PHQ-9 / mental health
// search intent in pt-BR, conservative budget, conversion-friendly copy.
const DEFAULT_HEADLINES = [
  "Teste de Depressão Online",            // 25
  "Avaliação Gratuita PHQ-9",             // 23
  "Estou com Depressão? Descubra",        // 28
  "Teste Validado pela OMS",              // 23
  "Resultado em 3 Minutos",               // 22
  "100% Anônimo e Confidencial",          // 27
  "Cuidar+ · Saúde Mental",               // 22
  "Onde Buscar Ajuda no SUS",             // 23
  "Sintomas de Depressão?",               // 22
  "Faça o Teste Agora · Grátis",          // 27
  "Apoio Emocional Imediato",             // 24
  "Ansiedade ou Depressão?",              // 23
  "Triagem Baseada no DSM-5",             // 24
  "Não Está Sozinho · Comece",            // 26
  "Avaliação Acolhedora",                 // 20
];

const DEFAULT_DESCRIPTIONS = [
  "Autoavaliação acolhedora baseada no PHQ-9 (OMS) e DSM-5. Descubra como você está hoje.",
  "Anônimo, gratuito e em 3 minutos. Saiba onde buscar ajuda gratuita no SUS perto de você.",
  "Não substitui diagnóstico médico, mas ajuda você a entender seus sintomas com clareza.",
  "Plataforma educativa criada com critérios validados internacionalmente. Comece agora.",
];

const DEFAULT_KEYWORDS_EXACT = [
  "[teste de depressão]",
  "[teste depressão online]",
  "[teste phq 9]",
  "[estou com depressão]",
  "[sintomas de depressão]",
  "[avaliação depressão]",
];

const DEFAULT_KEYWORDS_PHRASE = [
  '"teste de depressão gratis"',
  '"como saber se tenho depressão"',
  '"teste online saúde mental"',
  '"sinais de depressão teste"',
  '"autoavaliação depressão"',
  '"phq 9 online"',
];

const NEGATIVE_KEYWORDS = [
  "-infantil", "-cachorro", "-grátis filme", "-piada",
  "-tcc", "-monografia", "-pdf", "-letra", "-musica",
  "-game", "-jogo", "-meme",
];

const SITELINKS = [
  { title: "Como funciona", desc1: "Entenda o método em 1 minuto", desc2: "PHQ-9 + DSM-5", path: "/#sobre" },
  { title: "Onde buscar ajuda", desc1: "CAPS, UBS e CVV 188", desc2: "Atendimento gratuito", path: "/#sobre" },
  { title: "Política de privacidade", desc1: "100% anônimo", desc2: "Dados protegidos", path: "/privacidade" },
  { title: "Plantão CVV 188", desc1: "Apoio emocional 24h", desc2: "Ligação gratuita", path: "/#sobre" },
];

const CALLOUTS = [
  "Gratuito", "Anônimo", "Validado OMS", "3 minutos",
  "Sem cadastro", "Resultado imediato", "Apoio CVV 188",
];

interface Props {
  baseUrl: string; // ex: https://cuidarmaisbrasil.life
}

export const CampaignComposer = ({ baseUrl }: Props) => {
  const [budget, setBudget] = useState(20);
  const [campaignName, setCampaignName] = useState("Cuidar+ · Search · Brasil");
  const [headlines, setHeadlines] = useState(DEFAULT_HEADLINES.join("\n"));
  const [descriptions, setDescriptions] = useState(DEFAULT_DESCRIPTIONS.join("\n"));
  const [keywords, setKeywords] = useState(
    [...DEFAULT_KEYWORDS_EXACT, ...DEFAULT_KEYWORDS_PHRASE].join("\n")
  );
  const [negatives, setNegatives] = useState(NEGATIVE_KEYWORDS.join("\n"));
  const [finalUrl, setFinalUrl] = useState(
    `${baseUrl}/?utm_source=google&utm_medium=cpc&utm_campaign=cuidar-search-br&utm_content=phq9`
  );

  const headlineList = useMemo(
    () => headlines.split("\n").map((h) => h.trim()).filter(Boolean),
    [headlines]
  );
  const descList = useMemo(
    () => descriptions.split("\n").map((d) => d.trim()).filter(Boolean),
    [descriptions]
  );
  const kwList = useMemo(
    () => keywords.split("\n").map((k) => k.trim()).filter(Boolean),
    [keywords]
  );
  const negList = useMemo(
    () => negatives.split("\n").map((n) => n.trim().replace(/^-/, "")).filter(Boolean),
    [negatives]
  );

  const monthly = budget * 30.4;

  // Validations matching Google Ads RSA limits
  const headlineErrors = headlineList.filter((h) => h.length > 30);
  const descErrors = descList.filter((d) => d.length > 90);
  const issues: string[] = [];
  if (headlineList.length < 3) issues.push("Mínimo 3 títulos exigidos pelo Google.");
  if (headlineList.length > 15) issues.push("Máximo 15 títulos.");
  if (descList.length < 2) issues.push("Mínimo 2 descrições exigidas.");
  if (descList.length > 4) issues.push("Máximo 4 descrições.");
  if (headlineErrors.length) issues.push(`${headlineErrors.length} título(s) com mais de 30 caracteres.`);
  if (descErrors.length) issues.push(`${descErrors.length} descrição(ões) com mais de 90 caracteres.`);
  if (budget > 20) issues.push("Orçamento acima do limite proposto (R$ 20/dia).");

  const previewHost = useMemo(() => {
    try { return new URL(finalUrl).hostname.replace(/^www\./, ""); } catch { return baseUrl; }
  }, [finalUrl, baseUrl]);

  const previewHeadline = headlineList.slice(0, 3).join(" | ") || "Teste de Depressão Online";
  const previewDesc = descList[0] || "";

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  const downloadCsv = () => {
    // Google Ads Editor compatible CSV (Search RSA)
    const rows: string[][] = [];
    rows.push(["Campaign", "Budget", "Campaign Type", "Networks", "Languages", "Bid Strategy Type", "Campaign Status"]);
    rows.push([campaignName, String(budget), "Search", "Google search", "Portuguese", "Maximize Conversions", "Paused"]);
    rows.push([]);
    rows.push(["Campaign", "Ad Group", "Ad Group Status", "Default Max CPC"]);
    rows.push([campaignName, "Depressão · Geral", "Enabled", "2.50"]);
    rows.push([]);
    rows.push(["Campaign", "Ad Group", "Keyword", "Match Type", "Status"]);
    for (const k of kwList) {
      let kw = k, match = "Broad";
      if (k.startsWith("[") && k.endsWith("]")) { kw = k.slice(1, -1); match = "Exact"; }
      else if (k.startsWith('"') && k.endsWith('"')) { kw = k.slice(1, -1); match = "Phrase"; }
      rows.push([campaignName, "Depressão · Geral", kw, match, "Enabled"]);
    }
    rows.push([]);
    rows.push(["Campaign", "Negative Keyword", "Match Type", "Level"]);
    for (const n of negList) rows.push([campaignName, n, "Broad", "Campaign"]);
    rows.push([]);
    rows.push(["Campaign", "Ad Group", "Ad Type", "Final URL", ...headlineList.map((_, i) => `Headline ${i + 1}`), ...descList.map((_, i) => `Description ${i + 1}`)]);
    rows.push([campaignName, "Depressão · Geral", "Responsive search ad", finalUrl, ...headlineList, ...descList]);

    const csv = rows.map((r) => r.map((c) => `"${(c ?? "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${campaignName.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado para Google Ads Editor");
  };

  const fullSpec = useMemo(() => {
    return `# ${campaignName}
Tipo: Search · Idioma: Português · País: Brasil
Estratégia: Maximizar conversões (sem CPA inicial)
Orçamento: R$ ${budget.toFixed(2)}/dia (~R$ ${monthly.toFixed(0)}/mês)
URL final: ${finalUrl}
Conversão: registrar evento "test_completed" via GA4 (já implementado)

## Títulos (${headlineList.length}/15)
${headlineList.map((h, i) => `${i + 1}. ${h}  [${h.length}/30]`).join("\n")}

## Descrições (${descList.length}/4)
${descList.map((d, i) => `${i + 1}. ${d}  [${d.length}/90]`).join("\n")}

## Palavras-chave
${kwList.join("\n")}

## Palavras-chave negativas
${negList.map((n) => `-${n}`).join("\n")}

## Sitelinks
${SITELINKS.map((s) => `- ${s.title} → ${baseUrl}${s.path}\n  ${s.desc1} · ${s.desc2}`).join("\n")}

## Frases de destaque (callouts)
${CALLOUTS.join(" · ")}
`;
  }, [campaignName, budget, monthly, finalUrl, headlineList, descList, kwList, negList, baseUrl]);

  return (
    <div className="space-y-6">
      {/* Resumo + ações */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold">Campanha Google Ads</h3>
            <p className="text-sm text-muted-foreground">
              Search · Brasil · pt-BR · Maximizar conversões. Crie, revise o preview e exporte
              um CSV pronto para o <strong>Google Ads Editor</strong>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => copy(fullSpec, "Brief completo")}>
              <Copy className="h-4 w-4 mr-1" /> Copiar brief
            </Button>
            <Button size="sm" onClick={downloadCsv} disabled={issues.length > 0}>
              <Download className="h-4 w-4 mr-1" /> Exportar CSV
            </Button>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="campaign-name">Nome da campanha</Label>
            <Input id="campaign-name" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="budget">Orçamento diário (R$)</Label>
            <Input
              id="budget" type="number" min={5} max={20} step={1}
              value={budget}
              onChange={(e) => setBudget(Math.min(20, Math.max(5, Number(e.target.value) || 0)))}
            />
            <p className="text-xs text-muted-foreground">
              ≈ R$ {monthly.toFixed(0)}/mês · limite definido: R$ 20/dia
            </p>
          </div>
          <div className="space-y-1 sm:col-span-1">
            <Label htmlFor="final-url">URL final (com UTM)</Label>
            <Input id="final-url" value={finalUrl} onChange={(e) => setFinalUrl(e.target.value)} />
          </div>
        </div>

        {issues.length > 0 && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <p className="font-medium text-destructive mb-1">Ajustes antes de publicar:</p>
            <ul className="list-disc list-inside text-destructive/90 space-y-0.5">
              {issues.map((i) => <li key={i}>{i}</li>)}
            </ul>
          </div>
        )}
      </Card>

      {/* Preview do anúncio */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Preview do anúncio (Google Search)</h4>
          <Badge variant="secondary" className="text-xs">Patrocinado</Badge>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4 max-w-2xl">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="font-medium text-foreground">Patrocinado</span>
            <span>·</span>
            <span>{previewHost}</span>
          </div>
          <h3 className="text-[#1a0dab] dark:text-blue-400 text-xl font-medium mt-1 leading-snug">
            {previewHeadline}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            {previewDesc}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
            {SITELINKS.slice(0, 4).map((s) => (
              <a key={s.title} className="text-[#1a0dab] dark:text-blue-400 text-sm hover:underline">
                {s.title}
              </a>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {CALLOUTS.slice(0, 4).join(" · ")}
          </p>
        </div>
      </Card>

      {/* Editores */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4 space-y-2">
          <Label>Títulos (1 por linha · máx 30 chars · 3-15)</Label>
          <Textarea rows={10} value={headlines} onChange={(e) => setHeadlines(e.target.value)} className="font-mono text-xs" />
          <p className="text-xs text-muted-foreground">{headlineList.length} títulos</p>
        </Card>
        <Card className="p-4 space-y-2">
          <Label>Descrições (1 por linha · máx 90 chars · 2-4)</Label>
          <Textarea rows={10} value={descriptions} onChange={(e) => setDescriptions(e.target.value)} className="font-mono text-xs" />
          <p className="text-xs text-muted-foreground">{descList.length} descrições</p>
        </Card>
        <Card className="p-4 space-y-2">
          <Label>Palavras-chave ([exata], "frase", larga)</Label>
          <Textarea rows={10} value={keywords} onChange={(e) => setKeywords(e.target.value)} className="font-mono text-xs" />
          <p className="text-xs text-muted-foreground">{kwList.length} palavras-chave</p>
        </Card>
        <Card className="p-4 space-y-2">
          <Label>Palavras-chave negativas (uma por linha)</Label>
          <Textarea rows={10} value={negatives} onChange={(e) => setNegatives(e.target.value)} className="font-mono text-xs" />
          <p className="text-xs text-muted-foreground">{negList.length} negativas</p>
        </Card>
      </div>

      {/* Como publicar */}
      <Card className="p-5 space-y-3">
        <h4 className="font-semibold flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" /> Como publicar (3 passos · ~5 min)
        </h4>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Clique em <strong>Exportar CSV</strong> acima.</li>
          <li>
            Abra o{" "}
            <a className="text-primary hover:underline inline-flex items-center gap-1"
               href="https://ads.google.com/intl/pt-BR_br/home/tools/ads-editor/" target="_blank" rel="noreferrer">
              Google Ads Editor <ExternalLink className="h-3 w-3" />
            </a>{" "}
            (gratuito) e faça login com a conta que vai pagar.
          </li>
          <li>Conta &gt; Importar &gt; Do arquivo · selecione o CSV · revise · clique em <strong>Publicar</strong>.</li>
        </ol>
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Posso publicar 100% automático sem sair daqui?
          </summary>
          <div className="mt-2 space-y-2 text-muted-foreground">
            <p>
              Sim, mas exige liberação <strong>única</strong> sua na sua conta Google: token
              de desenvolvedor da API Google Ads (aprovação Google em até 48h) + Customer ID +
              autorização OAuth. Quando você quiser, peça aqui que eu adiciono o botão
              <em> "Publicar no Google Ads"</em> nesta tela.
            </p>
          </div>
        </details>
      </Card>
    </div>
  );
};
