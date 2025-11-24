// seed-prod.js - Seed simplificado para produção (apenas Admin Global)

import bcrypt from 'bcrypt'
import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não configurada!')
  process.exit(1)
}

// Detecta AWS e configura SSL
const isAWS = DATABASE_URL.includes('rds.amazonaws.com')
const sslConfig = isAWS ? { ssl: { rejectUnauthorized: false } } : {}

console.log(
  `🌱 Seed produção - Conectando: ${isAWS ? 'AWS RDS (SSL)' : 'Local'}`,
)

const client = postgres(DATABASE_URL, sslConfig)

async function seed() {
  try {
    // Verifica se já existe admin global
    const existing = await client`
			SELECT adm_id FROM administradores WHERE adm_cpf = '00000000000'
		`

    if (existing.length > 0) {
      console.log('✅ Admin Global já existe - skip seed')
      await client.end()
      return
    }

    // Insere admin global
    const senhaHash = await bcrypt.hash('AdminGlobal@123', 10)

    await client`
			INSERT INTO administradores (
				adm_nome, adm_email, adm_cpf, adm_data_nascimento,
				adm_login, adm_senha, cid_id, adm_ativo
			) VALUES (
				'Administrador Global',
				'admin.global@minhacidade.com',
				'00000000000',
				'1975-01-01',
				'admin.global',
				${senhaHash},
				NULL,
				true
			)
		`

    console.log('✅ Admin Global criado com sucesso!')
    console.log('   Login: admin.global')
    console.log('   Senha: AdminGlobal@123')

    await client.end()
  } catch (error) {
    console.error('❌ Erro no seed:', error)
    await client.end()
    process.exit(1)
  }
}

seed()
