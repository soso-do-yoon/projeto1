# Testes de falha

## Caso 1: retorno sem cookie temporário
- **Preparação:** login com GitHub iniciado em janela comum e interrompido na página de autorização.
- **Pedido enviado:** URL de autorização aberta em janela anônima (sem `__Host-oauth-tx`) e autorização concluída.
- **Resultado esperado:** o retorno recusa a resposta e não cria sessão.
- **Resultado observado:** 400 "Parametros ausentes"; nenhuma sessão criada.

## Caso 2: state alterado
- **Preparação:** login com GitHub iniciado e interrompido na página do provedor.
- **Pedido enviado:** rota de retorno chamada com o parâmetro state alterado (URL não registrada por conter valores transitórios).
- **Resultado esperado:** recusa antes da troca do código.
- **Resultado observado:** 400 "State invalido".

## Caso 3: reutilização da transação
- **Preparação:** login com GitHub concluído com sucesso.
- **Pedido enviado:** URL do retorno copiada no painel Network (Copy URL) e aberta novamente.
- **Resultado esperado:** a repetição falha, pois a transação já foi removida.
- **Resultado observado:** 400 "Parametros ausentes".

## Caso 4: sessão expirada
- **Preparação:** sessão de teste criada; no console D1 foi executado `UPDATE sessions SET expires_at = 0;`.
- **Pedido enviado:** página recarregada e GET /api/me.
- **Resultado esperado:** /api/me responde 401.
- **Resultado observado:** 401 `{"authenticated":false}`; a página voltou a exibir os botões de login.

## Caso 5: origem inválida na saída
- **Preparação:** console do navegador aberto em https://example.com.
- **Pedido enviado:** `fetch("https://projeto1-15s.pages.dev/oauth/logout", { method: "POST" })`.
- **Resultado esperado:** a rota recusa a operação.
- **Resultado observado:** 403 (Origin diferente de PUBLIC_BASE_URL).

## Caso 6: reutilização do cookie revogado
- **Preparação:** valor do cookie `__Host-session` copiado temporariamente pelas ferramentas de desenvolvimento; logout executado.
- **Pedido enviado:** cookie restaurado com o mesmo valor e GET /api/me.
- **Resultado esperado:** 401, pois a linha foi removida do D1.
- **Resultado observado:** 401 `{"authenticated":false}`; a cópia do valor foi apagada.

## Testes adicionais
- GET /oauth/login/facebook → 404 "Not found".
- GET /oauth/logout → 405 "Method Not Allowed".