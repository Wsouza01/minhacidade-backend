# ⚡ Quick Start - Deploy em 3 Comandos

## 1️⃣ Configure Secrets

```bash
pulumi config set --secret dbPassword "SuaSenhaSegura123!"
```

## 2️⃣ Deploy Tudo

```bash
pulumi up
# Esperar ~10 minutos
```

## 3️⃣ Seed (Criar Admin Global)

```bash
export DB_ENDPOINT=$(pulumi stack output databaseEndpoint)
export DB_PASSWORD="SuaSenhaSegura123!"

cd ..
docker build -f Dockerfile.seed -t seed .
docker run --rm \
  -e DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@${DB_ENDPOINT}/minhacidade_backend" \
  seed
```

## ✅ Pronto!

```bash
# Testar
curl http://$(pulumi stack output url)/health

# Login Admin Global
# Usuario: AdminGlobal
# Senha: adminGlobal@123
```

---

📖 Ver README.md para mais detalhes
