# Testes de falha

| # | Teste | Como foi feito | Resultado esperado | Resultado obtido |
|---|---|---|---|---|
| 1 | Provedor inválido | GET /oauth/login/facebook | 404 | 404 "Not found" |
| 2 | Callback sem transação | GET /oauth/callback/google?code=falso&state=falso sem cookie | 400 | 400 "Parametros ausentes" |
| 3 | State alterado | Iniciou login GitHub e chamou o callback com state=alterado | 400 | 400 "State invalido" |
| 4 | Transação reutilizada | Repetiu o mesmo callback (F5) | 400 | 400 "Parametros ausentes" |
| 5 | Logout por GET | GET /oauth/logout | 405 | 405 "Method Not Allowed" |
| 6 | Logout de outra origem | POST vindo de https://example.com | 403 | 403 |