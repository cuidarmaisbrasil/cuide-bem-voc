import { AlertTriangle, Phone } from "lucide-react";
import { track } from "@/lib/tracking";

export const EmergencyBanner = () => (
  <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-4 sm:p-5">
    <div className="flex gap-3">
      <AlertTriangle className="h-5 w-5 flex-shrink-0 text-destructive mt-0.5" />
      <div className="space-y-2">
        <p className="text-sm font-semibold text-destructive">
          Em risco imediato? Você não está sozinho(a).
        </p>
        <p className="text-sm text-foreground/80">
          Se está com pensamentos de se ferir ou de morte, ligue agora para o{" "}
          <a href="tel:188" onClick={() => track({ type: "click", payload: { link_type: "cvv", target_id: "188", target_label: "CVV 188 (banner)" } })} className="font-semibold underline underline-offset-2">
            CVV — 188
          </a>{" "}
          (24h, gratuito) ou para o{" "}
          <a href="tel:192" onClick={() => track({ type: "click", payload: { link_type: "samu", target_id: "192", target_label: "SAMU 192 (banner)" } })} className="font-semibold underline underline-offset-2">
            SAMU — 192
          </a>
          . O atendimento é sigiloso e gratuito.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <a
            href="tel:188"
            onClick={() => track({ type: "click", payload: { link_type: "cvv", target_id: "188", target_label: "CVV 188" } })}
            className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground"
          >
            <Phone className="h-3 w-3" /> CVV 188
          </a>
          <a
            href="tel:192"
            onClick={() => track({ type: "click", payload: { link_type: "samu", target_id: "192", target_label: "SAMU 192" } })}
            className="inline-flex items-center gap-1.5 rounded-full bg-destructive/90 px-3 py-1.5 text-xs font-semibold text-destructive-foreground"
          >
            <Phone className="h-3 w-3" /> SAMU 192
          </a>
        </div>
      </div>
    </div>
  </div>
);
