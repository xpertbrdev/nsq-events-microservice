# Postman Collection - Events Module API

Esta pasta contém a collection e environments do Postman para testar a API do Events Module.

## 📦 Arquivos

- **Events-Module-API.postman_collection.json** - Collection completa com todos os endpoints
- **Events-Module-Local.postman_environment.json** - Environment para desenvolvimento local
- **Events-Module-Production.postman_environment.json** - Environment para produção

## 🚀 Como Usar

### 1. Importar no Postman

1. Abra o Postman
2. Clique em **Import**
3. Selecione os 3 arquivos JSON desta pasta
4. Clique em **Import**

### 2. Selecionar Environment

No canto superior direito do Postman, selecione o environment:
- **Events Module - Local** para testes locais
- **Events Module - Production** para produção

### 3. Testar a API

#### Fluxo Básico:

1. **Start Session**
   - Execute o endpoint `Sessions > Start Session`
   - O `sessionId` será **automaticamente salvo** no environment
   - Verifique no console do Postman: "Session ID saved: xxx"

2. **Add Event**
   - Execute `Sessions > Add Event`
   - O endpoint usa automaticamente o `{{sessionId}}` do environment

3. **Commit**
   - Execute `Sessions > Commit Session`
   - Publica todos os eventos no NSQ

#### Fluxos Completos:

A collection inclui 2 exemplos completos na pasta **Examples**:

1. **Complete Flow - Create Product**
   - Criar sessão
   - Adicionar evento de produto
   - Verificar status
   - Fazer commit

2. **Complete Flow - Create Order**
   - Criar sessão
   - Adicionar evento de pedido
   - Adicionar evento de item do pedido
   - Listar eventos
   - Fazer commit

## 🔧 Variáveis de Environment

### Local Environment

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `baseUrl` | `http://localhost:3000` | URL base da API local |
| `sessionId` | (auto) | ID da sessão (salvo automaticamente) |

### Production Environment

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `baseUrl` | `https://api.example.com` | URL base da API de produção |
| `sessionId` | (auto) | ID da sessão (salvo automaticamente) |

## 📝 Scripts Automáticos

### Post-Response Script no Start Session

```javascript
// Salvar sessionId no environment
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set('sessionId', response.sessionId);
    console.log('Session ID saved:', response.sessionId);
}
```

Este script é executado automaticamente após criar uma sessão e salva o `sessionId` no environment.

## 📚 Endpoints Disponíveis

### Sessions

- `POST /events/sessions/start` - Iniciar sessão
- `POST /events/sessions/{{sessionId}}/events` - Adicionar evento
- `POST /events/sessions/{{sessionId}}/commit` - Commit
- `POST /events/sessions/{{sessionId}}/rollback` - Rollback
- `GET /events/sessions/{{sessionId}}/status` - Status
- `GET /events/sessions/{{sessionId}}/events` - Listar eventos

### Metrics

- `GET /metrics` - Obter métricas

### Health

- `GET /health` - Health check geral
- `GET /health/nsq` - Health check NSQ
- `GET /health/redis` - Health check Redis

### OpenAPI

- `GET /api-json` - Obter OpenAPI JSON

## 🎯 Exemplos de Payloads

### Start Session

```json
{
  "filialId": "001",
  "filialCNPJ": "12345678000190",
  "ambiente": "production",
  "sender": "erp"
}
```

### Add Event

```json
{
  "data": {
    "produto": "Notebook Dell",
    "quantidade": 5,
    "preco": 3500.00
  },
  "method": "create",
  "className": "Produto",
  "unico": "PROD-001",
  "filialId": 1,
  "filialCnpj": "12345678000190"
}
```

## 🔍 Dicas

1. **Console do Postman**: Abra o console (View > Show Postman Console) para ver os logs dos scripts

2. **Variáveis**: Use `{{variavel}}` para referenciar variáveis do environment

3. **Ordem de Execução**: Para testar o fluxo completo, execute os endpoints na ordem:
   - Start Session
   - Add Event (quantas vezes necessário)
   - Commit

4. **Runner**: Use o Collection Runner do Postman para executar fluxos completos automaticamente

5. **Testes**: Adicione testes nos scripts para validar respostas automaticamente

## 📄 Licença

MIT

