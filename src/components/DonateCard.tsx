import { Heart, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// 🔧 Substitua pela URL real da sua página de doação
// (ex: https://apoia.se/cuidarmais  ou  https://buymeacoffee.com/seuusuario)
const DONATION_BASE_URL = "https://apoia.se/cuidarmais";

// Alguns serviços aceitam ?valor= ou /valor na URL — ajuste se necessário.
function buildDonationUrl(amount?: number) {
  if (!amount || amount <= 0) return DONATION_BASE_URL;
  const sep = DONATION_BASE_URL.includes("?") ? "&" : "?";
  return `${DONATION_BASE_URL}${sep}valor=${amount.toFixed(2)}`;
}

const PRESETS = [2, 5, 10];

export const DonateCard = ({ compact = false }: { compact?: boolean }) => {
  const [custom, setCustom] = useState("");

  const customAmount = (() => {
    const n = parseFloat(custom.replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : 0;
  })();

  const customUrl = customAmount > 0 ? buildDonationUrl(customAmount) : null;

  return (
    <Card className={`${compact ? "p-5" : "p-6 md:p-8"} shadow-card border-border/60 bg-gradient-soft`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-gradient-hero flex items-center justify-center shrink-0">
          <Heart className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-display text-lg md:text-xl font-semibold leading-tight">
            Apoie o Cuidar+
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Esta plataforma é gratuita. Sua doação ajuda a manter a ferramenta
            no ar e acessível para mais pessoas.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {PRESETS.map((value) => (
          <Button
            key={value}
            asChild
            variant="outline"
            className="border-primary/30 hover:bg-primary/10"
          >
            <a
              href={buildDonationUrl(value)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Doar R$ {value}
            </a>
          </Button>
        ))}
      </div>

      <div className="grid sm:grid-cols-[1fr_auto] gap-2 items-end">
        <div>
          <Label htmlFor="custom-amount" className="text-xs">
            Outro valor (R$)
          </Label>
          <Input
            id="custom-amount"
            inputMode="decimal"
            placeholder="Ex: 25"
            value={custom}
            onChange={(e) => setCustom(e.target.value.slice(0, 10))}
            maxLength={10}
          />
        </div>
        <Button
          asChild={!!customUrl}
          disabled={!customUrl}
          className="bg-gradient-hero text-primary-foreground hover:opacity-90 transition-smooth"
        >
          {customUrl ? (
            <a href={customUrl} target="_blank" rel="noopener noreferrer">
              <Heart className="h-4 w-4 mr-2" />
              Doar R$ {customAmount.toFixed(2).replace(".", ",")}
              <ExternalLink className="h-3 w-3 ml-1.5" />
            </a>
          ) : (
            <span>
              <Heart className="h-4 w-4 mr-2 inline" />
              Doar
            </span>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Você será redirecionado para um site externo seguro de pagamento.
      </p>
    </Card>
  );
};
