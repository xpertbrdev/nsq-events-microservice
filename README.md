# Events Module - NestJS

Módulo de gerenciamento de eventos com sessões transacionais, integração com NSQ e sistema de contingência para Redis.

## 📋 Características

- **Sessões Transacionais**: Controle explícito de início, commit e rollback
- **Integração NSQ**: Publicação de eventos via NSQ com Writer/Reader nativo
- **Sistema de Contingência**: Fallback para arquivo local em caso de falha do Redis
- **Métricas**: Monitoramento completo com Prometheus
- **CQRS**: Arquitetura baseada em comandos e queries
- **Swagger**: Documentação automática da API

## 🚀 Tecnologias

- NestJS 10.x
- Redis (ioredis)
- NSQ (nsqjs - Writer/Reader nativo)
- TypeScript
- CQRS
- Swagger/OpenAPI

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp config/.env.example config/.env
```

## 🔧 Configuração

Edite o arquivo `config/.env`:

```env
# Application
NODE_ENV=development
PORT=3000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# NSQ
NSQD_TCP_ADDR=localhost:4150
NSQLOOKUPD_HTTP_ADDR=localhost:4161
NSQ_TOPIC=events
NSQ_CHANNEL=events_channel

# Contingency
CONTINGENCY_FILE_PATH=./contingency-log.jsonl
```

## 🐳 Docker

Iniciar serviços de infraestrutura (Redis e NSQ):

```bash
cd docker
docker-compose up -d
```

Serviços disponíveis:
- Redis: `localhost:6379`
- NSQ (nsqd): `localhost:4150` (TCP) e `localhost:4151` (HTTP)
- NSQ Admin: `http://localhost:4171`

## 🏃 Executar

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

A aplicação estará disponível em:
- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api`

## 📚 API Endpoints

### Sessões

#### Iniciar Sessão
```http
POST /events/sessions/start
Content-Type: application/json

{
  "userId": "user123"
}
```

#### Adicionar Evento
```http
POST /events/sessions/{sessionId}/events
Content-Type: application/json

{
  "data": { "any": "data" },
  "eventType": "inserted",
  "userId": "user123",
  "FilialIDDestino": "001",
  "CNPJDestino": "12345678000190",
  "FilialOrigem": "002",
  "CNPJOrigem": "98765432000100"
}
```

#### Commit (Finalizar Sessão)
```http
POST /events/sessions/{sessionId}/commit
```

#### Rollback (Cancelar Sessão)
```http
POST /events/sessions/{sessionId}/rollback
```

#### Status da Sessão
```http
GET /events/sessions/{sessionId}/status
```

#### Listar Eventos da Sessão
```http
GET /events/sessions/{sessionId}/events
```

### Métricas

```http
GET /metrics
```

## 🏗️ Arquitetura

```
events-module/
├── src/
│   ├── nsq/                   # Módulo NSQ
│   │   ├── nsq.service.ts     # Writer NSQ
│   │   ├── nsq.consumer.ts    # Reader NSQ
│   │   └── nsq.module.ts
│   ├── events/
│   │   ├── commands/          # Comandos CQRS
│   │   ├── queries/           # Queries CQRS
│   │   ├── services/          # Lógica de negócio
│   │   ├── repositories/      # Acesso a dados
│   │   ├── controllers/       # Endpoints HTTP
│   │   ├── dto/               # Data Transfer Objects
│   │   ├── entities/          # Entidades
│   │   ├── enums/             # Enumerações
│   │   └── interfaces/        # Interfaces TypeScript
│   └── main.ts
└── docker/
    └── docker-compose.yml
```

## 🔄 Fluxo de Trabalho

1. **Iniciar Sessão**: Cliente inicia uma sessão transacional
2. **Adicionar Eventos**: Eventos são adicionados à sessão (armazenados no Redis)
3. **Commit**: Todos os eventos são publicados no NSQ via Writer
4. **Rollback** (opcional): Cancela a sessão e descarta eventos

## 🛡️ Sistema de Contingência

Em caso de falha ao salvar no Redis:
- Eventos são salvos em `contingency-log.jsonl`
- A transação **não é abortada**
- Um processo de recuperação pode reprocessar os eventos posteriormente

## 📊 Métricas Disponíveis

- `totalEvents`: Total de eventos processados
- `successRate`: Taxa de sucesso (%)
- `averageDuration`: Duração média de processamento (ms)
- `eventsPerMinute`: Eventos por minuto
- `deadLetterCount`: Quantidade de falhas
- `recentFailures`: Últimas 10 falhas

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Cobertura
npm run test:cov
```

## 📝 Integração com Projeto Existente

Para integrar este módulo em um projeto NestJS existente:

1. Copie as pastas `src/nsq` e `src/events` para seu projeto
2. Importe os módulos no seu `AppModule`:

```typescript
import { NsqModule } from './nsq/nsq.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    // ... outros módulos
    NsqModule,
    EventsModule,
  ],
})
export class AppModule {}
```

3. Configure as variáveis de ambiente no seu `.env`

## 🔌 NSQ Integration

### Writer (Publicação)

O `NsqService` usa o Writer nativo do `nsqjs` para publicar mensagens:

```typescript
import { NsqService } from './nsq/nsq.service';

// Publicar mensagem única
await nsqService.publish('events', { data: 'exemplo' });

// Publicar em lote
await nsqService.publishBatch('events', [
  { data: 'evento1' },
  { data: 'evento2' },
]);
```

### Consumer (Consumo)

O `NsqConsumer` usa o Reader nativo do `nsqjs` para consumir mensagens:

- Conecta automaticamente ao nsqlookupd
- Processa mensagens do tópico configurado
- Confirma (finish) ou reenfileira (requeue) mensagens

## 📄 Licença

MIT

