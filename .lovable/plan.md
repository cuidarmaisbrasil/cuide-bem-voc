
## Objetivo

Adicionar um **contato gestor de ondas** ao cadastro de cada empresa no Cuidar+ Trabalho. Esse contato:
- Gerencia a lista de e-mails dos colaboradores (criar, editar, importar, excluir), com **área**, **setor** e **departamento**.
- **Aprova o envio da 1ª onda** após revisar os cadastros.
- É **notificado** das ondas seguintes (envio automático).
- **Não** tem acesso a relatórios individuais.

O contato principal (owner) mantém o acesso atual (dashboard, relatórios agregados por onda e finais).

## Fluxo

```text
Empresa se cadastra em /trabalho
  ├─ Dados da empresa + Contato principal (owner) [já existe]
  └─ + Contato gestor de ondas (novo): nome, e-mail, cargo, WhatsApp
        │
Admin aprova empresa
  └─ E-mail automático ao gestor com convite para criar conta
        │
Gestor cria conta em /auth (email pré-validado com o cadastro)
  └─ Ganha vínculo com a empresa (role wave_manager)
        │
Acessa /trabalho/ondas
  ├─ CRUD de colaboradores (email, nome, área, setor, departamento)
  │     ├─ Import em lote (colar linhas ou CSV)
  │     └─ Visualização agrupada: Departamento → Setor → Área
  ├─ Onda 1: card "Aguardando sua aprovação"
  │     ├─ Validações: e-mails válidos, sem duplicatas
  │     ├─ Checkbox: "Confirmo que revisei todos os e-mails e sua alocação"
  │     └─ Botão "Aprovar envio da 1ª onda" → dispara envios
  └─ Ondas 2 a 6: apenas notificação "Onda X disparada em <data>"
```

## Mudanças

### 1. Banco de dados

**`companies`** — colunas do gestor de ondas:
- `wave_manager_name`, `wave_manager_email`, `wave_manager_role`, `wave_manager_whatsapp`, `wave_manager_user_id`.

**`wellness_participants`** — organização:
- `area`, `setor`, `departamento` (todas opcionais).

**`wellness_company_rounds`** — controle da 1ª onda:
- `first_wave_approved_at`, `first_wave_approved_by`.

**`company_wave_managers`** (nova) — vínculo user_id ↔ company_id, com RLS e função `is_wave_manager_of()` (security definer) para evitar recursão.

**`user_roles.app_role`** — novo valor: `wave_manager`.

**RLS** — gestor pode ler/escrever `wellness_participants` e ler `wellness_invitations` da sua empresa. Continua **sem** acesso às tabelas de respostas individuais (`phq9_company_responses`, `copsoq_responses`, `psicossocial_responses`, etc.).

### 2. Cadastro (`src/pages/Trabalho.tsx`)

Nova seção "Contato gestor de ondas" no formulário de signup, com aviso do papel (gerencia colaboradores, não vê respostas individuais).

### 3. Nova página `/trabalho/ondas`

Acessível a owner + wave_manager. Contém:
- **Lista de colaboradores** com edição inline (email, nome, área, setor, departamento) e exclusão.
- **Import em lote** por colagem/CSV.
- **Agrupamento visual** Departamento → Setor → Área, com contagens.
- **Card de aprovação da 1ª onda** quando `first_wave_approved_at` é nulo:
  - Bloqueia se houver e-mails inválidos ou duplicados.
  - Alerta amarelo (não bloqueio) quando faltar área/setor/departamento.
  - Checkbox obrigatório antes do botão.
- **Cards das ondas 2–6**: exibem data agendada e status ("agendada", "enviada em X", "concluída por N colaboradores").
- Após aprovar a 1ª onda, os campos ficam somente-leitura para o gestor (edição só via admin) para preservar agrupamentos dos relatórios.

### 4. Edge functions novas

- `wave-manager-invite` — envia e-mail ao gestor quando a empresa é aprovada.
- `wave-manager-claim` — no primeiro login do gestor, valida e-mail e cria o vínculo + role.
- `wellness-approve-first-wave` — grava aprovação e libera as invitations pendentes.
- Hook em `wellness-dispatch` para notificar o gestor quando cada onda posterior é disparada.

### 5. Admin

`CompaniesAdmin`/`TrabalhoAdmin` exibem os dados do gestor de ondas e botão "Reenviar convite".

## Arquivos afetados

- migration (companies, wellness_participants, wellness_company_rounds, company_wave_managers, enum, RLS, função)
- `src/pages/Trabalho.tsx` (form de signup)
- `src/pages/TrabalhoOndas.tsx` (novo)
- `src/App.tsx` (rota `/trabalho/ondas`)
- `src/pages/Auth.tsx` (tratar `?wm=<company_id>` no callback)
- `src/hooks/useAuth.tsx` (`isWaveManager`, `waveManagerCompanyId`)
- `src/components/admin/CompaniesAdmin.tsx` e `TrabalhoAdmin.tsx`
- `supabase/functions/wave-manager-invite/index.ts` (novo)
- `supabase/functions/wave-manager-claim/index.ts` (novo)
- `supabase/functions/wellness-approve-first-wave/index.ts` (novo)
- `supabase/functions/wellness-dispatch/index.ts` (notificação ao gestor)
- template de e-mail em `supabase/functions/_shared/transactional-email-templates/`

## Fora de escopo

- Não altero cálculos de scoring nem relatórios existentes.
- Não removo acesso do owner.
- WhatsApp: apenas armazenado (uso manual). Não há integração automática de envio por WhatsApp neste plano — confirme se quer isso depois.
- Filtros por `area`/`setor` nos relatórios agregados: não incluídos agora, podem ser um próximo passo curto.
