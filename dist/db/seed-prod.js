import 'dotenv/config';
import bcrypt from 'bcrypt';
import { hashCPF } from '../utils/cpfHash.js';
import { eq } from 'drizzle-orm';
import { db } from './index.js';
import { administradores } from './schema/administradores.js';
import { cidades } from './schema/cidades.js';
async function runSeed() {
    try {
        console.log('🌱 SEED DE PRODUÇÃO INICIADO...');
        // Criar cidade padrão se não existir
        const [cidadeExistente] = await db.select().from(cidades).limit(1);
        let cidade = cidadeExistente;
        if (!cidade) {
            const [novaCidade] = await db
                .insert(cidades)
                .values({
                cid_nome: 'Cidade Padrão',
                cid_estado: 'SP',
                cid_padrao: true,
                cid_ativo: true,
            })
                .returning();
            cidade = novaCidade;
        }
        if (!cidade) {
            throw new Error('Não foi possível criar nem recuperar a cidade padrão.');
        }
        console.log('🏙️ Cidade padrão:', cidade.cid_nome);
        // Verifica se admin global já existe
        const [adminGlobal] = await db
            .select()
            .from(administradores)
            .where(eq(administradores.adm_login, 'admin.global'))
            .limit(1);
        if (adminGlobal) {
            if (adminGlobal.cid_id !== null) {
                console.log('🔁 Admin global existe mas está vinculado a uma cidade. Atualizando para admin-global...');
                await db
                    .update(administradores)
                    .set({
                    cid_id: null,
                    adm_nome: 'Administrador Global',
                    adm_email: 'admin.global@minhacidade.com',
                    adm_cpf: await hashCPF('00000000000'),
                    adm_data_nascimento: '1975-01-01',
                    adm_login: 'admin.global',
                    adm_senha: await bcrypt.hash('AdminGlobal@123', 10),
                    adm_ativo: true,
                })
                    .where(eq(administradores.adm_id, adminGlobal.adm_id));
                console.log('✅ Admin global atualizado para acesso correto.');
            }
            else {
                console.log('🔁 Admin global já existe e está configurado corretamente, ignorando seed.');
            }
            return;
        }
        console.log('👤 Criando admin global...');
        await db.insert(administradores).values({
            adm_nome: 'Administrador Global',
            adm_email: 'admin.global@minhacidade.com',
            adm_cpf: await hashCPF('00000000000'),
            adm_data_nascimento: '1975-01-01',
            adm_login: 'admin.global',
            adm_senha: await bcrypt.hash('AdminGlobal@123', 10),
            cid_id: null, // null => admin-global
            adm_ativo: true,
        });
        console.log('✨ SEED PROD FINALIZADO!');
    }
    catch (error) {
        console.error('❌ Erro ao executar seed:', error);
    }
    finally {
        process.exit();
    }
}
runSeed();
