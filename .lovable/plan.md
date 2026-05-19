
# Avaliação preventiva continuada para empresas

Programa de 30 dias por trabalhador, disparado por e-mail corporativo, com 3 testes, tudo editável pelo admin e medindo latência de resposta por questão.

```text
D0  ──► PHQ-9 (depressão)         ┐
D15 ──► ECIG (conflito intragrupo) │── mesmo token, anonimato p/ empresa
D30 ──► COPSOQ (bem-estar)        ┘
```

## 1. Modelo de dados (migrations)

- `wellness_programs` — programa por empresa (active, intervalos D0/D15/D30 configuráveis, criado_por_admin).
- `wellness_participants` — `company_id`, `email`, `token` (uuid), `enrolled_at`, `unsubscribed_at`. Token usado em todos os 3 links. Empresa nunca vê `email`.
- `wellness_invitations` — `participant_id`, `wave` (`phq9` | `ecig` | `copsoq`), `scheduled_at`, `sent_at`, `opened_at`, `completed_at`, `status`.
- `ecig_responses` — `company_id`, `participant_token_hash`, `answers` (jsonb), `scores` (jsonb: tarefa/relacionamento/processo), `latencies_ms` (jsonb), demografia, `created_at`.
- `phq9_company_responses` — versão corporativa do PHQ-9 (já capturamos latências em `test_events`; aqui adicionamos `company_id` + `participant_token_hash` + `wave='phq9'`).
- `copsoq_responses` — adicionar colunas `participant_token_hash` e `wave='copsoq'` (sem quebrar respostas públicas).
- `instrument_questions` — tabela única de itens editáveis: `instrument` (`phq9`|`ecig`|`copsoq_<version>`), `n`, `text`, `scale`, `reverse`, `response_set`, `active`. Substitui/estende `copsoq_question_overrides` e permite editar PHQ-9 e ECIG da mesma forma.
- RLS: admins gerenciam tudo; donos da empresa veem só agregados; tokens públicos resolvem participante via edge function (não expostos via RLS direto).

## 2. Edge functions

- `wellness-enroll` — admin/empresa envia lista de e-mails → cria participantes + 3 convites agendados.
- `wellness-dispatch` (cron a cada 15 min) — varre `wellness_invitations` com `scheduled_at <= now()` e `sent_at IS NULL`, enfileira e-mail transacional com link `/w/<token>/<wave>`.
- `wellness-resolve-token` — valida token, retorna `company`, `wave`, questões ativas.
- `wellness-submit` — recebe respostas + latências, calcula score, grava na tabela certa, marca convite como `completed`.
- `submit-copsoq` e `track-event` ajustados para aceitar `participant_token` opcional.

## 3. Frontend

- **Rotas públicas anônimas:**
  - `/w/:token/phq9` — reaproveita `DepressionTest` (já tem latência), submete via `wellness-submit`.
  - `/w/:token/ecig` — novo `EcigTest` (placeholder de itens até você colar; mesma UI Likert do COPSOQ, captura latência por questão).
  - `/w/:token/copsoq` — reaproveita `CopsoqResponder`, adiciona captura de latência (hoje não captura).
- **Admin (`TrabalhoAdmin` + nova aba "Programa"):**
  - Editor de itens unificado: tabs PHQ-9 / ECIG / COPSOQ (×6 versões), com ativar/desativar e editar texto — salva auto.
  - Por empresa: importar CSV/colar e-mails, ver progresso (enviados/abertos/concluídos por onda), reenviar, cancelar.
  - Painel de latências: média/mediana por questão, outliers (cliques < 500ms ou > 2 min), por onda.

## 4. Latência (padrão único)

Em todos os 3 testes: ao montar a questão, `shownAt = Date.now()`. No clique, `latency = clamp(0, 600000, now - shownAt)`. Enviado como `latencies_ms: number[]` alinhado às respostas. Já existe no PHQ-9 — replicar no ECIG e adicionar no COPSOQ.

## 5. E-mails

Usar infra transacional Lovable Emails já existente. 3 templates:
- `wellness-invite-phq9`, `wellness-invite-ecig`, `wellness-invite-copsoq` — todos com link único por token, rodapé de anonimato e link de descadastro (`/unsubscribe?token=…`).

## 6. O que fica em stand-by

- Projeções de melhora por ação (conforme você pediu).
- Catálogo de ações e cutoffs oficiais — só voltamos quando você trouxer fontes.

## 7. O que preciso de você antes de codar o ECIG

Cole aqui os itens do ECIG que devo usar (ex.: versão Jehn 1995 adaptada por Martins, 9 ou 12 itens, com escala Likert 1–5 ou 1–7) e qualquer cutoff/escoragem. Sem isso, deixo o ECIG com estrutura de 3 subescalas (tarefa/relacionamento/processo) e itens placeholder marcados visivelmente como `[EDITAR]` para você preencher no admin.

## 8. Ordem de execução (após aprovação)

1. Migrations (tabelas + RLS + colunas novas).
2. Edge functions (enroll, dispatch, resolve, submit) + cron.
3. Editor unificado de itens no admin.
4. Rotas `/w/:token/:wave` + captura de latência no COPSOQ e ECIG.
5. Setup de e-mails transacionais (3 templates) + envio.
6. Painel de progresso e latências por empresa.

Aprovado? Se sim, já começo pelas migrations. Se você puder colar o ECIG junto, melhor — saio com o instrumento real em vez de placeholders.
