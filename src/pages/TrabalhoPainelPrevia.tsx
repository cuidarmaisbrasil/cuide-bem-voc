import { Link } from "react-router-dom";
import { Building2, ClipboardList, FileText, Receipt, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const areas = [
  { icon: Building2, title: "Empresa", text: "Dados cadastrais, responsável e gestor de ciclos." },
  { icon: Users, title: "Equipe e ciclos", text: "Cadastro de colaboradores, disparos e acompanhamento de adesão." },
  { icon: Receipt, title: "Documentos", text: "Contrato e notas fiscais disponíveis para consulta e download." },
  { icon: FileText, title: "Relatórios", text: "Relatório geral, módulo psicossocial NR-1/PGR e comparação entre ciclos." },
];

export default function TrabalhoPainelPrevia() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader variant="trabalho" />
      <div className="container max-w-6xl py-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><Badge variant="secondary" className="mb-3">Prévia ilustrativa</Badge><h1 className="font-display text-3xl font-semibold">Painel da empresa</h1><p className="mt-1 text-muted-foreground">Uma visão organizada do acompanhamento, sem expor respostas individuais.</p></div>
          <Button asChild><Link to="/trabalho/login">Entrar no painel</Link></Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {["Colaboradores", "Ciclos", "Adesão", "Documentos pendentes"].map((label) => <Card key={label} className="p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">—</p><p className="text-xs text-muted-foreground">Sem dados nesta prévia</p></Card>)}
        </div>
        <section className="space-y-3"><h2 className="font-display text-xl font-semibold flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Áreas do painel</h2><div className="grid gap-3 sm:grid-cols-2">{areas.map((area) => <Card key={area.title} className="p-5"><area.icon className="h-5 w-5 text-primary" /><h3 className="mt-3 font-semibold">{area.title}</h3><p className="mt-1 text-sm text-muted-foreground">{area.text}</p></Card>)}</div></section>
        <Card className="p-5 border-dashed"><h2 className="font-display text-lg font-semibold">Como aparecem os dados reais</h2><p className="mt-1 text-sm text-muted-foreground">Após o acesso, os cartões são preenchidos somente com informações da empresa e resultados agregados. Quando não houver dados, o painel informa claramente o que ainda está pendente.</p></Card>
      </div>
      <SiteFooter variant="trabalho" />
    </main>
  );
}