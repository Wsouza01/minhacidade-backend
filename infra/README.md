# 🚀 Deploy Produção - MinhaCidade+ Backend

## Setup Rápido (3 passos)

### 1. Configurar Secrets

```bash
cd infra

# Senha do PostgreSQL
pulumi config set --secret dbPassword "SuaSenhaSegura123!"

```

### 2. Deploy

```bash
pulumi up
# Digitar 'yes' para confirmar
# Aguardar ~10 minutos
```

### 3. Rodar Seed (Criar Admin Global)

```bash
# Obter endpoint do banco
export DB_ENDPOINT=$(pulumi stack output databaseEndpoint)
export DB_PASSWORD="SuaSenhaSegura123!"

# Build e rodar seed
cd ..
docker build -f Dockerfile.seed -t seed .
docker run --rm \
  -e DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@${DB_ENDPOINT}/minhacidade_backend" \
  seed

# Output esperado:
# ✅ Admin Global criado!
# Login: AdminGlobal
# Senha: adminGlobal@123
```

## Outputs

```bash
pulumi stack output

# url: deploy-lb-xxxxx.us-east-1.elb.amazonaws.com (Load Balancer)
# databaseEndpoint: deploy-db-xxxxx.rds.amazonaws.com:5432
# databaseName: minhacidade_backend
```

## Testar

```bash
curl http://$(pulumi stack output url)/health
# Esperado: {"status":"healthy"}
```

## Update (Novo Deploy)

```bash
# Após commitar código
pulumi up
# Automaticamente reconstrói imagem e faz rolling deployment
```

## Destruir Tudo

```bash
pulumi destroy
# ⚠️ CUIDADO: Deleta RDS, ECS, Load Balancer, etc
```

---

## 📋 O Que Foi Criado

- ✅ **RDS PostgreSQL** (db.t3.micro, 20GB)
- ✅ **ECR** (Docker Registry)
- ✅ **ECS Fargate** (Auto-scaling 1-5 containers)
- ✅ **Application Load Balancer** (HTTP:80 → :3333)
- ✅ **Security Groups** (DB + ECS)
- ✅ **Variáveis de Ambiente** (DATABASE_URL, etc)

## 🔐 Admin Global (criado pelo seed)

```
Login:  AdminGlobal
Email:  adminglobal@minhacidade.com
Senha:  adminGlobal@123
```

**⚠️ Trocar a senha na primeira vez!**

## 💰 Custo Estimado

~$44/mês (us-east-1):
- RDS t3.micro: ~$15
- ECS Fargate (512MB): ~$8
- Load Balancer: ~$16
- Data Transfer: ~$5

## 📞 Troubleshooting

### Container não inicia
```bash
pulumi logs --follow
```

### Seed falhou
```bash
# Verificar se RDS está acessível
psql -h $(pulumi stack output databaseEndpoint | cut -d: -f1) -U postgres -d minhacidade_backend

# Rodar seed novamente (verifica se já existe)
docker run --rm -e DATABASE_URL="..." seed
```

### Health check falha
```bash
# Aguardar 2-3 minutos para container iniciar
curl http://$(pulumi stack output url)/health
```
