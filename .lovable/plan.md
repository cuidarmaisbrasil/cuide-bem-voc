
# Psicometria real — CFA, invariância, viés

Objetivo: substituir o `PsychometricsReport.tsx` atual (valores hardcoded) por um pipeline em que **todo número exibido vem de cálculo real** sobre as respostas do ciclo. Onde n for insuficiente, o relatório mostra "indisponível — n < mínimo" em vez de inventar valores.

## Regra fixada como memória do projeto

Salva em `mem://preferences/no-fake-samples.md`: nenhuma tela de relatório/estatística pode renderizar valores demonstrativos hardcoded. Toda métrica = cálculo real, ou rótulo explícito de "exemplo educacional" + aviso visível. Vou aplicar isso retroativamente nesta entrega.

## Arquitetura

```text
Browser ──► Edge Function ──► Worker Python (Modal)
  (UI)      wellness-psychometrics      ├── semopy  → CFA, invariância
              (Deno/TS)                 ├── pingouin → α, ω, correlações
              ├── valida n mínimo       ├── factor_analyzer → Harman, PCA
              ├── busca respostas       └── statsmodels → DIF (logística ordinal)
              ├── calcula em TS o que    
              │   for trivial (α,        Retorna JSON com fit indices,
              │   midpoint, straight,    bias metrics, invariance deltas
              │   aquiescência, Harman)
              └── delega ao worker
                  o que exige álgebra
```

## Por que worker externo

Deno Edge não tem álgebra matricial dimensionada (autovalores grandes, otimização WLSMV iterativa, regressão ordinal). Opções consideradas:
- **Modal (escolhida):** Python serverless, pay-per-second, cold start ~2s, sem custo fixo. Endpoint HTTPS protegido por token. `semopy` + `pingouin` + `factor_analyzer` + `statsmodels` instalam limpos.
- Fly.io / Railway: bom, mas exige container sempre ligado → custo fixo.
- R/lavaan: padrão-ouro acadêmico, mas dobra a complexidade de hosting sem ganho sobre `semopy` para nossos modelos.

## Etapas

### 1. Pré-requisitos de dados (sem isso, números não fecham)

- **MC-SDS-10 (Marlowe-Crowne 10 itens, PT-BR):** adicionar como bloco de 10 itens dicotômicos no fim da Onda 3 (COPSOQ já é a mais longa, evita inflar outras). Sem isso, "desejabilidade social" não existe.
- **Pareamento longitudinal anônimo:** o `participant_token_hash` já existe por ciclo, mas não persiste entre ciclos para o mesmo e-mail. Adicionar `wellness_participants.longitudinal_hash` = HMAC-SHA256(email_normalizado, segredo do servidor) — mesmo valor entre ciclos, irreversível, empresa não vê. Habilita invariância longitudinal e análise de mudança intra-sujeito.
- **n mínimo por análise:** configurável em `wellness_company_settings` (já existe `n_min_privacy`). Adicionar `n_min_cfa` (default 150), `n_min_invariance` (default 200/grupo), `n_min_dif` (default 100/grupo).

### 2. Migrations

- `wellness_psychometrics_runs`: 1 linha por (company_id, round_no, instrument). Colunas: `fit_indices jsonb`, `bias_metrics jsonb`, `invariance jsonb`, `n_used int`, `computed_at`, `status` (`ok` | `insufficient_n` | `worker_error`), `error_msg`. RLS: admins e owners da empresa leem; só service_role escreve.
- `instrument_questions`: marcar 10 novos itens MC-SDS-10 com `instrument='mc_sds_10'`, `scale='dichotomous'`.
- `copsoq_responses`: adicionar coluna `social_desirability_score smallint` (0–10), preenchida no submit quando os 10 itens vierem juntos.
- `wellness_participants`: adicionar `longitudinal_hash text` (nullable, index).
- Função `compute_longitudinal_hash(email text) returns text` security definer, lê segredo de `vault` (ou de env via edge function — não fica no DB).

### 3. Cálculos em TypeScript (rodam no Deno Edge, sem worker)

Função `wellness-psychometrics-light`:
- **α de Cronbach:** fórmula direta sobre matriz de covariância dos itens.
- **Harman single-factor:** PCA via `ml-pca` (npm), % variância do 1º componente.
- **Aquiescência:** índice em pares de itens reversos quando o instrumento tem reversos (PHQ-9 não tem; ECIG tem; COPSOQ tem alguns).
- **Midpoint %:** trivial.
- **Straightlining %:** variância intra-respondente ≈ 0.
- **Correlação com MC-SDS-10:** Pearson direto.

Resultado: maioria do quadro de viés roda nativo, sem custo externo.

### 4. Worker Python no Modal

Repo separado `cuidar-psychometrics-worker`:
```text
app.py
  @app.function(image=Image.debian_slim().pip_install("semopy","pingouin","factor_analyzer","statsmodels","numpy","pandas"))
  @app.web_endpoint(method="POST", custom_domains=[...])
  def compute(payload):
      # payload = {instrument, responses: [[...]], model_spec, demographics?}
      # devolve {fit:{chi2_df,cfi,tli,rmsea,srmr,omega}, dif:[...], invariance:{configural,metric,scalar}}
```

