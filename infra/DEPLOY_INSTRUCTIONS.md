# 🚀 DEPLOY INSTRUCTIONS - MINHACIDADE+ BACKEND COM HTTPS

## 📋 Problema Resolvido

O erro **"Mixed Content"** ocorria porque:
- Frontend estava em HTTPS (CloudFront) ✅
- Backend estava em HTTP (ALB) ❌
- Navegador bloqueava requisições HTTP de contexto HTTPS

## ✅ Solução Implementada

**CloudFront como proxy reverso HTTPS** para o ALB (HTTP interno):

```
[Frontend HTTPS] 
    ↓
[CloudFront HTTPS] ← Certificado SSL automático
    ↓
[ALB HTTP] ← Interno (sem HTTPS necessário)
    ↓
[ECS Fargate] → Backend Fastify
```

---

## 🔧 PASSO A PASSO DE DEPLOY

### 1️⃣ Configurar Variáveis do Pulumi

```bash
cd Backend/minhacidade-backend/infra

# Editar Pulumi.yaml com senhas seguras
nano Pulumi.yaml

# Atualizar:
# - aws-node-infra:dbPassword: "SenhaSegura123!@#"
# - aws-node-infra:jwtSecret: "seu-jwt-secret-aleatorio"
```

### 2️⃣ Deploy da Infraestrutura Backend

```bash
# Instalar dependências
pnpm install

# Preview das mudanças
pulumi preview

# Deploy completo (5-10 minutos)
pulumi up

# Copiar a URL do CloudFront quando terminado
```

**Output esperado:**
```
cloudFrontUrl: d1234abcd.cloudfront.net
albUrl: deploy-lb-xxxxx.us-east-1.elb.amazonaws.com (INTERNO)
databaseEndpoint: deploy-db.xxxxx.us-east-1.rds.amazonaws.com
databaseName: minhacidade_backend
```

### 3️⃣ Atualizar Variáveis do Frontend

No arquivo `Web/minha-cidade/.env`:

```bash
# Usar a URL HTTPS do CloudFront
NEXT_PUBLIC_BACKEND_URL=https://d1234abcd.cloudfront.net
NEXT_PUBLIC_API_URL=https://d1234abcd.cloudfront.net
GEMINI_API_KEY=sua-chave-gemini
```

### 4️⃣ Atualizar sst.config.ts (Opcional)

Se quiser hardcodear a URL no `sst.config.ts`:

```typescript
// Substitua a linha:
const fallbackProdUrl = "https://d1234abcd.cloudfront.net";
// Por sua URL real do Pulumi
```

### 5️⃣ Deploy do Frontend

```bash
cd Web/minha-cidade

# Com variáveis de ambiente configuradas
sst deploy

# Ou se usar SST v5+
sst deploy --stage production
```

---

## 🔍 VERIFICAÇÃO POS-DEPLOY

### ✅ Checklist

```bash
# 1. Verificar saúde do backend (via CloudFront HTTPS)
curl https://d1234abcd.cloudfront.net/health

# Resposta esperada:
# {"status":"healthy"}

# 2. Verificar banco de dados
curl https://d1234abcd.cloudfront.net/chamados | jq

# 3. Verificar frontend em HTTPS
curl https://seu-cloudfront-domain.cloudfront.net | grep "Next"

# 4. Verificar no navegador
# https://seu-cloudfront-domain.cloudfront.net
# → Abrir DevTools (F12)
# → Ir para Network
# → Fazer login
# → Verificar requisições para backend em HTTPS ✅
```

### 🔐 Segurança HTTPS

- ✅ CloudFront fornece certificado SSL **automaticamente**
- ✅ Domínio padrão: `https://d1234abcd.cloudfront.net`
- ✅ Sem Mixed Content (tudo HTTPS)
- ✅ ALB pode manter HTTP interno (CloudFront faz o proxy)

---

## 🛠️ TROUBLESHOOTING

### Erro: "Mixed Content"

**Causa:** Ainda usando URL HTTP do ALB no frontend

