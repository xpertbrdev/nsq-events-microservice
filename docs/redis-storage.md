# Redis Storage Structure

Este documento descreve a estrutura de armazenamento de sessões e eventos no Redis.

## 📊 Estrutura de Chaves

### Sessões Ativas (CURRENT)

**Prefixo**: `session:current:`

**Formato**: `session:current:{sessionId}`

**Tipo**: Hash

**TTL**: 24 horas

**Campos**:
```
id: string
status: SessionStatus (ACTIVE, PROCESSING)
createdAt: ISO string
eventCount: number
ambiente: string
matrizId: string
matrizCNPJ: string
sender: string
topic: string
```

**Exemplo**:
```
session:current:550e8400-e29b-41d4-a716-446655440000
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "ACTIVE",
  "createdAt": "2025-10-20T14:00:00.000Z",
  "eventCount": "5",
  "ambiente": "production",
  "matrizId": "001",
  "matrizCNPJ": "12345678000190",
  "sender": "erp",
  "topic": "production-001-12345678000190-erp"
}
```

### Sessões Finalizadas (COMMITTED)

**Prefixo**: `session:committed:`

**Formato**: `session:committed:{sessionId}`

**Tipo**: Hash

**TTL**: 7 dias

**Campos**: (mesmos de CURRENT) + `committedAt`
```
id: string
status: SessionStatus (COMMITTED, ROLLED_BACK, FAILED)
createdAt: ISO string
committedAt: ISO string  ← Novo campo
eventCount: number
ambiente: string
matrizId: string
matrizCNPJ: string
sender: string
topic: string
```

**Exemplo**:
```
session:committed:550e8400-e29b-41d4-a716-446655440000
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "COMMITTED",
  "createdAt": "2025-10-20T14:00:00.000Z",
  "committedAt": "2025-10-20T14:05:00.000Z",
  "eventCount": "5",
  "ambiente": "production",
  "matrizId": "001",
  "matrizCNPJ": "12345678000190",
  "sender": "erp",
  "topic": "production-001-12345678000190-erp"
}
```

### Eventos

**Prefixo**: `events:`

**Formato**: `events:{sessionId}`

**Tipo**: List

**TTL**: 24 horas (renovado a cada adição de evento)

**Estrutura**:
```json
{
  "timestamp": "2025-10-20T14:00:00.000Z",
  "messageId": "uuid",
  "data": {
    "data": { ... },
    "method": "create",
    "className": "Produto",
    "unico": "PROD-001",
    "filialId": 1,
    "filialCnpj": "12345678000190"
  }
}
```

## 🔄 Ciclo de Vida de uma Sessão

### 1. Criação (Start Session)

```
POST /events/sessions/start
→ Cria: session:current:{sessionId}
→ Status: ACTIVE
→ TTL: 24h
```

### 2. Adição de Eventos

```
POST /events/sessions/{sessionId}/events
→ Adiciona em: events:{sessionId}
→ Incrementa eventCount em session:current:{sessionId}
→ Renova TTL de ambos
```

### 3. Commit

```
POST /events/sessions/{sessionId}/commit
→ Atualiza status: PROCESSING
→ Publica eventos no NSQ
→ Atualiza status: COMMITTED
→ Move de session:current: para session:committed:
→ Adiciona campo committedAt
→ Remove session:current:{sessionId}
→ TTL de session:committed: = 7 dias
```

### 4. Rollback

```
POST /events/sessions/{sessionId}/rollback
→ Atualiza status: ROLLED_BACK
→ Move de session:current: para session:committed:
→ Deleta events:{sessionId}
→ Mantém session:committed:{sessionId} para histórico
```

## 📈 Benefícios da Separação

### Performance

- **Consultas mais rápidas**: Sessões ativas separadas das finalizadas
- **Menos chaves**: CURRENT tem menos dados que COMMITTED
- **Scan eficiente**: Possível fazer SCAN apenas em CURRENT

### Organização

- **Clara separação**: Sessões ativas vs. histórico
- **TTL diferenciado**: 24h para ativas, 7 dias para histórico
- **Auditoria**: Histórico de todas as sessões finalizadas

### Escalabilidade

- **Limpeza automática**: TTL remove dados antigos
- **Espaço otimizado**: Sessões antigas expiram em 7 dias
- **Monitoramento**: Fácil contar sessões ativas vs. finalizadas

## 🔍 Consultas Úteis

### Listar todas as sessões ativas

```bash
redis-cli KEYS "session:current:*"
```

### Listar todas as sessões finalizadas

```bash
redis-cli KEYS "session:committed:*"
```

### Contar sessões ativas

```bash
redis-cli KEYS "session:current:*" | wc -l
```

### Ver detalhes de uma sessão

```bash
# Ativa
redis-cli HGETALL "session:current:{sessionId}"

# Finalizada
redis-cli HGETALL "session:committed:{sessionId}"
```

### Listar eventos de uma sessão

```bash
redis-cli LRANGE "events:{sessionId}" 0 -1
```

## 🛡️ Sistema de Contingência

Em caso de falha ao salvar no Redis, os dados são salvos em:

```
contingency-log.jsonl
```

Formato:
```json
{"type":"session","data":{...},"timestamp":"..."}
{"type":"event","sessionId":"...","data":{...},"timestamp":"..."}
{"type":"move_to_committed","sessionId":"...","timestamp":"..."}
```

## 📊 Métricas

### Chaves de Métricas

```
metrics:processing          - Sorted set com registros de processamento
metrics:active_sessions     - Contador de sessões ativas
failures:recent             - Sorted set com últimas 100 falhas
```

## 🔧 Configuração

### TTL

```typescript
SESSION_TTL = 60 * 60 * 24        // 24 horas (sessões ativas)
COMMITTED_TTL = 60 * 60 * 24 * 7  // 7 dias (sessões finalizadas)
```

### Prefixos

```typescript
SESSION_CURRENT_PREFIX = 'session:current:'
SESSION_COMMITTED_PREFIX = 'session:committed:'
EVENTS_PREFIX = 'events:'
```

## 📄 Licença

MIT

