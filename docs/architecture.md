# Arquitetura do Módulo de Eventos

## Visão Geral

O módulo de eventos implementa um sistema de gerenciamento de eventos com sessões transacionais, utilizando o padrão CQRS (Command Query Responsibility Segregation) e integração com NSQ para mensageria.

## Componentes Principais

### 1. Controllers
- **EventsController**: Gerencia endpoints relacionados a sessões e eventos
- **MetricsController**: Fornece métricas do sistema

### 2. Services

#### ContingencyService
Responsável pelo sistema de contingência em caso de falha do Redis:
- Salva eventos em arquivo local (`contingency-log.jsonl`)
- Permite recuperação posterior dos eventos
- Não aborta transações em caso de falha

#### NsqPublisherService
Gerencia a publicação de eventos no NSQ:
- Publica eventos individuais ou em lote
- Aciona contingência em caso de falha
- Utiliza `nest-nsq-transport` para integração

#### MetricsService
Coleta e fornece métricas do sistema:
- Total de eventos processados
- Taxa de sucesso
- Duração média de processamento
- Eventos por minuto
- Falhas recentes

#### EventProcessorService
Processa sessões de eventos:
- Divide eventos em batches
- Coordena publicação no NSQ
- Registra métricas

#### EventSessionService
Gerencia o ciclo de vida das sessões:
- Criação de sessões
- Emissão de eventos de domínio

### 3. Repositories

#### EventSessionRepository
Gerencia persistência no Redis:
- Salva e recupera sessões
- Adiciona eventos às sessões
- Atualiza status das sessões
- Implementa sistema de contingência

### 4. CQRS

#### Commands
- **StartSessionCommand**: Inicia nova sessão
- **AddEventCommand**: Adiciona evento à sessão
- **CommitSessionCommand**: Finaliza e processa sessão
- **RollbackSessionCommand**: Cancela sessão

#### Queries
- **GetMetricsQuery**: Obtém métricas do sistema
- **GetSessionStatusQuery**: Obtém status de uma sessão
- **GetSessionEventsQuery**: Lista eventos de uma sessão

## Fluxo de Dados

### Fluxo de Criação de Sessão
```
Cliente → EventsController → StartSessionCommand → StartSessionHandler
    → EventSessionService → EventSessionRepository → Redis
    → MetricsService → Response
```

### Fluxo de Adição de Evento
```
Cliente → EventsController → AddEventCommand → AddEventHandler
    → EventSessionRepository → Redis (com contingência)
    → EventSessionService (emit event)
```

### Fluxo de Commit
```
Cliente → EventsController → CommitSessionCommand → CommitSessionHandler
    → EventSessionRepository (get events) → Redis
    → EventProcessorService → NsqPublisherService → NSQ
    → MetricsService → SessionStatus.COMMITTED
```

## Sistema de Contingência

### Quando Ativado
- Falha ao salvar sessão no Redis
- Falha ao adicionar evento no Redis
- Falha ao publicar no NSQ

### Comportamento
1. Evento/dados são salvos em `contingency-log.jsonl`
2. Log de warning é gerado
3. **Transação NÃO é abortada**
4. Processo continua normalmente

### Recuperação
Um processo separado pode:
1. Ler o arquivo de contingência
2. Reprocessar eventos
3. Limpar arquivo após sucesso

## Padrões de Design

### CQRS
Separação clara entre comandos (escrita) e queries (leitura):
- Commands modificam estado
- Queries apenas leem dados
- Handlers isolados e testáveis

### Repository Pattern
Abstração da camada de persistência:
- Isola lógica de acesso a dados
- Facilita testes com mocks
- Permite troca de implementação

### Event-Driven
Comunicação via eventos de domínio:
- Desacoplamento entre componentes
- Facilita extensibilidade
- Auditoria e rastreamento

## Tecnologias

### Redis
- Armazenamento de sessões (hash)
- Lista de eventos (list)
- TTL de 24 horas
- Pipeline para operações atômicas

### NSQ
- Mensageria distribuída
- Publicação via TCP
- Integração com NestJS Microservices

### Prometheus (futuro)
- Métricas exportadas
- Integração com Grafana
- Monitoramento em tempo real

## Segurança

### Validação
- DTOs com class-validator
- Validação automática via ValidationPipe
- Sanitização de entrada

### Isolamento
- Sessões isoladas por ID
- TTL automático no Redis
- Limpeza automática de dados antigos

## Escalabilidade

### Horizontal
- Stateless (estado no Redis)
- Múltiplas instâncias possíveis
- Load balancer compatível

### Vertical
- Batching de eventos
- Pipeline do Redis
- Processamento assíncrono

## Observabilidade

### Logs
- Estruturados com Winston
- Níveis: debug, info, warn, error
- Contexto de sessão

### Métricas
- Tempo de processamento
- Taxa de sucesso/falha
- Eventos por minuto
- Sessões ativas

### Rastreamento
- Eventos de domínio
- Histórico de sessões
- Auditoria de falhas

