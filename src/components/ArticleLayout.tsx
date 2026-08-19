import { ReactNode, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/SiteHeader";

export type ArticleMeta = {
  slug: string;
  title: string;
  description: string;
  published: string;
  updated?: string;
  readingMinutes: number;
  badge: string;
};

const SITE = "https://cuidarmaisbrasil.life";

export const ArticleLayout = ({
  meta,
  children,
  related = [],
}: {
  meta: ArticleMeta;
  children: ReactNode;
  related?: { to: string; label: string }[];
}) => {
  useEffect(() => {
    document.title = `${meta.title} — Cuidar+ Brasil`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", meta.description);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${SITE}${meta.slug}`;

    const old = document.querySelector('script[data-page="article-ld"]');
    if (old) old.remove();
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.page = "article-ld";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: meta.title,
      description: meta.description,
      datePublished: meta.published,
      dateModified: meta.updated ?? meta.published,
      inLanguage: "pt-BR",
      author: { "@type": "Organization", name: "Cuidar+ Brasil" },
      publisher: { "@type": "Organization", name: "Cuidar+ Brasil", url: SITE },
      mainEntityOfPage: `${SITE}${meta.slug}`,
    });
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [meta]);

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader variant="brasil" />

      <article className="container max-w-3xl py-10 space-y-6">
        <header className="space-y-3">
          <Badge variant="secondary">{meta.badge}</Badge>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">{meta.title}</h1>
          <p className="text-sm text-muted-foreground">
            Publicado em {new Date(meta.published).toLocaleDateString("pt-BR")}
            {meta.updated ? ` · atualizado em ${new Date(meta.updated).toLocaleDateString("pt-BR")}` : ""}
            {" · "}{meta.readingMinutes} min de leitura
          </p>
        </header>

        <div
          className="prose prose-sm max-w-none text-foreground space-y-5
                     [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8
                     [&_h3]:font-semibold [&_h3]:mt-6
                     [&_p]:leading-relaxed [&_p]:text-foreground
                     [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
                     [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2
                     [&_table]:w-full [&_table]:text-sm [&_th]:text-left [&_th]:py-2 [&_td]:py-2
                     [&_td]:border-t [&_td]:border-border/60
                     [&_strong]:text-foreground"
        >
          {children}

          <Card className="p-5 my-8 bg-muted/40 not-prose">
            <p className="text-sm mb-1 font-medium">Cuidar+ Trabalho</p>
            <p className="text-sm text-muted-foreground mb-3">
              Medição periódica de riscos psicossociais com relatório pronto para anexar à AEP e ao
              inventário de riscos. Gratuito até 100 colaboradores.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button asChild size="sm"><Link to="/trabalho">Conhecer o programa</Link></Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/trabalho/amostra-relatorio">Ver amostra do relatório</Link>
              </Button>
            </div>
          </Card>

          {related.length > 0 && (
            <div className="not-prose">
              <h2 className="font-display text-lg font-semibold mb-2">Leia também</h2>
              <ul className="space-y-1 text-sm">
                {related.map((r) => (
                  <li key={r.to}>
                    <Link to={r.to} className="underline text-muted-foreground hover:text-foreground">
                      {r.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </article>
    </main>
  );
};

export default ArticleLayout;
