# Events Module - NestJS v2.0

Módulo de gerenciamento de eventos com sessões transacionais, integração com NSQ e tópicos dinâmicos.

## 🎯 Principais Mudanças v2.0

### Nova Estrutura de Eventos

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

### Tópico NSQ Dinâmico

O tópico NSQ agora é gerado dinamicamente no formato:

```
ambiente-matrizId-matrizCNPJ-sender
```

Exemplo: `production-001-12345678000190-erp`

## 📚 API Endpoints

### Iniciar Sessão

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

### Adicionar Evento

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

### Commit (Finalizar Sessão)

```http
POST /events/sessions/{sessionId}/commit
```

Publica todos os eventos no tópico NSQ definido na sessão.

### Rollback (Cancelar Sessão)

```http
POST /events/sessions/{sessionId}/rollback
```

### Status da Sessão

```http
GET /events/sessions/{sessionId}/status
```

### Listar Eventos da Sessão

```http
GET /events/sessions/{sessionId}/events
```

### Health Checks

```http
GET /health          # Health check geral (Redis + NSQ)
GET /health/nsq      # Health check NSQ (Writer e Reader)
GET /health/redis    # Health check Redis
```

### OpenAPI

```http
GET /api-json        # Retorna especificação OpenAPI 3.0
```

## 🔄 Fluxo Completo

```typescript
// 1. Iniciar sessão
const session = await fetch('/events/sessions/start', {
  method: 'POST',
  body: JSON.stringify({
    filialId: '001',
    filialCNPJ: '12345678000190',
    ambiente: 'production',
    sender: 'erp'
  })
});

const { sessionId } = await session.json();
// Topic criado: production-001-12345678000190-erp

// 2. Adicionar eventos
await fetch(`/events/sessions/${sessionId}/events`, {
  method: 'POST',
  body: JSON.stringify({
    data: { produto: 'Notebook', quantidade: 5 },
    method: 'create',
    className: 'Produto',
    unico: 'PROD-001',
    filialId: 1,
    filialCnpj: '12345678000190'
  })
});

await fetch(`/events/sessions/${sessionId}/events`, {
  method: 'POST',
  body: JSON.stringify({
    data: { produto: 'Mouse', quantidade: 10 },
    method: 'create',
    className: 'Produto',
    unico: 'PROD-002',
    filialId: 1,
    filialCnpj: '12345678000190'
  })
});

// 3. Commit - publica no NSQ topic: production-001-12345678000190-erp
await fetch(`/events/sessions/${sessionId}/commit`, {
  method: 'POST'
});
```

## 🏗️ Estrutura de Dados no NSQ

Cada mensagem publicada no NSQ terá o seguinte formato:

```json
{
  "timestamp": "2025-10-20T12:00:00.000Z",
  "messageId": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "data": {
      "produto": "Notebook",
      "quantidade": 5
    },
    "method": "create",
    "className": "Produto",
    "unico": "PROD-001",
    "filialId": 1,
    "filialCnpj": "12345678000190"
  }
}
```

## 🔌 Configuração

```env
# Application
NODE_ENV=development
PORT=3000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# NSQ
NSQD_TCP_ADDR=localhost:4150
NSQLOOKUPD_HTTP_ADDR=localhost:4161
NSQ_TOPIC=events  # Tópico padrão (fallback)
NSQ_CHANNEL=events_channel

# Contingency
CONTINGENCY_FILE_PATH=./contingency-log.jsonl
```

## 🚀 Executar

```bash
# Instalar dependências
npm install

# Iniciar infraestrutura (Redis + NSQ)
cd docker
docker-compose up -d

# Copiar configuração
cp config/.env.example config/.env

# Executar em desenvolvimento
npm run start:dev
```

Endpoints disponíveis:
- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api`
- OpenAPI JSON: `http://localhost:3000/api-json`
- Health Check: `http://localhost:3000/health`

## 📊 Exemplo de Uso Completo

```typescript
import axios from 'axios';

const API_URL = 'http://localhost:3000';

async function processarPedido() {
  // 1. Verificar saúde da API
  const health = await axios.get(`${API_URL}/health`);
  console.log('API Health:', health.data);

  // 2. Iniciar sessão
  const { data: session } = await axios.post(`${API_URL}/events/sessions/start`, {
    filialId: '001',
    filialCNPJ: '12345678000190',
    ambiente: 'production',
    sender: 'pdv'
  });

  console.log('Sessão criada:', session.sessionId);
  console.log('Tópico NSQ:', 'production-001-12345678000190-pdv');

  try {
    // 3. Adicionar evento de criação de pedido
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

    // 4. Adicionar evento de item do pedido
    await axios.post(`${API_URL}/events/sessions/${session.sessionId}/events`, {
      data: {
        pedidoId: 'PED-001',
        produto: 'Produto A',
        quantidade: 2,
        preco: 75.00
      },
      method: 'create',
      className: 'ItemPedido',
      unico: 'ITEM-001',
      filialId: 1,
      filialCnpj: '12345678000190'
    });

    // 5. Commit - publica todos os eventos
    await axios.post(`${API_URL}/events/sessions/${session.sessionId}/commit`);
    
    console.log('Pedido processado com sucesso!');
  } catch (error) {
    // 6. Em caso de erro, fazer rollback
    await axios.post(`${API_URL}/events/sessions/${session.sessionId}/rollback`);
    console.error('Erro ao processar pedido:', error);
  }
}

processarPedido();
```

## 🔍 Diferenças da v1.0

| Aspecto | v1.0 | v2.0 |
|---------|------|------|
| **Tópico NSQ** | Fixo (configuração) | Dinâmico por sessão |
| **Estrutura IEvent** | Flat (eventType, userId, data) | Nested (messageId, timestamp, IEventData) |
| **StartSession** | userId + filialId + filialCNPJ + ambiente + sender | filialId + filialCNPJ + ambiente + sender |
| **CreateEvent** | eventType, userId, FilialIDDestino, etc | method, className, unico, filialId, filialCnpj |
| **messageId** | Não existia | UUID gerado automaticamente |
| **Health Checks** | Não existia | Endpoints /health, /health/nsq, /health/redis |
| **OpenAPI JSON** | Arquivo estático | Endpoint /api-json |

## 📄 Licença

MIT

