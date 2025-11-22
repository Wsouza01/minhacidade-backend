import { eq } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { cidades } from '../../../db/schema/cidades.js';
import { usuarios } from '../../../db/schema/usuarios.js';
export const getUsersRoute = (app) => {
    app.get('/users', async (_request, reply) => {
        try {
            const users = await db
                .select({
                usu_id: usuarios.usu_id,
                nome: usuarios.usu_nome,
                cpf: usuarios.usu_cpf,
                email: usuarios.usu_email,
                login: usuarios.usu_login,
                data_nascimento: usuarios.usu_data_nascimento,
                tipo: usuarios.usu_tipo,
                ativo: usuarios.usu_ativo,
                tentativas_login: usuarios.usu_tentativas_login,
                bloqueado_ate: usuarios.usu_bloqueado_ate,
                endereco: usuarios.usu_endereco,
                cid_id: usuarios.cid_id,
                cidade_nome: cidades.cid_nome,
                cidade_estado: cidades.cid_estado,
            })
                .from(usuarios)
                .leftJoin(cidades, eq(usuarios.cid_id, cidades.cid_id))
                .where(eq(usuarios.usu_ativo, true));
            return reply.send(users);
        }
        catch (error) {
            console.error('Erro ao buscar usuários:', error);
            return reply.status(500).send({
                message: 'Erro interno no servidor',
                error: error instanceof Error ? error.message : 'Erro desconhecido',
                code: 'INTERNAL_SERVER_ERROR',
            });
        }
    });
};
