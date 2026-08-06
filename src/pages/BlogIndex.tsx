import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const POSTS = [
  {
    to: "/blog/nr-1-riscos-psicossociais-passo-a-passo",
    title: "NR-1 e riscos psicossociais: como cumprir passo a passo",
    desc: "Roteiro em 7 etapas: critérios, medição, inventário, plano de ação e os documentos que a fiscalização pede.",
    tag: "Conformidade",
  },
  {
    to: "/blog/nr-1-saude-mental-fiscalizacao",
    title: "NR-1 e saúde mental: o que a fiscalização verifica",
    desc: "O que o Auditor Fiscal do Trabalho pede, os cinco apontamentos mais comuns e um plano de preparação em 90 dias.",
    tag: "Fiscalização",
  },
  {
    to: "/blog/copsoq-ii-o-que-e-como-aplicar",
    title: "COPSOQ II: o que é, quais dimensões mede e como aplicar",
    desc: "Versões curta, média e longa, faixas de corte, cuidados de anonimato e limites do instrumento.",
    tag: "Instrumento",
  },
  {
    to: "/blog/plano-de-acao-riscos-psicossociais",
    title: "Plano de ação para riscos psicossociais: estrutura e exemplo",
    desc: "Hierarquia de controle, campos obrigatórios por linha e como demonstrar eficácia entre ciclos.",
    tag: "Gestão",
  },
  {
    to: "/blog/pgr-nr-1-o-que-mudou",
    title: "PGR e NR-1: o que mudou com os fatores psicossociais",
    desc: "Inventário de riscos, relação com a AEP da NR-17, obrigações de ME e EPP e trabalho remoto.",
    tag: "PGR",
  },
  {
    to: "/blog/aep-nr-17-fatores-psicossociais",
    title: "AEP da NR-17 com fatores psicossociais: o que precisa constar",
    desc: "Seções obrigatórias, como sustentar a parte psicossocial e quando a AEP dispara uma AET.",
    tag: "AEP",
  },
  {
    to: "/blog/saude-mental-no-trabalho-guia-empresas",
    title: "Saúde mental no trabalho: guia prático para empresas",
    desc: "Fatores organizacionais que mais adoecem, o que funciona de fato e como medir sem invadir a privacidade.",
    tag: "Guia",
  },
  {
    to: "/blog/rh-saude-mental-trabalho",
    title: "O que o RH precisa medir em 2026",
    desc: "Panorama para RH: domínios psicossociais, escolha de instrumento e erros comuns.",
    tag: "Para RH",
  },
];

const TITLE = "Blog — NR-1, riscos psicossociais e saúde mental no trabalho";
const DESC =
  "Artigos práticos sobre NR-1, PGR, AEP da NR-17, COPSOQ II e gestão de riscos psicossociais para RH, SESMT e consultorias de SST.";

const BlogIndex = () => {
  useEffect(() => {
    document.title = `${TITLE} — Cuidar+ Brasil`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", DESC);
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="container py-4 flex items-center justify-between">
          <Link to="/" className="font-display font-semibold">Cuidar+ Brasil</Link>
          <Link to="/trabalho" className="text-sm text-muted-foreground hover:text-foreground">
            Cuidar+ Trabalho →
          </Link>
        </div>
      </header>

      <section className="container max-w-3xl py-10 space-y-8">
        <div className="space-y-3">
          <Badge variant="secondary">Conteúdo técnico</Badge>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            NR-1, riscos psicossociais e saúde mental no trabalho
          </h1>
          <p className="text-muted-foreground">
            Material de referência para RH, SESMT e consultorias de segurança do trabalho. Sem promessa
            fácil: o que a norma exige, como medir e como documentar.
          </p>
        </div>

        <div className="grid gap-4">
          {POSTS.map((p) => (
            <Card key={p.to} className="p-5 hover:border-primary/40 transition-colors">
              <Link to={p.to} className="block space-y-2">
                <Badge variant="outline" className="text-xs">{p.tag}</Badge>
                <h2 className="font-display text-lg font-semibold leading-snug">{p.title}</h2>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </Link>
            </Card>
          ))}
        </div>

        <Card className="p-5 bg-muted/40">
          <p className="text-sm">
            É consultoria de SST ou medicina ocupacional?{" "}
            <Link to="/trabalho/parceiros" className="underline text-primary">
              Conheça o programa de parceiros
            </Link>{" "}
            para oferecer a medição psicossocial aos seus clientes.
          </p>
        </Card>
      </section>
    </main>
  );
};

export default BlogIndex;