Modelos pré-especificados (sintaxe lavaan/semopy) versionados em código, um por instrumento:
- PHQ-9: 1 fator, 9 indicadores.
- ECIG: 2 fatores (tarefa/relacionamento) com cargas-cruzadas zero.
- COPSOQ-II BR curto: modelo multidimensional 8 fatores com base em Pejtersen 2010 + adaptação Rosário 2017.
- LIPT-60: 6 fatores (Zapf 1996 / González de Rivera 2003).
- MDiSH: 4 fatores (Page 2016, validação BR Felix 2022 quando disponível).
- SHRAS: 2 fatores.

Estimador WLSMV para itens ordinais.

### 5. Edge function `wellness-psychometrics` (orquestrador)

Disparada quando uma rodada fecha (`wellness_company_rounds.closed_at`) OU manualmente pelo admin:
1. Para cada instrumento da rodada: contar n.
2. Se n < n_min_cfa → gravar `status='insufficient_n'`, pular.
3. Calcular bloco TS (α, Harman, viés).
4. Chamar worker Modal com timeout 60s. Token de auth via secret `MODAL_WORKER_TOKEN`.
5. Persistir resultado em `wellness_psychometrics_runs`.
6. Para invariância: se houver ≥2 rodadas com n suficiente, montar payload longitudinal e chamar worker de novo.

### 6. UI — `PsychometricsReport.tsx` reescrito

Recebe `company_id` + `round_no` como props, busca de `wellness_psychometrics_runs`. Estados possíveis por linha:
- `ok` → mostra valores reais + badge.
- `insufficient_n` → mostra "n=X, mínimo Y — análise indisponível neste ciclo".
- `worker_error` → mostra erro técnico discreto para admin, oculta para owner.
- `pending` → "calculando…" com botão de re-disparar para admin.

**Sem fallback hardcoded.** Se `wellness_psychometrics_runs` está vazio, a seção mostra "Análise psicométrica ainda não executada para este ciclo" + botão "Calcular agora" (admin only).

### 7. Página `/trabalho/amostra-relatorio` (lead capture)

Hoje é puro mock. Duas opções honestas:
- **(a)** Apontar para um ciclo real anonimizado de empresa-piloto que autorizou uso como caso, com banner "Dados reais — empresa Y, ciclo 2025-Q2, n=...".
- **(b)** Gerador determinístico de dados sintéticos com seed fixo, documentado: `npm:@faker-js/faker` gera 250 respostas via distribuições calibradas em médias publicadas dos manuais → roda o pipeline real → exibe relatório real sobre dados sintéticos, com banner "Dados simulados a partir de distribuições publicadas — não corresponde a empresa real".

Recomendo **(b)** até termos uma empresa-piloto que autorize. Implemento o gerador em `supabase/functions/_generate-synthetic-cycle/` (admin-only), roda uma vez, popula uma `company_id` chamada `__SAMPLE__` e o pipeline psicométrico real calcula em cima. O lead capture vê números reais sobre amostra sintética declarada.

### 8. Segurança / privacidade

- Worker Modal recebe apenas matriz numérica + demografia agregada (gênero, faixa etária). Nunca tokens, e-mails, ou IDs.
- `longitudinal_hash` é HMAC, não reversível sem o segredo. Segredo fica em edge function env, não no DB.
- `wellness_psychometrics_runs` herda RLS de owner-da-empresa só para agregados; itens brutos nunca saem.

### 9. Limpeza

- Remover arrays `FIT` e `BIAS` hardcoded de `src/components/admin/PsychometricsReport.tsx`.
- Substituir aviso atual ("valores ilustrativos") por estados reais.
- Atualizar texto da página `/trabalho/amostra-relatorio` para refletir origem dos dados.

## O que preciso de você antes de começar

1. **Modal account:** você abre conta gratuita em modal.com, gera token, eu peço via `add_secret` (`MODAL_WORKER_TOKEN` + `MODAL_WORKER_URL`). Tier free cobre desenvolvimento; produção fica ~US$ 5-20/mês conforme volume.
2. **MC-SDS-10 PT-BR:** quer a versão de Gouveia et al. (2009) ou Ribas Jr. et al. (2004)? As duas têm validação BR.
3. **Caminho da amostra:** (a) empresa-piloto real autorizada ou (b) dados sintéticos declarados? Default sugerido: (b) agora, migrar para (a) quando tivermos piloto.
4. **Ordem de execução:** posso entregar em 3 PRs — (i) migrations + cálculos TS + UI reescrita já mostrando "indisponível" honestamente; (ii) worker Modal + integração CFA/invariância; (iii) gerador sintético + página de amostra. Aprova essa ordem?

## Fora de escopo desta entrega

- Análise de mudança causal (necessita design quase-experimental, fica para depois).
- IRT (modelo Rasch / 2PL) — útil mas não pedido; podemos adicionar depois com `mirt` se virar prioridade.
- DIF por raça/etnia — só faz sentido se coletarmos a variável, hoje não coletamos.

