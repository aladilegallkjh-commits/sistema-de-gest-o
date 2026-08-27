# Project TODO

- [x] Definir modelo de dados integrado para clientes, propostas, projetos, ordens, checklists, estoque, requisições, fornecedores, custos, pós-venda e auditoria
- [x] Implementar autenticação e controle de acesso por papel: Administrador, Gestor, Comercial, Produção, Compras/Estoque e Pós-venda
- [x] Restringir navegação e ações conforme o papel do usuário
- [x] Implementar dashboard Central de Atenção como ponto de entrada após login
- [x] Implementar cadastro e gestão de clientes
- [x] Implementar propostas personalizadas com itens, condições, versionamento, envio, aprovação e conversão em projeto
- [x] Implementar projetos derivados de propostas aprovadas
- [x] Implementar ordens de produção com responsáveis, prioridade, prazo, status, anexos e histórico
- [x] Implementar modelos e execução de checklists com evidências e conclusão vinculada à OP
- [x] Implementar estoque com entradas, saídas, reservas, estoque mínimo, movimentações e alertas
- [x] Implementar requisições internas de materiais com aprovação e vínculo ao projeto/OP
- [x] Implementar cadastro de fornecedores, categorias, condições, histórico e entregas pendentes
- [x] Implementar controle de custos previsto x realizado, margem e alertas de desvio
- [x] Implementar módulo de pós-venda com satisfação, pendências, oportunidades e histórico
- [x] Implementar régua de comunicação por etapa do ciclo
- [x] Implementar relatórios gerenciais com gráficos e exportação
- [x] Implementar layout sofisticado, responsivo e acessível para desktop, tablet e celular
- [x] Criar testes Vitest para regras, procedures e fluxos principais
- [x] Validar visualmente as telas e corrigir problemas de usabilidade
- [x] Revisar todo o todo.md e criar checkpoint final do projeto

## Pendências identificadas na revisão de completude

- [x] Implementar RBAC completo no frontend e backend, com navegação e ações condicionadas por papel em todos os módulos
- [x] Construir CRUDs e telas reais para clientes, propostas, projetos, OPs, checklists, estoque, requisições, fornecedores, custos e pós-venda
- [x] Implementar fluxos integrados reais: proposta → projeto → OP → checklist → custos → pós-venda, incluindo aprovação, histórico e anexos/evidências
- [x] Substituir dados demonstrativos por consultas reais e implementar exportação funcional dos relatórios
- [x] Adicionar testes Vitest cobrindo procedures e fluxos principais de cada módulo
