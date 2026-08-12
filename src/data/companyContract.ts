// Contrato de prestação de serviços — Cuidar+ Trabalho
// Obrigatório para empresas com mais de 50 trabalhadores antes de abrir o ciclo.

export const CONTRACT_VERSION = "v1";
export const CONTRACT_HEADCOUNT_THRESHOLD = 50;

/** Extrai o maior número declarado na faixa de porte (ex.: "100–249 trabalhadores" -> 249). */
export function headcountFromSizeRange(sizeRange?: string | null): number | null {
  if (!sizeRange) return null;
  const nums = (sizeRange.match(/\d+/g) || []).map(Number).filter((n) => Number.isFinite(n));
  if (!nums.length) return null;
  return Math.max(...nums);
}

/** Regra: contrato exigido quando o porte cadastrado indica mais de 50 trabalhadores. */
export function contractRequiredForSize(sizeRange?: string | null): boolean {
  const n = headcountFromSizeRange(sizeRange);
  return n !== null && n > CONTRACT_HEADCOUNT_THRESHOLD;
}

export interface ContractParty {
  name: string;
  cnpj?: string | null;
  sizeRange?: string | null;
}

export function buildContractText(company: ContractParty): string {
  const cnpj = company.cnpj?.trim() || "(CNPJ a informar)";
  const porte = company.sizeRange?.trim() || "(porte a informar)";
  return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE AVALIAÇÃO DE RISCOS PSICOSSOCIAIS
Cuidar+ Trabalho — versão ${CONTRACT_VERSION}

PARTES

CONTRATADA: GAMA SOLUTIONS, inscrita no CNPJ sob o nº 52.115.028/0001-78, que atua sob o nome fantasia CUIDAR+ TRABALHO, responsável pela plataforma Cuidar+ Trabalho, doravante CONTRATADA.

CONTRATANTE: ${company.name}, inscrita no CNPJ sob o nº ${cnpj}, porte declarado: ${porte}, doravante CONTRATANTE.

CLÁUSULA 1 — OBJETO
1.1. A CONTRATADA disponibiliza à CONTRATANTE a aplicação de instrumentos psicométricos para identificação e avaliação de fatores de risco psicossociais relacionados ao trabalho, em ciclos compostos por 5 (cinco) ondas de aplicação, com geração de relatórios agregados para composição do inventário de riscos do PGR (NR-1) e da Avaliação Ergonômica Preliminar (NR-17).
1.2. Os instrumentos aplicados no ciclo são: PHQ-9, GAD-7, COPSOQ II, ECIG, LIPT-60, MDiSH e SHRAS, nas versões em língua portuguesa adotadas pela plataforma.
1.3. Os serviços não constituem diagnóstico clínico individual nem substituem atendimento em saúde, assistência médica ocupacional ou perícia.

CLÁUSULA 2 — OBRIGATORIEDADE DESTE INSTRUMENTO
2.1. Este contrato é condição prévia e obrigatória para o início do ciclo de envio dos testes por CONTRATANTES com mais de ${CONTRACT_HEADCOUNT_THRESHOLD} (cinquenta) trabalhadores, conforme porte declarado no cadastro.
2.2. Enquanto não houver aceite válido, a plataforma bloqueará a abertura de novos ciclos e o disparo das ondas.

CLÁUSULA 3 — OBRIGAÇÕES DA CONTRATANTE
3.1. Fornecer lista de participantes íntegra e atualizada, com autorização interna para uso corporativo dos endereços de e-mail.
3.2. Designar gestor de ondas responsável pela revisão da lista e pela aprovação da 1ª onda.
3.3. Comunicar previamente aos trabalhadores a finalidade, a voluntariedade e o caráter anônimo da participação.
3.4. Assegurar que a resposta ocorra em horário de trabalho, sem prejuízo remuneratório e sem qualquer forma de coação.
3.5. Realizar a devolutiva dos resultados agregados aos trabalhadores antes da abertura do ciclo seguinte, conforme exigência de participação da NR-1.
3.6. Não solicitar, induzir ou tentar obter a identificação de respondentes individuais.
3.7. Adotar medidas de prevenção decorrentes dos riscos identificados, sendo a CONTRATANTE a única responsável pelo cumprimento das obrigações legais de SST.

CLÁUSULA 4 — OBRIGAÇÕES DA CONTRATADA
4.1. Disponibilizar os instrumentos, o envio das ondas e os relatórios agregados no prazo do ciclo contratado.
4.2. Aplicar limiar mínimo de recorte estatístico para impedir reidentificação de respondentes em recortes por setor, área ou função.
4.3. Manter registro técnico de aplicação e das evidências psicométricas utilizadas nos relatórios.
4.4. Prestar suporte à CONTRATANTE quanto à leitura e ao uso dos relatórios.

CLÁUSULA 5 — ANONIMATO, PRIVACIDADE E LGPD
5.1. As respostas individuais são anônimas para a CONTRATANTE; nenhum resultado individual identificável é entregue à empresa.
5.2. A CONTRATADA atua como operadora de dados pessoais em relação aos dados cadastrais fornecidos pela CONTRATANTE, que figura como controladora dessas informações, nos termos da Lei 13.709/2018 (LGPD).
5.3. Dados de saúde mental são tratados como dados pessoais sensíveis, com base legal em tutela da saúde e cumprimento de obrigação legal e regulatória de SST.
5.4. Relatórios individuais são disponibilizados exclusivamente ao próprio respondente, por meio de código de acesso anônimo.
5.5. É vedada à CONTRATANTE qualquer utilização dos resultados para fins disciplinares, de promoção, de desligamento ou de seleção de pessoal.

CLÁUSULA 6 — CICLOS, PRAZOS E PREÇO
6.1. O ciclo é composto por 5 ondas, aplicadas em D+1, D+7, D+15, D+22 e D+30, com repetição a cada 3 (três) meses.
6.2. O preço é calculado por trabalhador, por ciclo, conforme proposta comercial aceita pela CONTRATANTE, que integra este contrato.
6.3. Para CONTRATANTES com mais de 100 trabalhadores, no primeiro ano é cobrado apenas 1 (um) dos 3 (três) ciclos implantados, permanecendo os demais sem custo adicional.
6.4. O faturamento ocorre por ciclo, com vencimento conforme a proposta comercial.

CLÁUSULA 7 — VIGÊNCIA E RESCISÃO
7.1. A vigência é de 12 (doze) meses a contar do aceite, renovável automaticamente por iguais períodos, salvo manifestação em contrário com 30 (trinta) dias de antecedência.
7.2. A rescisão não afeta a obrigação de pagamento dos ciclos já iniciados nem a guarda dos registros legalmente exigidos.

CLÁUSULA 8 — PROPRIEDADE INTELECTUAL
8.1. A plataforma, os modelos de relatório, os algoritmos de pontuação e os materiais técnicos permanecem de titularidade exclusiva da CONTRATADA.
8.2. Os relatórios entregues podem ser usados livremente pela CONTRATANTE para fins internos e de fiscalização, vedada a revenda ou redistribuição comercial.

CLÁUSULA 9 — CONFIDENCIALIDADE
9.1. As partes obrigam-se a manter sigilo sobre informações técnicas, comerciais e operacionais a que tiverem acesso, durante e após a vigência.

CLÁUSULA 10 — LIMITAÇÃO DE RESPONSABILIDADE
10.1. A responsabilidade da CONTRATADA limita-se ao valor do ciclo em que ocorrer o evento gerador.
10.2. A CONTRATADA não responde por decisões de gestão, medidas administrativas ou omissões da CONTRATANTE quanto aos riscos identificados.

CLÁUSULA 11 — ASSINATURA ELETRÔNICA
11.1. As partes reconhecem a validade da assinatura eletrônica simples, nos termos da Lei 14.063/2020 e do art. 10, §2º, da MP 2.200-2/2001.
11.2. O aceite registra nome, CPF, cargo, e-mail, data e hora, endereço IP resumido, navegador e o resumo criptográfico (hash SHA-256) do texto integral aceito, garantindo a integridade do documento.
11.3. A CONTRATANTE pode, opcionalmente, anexar via da versão assinada digitalmente (ex.: GOV.BR), que passa a integrar o registro do aceite.

CLÁUSULA 12 — FORO
12.1. Fica eleito o foro da comarca de Recife/PE para dirimir controvérsias, com renúncia a qualquer outro.`;
}

/** Hash SHA-256 do texto do contrato (hex). */
export async function contractHash(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
