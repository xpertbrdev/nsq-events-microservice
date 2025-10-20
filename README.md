# Events Module - NestJS v2.0

Módulo de gerenciamento de eventos com sessões transacionais, integração com NSQ e tópicos dinâmicos.

## 📋 Características

- **Sessões Transacionais**: Controle explícito de início, commit e rollback
- **Tópicos NSQ Dinâmicos**: Gerados automaticamente no formato `ambiente-matrizId-matrizCNPJ-sender`
- **Integração NSQ**: Publicação de eventos via NSQ com Writer/Reader nativo
- **Sistema de Contingência**: Fallback para arquivo local em caso de falha do Redis
- **Métricas**: Monitoramento completo com Prometheus
- **CQRS**: Arquitetura baseada em comandos e queries
- **Swagger**: Documentação automática da API
- **Health Checks**: Endpoints para verificar saúde da API, Redis e NSQ

## 🚀 Tecnologias

- NestJS 10.x
- Redis (ioredis)
- NSQ (nsqjs - Writer/Reader nativo)
- TypeScript
- CQRS
- Swagger/OpenAPI
- Terminus (Health Checks)

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
- OpenAPI JSON: `http://localhost:3000/api-json`
- Health Check: `http://localhost:3000/health`

## 📚 API Endpoints

### Sessões

#### Iniciar Sessão
```http
POST /events/sessions/start
Content-Type: application/json

{
  "filialId": "001",
  "filialCNPJ": "12345678000190",
  "ambiente": "production",
  "sender": "erp"
}
```

**Response:**
```json
{
  "sessionId": "uuid-da-sessao",
  "message": "Session started successfully with topic: production-001-12345678000190-erp"
}
```

#### Adicionar Evento
```http
POST /events/sessions/{sessionId}/events
Content-Type: application/json

{
  "data": {
    "produto": "Notebook",
    "quantidade": 5,
    "preco": 3500.00
  },
  "method": "create",
  "className": "Produto",
  "unico": "PROD-12345",
  "filialId": 1,
  "filialCnpj": "12345678000190"
}
```

#### Commit (Finalizar Sessão)
```http
POST /events/sessions/{sessionId}/commit
```

Publica todos os eventos no tópico NSQ definido na sessão.

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

### Health Checks

#### Health Check Geral
```http
GET /health
```

Verifica Redis e NSQ.

#### Health Check NSQ
```http
GET /health/nsq
```

Verifica conexão do Writer e Reader NSQ.

#### Health Check Redis
```http
GET /health/redis
```

Verifica conexão com Redis.

### OpenAPI

#### Obter OpenAPI JSON
```http
GET /api-json
```

Retorna a especificação OpenAPI 3.0 em formato JSON.

## 🏗️ Estrutura de Dados

### IEvent

```typescript
interface IEvent {
  timestamp: Date;
  messageId: string;  // UUID gerado automaticamente
  data: IEventData;
}

interface IEventData {
  data: any;          // Dados do evento
  method: string;     // Método/ação (ex: 'create', 'update', 'delete')
  className: string;  // Nome da classe/entidade
  unico: string;      // Identificador único do registro
  filialId: number;   // ID da filial
  filialCnpj: string; // CNPJ da filial
}
```

### Tópico NSQ

Formato: `ambiente-matrizId-matrizCNPJ-sender`

Exemplo: `production-001-12345678000190-erp`

## 🔄 Fluxo de Trabalho

1. **Iniciar Sessão**: Cliente inicia uma sessão transacional (define o tópico NSQ)
2. **Adicionar Eventos**: Eventos são adicionados à sessão (armazenados no Redis)
3. **Commit**: Todos os eventos são publicados no NSQ no tópico da sessão
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

1. Copie as pastas `src/nsq`, `src/events` e `src/health` para seu projeto
2. Importe os módulos no seu `AppModule`:

```typescript
import { EventsModule } from './events/events.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // ... outros módulos
    EventsModule,
    HealthModule,
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

## 📄 Exemplo Completo

```typescript
import axios from 'axios';

const API_URL = 'http://localhost:3000';

async function processarPedido() {
  // 1. Iniciar sessão
  const { data: session } = await axios.post(`${API_URL}/events/sessions/start`, {
    filialId: '001',
    filialCNPJ: '12345678000190',
    ambiente: 'production',
    sender: 'pdv'
  });

  console.log('Sessão criada:', session.sessionId);
  console.log('Tópico NSQ:', 'production-001-12345678000190-pdv');

  try {
    // 2. Adicionar evento de criação de pedido
    await axios.post(`${API_URL}/events/sessions/${session.sessionId}/events`, {
      data: {
        numeroPedido: 'PED-001',
        cliente: 'João Silva',
        total: 150.00
      },
      method: 'create',
      className: 'Pedido',
      unico: 'PED-001',
      filialId: 1,
      filialCnpj: '12345678000190'
    });

    // 3. Commit - publica todos os eventos
    await axios.post(`${API_URL}/events/sessions/${session.sessionId}/commit`);
    
    console.log('Pedido processado com sucesso!');
  } catch (error) {
    // 4. Em caso de erro, fazer rollback
    await axios.post(`${API_URL}/events/sessions/${session.sessionId}/rollback`);
    console.error('Erro ao processar pedido:', error);
  }
}

processarPedido();
```

## 📄 Licença

MIT

