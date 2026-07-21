# Banco do diagnóstico

O questionário, as opções, as fórmulas, as recomendações e os entregáveis são fixos e ficam em `lib/diagnosticCatalog.js`. O PostgreSQL guarda somente dados produzidos pelos usuários e consultores.

## Banco novo

Execute `diagnostics.sql`. Ele cria seis tabelas operacionais e não insere nenhum registro.

## Banco com a estrutura anterior

Faça um backup e execute `diagnostics-to-fixed.sql` uma única vez. A migration:

- preserva submissões, respostas, avaliações, resultados e protocolos;
- troca as chaves numéricas de catálogo pelos códigos fixos de seção, pergunta e avaliação;
- remove as sete tabelas e os 118 registros do catálogo estático.

Os scripts não são executados automaticamente pela aplicação.
