import { Link } from "react-router-dom";
import {
  Heart,
  Briefcase,
  BookOpen,
  HelpCircle,
  Mail,
  LayoutDashboard,
  Handshake,
  FileText,
  Newspaper,
  PhoneCall,
  CalendarDays,
} from "lucide-react";

export type SiteFooterVariant = "brasil" | "trabalho";

type FooterLink = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

const BRASIL_LINKS: FooterLink[] = [
  { to: "/", label: "Início", icon: Heart },
  { to: "/blog", label: "Blog", icon: BookOpen },
  { to: "/imprensa", label: "Imprensa", icon: Newspaper },
  { to: "/trabalho", label: "Para empresas", icon: Briefcase },
];

const BRASIL_LEGAL: FooterLink[] = [
  { to: "/privacidade", label: "Privacidade", icon: FileText },
  { to: "/termos", label: "Termos de uso", icon: FileText },
];

const TRABALHO_LINKS: FooterLink[] = [
  { to: "/trabalho", label: "Início", icon: Briefcase },
  { to: "/trabalho/painel", label: "Painel da empresa", icon: LayoutDashboard },
  { to: "/trabalho/faq", label: "Dúvidas frequentes", icon: HelpCircle },
  { to: "/trabalho/parceiros", label: "Parceiros SST", icon: Handshake },
];

const TRABALHO_LEGAL: FooterLink[] = [
  { to: "/trabalho/termos", label: "Termos e condições", icon: FileText },
  { to: "/trabalho/contato", label: "Contato", icon: Mail },
];

export const SiteFooter = ({ variant = "brasil" }: { variant?: SiteFooterVariant }) => {
  const isTrabalho = variant === "trabalho";
  const nav = isTrabalho ? TRABALHO_LINKS : BRASIL_LINKS;
  const legal = isTrabalho ? TRABALHO_LEGAL : BRASIL_LEGAL;

  return (
    <footer className="border-t border-border/60 bg-muted/30 mt-12">
      <div className="container max-w-6xl py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <span className="flex items-center gap-2 font-display font-semibold">
            <span
              className={
                "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 " +
                (isTrabalho
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-gradient-hero text-primary-foreground")
              }
            >
              {isTrabalho ? <Briefcase className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
            </span>
            {isTrabalho ? "Cuidar+ Trabalho" : "Cuidar+ Brasil"}
          </span>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isTrabalho
              ? "Presença com cuidado, ação com resultado. Medição periódica de riscos psicossociais para a NR-1."
              : "Rastreio gratuito e anônimo de saúde mental, com base científica e caminhos de ajuda pelo SUS."}
          </p>
        </div>

        <nav aria-label="Navegação do rodapé" className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Navegar</p>
          <ul className="space-y-1.5">
            {nav.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth"
                >
                  <l.icon className="h-3.5 w-3.5 text-primary" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Links institucionais" className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Institucional</p>
          <ul className="space-y-1.5">
            {legal.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth"
                >
                  <l.icon className="h-3.5 w-3.5 text-primary" />
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to={isTrabalho ? "/" : "/trabalho"}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth"
              >
                {isTrabalho ? <Heart className="h-3.5 w-3.5 text-primary" /> : <Briefcase className="h-3.5 w-3.5 text-primary" />}
                {isTrabalho ? "Cuidar+ Brasil" : "Cuidar+ Trabalho"}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {isTrabalho ? "Fale com a gente" : "Precisa de ajuda agora?"}
          </p>
          {isTrabalho ? (
            <a
              href="https://calendly.com/comercial-cuidarmaisbrasil"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth"
            >
              <CalendarDays className="h-3.5 w-3.5 text-primary" /> Agendar reunião
            </a>
          ) : (
            <a
              href="tel:188"
              className="flex items-center gap-2 text-sm font-medium text-destructive hover:opacity-80 transition-smooth"
            >
              <PhoneCall className="h-3.5 w-3.5" /> CVV 188 — 24h, gratuito
            </a>
          )}
        </div>
      </div>

      <div className="border-t border-border/60">
        <p className="container max-w-6xl py-4 text-xs text-muted-foreground text-center sm:text-left">
          © {new Date().getFullYear()} Cuidar+ · Gama Solutions (CNPJ 52.115.028/0001-78)
        </p>
      </div>
    </footer>
  );
};

export default SiteFooter;
