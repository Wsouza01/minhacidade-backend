# Setup Pulumi - MINHACIDADE+ Infrastructure

## Visão Geral

Este projeto Pulumi provisiona toda a infraestrutura AWS necessária para o MINHACIDADE+:

- **5 Buckets S3** para diferentes propósitos
- **Políticas de retenção automática** (lifecycle policies)
- **Criptografia por padrão** (AES256)
- **Versionamento** de arquivos críticos
- **Políticas de acesso** (IAM)

## Pré-requisitos

```bash
# 1. Instalar Pulumi CLI
curl -fsSL https://get.pulumi.com | sh

# 2. Verificar instalação
pulumi version  # Deve ser >= 3.113.0

# 3. Configurar AWS CLI
aws configure
# Ou definir variáveis de ambiente:
export AWS_ACCESS_KEY_ID=seu-id
export AWS_SECRET_ACCESS_KEY=sua-chave
export AWS_REGION=us-east-1

# 4. Login no Pulumi (cria conta gratuita em https://app.pulumi.com)
pulumi login
```

## Instalação

```bash
cd Backend/minhacidade-backend/infra

# Instalar dependências
pnpm install

# Ver stacks disponíveis
pulumi stack ls

# Selecionar stack de desenvolvimento
pulumi stack select dev
```

## Estrutura de Buckets

### 1. **minhacidade-anexos** (Produção)
```
Propósito: Armazenar anexos de chamados
- Imagens enviadas por cidadãos
- Documentos de etapas
- Fotos do local do problema

Configuração:
- Retenção: 1 ano (após encerramento de chamado)
- Versionamento: Habilitado
- Transições automáticas: STANDARD_IA (30d) → GLACIER (90d)
- Criptografia: AES256
```

### 2. **minhacidade-uploads-temp** (Temporário)
```
Propósito: Uploads em progresso
- Arquivos sendo processados
- Cache temporário de imagens

Configuração:
- Limpeza automática: 7 dias
- Versionamento: Desabilitado
- Criptografia: AES256
```

### 3. **minhacidade-relatorios** (Exportação)
```
Propósito: Relatórios exportados
- Excel (.xlsx)
- PDF de estatísticas
- Relatórios por departamento

Configuração:
- Retenção: 90 dias
- Versionamento: Habilitado
- Criptografia: AES256
```

### 4. **minhacidade-backups** (Crítico)
```
Propósito: Backups de banco de dados
- Snapshots diários do PostgreSQL
- Backups incrementais

Configuração:
- Retenção: 2 anos
- Versionamento: Habilitado
- Replicação cross-region: Habilitada
- Transições: STANDARD_IA (30d) → GLACIER (90d) → DEEP_ARCHIVE (365d)
- Criptografia: AES256
```

### 5. **minhacidade-logs** (Auditoria)
```
Propósito: Logs de aplicação
- ALB (Application Load Balancer)
- CloudFront
- API access logs

Configuração:
- Retenção: 30 dias
- Transição para STANDARD_IA: 7 dias
- Criptografia: AES256
```

## Comandos Principais

### Preview (sem aplicar mudanças)
```bash
pulumi preview
```

### Deploy (aplicar mudanças)
```bash
# Simples
pulumi up

# Com aprovação automática (sem confirmação)
pulumi up --yes

# Com stack específica
pulumi up --stack dev
```

### Destruir recursos
```bash
# Preview do que será deletado
pulumi destroy --preview

# Destruir de verdade
pulumi destroy

# Com stack específica
pulumi destroy --stack dev
```

### Ver outputs
```bash
# Após deploy, ver os buckets criados
pulumi stack output

# Exemplos de outputs:
# bucketAnexosName = "minhacidade-anexos-dev-123456789"
# bucketBackupsName = "minhacidade-backups-dev-123456789"
# s3PolicyArn = "arn:aws:iam::123456789:policy/minhacidade-s3-access-dev"
```

### Refresh state
```bash
# Sincronizar estado local com AWS
pulumi refresh
```

## Configuração por Ambiente

### Staging
```bash
# Criar stack staging
pulumi stack init staging

# Copiar config de dev
cp Pulumi.dev.yaml Pulumi.staging.yaml

# Editar para staging
pulumi config set minhacidade:environment staging --stack staging
pulumi config set aws:region us-east-1 --stack staging

# Deploy
pulumi up --stack staging
```

