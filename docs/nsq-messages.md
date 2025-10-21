# NSQ Messages Storage

Este documento descreve o sistema de armazenamento e consulta de mensagens consumidas do NSQ.

## 📋 Visão Geral

O sistema consome mensagens do NSQ automaticamente e as armazena no Redis para consulta posterior. Todas as mensagens recebidas são persistidas e podem ser listadas através de endpoints REST.

## 🔄 Fluxo de Funcionamento

```
NSQ Topic
   ↓
NsqConsumer (Reader)
   ↓
NsqMessageStorageService
   ↓
Redis (nsq:messages:*)
   ↓
GET /nsq/messages (API)
```

## 📊 Estrutura no Redis

### Mensagens Individuais

**Prefixo**: `nsq:messages:`

**Formato**: `nsq:messages:{messageId}`

**Tipo**: Hash

**TTL**: 7 dias

**Campos**:
```
id: string (UUID)
topic: string
channel: string
data: string (JSON)
receivedAt: ISO string
attempts: number
```

**Exemplo**:
```
nsq:messages:550e8400-e29b-41d4-a716-446655440000
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "topic": "production-001-12345678000190-erp",
  "channel": "events_channel",
  "data": "{\"timestamp\":\"...\",\"messageId\":\"...\",\"data\":{...}}",
  "receivedAt": "2025-10-20T16:00:00.000Z",
  "attempts": "1"
}
```

### Lista de Mensagens

**Chave**: `nsq:messages:list`

**Tipo**: Sorted Set

**Score**: Timestamp (milissegundos)

**Membros**: IDs das mensagens

**Limite**: Últimas 1000 mensagens

## 🚀 API Endpoints

### Listar Todas as Mensagens

```http
GET /nsq/messages?limit=100&offset=0
```

**Query Parameters**:
- `limit` (opcional): Número de mensagens a retornar (padrão: 100)
- `offset` (opcional): Offset para paginação (padrão: 0)

**Response**:
```json
{
  "messages": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "topic": "production-001-12345678000190-erp",
      "channel": "events_channel",
      "data": {
        "timestamp": "2025-10-20T16:00:00.000Z",
        "messageId": "abc-123",
        "data": {
          "data": { "produto": "Notebook" },
          "method": "create",
          "className": "Produto",
          "unico": "PROD-001",
          "filialId": 1,
          "filialCnpj": "12345678000190"
        }
      },
      "receivedAt": "2025-10-20T16:00:00.000Z",
      "attempts": 1
    }
  ],
  "total": 150,
  "limit": 100,
  "offset": 0
}
```

### Obter Mensagem por ID

```http
GET /nsq/messages/{messageId}
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "topic": "production-001-12345678000190-erp",
  "channel": "events_channel",
  "data": { ... },
  "receivedAt": "2025-10-20T16:00:00.000Z",
  "attempts": 1
}
```

### Deletar Mensagem

```http
DELETE /nsq/messages/{messageId}
```

**Response**:
```json
{
  "message": "Message deleted successfully"
}
```

### Limpar Todas as Mensagens

```http
DELETE /nsq/messages
```

**Response**:
```json
{
  "message": "All messages cleared successfully"
}
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
# NSQ
NSQD_TCP_ADDR=localhost:4150
NSQLOOKUPD_HTTP_ADDR=localhost:4161
NSQ_TOPIC=events
NSQ_CHANNEL=events_channel
```

### Parâmetros de Armazenamento

```typescript
MESSAGE_TTL = 60 * 60 * 24 * 7  // 7 dias
MAX_MESSAGES = 1000              // Últimas 1000 mensagens
```

## 📈 Características

### Armazenamento Automático

- ✅ Todas as mensagens consumidas são automaticamente armazenadas
- ✅ UUID único gerado para cada mensagem
- ✅ Timestamp de recebimento registrado
- ✅ Número de tentativas de processamento salvo

### Paginação

- ✅ Suporte a `limit` e `offset`
- ✅ Mensagens ordenadas por timestamp (mais recentes primeiro)
- ✅ Total de mensagens retornado na resposta

### Limpeza Automática

- ✅ TTL de 7 dias para cada mensagem
- ✅ Mantém apenas últimas 1000 mensagens
- ✅ Remoção automática de mensagens antigas

### Consulta Eficiente

- ✅ Sorted Set para ordenação rápida
- ✅ Hash para armazenamento estruturado
- ✅ Busca por ID em O(1)

## 🔍 Consultas Redis

### Listar todas as mensagens

```bash
redis-cli ZREVRANGE "nsq:messages:list" 0 -1
```

### Contar mensagens

```bash
redis-cli ZCARD "nsq:messages:list"
```

### Ver detalhes de uma mensagem

```bash
redis-cli HGETALL "nsq:messages:{messageId}"
```

### Limpar todas as mensagens

```bash
redis-cli DEL "nsq:messages:list"
redis-cli KEYS "nsq:messages:*" | xargs redis-cli DEL
```

## 📊 Exemplo de Uso

### 1. Publicar Evento (via API)

```bash
# Criar sessão
curl -X POST http://localhost:3000/events/sessions/start \
  -H "Content-Type: application/json" \
  -d '{
    "filialId": "001",
    "filialCNPJ": "12345678000190",
    "ambiente": "production",
    "sender": "erp"
  }'

# Adicionar evento
curl -X POST http://localhost:3000/events/sessions/{sessionId}/events \
  -H "Content-Type: application/json" \
  -d '{
    "data": { "produto": "Notebook" },
    "method": "create",
    "className": "Produto",
    "unico": "PROD-001",
    "filialId": 1,
    "filialCnpj": "12345678000190"
  }'

# Commit (publica no NSQ)
curl -X POST http://localhost:3000/events/sessions/{sessionId}/commit
```

### 2. Consumir e Armazenar (Automático)

O `NsqConsumer` consome automaticamente e armazena no Redis.

### 3. Listar Mensagens

```bash
# Listar últimas 10 mensagens
curl http://localhost:3000/nsq/messages?limit=10

# Listar com paginação
curl http://localhost:3000/nsq/messages?limit=20&offset=20

# Obter mensagem específica
curl http://localhost:3000/nsq/messages/{messageId}
```

## 🛡️ Tratamento de Erros

### Falha ao Armazenar

Se houver erro ao salvar no Redis, a mensagem é logada mas **não é reenfileirada** no NSQ (para evitar loops infinitos).

### Mensagem Não Encontrada

Retorna `404` ao buscar mensagem que não existe.

### Erro de Parsing

Se a mensagem NSQ não for JSON válido, ela é **reenfileirada** com delay de 1 segundo.

## 📄 Swagger Documentation

Todos os endpoints estão documentados no Swagger:

```
http://localhost:3000/api
```

Tag: **NSQ Messages**

## 🎯 Casos de Uso

### Auditoria

Consultar todas as mensagens processadas para auditoria.

### Debug

Verificar conteúdo de mensagens específicas para debug.

### Reprocessamento

Consultar mensagens para reprocessamento manual.

### Monitoramento

Verificar quantidade de mensagens processadas.

## 📄 Licença

MIT

