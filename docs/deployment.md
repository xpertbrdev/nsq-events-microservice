# Guia de Deployment

## Pré-requisitos

- Node.js 18.x ou 20.x LTS
- Redis 7.x
- NSQ (nsqd, nsqlookupd)
- Docker e Docker Compose (opcional)

## Ambiente de Desenvolvimento

### 1. Instalação

```bash
# Clonar repositório
git clone <repo-url>
cd events-module

# Instalar dependências
npm install

# Configurar ambiente
cp config/.env.example config/.env
```

### 2. Iniciar Infraestrutura

```bash
# Usando Docker Compose
cd docker
docker-compose up -d

# Verificar serviços
docker-compose ps
```

### 3. Executar Aplicação

```bash
# Modo desenvolvimento
npm run start:dev

# Acessar
# API: http://localhost:3000
# Swagger: http://localhost:3000/api
# NSQ Admin: http://localhost:4171
```

## Ambiente de Produção

### 1. Build

```bash
# Compilar TypeScript
npm run build

# Verificar dist/
ls -la dist/
```

### 2. Variáveis de Ambiente

Criar arquivo `.env` em produção:

```env
NODE_ENV=production
PORT=3000

# Redis (usar Redis gerenciado em produção)
REDIS_HOST=redis.production.com
REDIS_PORT=6379
REDIS_PASSWORD=<senha-segura>
REDIS_DB=0

# NSQ (cluster NSQ em produção)
NSQD_TCP_ADDR=nsqd.production.com:4150
NSQLOOKUPD_HTTP_ADDR=nsqlookupd.production.com:4161
NSQ_TOPIC=events

# Contingency
CONTINGENCY_FILE_PATH=/var/log/events/contingency-log.jsonl

# Metrics
METRICS_ENABLED=true
METRICS_PORT=9090
```

### 3. Executar

```bash
# Diretamente
npm run start:prod

# Com PM2
pm2 start dist/main.js --name events-module

# Com systemd
sudo systemctl start events-module
```

## Docker

### Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3000

CMD ["node", "dist/main"]
```

### Build e Run

```bash
# Build
docker build -t events-module:latest .

# Run
docker run -d \
  --name events-module \
  -p 3000:3000 \
  --env-file .env \
  events-module:latest
```

## Kubernetes

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: events-module
spec:
  replicas: 3
  selector:
    matchLabels:
      app: events-module
  template:
    metadata:
      labels:
        app: events-module
    spec:
      containers:
      - name: events-module
        image: events-module:latest
        ports:
        - containerPort: 3000
        env:
        - name: REDIS_HOST
          valueFrom:
            configMapKeyRef:
              name: events-config
              key: redis-host
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: events-secrets
              key: redis-password
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: events-module
spec:
  selector:
    app: events-module
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## Monitoramento

### Health Check

Adicionar endpoint de health check:

```typescript
// src/health/health.controller.ts
@Get('health')
check() {
  return { status: 'ok', timestamp: new Date() };
}
```

### Prometheus Metrics

Expor métricas no formato Prometheus:

```bash
# Acessar métricas
curl http://localhost:9090/metrics
```

### Logs

Configurar agregação de logs:

```bash
# Filebeat, Fluentd, ou similar
# Enviar para Elasticsearch/Loki
```

## Backup e Recuperação

### Redis

```bash
# Backup manual
redis-cli --rdb /backup/dump.rdb

# Backup automático (redis.conf)
save 900 1
save 300 10
save 60 10000
```

### Contingency File

```bash
# Backup do arquivo de contingência
cp contingency-log.jsonl /backup/contingency-$(date +%Y%m%d).jsonl

# Rotação de logs
logrotate /etc/logrotate.d/events-contingency
```

## Troubleshooting

### Redis Não Conecta

```bash
# Verificar conexão
redis-cli -h <host> -p <port> ping

# Verificar logs
docker logs events-redis
```

### NSQ Não Publica

```bash
# Verificar nsqd
curl http://localhost:4151/stats

# Verificar nsqlookupd
curl http://localhost:4161/lookup?topic=events
```

### Alta Latência

```bash
# Verificar métricas
curl http://localhost:3000/metrics

# Analisar logs
pm2 logs events-module
```

## Segurança

### Secrets Management

```bash
# Usar AWS Secrets Manager, HashiCorp Vault, etc.
# Nunca commitar .env

# Exemplo com AWS
aws secretsmanager get-secret-value --secret-id events-module/redis
```

### Network Policies

```yaml
# Kubernetes NetworkPolicy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: events-module-policy
spec:
  podSelector:
    matchLabels:
      app: events-module
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api-gateway
    ports:
    - protocol: TCP
      port: 3000
```

## Performance

### Otimizações

1. **Redis Connection Pool**
   - Configurar pool de conexões
   - Usar pipeline para operações em lote

2. **NSQ Batching**
   - Processar eventos em batches
   - Configurar buffer size

3. **Caching**
   - Cache de sessões ativas
   - TTL apropriado

4. **Horizontal Scaling**
   - Múltiplas instâncias
   - Load balancer (Nginx, ALB)

## Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Redis acessível e configurado
- [ ] NSQ cluster operacional
- [ ] Build executado com sucesso
- [ ] Testes passando
- [ ] Health checks configurados
- [ ] Monitoramento ativo
- [ ] Logs agregados
- [ ] Backup configurado
- [ ] Secrets seguros
- [ ] Documentação atualizada

