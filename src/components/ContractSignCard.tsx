import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { FileSignature, ShieldCheck, Printer, Upload } from "lucide-react";
import {
  CONTRACT_VERSION,
  buildContractText,
  contractHash,
  contractRequiredForSize,
  headcountFromSizeRange,
} from "@/data/companyContract";

interface Props {
  companyId: string;
  companyName: string;
  cnpj?: string | null;
  sizeRange?: string | null;
  /** Somente leitura (visão do admin) */
  readOnly?: boolean;
}

interface ContractRow {
  id: string;
  version: string;
  contract_hash: string;
  signer_name: string;
  signer_cpf: string;
  signer_role: string;
  signer_email: string;
  accepted_at: string;
  signed_file_path: string | null;
}

export const ContractSignCard = ({ companyId, companyName, cnpj, sizeRange, readOnly }: Props) => {
  const [contract, setContract] = useState<ContractRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);

  const required = contractRequiredForSize(sizeRange);
  const headcount = headcountFromSizeRange(sizeRange);
  const text = useMemo(
    () => buildContractText({ name: companyName, cnpj, sizeRange }),
    [companyName, cnpj, sizeRange],
  );

  useEffect(() => {
    if (!companyId) return;
    supabase
      .from("company_contracts")
      .select("id,version,contract_hash,signer_name,signer_cpf,signer_role,signer_email,accepted_at,signed_file_path")
      .eq("company_id", companyId)
      .eq("status", "accepted")
      .order("accepted_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setContract((data as any) ?? null);
        setLoading(false);
      });
  }, [companyId]);

  async function sign() {
    if (!agree) return toast.error("Marque a concordância com os termos do contrato.");
    if (!name.trim() || cpf.replace(/\D/g, "").length !== 11 || !role.trim() || !email.trim()) {
      return toast.error("Preencha nome, CPF (11 dígitos), cargo e e-mail do signatário.");
    }
    setBusy(true);
    try {
      const hash = await contractHash(text);
      const { data, error } = await supabase.functions.invoke("company-contract-sign", {
        body: {
          company_id: companyId,
          version: CONTRACT_VERSION,
          contract_hash: hash,
          signer_name: name,
          signer_cpf: cpf,
          signer_role: role,
          signer_email: email,
          headcount_declared: headcount,
        },
      });
      const d = data as any;
      if (error || d?.error) throw new Error(d?.message || d?.error || error?.message);
      toast.success("Contrato aceito. O ciclo já pode ser iniciado.");
      setContract({
        id: d.contract.id,
        version: d.contract.version,
        contract_hash: d.contract.contract_hash,
        signer_name: name,
        signer_cpf: cpf,
        signer_role: role,
        signer_email: email,
        accepted_at: d.contract.accepted_at,
        signed_file_path: null,
      });
    } catch (e: any) {
      toast.error(e.message || "Erro ao registrar o aceite.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadSigned(file: File) {
    if (!contract) return;
    setBusy(true);
    try {
      const path = `${companyId}/${contract.id}-${file.name.replace(/[^\w.-]+/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("company-contracts").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { error } = await supabase
        .from("company_contracts")
        .update({ signed_file_path: path, signed_file_uploaded_at: new Date().toISOString() })
        .eq("id", contract.id);
      if (error) throw error;
      setContract({ ...contract, signed_file_path: path });
      toast.success("Via assinada anexada ao registro.");
    } catch (e: any) {
      toast.error(e.message || "Erro no upload.");
    } finally {
      setBusy(false);
    }
  }

  function printContract() {
    const w = window.open("", "_blank");
    if (!w) return;
    const signedBlock = contract
      ? `\n\n---\nACEITE ELETRÔNICO REGISTRADO\nSignatário: ${contract.signer_name} — ${contract.signer_role}\nCPF: ${contract.signer_cpf}\nE-mail: ${contract.signer_email}\nData/hora: ${new Date(contract.accepted_at).toLocaleString("pt-BR")}\nHash SHA-256 do texto aceito: ${contract.contract_hash}`
      : "";
    w.document.write(
      `<html><head><title>Contrato — ${companyName}</title></head><body style="font-family:Georgia,serif;white-space:pre-wrap;line-height:1.5;padding:32px;max-width:760px;margin:0 auto">${(text + signedBlock).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!))}</body></html>`,
    );
    w.document.close();
    w.print();
  }

  function downloadContract() {
    const signedBlock = contract
      ? `\n\n---\nACEITE ELETRÔNICO REGISTRADO\nSignatário: ${contract.signer_name} — ${contract.signer_role}\nCPF: ${contract.signer_cpf}\nE-mail: ${contract.signer_email}\nData/hora: ${new Date(contract.accepted_at).toLocaleString("pt-BR")}\nHash SHA-256 do texto aceito: ${contract.contract_hash}`
      : "";
    const blob = new Blob([text + signedBlock], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contrato-cuidar-mais-trabalho-${CONTRACT_VERSION}-${companyName.replace(/[^\w-]+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return null;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <FileSignature className="h-5 w-5 mt-0.5 text-primary" />
          <div>
            <h2 className="font-display text-lg font-semibold">Contrato de prestação de serviços</h2>
            <p className="text-sm text-muted-foreground">
              {required
                ? `Obrigatório para empresas com mais de 50 trabalhadores (porte cadastrado: ${sizeRange || "—"}). O ciclo de envio dos testes só é liberado após o aceite.`
                : "Registro contratual da empresa."}
            </p>
          </div>
        </div>
        <Badge variant={contract ? "default" : "destructive"}>
          {contract ? "Assinado" : "Pendente"}
        </Badge>
      </div>

      <details className="rounded-md border border-border/60 bg-muted/30 p-3">
        <summary className="cursor-pointer text-sm font-medium">Ler o contrato na íntegra (versão {CONTRACT_VERSION})</summary>
        <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
          {text}
        </pre>
      </details>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={printContract}>
          <Printer className="h-4 w-4" /> Baixar / imprimir PDF
        </Button>
        {contract && !readOnly && (
          <label className="inline-flex">
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadSigned(e.target.files[0])}
            />
            <Button size="sm" variant="outline" asChild disabled={busy}>
              <span><Upload className="h-4 w-4" /> Anexar via assinada (GOV.BR)</span>
            </Button>
          </label>
        )}
      </div>

      {contract ? (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs space-y-1">
          <div className="flex items-center gap-2 font-medium text-sm">
            <ShieldCheck className="h-4 w-4 text-primary" /> Aceite eletrônico simples registrado
          </div>
          <div>Signatário: {contract.signer_name} — {contract.signer_role}</div>
          <div>CPF: {contract.signer_cpf} · E-mail: {contract.signer_email}</div>
          <div>Data/hora: {new Date(contract.accepted_at).toLocaleString("pt-BR")}</div>
          <div className="break-all">Hash SHA-256 do texto aceito: {contract.contract_hash}</div>
          <div>Via assinada anexada: {contract.signed_file_path ? "sim" : "não"}</div>
        </div>
      ) : readOnly ? (
        <p className="text-sm text-muted-foreground">Aguardando aceite da empresa.</p>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label>Nome do signatário *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>CPF *</Label><Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" /></div>
            <div><Label>Cargo *</Label><Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ex.: Diretor de RH" /></div>
            <div><Label>E-mail *</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={agree} onCheckedChange={(v) => setAgree(!!v)} className="mt-0.5" />
            <span>
              Li e concordo com o contrato acima, e declaro ter poderes para representar {companyName}. Serão registrados
              data, hora, IP resumido, navegador e o hash do texto aceito, como assinatura eletrônica simples (Lei 14.063/2020).
            </span>
          </label>
          <Button onClick={sign} disabled={busy}>
            {busy ? "Registrando…" : "Assinar e liberar o ciclo"}
          </Button>
        </div>
      )}
    </Card>
  );
};