### Production
```bash
# Criar stack production
pulumi stack init production

# Copiar config de dev
cp Pulumi.dev.yaml Pulumi.production.yaml

# Editar para production
pulumi config set minhacidade:environment production --stack production
pulumi config set aws:region us-east-1 --stack production

# Deploy (com backup antes!)
pulumi up --stack production
```

## Integração com Backend

### 1. Obter nomes dos buckets após deploy

```bash
# Executar este comando após pulumi up
pulumi stack output bucketAnexosName > bucket_names.json
pulumi stack output bucketTempName >> bucket_names.json
pulumi stack output bucketRelatoriosName >> bucket_names.json
```

### 2. Adicionar ao `.env` do backend

```bash
# Backend/.env
# ... outras variáveis ...

# S3 Buckets
S3_BUCKET_ANEXOS=minhacidade-anexos-dev-123456789
S3_BUCKET_TEMP=minhacidade-uploads-temp-dev-123456789
S3_BUCKET_RELATORIOS=minhacidade-relatorios-dev-123456789
S3_BUCKET_BACKUPS=minhacidade-backups-dev-123456789
S3_BUCKET_LOGS=minhacidade-logs-dev-123456789

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=seu-id
AWS_SECRET_ACCESS_KEY=sua-chave
```

### 3. Usar buckets no backend

```typescript
// src/services/s3.ts (exemplo)
import { S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export const uploadAnexo = async (file: Buffer, fileName: string) => {
  // Fazer upload para S3
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_ANEXOS,
    Key: `chamados/${Date.now()}_${fileName}`,
    Body: file,
  });

  const response = await s3.send(command);
  return response.Location; // Retorna URL do arquivo
};
```

## Troubleshooting

### "No credentials found"
```bash
# Configure AWS CLI
aws configure

# Ou defina variáveis de ambiente
export AWS_ACCESS_KEY_ID=xxx
export AWS_SECRET_ACCESS_KEY=xxx
```

### "Stack not found"
```bash
# Listar stacks disponíveis
pulumi stack ls

# Criar nova stack
pulumi stack init dev
```

### "Access Denied"
```bash
# Verificar permissões IAM
aws iam list-user-policies --user-name seu-usuario

# Dar permissões mínimas (veja policy.json)
```

### Bucket já existe
```bash
# Pulumi tenta reutilizar buckets existentes
# Para força novo nome:
pulumi up --refresh

# Ou destruir e recriar
pulumi destroy
pulumi up
```

## Monitoramento

### CloudWatch
```bash
# Ver logs de aplicação
aws logs tail /aws/lambda/minhacidade --follow

# Métricas de S3
aws cloudwatch get-metric-statistics \
  --namespace AWS/S3 \
  --metric-name BucketSizeBytes \
  --dimensions Name=BucketName,Value=minhacidade-anexos-dev
```

### S3 Dashboard
```bash
# Tamanho dos buckets
aws s3 ls --summarize --human-readable --recursive s3://minhacidade-anexos-dev

# Número de objetos
aws s3 ls --recursive s3://minhacidade-anexos-dev | wc -l
```

## Segurança

- ✅ Todos os buckets têm Block Public Access habilitado
- ✅ Criptografia AES256 por padrão
- ✅ Versionamento para arquivos críticos
- ✅ Lifecycle policies para reduzir custos
- ✅ IAM Policy restricta para acesso

## Custos Estimados (Mensal)

| Item | Estimativa |
|------|-----------|
| S3 Storage (1GB) | ~$0.023 |
| S3 Requests (10k) | ~$0.40 |
| Data Transfer | ~$0.09 per GB |
| **Total mínimo** | **~$5-10** |

> Nota: Custos variam com uso. Usar CloudWatch para monitorar.

## Próximas Etapas

1. ✅ Deploy da infraestrutura (`pulumi up`)
2. ✅ Obter nomes dos buckets (`pulumi stack output`)
3. ✅ Integrar com backend (ver seção acima)
4. ✅ Testar upload de arquivo
5. ✅ Configurar CI/CD para deploy automático

## Links Úteis

- Pulumi Docs: https://www.pulumi.com/docs/
- AWS S3 Docs: https://docs.aws.amazon.com/s3/
- Lifecycle Policies: https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html
- IAM Best Practices: https://docs.aws.amazon.com/IAM/latest/userguide/best-practices.html

## Suporte

Para dúvidas:
1. Verificar logs: `pulumi logs`
2. Usar `pulumi preview` antes de `pulumi up`
3. Consultar documentação: https://www.pulumi.com/registry/packages/aws/