**Solução:**
```bash
# Verificar variável no frontend
echo $NEXT_PUBLIC_BACKEND_URL
# Deve ser: https://d1234abcd.cloudfront.net

# Se estiver http://, atualizar .env e rebuild
rm -rf .next
pnpm dev
```

### Erro: "CORS bloqueado"

**Verificar:** O backend deve ter CORS habilitado para CloudFront

No `Backend/minhacidade-backend/src/server.ts`:
```typescript
app.register(cors, { origin: '*' })  // ✅ Habilitado
```

### Backend responde lento via CloudFront

**Causa:** Primeira requisição pode ter latência (warmup do ECS)

**Solução:** Aguardar 30 segundos após deploy, depois testar novamente

### Certificado SSL não reconhecido

**Não há problema!** CloudFront auto-gera e renova certificados:
- Certificado é válido
- Renovação automática
- Sem custo adicional

---

## 📊 ARQUITETURA FINAL

```
┌─────────────────────────────────────────┐
│     USUÁRIO NO NAVEGADOR (HTTPS)       │
└────────────────┬────────────────────────┘
                 │
                 ↓
    ┌────────────────────────────┐
    │   CloudFront (HTTPS)       │
    │   d1234abcd.cloudfront.net │
    │   • Certificado SSL auto   │
    │   • Proxy reverso          │
    │   • Cache (opcional)       │
    └────────────────┬───────────┘
                     │
                     ↓ HTTP (interno, seguro na VPC)
    ┌─────────────────────────────┐
    │   ALB (HTTP port 80)        │
    │   deploy-lb-xxxxx...        │
    │   • Health checks           │
    │   • Load balancing          │
    └─────────────┬───────────────┘
                  │
         ┌────────┴──────────┐
         ↓                   ↓
    ┌─────────────┐   ┌──────────────┐
    │ ECS Fargate │   │ RDS Database │
    │ Backend API │   │  PostgreSQL  │
    │ Port 3333   │   │  Port 5432   │
    └─────────────┘   └──────────────┘
```

---

## 🚀 SCRIPTS ÚTEIS

### Obter URL do CloudFront

```bash
cd Backend/minhacidade-backend/infra
pulumi stack output cloudFrontUrl
# Output: d1234abcd.cloudfront.net
```

### Atualizar .env automaticamente

```bash
# (Opcional) Script para extrair URL e atualizar frontend .env
CLOUDFRONT_URL=$(cd Backend/minhacidade-backend/infra && pulumi stack output cloudFrontUrl)
echo "NEXT_PUBLIC_BACKEND_URL=https://$CLOUDFRONT_URL" > Web/minha-cidade/.env.production
```

### Limpar cache CloudFront (se necessário)

```bash
# Invalidar todos os arquivos (pode demorar 1-2 minutos)
aws cloudfront create-invalidation \
  --distribution-id $(pulumi stack output cloudFrontDistributionId) \
  --paths "/*"
```

---

## 📝 VARIÁVEIS DE AMBIENTE

### Backend (Pulumi)

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `dbPassword` | secret | Senha PostgreSQL |
| `jwtSecret` | secret | Chave JWT |
| `domainName` | string | Domínio customizado (opcional) |
| `certificateArn` | string | ACM Cert ARN (opcional) |

### Frontend (Next.js via SST)

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `NEXT_PUBLIC_BACKEND_URL` | string | URL HTTPS do backend |
| `NEXT_PUBLIC_API_URL` | string | Mesmo que acima |
| `GEMINI_API_KEY` | string | Chave API Google Gemini |

---

## ⏱️ TEMPO DE DEPLOY

| Componente | Tempo |
|-----------|-------|
| ECR Build & Push | 3-5 min |
| RDS Criação | 3-5 min |
| ECS Cluster | 2-3 min |
| ALB Setup | 1-2 min |
| CloudFront Distribution | 2-3 min |
| **Total** | **~10-15 min** |

---

## 🔗 REFERÊNCIAS

- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [Pulumi AWS Provider](https://www.pulumi.com/docs/reference/pkg/aws/)
- [SSL/TLS Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)

---

**Status:** ✅ Pronto para deployment em produção  
**Última atualização:** 2025-11-22  
**Versão:** 1.0
