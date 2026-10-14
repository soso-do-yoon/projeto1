# Avaliacao: GitHub Actions com IA

Repositorio: https://github.com/soso-do-yoon/projeto1

## T1 - ci.yml

O workflow ci roda em todo push e em todo pull request para main, com 3 verificacoes: segredo versionado, migracoes D1 em SQLite local e HTML valido.

- Execucao vermelha (PR #1, commit com erro de proposito): https://github.com/soso-do-yoon/projeto1/actions/runs/38491853947
- Execucao verde (PR #1, apos a correcao): https://github.com/soso-do-yoon/projeto1/actions/runs/38491946398
- Execucao verde na main: https://github.com/soso-do-yoon/projeto1/actions/runs/38487687252
- Observacao: as execucoes 1 e 2 falharam (https://github.com/soso-do-yoon/projeto1/actions/runs/38486495195 e https://github.com/soso-do-yoon/projeto1/actions/runs/38487428648) porque o htmlhint reprovava paginas HTML do template Bootstrap. Decidimos validar somente public/index.html. Os PRs de T1 e T4 foram combinados no PR #1.

Por que testar as migracoes em um SQLite local antes do D1: porque e rapido, gratuito e sem risco, e acusa erro de sintaxe SQL antes de tocar no banco de producao.

## T2 - Protecao da main

A main exige pull request e o status check verificar (ruleset).

- PR bloqueado e depois liberado: https://github.com/soso-do-yoon/projeto1/pull/1
- git push direto recusado. No terminal, git push origin main retornou: [remote rejected] main -> main (push declined due to repository rule violations); error: GH013: Repository rule violations found for refs/heads/main; Changes must be made through a pull request; Required status check "verificar" is expected. O commit de teste nao entrou na main.

## T3 - Revisao por IA

Workflow revisao-ia.yml com actions/ai-inference@v2 (provider copilot), que comenta no PR.

- PR com SQL vulneravel (concatenacao), com comentario da IA: https://github.com/soso-do-yoon/projeto1/pull/3
- Segunda revisao, apos corrigir para prepare().bind(): no mesmo PR #3
- Erro de permissao ao remover pull-requests: write: https://github.com/soso-do-yoon/projeto1/actions/runs/38496206229 (erro: Resource not accessible by integration (addComment)). PR: https://github.com/soso-do-yoon/projeto1/pull/4. A permissao foi restaurada depois.
- Todas as execucoes: https://github.com/soso-do-yoon/projeto1/actions/workflows/revisao-ia.yml
- Afirmacao duvidosa da IA: na segunda revisao do PR #3 ela apontou falta de autenticacao no endpoint, algo especulativo e fora do escopo do diff (o PR so trocava a concatenacao por bind).

## T4 - migrar.yml

O workflow migrar so roda quando um push na main altera migrations/.

- Execucao ao mergear a migracao 0002 (adiciona a coluna user_agent em sessions): https://github.com/soso-do-yoon/projeto1/actions/runs/38493247727
- Confirmacao com wrangler (PRAGMA table_info(sessions) no D1 remoto) mostrou a coluna user_agent.
- Segundo merge sem tocar em migrations/ (PR #5, so README): https://github.com/soso-do-yoon/projeto1/pull/5. A lista do workflow continua com apenas uma execucao: https://github.com/soso-do-yoon/projeto1/actions/workflows/migrar.yml

## Respostas

1. O ci.yml roda duas vezes porque o gatilho push dispara a cada push em qualquer branch e o gatilho pull_request dispara ao abrir ou atualizar o PR. Os dois aparecem como obrigatorios na main (ci / verificar (pull_request) e ci / verificar (push)). O pull_request valida o resultado da combinacao do PR com a main; o push valida o commit enviado ao branch.

2. PRs vindos de forks nao recebem secrets, entao COPILOT_PAT nao fica disponivel. Isso impede que alguem abra um PR malicioso alterando o workflow para imprimir ou enviar o token para fora.

3. O revisao-ia declara permissions para seguir o menor privilegio: o GITHUB_TOKEN so recebe contents: read e pull-requests: write, o minimo para ler o codigo e comentar. Sem pull-requests: write o comentario falha, como vimos na T3.

4. Nao. A IA comentou mas o job ficou verde mesmo com problema apontado, nao e deterministica e fez afirmacao especulativa (item 4 da T3). O status check verificar e deterministico e bloqueia o merge. A revisao da IA e um apoio e nao deve ser o criterio de bloqueio.
