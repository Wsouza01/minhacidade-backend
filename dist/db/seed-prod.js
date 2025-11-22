/**
 * SEED PRODUÇÃO - Cria apenas o Admin Global padrão
 * Executar uma única vez ao inicializar o banco em produção
 */
import "dotenv/config";
import bcrypt from "bcrypt";
import { db } from "./index.js";
import { administradores } from "./schema/administradores.js";
// ============================================================================
// ADMIN GLOBAL PADRÃO
// ============================================================================
const ADMIN_GLOBAL_DEFAULT = {
    login: "AdminGlobal",
    email: "adminglobal@minhacidade.com",
    senha: "adminGlobal@123",
    nome: "Administrador Global",
    cpf: "00000000000",
    dataNascimento: "1990-01-01",
};
// ============================================================================
// MAIN
// ============================================================================
async function seedProd() {
    try {
        console.log("🌱 Iniciando seed de PRODUÇÃO...");
        console.log(`📅 ${new Date().toISOString()}`);
        // 1. Verificar se já existe admin global
        const existingAdmin = await db
            .select()
            .from(administradores)
            .where((table) => {
            // Buscar por login ou email
            return undefined; // Será implementado corretamente
        })
            .limit(1);
        if (existingAdmin.length > 0) {
            console.log("⚠️  Admin global já existe. Abortando seed.");
            process.exit(0);
        }
        // 2. Hash da senha
        const senhaHash = await bcrypt.hash(ADMIN_GLOBAL_DEFAULT.senha, 10);
        // 3. Criar admin global SEM cidade associada (admin de todos os sistemas)
        const adminGlobal = await db
            .insert(administradores)
            .values({
            adm_nome: ADMIN_GLOBAL_DEFAULT.nome,
            adm_email: ADMIN_GLOBAL_DEFAULT.email,
            adm_cpf: ADMIN_GLOBAL_DEFAULT.cpf,
            adm_data_nascimento: ADMIN_GLOBAL_DEFAULT.dataNascimento,
            adm_senha: senhaHash,
            adm_login: ADMIN_GLOBAL_DEFAULT.login,
            adm_ativo: true,
            adm_tentativas_login: 0,
            // cid_id: null (sem cidade = admin global)
        })
            .returning();
        console.log("✅ Admin Global criado com sucesso!");
        console.log(`
╔════════════════════════════════════════════╗
║      CREDENCIAIS ADMIN GLOBAL               ║
╠════════════════════════════════════════════╣
║ Login:    ${ADMIN_GLOBAL_DEFAULT.login.padEnd(26)} ║
║ Email:    ${ADMIN_GLOBAL_DEFAULT.email.padEnd(26)} ║
║ Senha:    ${ADMIN_GLOBAL_DEFAULT.senha.padEnd(26)} ║
╚════════════════════════════════════════════╝
		`);
        console.log("✨ Seed de produção concluído!");
        process.exit(0);
    }
    catch (error) {
        console.error("❌ Erro ao executar seed:", error);
        process.exit(1);
    }
}
// Executar
seedProd();
