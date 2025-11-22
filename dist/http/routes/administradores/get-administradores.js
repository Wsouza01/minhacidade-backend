import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../../db/index.js";
import { administradores } from "../../../db/schema/administradores.js";
import { cidades } from "../../../db/schema/cidades.js";
export const getAdministradoresRoute = (app) => {
    app.get("/administradores", {
        schema: {
            querystring: z.object({
                cidadeId: z.string().uuid().optional(),
                ativo: z.string().optional(), // "true" | "false"
            }),
        },
    }, async (request, reply) => {
        try {
            const query = request.query;
            const { cidadeId, ativo } = query;
            let queryBuilder = db
                .select({
                id: administradores.adm_id,
                nome: administradores.adm_nome,
                email: administradores.adm_email,
                cpf: administradores.adm_cpf,
                login: administradores.adm_login,
                ativo: administradores.adm_ativo,
                criado: administradores.adm_criado,
                cidadeId: administradores.cid_id,
                cidadeNome: cidades.cid_nome,
                cidadeEstado: cidades.cid_estado,
            })
                .from(administradores)
                .leftJoin(cidades, eq(administradores.cid_id, cidades.cid_id));
            // Aplicar filtros
            if (cidadeId) {
                queryBuilder = queryBuilder.where(eq(administradores.cid_id, cidadeId));
            }
            if (ativo !== undefined) {
                queryBuilder = queryBuilder.where(eq(administradores.adm_ativo, ativo === "true"));
            }
            const result = await queryBuilder;
            const formatted = result.map((row) => ({
                id: row.id,
                nome: row.nome,
                email: row.email,
                cpf: row.cpf,
                login: row.login,
                ativo: row.ativo,
                criado: row.criado,
                cidade: row.cidadeId
                    ? {
                        id: row.cidadeId,
                        nome: row.cidadeNome,
                        estado: row.cidadeEstado,
                    }
                    : null,
            }));
            return reply.send(formatted);
        }
        catch (error) {
            console.error("Erro ao buscar administradores:", error);
            return reply.code(500).send({
                message: "Erro ao buscar administradores",
                error: error instanceof Error ? error.message : String(error),
            });
        }
    });
    // Buscar administrador por ID
    app.get("/administradores/:id", {
        schema: {
            params: z.object({
                id: z.string().uuid(),
            }),
        },
    }, async (request, reply) => {
        try {
            const params = request.params;
            const { id } = params;
            const result = await db
                .select({
                id: administradores.adm_id,
                nome: administradores.adm_nome,
                email: administradores.adm_email,
                cpf: administradores.adm_cpf,
                dataNascimento: administradores.adm_data_nascimento,
                login: administradores.adm_login,
                ativo: administradores.adm_ativo,
                criado: administradores.adm_criado,
                cidadeId: administradores.cid_id,
                cidadeNome: cidades.cid_nome,
                cidadeEstado: cidades.cid_estado,
            })
                .from(administradores)
                .leftJoin(cidades, eq(administradores.cid_id, cidades.cid_id))
                .where(eq(administradores.adm_id, id));
            if (result.length === 0) {
                return reply.code(404).send({
                    message: "Administrador não encontrado",
                });
            }
            const row = result[0];
            return reply.send({
                id: row.id,
                nome: row.nome,
                email: row.email,
                cpf: row.cpf,
                dataNascimento: typeof row.dataNascimento === "string"
                    ? row.dataNascimento
                    : row.dataNascimento.toISOString().split("T")[0],
                login: row.login,
                ativo: row.ativo,
                criado: row.criado,
                cidade: row.cidadeId
                    ? {
                        id: row.cidadeId,
                        nome: row.cidadeNome,
                        estado: row.cidadeEstado,
                    }
                    : null,
            });
        }
        catch (error) {
            console.error("Erro ao buscar administradores:", error);
            return reply.code(500).send({
                message: "Erro ao buscar administradores",
                error: error instanceof Error ? error.message : String(error),
            });
        }
    });
};
