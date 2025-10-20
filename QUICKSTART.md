# 🚀 Guia Rápido de Início

## ⚡ Início Rápido (5 minutos)

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Ambiente

```bash
cp config/.env.example config/.env
```

### 3. Iniciar Infraestrutura (Redis + NSQ)

```bash
cd docker
docker-compose up -d
cd ..
```

### 4. Executar Aplicação

```bash
npm run start:dev
```

### 5. Testar API

Acesse o Swagger: **http://localhost:3000/api**

## 📝 Exemplo de Uso

### 1. Iniciar Sessão

```bash
curl -X POST http://localhost:3000/events/sessions/start \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123"}'
```

**Resposta:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Session started successfully"
}
```

### 2. Adicionar Evento

```bash
curl -X POST http://localhost:3000/events/sessions/{sessionId}/events \
  -H "Content-Type: application/json" \
  -d '{
    "data": {"produto": "Notebook", "quantidade": 5},
    "eventType": "inserted",
    "userId": "user123",
    "FilialIDDestino": "001",
    "CNPJDestino": "12345678000190",
    "FilialOrigem": "002",
    "CNPJOrigem": "98765432000100"
  }'
```

### 3. Commit (Processar)

```bash
curl -X POST http://localhost:3000/events/sessions/{sessionId}/commit
```

### 4. Verificar Métricas

```bash
curl http://localhost:3000/metrics
```

## 🔍 Verificar Serviços

### Redis
```bash
docker exec -it events-redis redis-cli ping
# Resposta: PONG
```

### NSQ Admin
Acesse: **http://localhost:4171**

### Logs da Aplicação
```bash
# Se usando npm run start:dev
# Os logs aparecem no terminal

# Se usando PM2
pm2 logs events-module
```

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run start:dev

# Build
npm run build

# Testes
npm run test

# Lint
npm run lint

# Format
npm run format
```

## 📦 Estrutura de Pastas

```
events-module/
├── src/
│   ├── events/           # Módulo principal
│   │   ├── commands/     # Comandos CQRS
│   │   ├── queries/      # Queries CQRS
│   │   ├── services/     # Serviços
│   │   ├── repositories/ # Repositórios
│   │   └── controllers/  # Controllers
│   └── main.ts
├── config/
│   └── .env.example
├── docker/
│   └── docker-compose.yml
└── docs/
    ├── architecture.md
    └── deployment.md
```

## 🐛 Troubleshooting

### Redis não conecta
```bash
# Verificar se o container está rodando
docker ps | grep redis

# Reiniciar Redis
docker-compose restart redis
```

### NSQ não publica
```bash
# Verificar nsqd
curl http://localhost:4151/stats

# Reiniciar NSQ
docker-compose restart nsqd nsqlookupd
```

### Porta 3000 em uso
```bash
# Mudar porta no .env
PORT=3001
```

## 📚 Próximos Passos

1. Ler [README.md](./README.md) completo
2. Explorar [Arquitetura](./docs/architecture.md)
3. Consultar [Deployment](./docs/deployment.md)
4. Testar endpoints no Swagger
5. Implementar casos de uso específicos

## 💡 Dicas

- Use o Swagger para explorar a API interativamente
- Monitore o NSQ Admin para ver mensagens sendo publicadas
- Verifique o arquivo `contingency-log.jsonl` em caso de falhas
- Use `docker-compose logs -f` para ver logs em tempo real

## 🆘 Suporte

- Documentação: `./docs/`
- Issues: Criar issue no repositório
- Swagger: http://localhost:3000/api

