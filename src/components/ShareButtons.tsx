import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Copy, Facebook, Share2 } from "lucide-react";
import { track } from "@/lib/tracking";
import { toast } from "@/hooks/use-toast";

interface ShareButtonsProps {
  /** Texto curto e neutro — NUNCA expõe resultado pessoal do usuário. */
  title?: string;
  url?: string;
}

const DEFAULT_TITLE =
  "Fiz um teste gratuito e anônimo de saúde mental no Cuidar+. Pode ajudar você ou alguém próximo:";

export const ShareButtons = ({
  title = DEFAULT_TITLE,
  url = "https://cuidarmaisbrasil.life/",
}: ShareButtonsProps) => {
  const [copied, setCopied] = useState(false);
  const text = `${title} ${url}`;

  const handleTrack = (target: string) =>
    track({ type: "click", payload: { link_type: "platform", target_id: `share-${target}`, target_label: `Compartilhar ${target}` } });

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Link copiado!", description: "Cole onde quiser compartilhar." });
      handleTrack("copy");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Não foi possível copiar", description: "Copie manualmente: " + url });
    }
  };

  const onNative = async () => {
    handleTrack("native");
    if (navigator.share) {
      try {
        await navigator.share({ title: "Cuidar+", text: title, url });
      } catch {
        /* cancelado */
      }
    } else {
      onCopy();
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return (
    <Card className="p-5 md:p-6 shadow-card border-border/60 bg-gradient-to-br from-primary/5 to-transparent w-full h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <Share2 className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg font-semibold">Ajude alguém a se cuidar</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Compartilhe a ferramenta — pode ser o empurrãozinho que alguém precisa. Seu resultado pessoal não é compartilhado.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild className="bg-[#25D366] hover:bg-[#25D366]/90 text-white">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleTrack("whatsapp")}
            aria-label="Compartilhar no WhatsApp"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2 fill-current" aria-hidden="true">
              <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
            </svg>
            WhatsApp
          </a>
        </Button>
        <Button asChild variant="outline">
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleTrack("twitter")}
            aria-label="Compartilhar no X (Twitter)"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2 fill-current" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            X
          </a>
        </Button>
        <Button asChild variant="outline">
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleTrack("facebook")}
            aria-label="Compartilhar no Facebook"
          >
            <Facebook className="h-4 w-4 mr-2" />
            Facebook
          </a>
        </Button>
        <Button variant="outline" onClick={onCopy} aria-label="Copiar link">
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {copied ? "Copiado" : "Copiar link"}
        </Button>
        {typeof navigator !== "undefined" && "share" in navigator && (
          <Button variant="ghost" onClick={onNative} aria-label="Mais opções de compartilhamento">
            <Share2 className="h-4 w-4 mr-2" />
            Mais
          </Button>
        )}
      </div>
    </Card>
  );
};
