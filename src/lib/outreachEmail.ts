// Copy de prospecção Cuidar+ Trabalho.
// Estrutura de persuasão em 5 tempos (antecipação → leitura do cenário →
// solução → prova → convite de baixo atrito), com seleção exclusiva do
// primeiro ciclo gratuito.
// Tom: português comercial brasileiro — formal, contido, factual.
// Sem superlativos, sem elogios genéricos, sem entusiasmo importado do inglês.

export const COMMERCIAL_FROM = "comercial@cuidarmaisbrasil.life";
export const BOOKING_URL = "https://calendly.com/comercial-cuidarmaisbrasil";
export const SITE_URL = "https://cuidarmaisbrasil.life/trabalho";
export const SAMPLE_URL = "https://cuidarmaisbrasil.life/trabalho?amostra=1";
export const CARD_IMAGE_URL =
  "https://cuidarmaisbrasil.life/__l5e/assets-v1/f736383c-12f6-4861-af8d-51b4859d686d/cuidar-mais-trabalho-card.jpg";

export interface OutreachInput {
  company_name: string;
  sector?: string | null;
  city?: string | null;
  state?: string | null;
  target_role?: string | null;
  fit_rationale?: string | null;
  custom_copy?: string | null;
}

function local(p: OutreachInput) {
  return [p.city, p.state].filter(Boolean).join("/");
}

export function outreachSubject(p: OutreachInput) {
  return `${p.company_name}: primeiro ciclo NR-1 (riscos psicossociais) sem custo`;
}

