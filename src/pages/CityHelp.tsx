import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, MapPin, Phone, Search } from "lucide-react";
import {
  buildGoogleMapsUrl,
  buildPhoneSearchUrl,
  buildSecretariaSearchUrl,
  findMunicipalPlatform,
  meuSusDigital,
  nationalChannels,
  susUnits,
} from "@/data/sus";
import { cityPages, findCityBySlug } from "@/lib/cities";
import { track } from "@/lib/tracking";
import NotFound from "./NotFound";

const CityHelp = () => {
  const { slug } = useParams<{ slug: string }>();
  const info = slug ? findCityBySlug(slug) : null;

  useEffect(() => {
    if (!info) return;
    const { city, state } = info;
    const title = `Ajuda gratuita para depressão em ${city} (${state}) — CAPS, UBS e SUS | Cuidar+`;
    const description = `Como agendar atendimento psicológico ou psiquiátrico gratuito pelo SUS em ${city}/${state}: plataforma da prefeitura, telefones do CAPS, UBS e canais nacionais como CVV 188.`;
    document.title = title;

    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        const [k, v] = selector.replace(/[[\]"]/g, "").split("=");
        el.setAttribute(k, v);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", description);

    const url = `https://cuidarmaisbrasil.life/ajuda/${slug}`;
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;
    setMeta('meta[property="og:url"]', "content", url);

    return () => {
      document.title = "Cuidar+ · Teste de depressão online e onde encontrar ajuda";
      if (canonical) canonical.href = "https://cuidarmaisbrasil.life/";
    };
  }, [info, slug]);

  if (!info) return <NotFound />;

  const { city, state } = info;
  const platform = findMunicipalPlatform(city, state);
  const phoneUrl = buildPhoneSearchUrl(city, state);
  const secretariaUrl = buildSecretariaSearchUrl(city, state);
  const mapsUrl = buildGoogleMapsUrl(city, state);

  return (
    <main className="container py-10 md:py-14">
      <div className="mx-auto max-w-3xl space-y-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-smooth"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao teste
        </Link>

        <header className="space-y-3">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            <MapPin className="h-3 w-3 mr-1" /> {city} / {state}
          </Badge>
          <h1 className="font-display text-3xl md:text-4xl font-semibold leading-tight">
            Ajuda gratuita para depressão em {city}
          </h1>
          <p className="text-muted-foreground">
            Como agendar atendimento psicológico ou psiquiátrico pelo SUS em {city} ({state}),
            telefones úteis e canais de emergência 24h.
          </p>
        </header>

        {platform && (
          <Card className="p-6 shadow-card border-border/60">
            <h2 className="font-display text-xl font-semibold mb-2">
              Plataforma oficial da prefeitura
            </h2>
            <p className="text-sm font-semibold mb-1">{platform.name}</p>
            <p className="text-sm text-muted-foreground mb-4">{platform.description}</p>
            <Button asChild>
              <a
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  track({ type: "click", payload: { link_type: "platform", target_id: `city-${slug}-platform`, target_label: platform.name } })
                }
              >
                Acessar plataforma <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </a>
            </Button>
          </Card>
        )}

        <Card className="p-6 shadow-card border-border/60">
          <h2 className="font-display text-xl font-semibold mb-3">
            Telefones e mapa do SUS em {city}
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <a
                href={phoneUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  track({ type: "click", payload: { link_type: "sus", target_id: `city-${slug}-caps`, target_label: `CAPS ${city}/${state}` } })
                }
              >
                <Phone className="h-4 w-4 mr-2" /> CAPS / UBS
              </a>
            </Button>
            <Button asChild variant="outline">
              <a
                href={secretariaUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  track({ type: "click", payload: { link_type: "sus", target_id: `city-${slug}-secretaria`, target_label: `Secretaria ${city}/${state}` } })
                }
              >
                <Search className="h-4 w-4 mr-2" /> Secretaria de Saúde
              </a>
            </Button>
            <Button asChild variant="outline">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  track({ type: "click", payload: { link_type: "sus", target_id: `city-${slug}-maps`, target_label: `Maps ${city}/${state}` } })
                }
              >
                <MapPin className="h-4 w-4 mr-2" /> Google Maps
              </a>
            </Button>
          </div>
        </Card>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold">
            Onde a saúde mental do SUS é oferecida
          </h2>
          <div className="grid gap-3">
            {susUnits.map((u) => (
              <Card key={u.name} className="p-5 border-border/60">
                <h3 className="font-semibold mb-1">{u.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{u.description}</p>
                <p className="text-xs text-foreground/80"><strong>Como acessar:</strong> {u.howTo}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold">Canais nacionais 24h</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {nationalChannels.map((c) => (
              <Card key={c.phone} className={`p-5 border-border/60 ${c.emergency ? "border-l-4 border-l-destructive" : ""}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold">{c.name}</h3>
                  {c.emergency && (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">24h</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{c.description}</p>
                <a
                  href={`tel:${c.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                  onClick={() =>
                    track({ type: "click", payload: { link_type: c.phone === "188" ? "cvv" : c.phone === "192" ? "samu" : "platform", target_id: c.phone, target_label: c.name } })
                  }
                >
                  <Phone className="h-3.5 w-3.5" /> {c.phone}
                </a>
              </Card>
            ))}
          </div>
        </section>

        <Card className="p-5 bg-muted/40 border-border/60">
          <p className="text-sm text-foreground/80">
            Se você ainda não fez o rastreio, comece pelo nosso{" "}
            <Link to="/" className="text-primary font-medium hover:underline">teste de depressão gratuito (PHQ-9)</Link>{" "}
            — leva cerca de 5 minutos e é anônimo.
          </p>
        </Card>

        <section>
          <h2 className="font-display text-lg font-semibold mb-3">Outras cidades atendidas</h2>
          <div className="flex flex-wrap gap-2">
            {cityPages
              .filter((c) => c.slug !== slug)
              .map((c) => (
                <Link
                  key={c.slug}
                  to={`/ajuda/${c.slug}`}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted transition-smooth"
                >
                  <MapPin className="h-3 w-3" /> {c.city} ({c.state})
                </Link>
              ))}
            <a
              href={meuSusDigital.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted transition-smooth"
            >
              Outras cidades: Meu SUS Digital <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </section>
      </div>
    </main>
  );
};

export default CityHelp;
