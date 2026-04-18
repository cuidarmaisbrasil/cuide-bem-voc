import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ExternalLink, MapPin, Phone, RefreshCw, Search, Stethoscope } from "lucide-react";
import { TestAnswers } from "./DepressionTest";
import { interpretPhq9, interpretSymptoms, tenSymptoms, functionalImpactOptions } from "@/data/symptoms";
import { nationalChannels, susUnits, buildPhoneSearchUrl, buildSecretariaSearchUrl, buildGoogleMapsUrl } from "@/data/sus";
import { professionals } from "@/data/professionals";
import { EmergencyBanner } from "./EmergencyBanner";
import { DonateCard } from "./DonateCard";
import { ReliabilityBadge } from "./ReliabilityBadge";

interface ResultsProps {
  answers: TestAnswers;
  onRestart: () => void;
}

const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export const Results = ({ answers, onRestart }: ResultsProps) => {
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const score = useMemo(() => answers.phq9.reduce((a, b) => a + b, 0), [answers.phq9]);
  const interpretation = interpretPhq9(score);
  const symptomEval = interpretSymptoms(answers.symptoms);
  const symptomCount = answers.symptoms.length;
  const hasSuicidalThoughts = answers.symptoms.includes("morte") || answers.phq9[8] >= 1;
  const functionalLabel = functionalImpactOptions[answers.functionalImpact]?.label ?? "—";

  const matchedSymptoms = tenSymptoms.filter((s) => answers.symptoms.includes(s.id));
  const phoneUrl = city && state ? buildPhoneSearchUrl(city, state) : null;
  const secretariaUrl = city && state ? buildSecretariaSearchUrl(city, state) : null;
  const mapsUrl = city && state ? buildGoogleMapsUrl(city, state) : null;

  const levelColorClass = {
    success: "bg-success/10 text-success border-success/30",
    primary: "bg-primary/10 text-primary border-primary/30",
    warning: "bg-warning/10 text-warning-foreground border-warning/40",
    destructive: "bg-destructive/10 text-destructive border-destructive/30",
  }[interpretation.color] ?? "bg-muted text-foreground border-border";

  return (
    <section className="container py-12 md:py-16">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">Seu resultado</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold">
            Obrigado por cuidar de você
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Esta avaliação não substitui um diagnóstico médico, mas pode ser um ponto de partida importante.
          </p>
        </div>

        {hasSuicidalThoughts && <EmergencyBanner />}

        {/* Score card */}
        <Card className="p-6 md:p-8 shadow-soft border-border/60">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">PHQ-9 (escala da OMS)</p>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-display text-5xl font-semibold">{score}</span>
                <span className="text-muted-foreground">/27</span>
              </div>
              <Badge variant="outline" className={`${levelColorClass} font-medium`}>
                {interpretation.level}
              </Badge>
              <p className="text-sm text-foreground/80 mt-3">{interpretation.description}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Sintomas marcados (DSM-5)</p>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-display text-5xl font-semibold">{symptomCount}</span>
                <span className="text-muted-foreground">/10</span>
              </div>
              <Badge
                variant="outline"
                className={
                  symptomEval.severity === "high"
                    ? "bg-destructive/10 text-destructive border-destructive/30 font-medium"
                    : symptomEval.severity === "medium"
                      ? "bg-warning/10 text-warning-foreground border-warning/40 font-medium"
                      : "bg-success/10 text-success border-success/30 font-medium"
                }
              >
                {symptomEval.level}
              </Badge>
              <p className="text-sm text-foreground/80 mt-3">{symptomEval.description}</p>
            </div>
          </div>

          {/* Impacto funcional */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm font-medium mb-1">
              Impacto funcional (critério B do DSM-5)
            </p>
            <p className="text-sm text-muted-foreground">
              Você relatou que os sintomas dificultam seu dia a dia:{" "}
              <strong className="text-foreground">{functionalLabel}</strong>.
              {answers.functionalImpact >= 2 &&
                " Esse nível de prejuízo reforça a indicação de avaliação profissional."}
            </p>
          </div>

          {matchedSymptoms.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm font-medium mb-3">Sintomas que você relatou:</p>
              <div className="flex flex-wrap gap-2">
                {matchedSymptoms.map((s) => (
                  <Badge key={s.id} variant="secondary" className="bg-secondary/70">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {s.title}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Disclaimer */}
        <Card className="p-5 bg-muted/40 border-border/60">
          <p className="text-sm text-foreground/80 leading-relaxed">
            <strong>Importante:</strong> Este resultado é uma <em>autoavaliação orientativa</em> baseada
            no PHQ-9 e nos critérios diagnósticos do DSM-5/CID-11. Apenas um profissional de saúde
            (psiquiatra ou psicólogo) pode fazer um diagnóstico. Se você se identifica com vários
            sintomas, busque ajuda — o tratamento existe e funciona.
          </p>
        </Card>

        {/* SUS Section */}
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold">
              Como buscar ajuda gratuita pelo SUS
            </h2>
            <p className="text-muted-foreground mt-1">
              O Sistema Único de Saúde oferece atendimento em saúde mental em todo o Brasil.
            </p>
          </div>

          <Card className="p-6 shadow-card border-border/60">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="h-5 w-5 text-primary" />
              <h3 className="font-display text-lg font-semibold">Telefones para agendar consulta na sua cidade</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Informe sua cidade para encontrarmos os telefones de CAPS, UBS e da Secretaria Municipal de Saúde,
              onde você pode agendar atendimento psicológico ou psiquiátrico gratuito pelo SUS.
            </p>
            <div className="grid sm:grid-cols-[1fr_120px] gap-3">
              <div>
                <Label htmlFor="city" className="text-xs">Cidade</Label>
                <Input
                  id="city"
                  placeholder="Ex: Salvador"
                  value={city}
                  onChange={(e) => setCity(e.target.value.slice(0, 80))}
                  maxLength={80}
                />
              </div>
              <div>
                <Label htmlFor="state" className="text-xs">UF</Label>
                <select
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">UF</option>
                  {STATES.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>

            {phoneUrl && secretariaUrl && mapsUrl && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="default">
                  <a href={phoneUrl} target="_blank" rel="noopener noreferrer">
                    <Phone className="h-4 w-4 mr-2" />
                    Telefones do CAPS / UBS
                    <ExternalLink className="h-3 w-3 ml-1.5" />
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href={secretariaUrl} target="_blank" rel="noopener noreferrer">
                    <Search className="h-4 w-4 mr-2" />
                    Secretaria de Saúde
                    <ExternalLink className="h-3 w-3 ml-1.5" />
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                    <MapPin className="h-4 w-4 mr-2" />
                    Ver no Google Maps
                    <ExternalLink className="h-3 w-3 ml-1.5" />
                  </a>
                </Button>
                <a
                  href="tel:136"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-smooth"
                >
                  <Phone className="h-4 w-4" /> Disque Saúde 136
                </a>
              </div>
            )}
            {!phoneUrl && (
              <p className="text-xs text-muted-foreground mt-3">
                Preencha cidade e UF para encontrar os telefones de agendamento.
              </p>
            )}
          </Card>

          <div className="grid md:grid-cols-3 gap-3">
            {susUnits.map((u) => (
              <Card key={u.name} className="p-5 shadow-card border-border/60">
                <h4 className="font-semibold mb-2 leading-snug">{u.name}</h4>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{u.description}</p>
                <p className="text-xs text-foreground/80"><strong>Como acessar:</strong> {u.howTo}</p>
              </Card>
            ))}
          </div>

          <div>
            <h3 className="font-display text-lg font-semibold mb-3">Canais nacionais de apoio</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {nationalChannels.map((c) => (
                <Card
                  key={c.phone}
                  className={`p-5 shadow-card border-border/60 ${c.emergency ? "border-l-4 border-l-destructive" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="font-semibold leading-snug">{c.name}</h4>
                    {c.emergency && (
                      <Badge className="bg-destructive/10 text-destructive border-destructive/30" variant="outline">
                        24h
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{c.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`tel:${c.phone}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-smooth"
                    >
                      <Phone className="h-3.5 w-3.5" /> {c.phone}
                    </a>
                    {c.site && (
                      <a
                        href={c.site}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-smooth"
                      >
                        Site <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Private practitioners */}
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold">
              Atendimento particular acessível
            </h2>
            <p className="text-muted-foreground mt-1">
              Profissionais e clínicas parceiras especializadas em depressão, com valores sociais.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {professionals.map((p) => (
              <Card key={p.name} className="p-5 shadow-card border-border/60 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-hero flex items-center justify-center">
                    <Stethoscope className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold leading-tight">{p.name}</h4>
                    <p className="text-xs text-muted-foreground">{p.title}</p>
                  </div>
                </div>
                <p className="text-sm text-foreground/80 mb-3 flex-1">{p.bio}</p>
                <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                  <p><strong className="text-foreground">Especialidade:</strong> {p.specialty}</p>
                  <p><strong className="text-foreground">Modalidade:</strong> {p.modality}</p>
                  <p><strong className="text-foreground">Local:</strong> {p.city}</p>
                  <p><strong className="text-foreground">A partir de:</strong> {p.priceFrom} / sessão</p>
                </div>
                {p.whatsapp ? (
                  <Button asChild className="bg-gradient-hero text-primary-foreground hover:opacity-90 transition-smooth w-full">
                    <a
                      href={`https://wa.me/${encodeURIComponent(p.whatsapp)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Entrar em contato
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full">{p.contact}</Button>
                )}
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            * Profissionais listados a título informativo. Verifique sempre o registro no CRP/CRM.
          </p>
        </div>

        <DonateCard />

        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={onRestart} size="lg">
            <RefreshCw className="h-4 w-4 mr-2" /> Refazer avaliação
          </Button>
        </div>
      </div>
    </section>
  );
};
