# Painel da empresa e acesso exclusivo

## Objetivo

Transformar o painel existente em uma central clara para a empresa acompanhar cadastro, contrato, notas fiscais, colaboradores, ciclos e relatórios, além de criar uma página própria de login.

## Experiência proposta

### 1. Página de login da empresa
- Criar a rota `/trabalho/login`, separada do acesso administrativo.
- Identidade visual do Cuidar+ Trabalho, com e-mail, senha, mostrar/ocultar senha e recuperação de senha.
- Após entrar, encaminhar proprietários ao painel e gestores de ciclos à gestão de colaboradores e disparos.
- Manter criação de conta somente pelos fluxos autorizados já existentes; não abrir cadastro público indiscriminado.
- Adicionar a página pública `/reset-password` para concluir a recuperação de senha com segurança.

### 2. Nova organização do painel
- Cabeçalho com nome da empresa, situação cadastral e ações principais.
- Resumo inicial com números calculados dos dados reais: colaboradores cadastrados, ciclos realizados/em andamento, adesão e documentos pendentes.
- Navegação simples por áreas: Visão geral, Empresa, Equipe e ciclos, Documentos e Relatórios.
- Ações contextuais com ícones conhecidos: editar gestor, gerenciar colaboradores, baixar nota/contrato, abrir relatório e comparar ciclos.
- Estados vazios claros quando a empresa ainda não possui ciclos, notas ou relatórios.
- Preservar anonimato e permissões existentes; nenhum dado individual será mostrado à empresa.

### 3. Prévia visual e funcional
- Criar `/trabalho/painel/previa`, acessível sem login, usando apenas estados demonstrativos claramente rotulados como “Prévia ilustrativa”.
- A prévia mostrará a organização e os recursos, sem apresentar métricas fictícias como resultados reais: valores indisponíveis aparecerão como traços ou estados vazios.
- Incluir acesso à prévia na página do Cuidar+ Trabalho para avaliação do visual antes de uma empresa possuir dados.

### 4. Responsividade e qualidade
- No celular, trocar a navegação horizontal por seletor compacto e empilhar informações e ações.
- Ajustar botões, textos longos, documentos e cartões para 390 px, tablet e desktop.
- Manter carregamento leve, reutilizando os componentes e ícones já presentes.
- Corrigir redirecionamentos para que usuários sem sessão sejam enviados ao login da empresa, não ao cadastro público.

## Decisões técnicas

- Não será criado um perfil pessoal adicional: o painel reutilizará nome, cargo, e-mail e telefone do responsável já cadastrados na empresa, junto ao vínculo seguro existente com `companies` e `company_wave_managers`.
- O acesso aos relatórios continuará validado no backend pelas permissões atuais.
- A recuperação de senha usará o fluxo de e-mail do Lovable Cloud e uma página pública dedicada.
- Dados da prévia ficarão isolados da base real e sempre identificados como demonstração.

## Validação

- Testar login, recuperação de senha, saída e redirecionamentos.
- Validar proprietário e gestor de ciclos em seus destinos corretos.
- Conferir a prévia e o painel em 390 px, tablet e desktop.
- Confirmar ausência de rolagem lateral e erros de abertura.
