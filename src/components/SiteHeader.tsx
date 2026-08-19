import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Menu,
  Heart,
  Briefcase,
  BookOpen,
  HelpCircle,
  Mail,
  LayoutDashboard,
  PhoneCall,
  Handshake,
  FileText,
  Newspaper,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type SiteHeaderVariant = "brasil" | "trabalho";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  external?: boolean;
};

const BRASIL_NAV: NavItem[] = [
  { to: "/", label: "Início", icon: Heart },
  { to: "/blog", label: "Blog", icon: BookOpen },
  { to: "/imprensa", label: "Imprensa", icon: Newspaper },
  { to: "/trabalho", label: "Para empresas", icon: Briefcase },
];

const TRABALHO_NAV: NavItem[] = [
  { to: "/trabalho", label: "Início", icon: Briefcase },
  { to: "/trabalho/painel", label: "Painel", icon: LayoutDashboard },
  { to: "/trabalho/faq", label: "Dúvidas", icon: HelpCircle },
  { to: "/trabalho/parceiros", label: "Parceiros", icon: Handshake },
  { to: "/trabalho/termos", label: "Termos", icon: FileText },
  { to: "/trabalho/contato", label: "Contato", icon: Mail },
];

interface SiteHeaderProps {
  variant?: SiteHeaderVariant;
  /** Optional action rendered at the right of the desktop bar (e.g. "Sair"). */
  onSignOut?: () => void;
  /** Optional handler when the brand is clicked (overrides link navigation). */
  onBrandClick?: () => void;
}

export const SiteHeader = ({ variant = "brasil", onSignOut, onBrandClick }: SiteHeaderProps) => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const isTrabalho = variant === "trabalho";
  const items = isTrabalho ? TRABALHO_NAV : BRASIL_NAV;
  const home = isTrabalho ? "/trabalho" : "/";

  const isActive = (to: string) => (to === home ? pathname === to : pathname.startsWith(to));

  const Brand = (
    <span className="flex items-center gap-2 font-display font-semibold text-base sm:text-lg">
      <span
        className={cn(
          "h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
          isTrabalho ? "bg-secondary text-secondary-foreground" : "bg-gradient-hero text-primary-foreground",
        )}
      >
        {isTrabalho ? <Briefcase className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
      </span>
      <span className="truncate">{isTrabalho ? "Cuidar+ Trabalho" : "Cuidar+"}</span>
    </span>
  );

  return (
    <header className="border-b border-border/60 bg-background/85 backdrop-blur-md sticky top-0 z-40">
      <div className="container flex items-center justify-between gap-3 h-14">
        {onBrandClick ? (
          <button onClick={onBrandClick} aria-label="Ir para o início">
            {Brand}
          </button>
        ) : (
          <Link to={home} aria-label="Ir para o início">
            {Brand}
          </Link>
        )}

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Navegação principal">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-smooth",
                isActive(item.to)
                  ? "bg-secondary text-secondary-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          {!isTrabalho && (
            <a
              href="tel:188"
              className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-smooth"
            >
              <PhoneCall className="h-4 w-4" />
              CVV 188
            </a>
          )}
          {onSignOut && (
            <Button variant="ghost" size="sm" className="hidden md:inline-flex" onClick={onSignOut}>
              <LogOut className="h-4 w-4 mr-1.5" /> Sair
            </Button>
          )}

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-xs p-0">
              <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
              <div className="p-4 border-b border-border/60">{Brand}</div>
              <nav className="p-2 flex flex-col" aria-label="Navegação principal">
                {items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-smooth",
                      isActive(item.to)
                        ? "bg-secondary text-secondary-foreground font-medium"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    <item.icon className="h-4 w-4 text-primary" />
                    {item.label}
                  </Link>
                ))}
                <Link
                  to={isTrabalho ? "/" : "/trabalho"}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-muted transition-smooth"
                >
                  {isTrabalho ? <Heart className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
                  {isTrabalho ? "Cuidar+ Brasil" : "Cuidar+ Trabalho"}
                </Link>
                <a
                  href="tel:188"
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-smooth"
                >
                  <PhoneCall className="h-4 w-4" /> Emergência · CVV 188
                </a>
                {onSignOut && (
                  <button
                    onClick={() => {
                      setOpen(false);
                      onSignOut();
                    }}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-foreground hover:bg-muted transition-smooth text-left"
                  >
                    <LogOut className="h-4 w-4" /> Sair
                  </button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
