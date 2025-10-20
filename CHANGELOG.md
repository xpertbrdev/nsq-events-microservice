# Changelog

## [1.1.0] - 2025-10-20

### Changed
- **BREAKING**: Substituída implementação de NSQ via `@nestjs/microservices` por Writer/Reader nativo do `nsqjs`
- Removida dependência `nest-nsq-transport`
- Removida dependência `@nestjs/microservices`

### Added
- Novo módulo `NsqModule` com `NsqService` e `NsqConsumer`
- `NsqService` usa Writer nativo para publicação de mensagens
- `NsqConsumer` usa Reader nativo para consumo de mensagens
- Suporte a `NSQ_CHANNEL` na configuração
- Método `publishBatch` no `NsqService` para publicação em lote

### Improved
- Melhor controle sobre conexões NSQ
- Logs mais detalhados com contexto
- Tratamento de erros aprimorado na publicação

## [1.0.0] - 2025-10-20

### Added
- Implementação inicial do módulo de eventos
- Sessões transacionais com controle explícito (start, commit, rollback)
- Integração com NSQ para mensageria
- Sistema de contingência para falhas no Redis
- Arquitetura CQRS (Commands e Queries)
- Métricas completas (totalEvents, successRate, averageDuration, etc)
- Documentação completa (Swagger + Markdown)
- Docker Compose para ambiente de desenvolvimento
- OpenAPI 3.0 spec para geração de types TypeScript

