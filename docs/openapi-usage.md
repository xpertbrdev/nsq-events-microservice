# Guia de Uso do OpenAPI

## 📄 Arquivo OpenAPI

O arquivo `openapi.json` está disponível na raiz do projeto e contém a especificação completa da API em formato OpenAPI 3.0.

## 🔧 Gerando Types com openapi-typescript

### 1. Instalação

```bash
npm install -D openapi-typescript
```

### 2. Gerar Types

```bash
# Gerar types a partir do arquivo local
npx openapi-typescript openapi.json -o ./types/api.ts

# Ou gerar a partir da API em execução
npx openapi-typescript http://localhost:3000/api-json -o ./types/api.ts
```

### 3. Usar Types no Código

```typescript
import type { paths, components } from './types/api';

// Type para request de criação de evento
type CreateEventRequest = components['schemas']['CreateEventDto'];

// Type para response de sessão
type SessionResponse = components['schemas']['SessionResponseDto'];

// Type para endpoint de adicionar evento
type AddEventEndpoint = paths['/events/sessions/{sessionId}/events']['post'];

// Exemplo de uso
const event: CreateEventRequest = {
  data: { produto: 'Notebook', quantidade: 5 },
  eventType: 'inserted',
  userId: 'user123',
  FilialIDDestino: '001',
  CNPJDestino: '12345678000190',
  FilialOrigem: '002',
  CNPJOrigem: '98765432000100',
};
```

## 🚀 Usando com openapi-fetch

### 1. Instalação

```bash
npm install openapi-fetch
npm install -D openapi-typescript
```

### 2. Gerar Types

```bash
npx openapi-typescript openapi.json -o ./types/api.ts
```

### 3. Criar Cliente

```typescript
import createClient from 'openapi-fetch';
import type { paths } from './types/api';

const client = createClient<paths>({ 
  baseUrl: 'http://localhost:3000' 
});

// Iniciar sessão
const { data, error } = await client.POST('/events/sessions/start', {
  body: {
    userId: 'user123',
  },
});

if (error) {
  console.error('Erro:', error);
} else {
  console.log('Session ID:', data.sessionId);
}

// Adicionar evento
await client.POST('/events/sessions/{sessionId}/events', {
  params: {
    path: {
      sessionId: data.sessionId,
    },
  },
  body: {
    data: { produto: 'Notebook' },
    eventType: 'inserted',
    userId: 'user123',
    FilialIDDestino: '001',
    CNPJDestino: '12345678000190',
    FilialOrigem: '002',
    CNPJOrigem: '98765432000100',
  },
});

// Commit
await client.POST('/events/sessions/{sessionId}/commit', {
  params: {
    path: {
      sessionId: data.sessionId,
    },
  },
});
```

## 🔄 Usando com openapi-typescript-codegen

### 1. Instalação

```bash
npm install -D openapi-typescript-codegen
```

### 2. Gerar Cliente

```bash
npx openapi-typescript-codegen --input openapi.json --output ./src/generated
```

### 3. Usar Cliente Gerado

```typescript
import { EventsService } from './generated/services/EventsService';

// Iniciar sessão
const session = await EventsService.startSession({
  userId: 'user123',
});

// Adicionar evento
await EventsService.addEvent(session.sessionId, {
  data: { produto: 'Notebook' },
  eventType: 'inserted',
  userId: 'user123',
  FilialIDDestino: '001',
  CNPJDestino: '12345678000190',
  FilialOrigem: '002',
  CNPJOrigem: '98765432000100',
});

// Commit
await EventsService.commitSession(session.sessionId);
```

## 📝 Métodos de Obtenção do OpenAPI

### Método 1: Arquivo Estático (Recomendado)

O arquivo `openapi.json` já está incluído no projeto.

```bash
# Copiar para seu projeto
cp openapi.json ../seu-projeto/
```

### Método 2: Gerar via Script

```bash
npm run generate:openapi
```

### Método 3: Endpoint da API

Quando a aplicação estiver rodando:

```bash
# Baixar via curl
curl http://localhost:3000/api-json > openapi.json

# Ou acessar no navegador
# http://localhost:3000/api-json
```

### Método 4: Swagger UI

Acessar http://localhost:3000/api e copiar o JSON da especificação.

## 🎯 Ferramentas Recomendadas

### openapi-typescript
- **Uso**: Gerar types TypeScript
- **Vantagem**: Types precisos e autocomplete
- **Instalação**: `npm install -D openapi-typescript`

### openapi-fetch
- **Uso**: Cliente HTTP type-safe
- **Vantagem**: Totalmente tipado, leve
- **Instalação**: `npm install openapi-fetch`

### openapi-typescript-codegen
- **Uso**: Gerar cliente completo
- **Vantagem**: Cliente pronto para uso
- **Instalação**: `npm install -D openapi-typescript-codegen`

### @hey-api/openapi-ts (antigo openapi-typescript-codegen)
- **Uso**: Alternativa moderna
- **Vantagem**: Mais features, melhor manutenção
- **Instalação**: `npm install -D @hey-api/openapi-ts`

## 📦 Exemplo Completo

```typescript
// 1. Instalar dependências
// npm install openapi-fetch
// npm install -D openapi-typescript

// 2. Gerar types
// npx openapi-typescript openapi.json -o ./types/api.ts

// 3. Criar cliente
import createClient from 'openapi-fetch';
import type { paths } from './types/api';

const api = createClient<paths>({ 
  baseUrl: 'http://localhost:3000' 
});

// 4. Usar com type safety completo
async function processarPedido() {
  // Iniciar sessão
  const { data: session } = await api.POST('/events/sessions/start', {
    body: { userId: 'user123' },
  });

  if (!session) return;

  // Adicionar eventos
  await api.POST('/events/sessions/{sessionId}/events', {
    params: { path: { sessionId: session.sessionId } },
    body: {
      data: { tipo: 'pedido', numero: 123 },
      eventType: 'inserted',
      userId: 'user123',
      FilialIDDestino: '001',
      CNPJDestino: '12345678000190',
      FilialOrigem: '002',
      CNPJOrigem: '98765432000100',
    },
  });

  // Commit
  await api.POST('/events/sessions/{sessionId}/commit', {
    params: { path: { sessionId: session.sessionId } },
  });

  console.log('Pedido processado com sucesso!');
}
```

## 🔍 Validação do OpenAPI

### Usando Swagger Editor

1. Acessar https://editor.swagger.io/
2. Colar o conteúdo de `openapi.json`
3. Verificar erros e warnings

### Usando CLI

```bash
# Instalar validator
npm install -g @apidevtools/swagger-cli

# Validar
swagger-cli validate openapi.json
```

## 📚 Recursos Adicionais

- [OpenAPI Specification](https://swagger.io/specification/)
- [openapi-typescript](https://github.com/drwpow/openapi-typescript)
- [openapi-fetch](https://github.com/drwpow/openapi-typescript/tree/main/packages/openapi-fetch)
- [Swagger Editor](https://editor.swagger.io/)