export function outreachText(p: OutreachInput) {
  const setor = p.sector ? ` no setor de ${p.sector}` : "";
  const cidade = local(p) ? ` em ${local(p)}` : "";
  const cargo = p.target_role ? `${p.target_role}` : "responsável pelo tema";

  if (p.custom_copy && p.custom_copy.trim()) {
    return `${p.custom_copy.trim()}

A ${p.company_name} está entre as empresas selecionadas para receber o primeiro ciclo completo e o relatório final sem custo (até 100 colaboradores).

Amostra de uma página do relatório final: ${SAMPLE_URL}
Agenda de 15 min: ${BOOKING_URL}

—
Comercial Cuidar+ Trabalho
${COMMERCIAL_FROM}
${SITE_URL}`;
  }

  return `Olá,

Escrevo ao ${cargo} da ${p.company_name} sobre um ponto que costuma se repetir${setor}: quando perguntamos onde está o maior risco psicossocial da operação, as respostas quase sempre são as mesmas três — sobrecarga, clima em algumas equipes e um afastamento que ninguém viu chegar. O diagnóstico costuma estar certo; o que falta é a evidência documental que a NR-1 exige.

É esse o ponto que a fiscalização verifica primeiro: o inventário de riscos psicossociais existe no papel, mas sem medição periódica, sem série histórica e sem plano de ação rastreável.

O Cuidar+ Trabalho cobre exatamente essa lacuna, com uma arquitetura preventiva em 5 ondas, aplicada de forma anônima aos colaboradores${cidade}:
• Onda 1 — sinais de sofrimento e ansiedade (rastreio inicial)
• Onda 2 — percepção do ambiente psicossocial
• Onda 3 — clima e convivência no grupo de trabalho
• Onda 4 — condutas hostis e reteste comparativo
• Onda 5 — assédio: percepção, tolerância e disposição de reportar

Ao fim do ciclo (3 meses), a empresa recebe um relatório consolidado com indicadores por área/setor, faixas de atenção e risco, plano de ação e a documentação de conformidade com a NR-1. Cada colaborador recebe, por código anônimo, uma devolutiva individual.

A ${p.company_name} está entre as empresas selecionadas para receber o primeiro ciclo completo e o relatório final sem custo, para até 100 colaboradores. Sem contrato e sem cartão.

Uma página real do relatório final: ${SAMPLE_URL}
Se preferir conversar antes, são 15 minutos: ${BOOKING_URL}

Se o tema ainda não for prioridade, sem problema. Sugiro apenas guardar este e-mail: ele encurta o caminho na próxima notificação de fiscalização ou afastamento por saúde mental.

—
Comercial Cuidar+ Trabalho
${COMMERCIAL_FROM}
${SITE_URL}`;
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

export function outreachHtml(p: OutreachInput) {
  const setor = p.sector ? ` no setor de ${esc(p.sector)}` : "";
  const cidade = local(p) ? ` em ${esc(local(p))}` : "";
  const cargo = esc(p.target_role || "responsável pelo tema");
  const empresa = esc(p.company_name);
  const custom = p.custom_copy?.trim() ? esc(p.custom_copy.trim()).replace(/\n/g, "<br/>") : null;

  const ondas = [
    ["Onda 1", "Sinais de sofrimento e ansiedade — rastreio inicial"],
    ["Onda 2", "Percepção do ambiente psicossocial"],
    ["Onda 3", "Clima e convivência no grupo de trabalho"],
    ["Onda 4", "Condutas hostis e reteste comparativo"],
    ["Onda 5", "Assédio: percepção, tolerância e disposição de reportar"],
  ]
    .map(
      ([t, d]) =>
        `<tr><td style="padding:6px 0;font-size:14px;color:#0f172a;"><strong style="color:#0d3b34;">${t}</strong> — ${d}</td></tr>`
    )
    .join("");

  const corpo = custom
    ? `<p style="${P}">${custom}</p>`
    : `<p style="${P}">Escrevo ao <strong>${cargo}</strong> da <strong>${empresa}</strong> sobre um ponto que costuma se repetir${setor}: quando perguntamos onde está o maior risco psicossocial da operação, as respostas quase sempre são as mesmas três — sobrecarga, clima em algumas equipes e um afastamento que ninguém viu chegar. O diagnóstico costuma estar certo; o que falta é a evidência documental que a NR-1 exige.</p>
       <p style="${P}">É esse o ponto que a fiscalização verifica primeiro: o inventário de riscos psicossociais existe no papel, mas sem medição periódica, sem série histórica e sem plano de ação rastreável.</p>
       <p style="${P}">O <strong>Cuidar+ Trabalho</strong> cobre exatamente essa lacuna, com uma arquitetura preventiva em 5 ondas, aplicada de forma anônima aos colaboradores${cidade}:</p>
       <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:8px 0 16px;">${ondas}</table>
       <p style="${P}">Ao fim do ciclo (3 meses), a empresa recebe um <strong>relatório consolidado</strong> com indicadores por área/setor, faixas de atenção e risco, plano de ação e a documentação de conformidade com a NR-1. Cada colaborador recebe, por código anônimo, uma devolutiva individual.</p>`;

  return `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:0;background:#f1f5f4;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <img src="${CARD_IMAGE_URL}" alt="Cuidar+ Trabalho — Presença com cuidado, ação com resultado" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
  <div style="padding:24px 28px;">
    ${corpo}

    <div style="background:#0d3b34;border-radius:10px;padding:18px 20px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#e8b4a4;">Convite selecionado</p>
      <p style="margin:0;font-size:16px;line-height:1.5;color:#ffffff;">
        A <strong>${empresa}</strong> está entre as empresas selecionadas para receber o <strong>primeiro ciclo completo e o relatório final sem custo</strong>, para até 100 colaboradores. Sem contrato e sem cartão.
      </p>
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="padding-right:10px;">
          <a href="${SAMPLE_URL}" style="display:inline-block;background:#c9614a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:8px;">Ver amostra do relatório</a>
        </td>
        <td>
          <a href="${BOOKING_URL}" style="display:inline-block;background:#ffffff;color:#0d3b34;border:1px solid #0d3b34;text-decoration:none;font-size:14px;font-weight:600;padding:11px 20px;border-radius:8px;">Agendar 15 min</a>
        </td>
      </tr>
    </table>

    <p style="${P}font-size:13px;color:#475569;">Se a resposta for “ainda não é prioridade”, tudo bem — só peço que guarde este e-mail. Na próxima notificação de fiscalização ou afastamento por saúde mental, ele economiza meses.</p>

    <hr style="border:0;border-top:1px solid #e2e8f0;margin:20px 0;" />
    <p style="margin:0;font-size:12px;color:#64748b;line-height:1.6;">
      Comercial Cuidar+ Trabalho<br/>
      <a href="mailto:${COMMERCIAL_FROM}" style="color:#0d3b34;">${COMMERCIAL_FROM}</a><br/>
      <a href="${SITE_URL}" style="color:#0d3b34;">cuidarmaisbrasil.life/trabalho</a>
    </p>
  </div>
</div></body></html>`;
}

const P = "margin:0 0 14px;font-size:15px;line-height:1.6;color:#0f172a;";
