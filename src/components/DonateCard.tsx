import { Heart, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { track } from "@/lib/tracking";

// 🔧 Substitua pelo seu link real do Mercado Pago
// (ex: https://mpago.la/abc123  ou  https://link.mercadopago.com.br/seuusuario)
const MERCADO_PAGO_URL = "https://link.mercadopago.com.br/cuidarmais";

const PRESETS = [2, 5, 10];

export const DonateCard = ({ compact = false }: { compact?: boolean }) => {
  const [custom, setCustom] = useState("");

  const customAmount = (() => {
    const n = parseFloat(custom.replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : 0;
  })();

  const openDonation = (amount: number) => {
    track({ type: "click", payload: { link_type: "donation", target_id: String(amount), target_label: `Doação R$ ${amount}` } });
    toast.success(`Sugestão: R$ ${amount.toFixed(2).replace(".", ",")}`, {
      description: "Confirme o valor na página do Mercado Pago.",
    });
    window.open(MERCADO_PAGO_URL, "_blank", "noopener,noreferrer");
  };

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
            Esta plataforma é gratuita. Sua doação via Mercado Pago ajuda a
            manter a ferramenta no ar e acessível para mais pessoas.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {PRESETS.map((value) => (
          <Button
            key={value}
            variant="outline"
            className="border-primary/30 hover:bg-primary/10"
            onClick={() => openDonation(value)}
          >
            Doar R$ {value}
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
          disabled={customAmount <= 0}
          className="bg-gradient-hero text-primary-foreground hover:opacity-90 transition-smooth"
          onClick={() => openDonation(customAmount)}
        >
          <Heart className="h-4 w-4 mr-2" />
          {customAmount > 0
            ? `Doar R$ ${customAmount.toFixed(2).replace(".", ",")}`
            : "Doar"}
          <ExternalLink className="h-3 w-3 ml-1.5" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Você será redirecionado para o Mercado Pago, onde poderá pagar via PIX,
        cartão ou saldo.
      </p>
    </Card>
  );
};
