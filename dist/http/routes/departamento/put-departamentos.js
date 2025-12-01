import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../../db/index.js";
import { schema } from "../../../db/schema/index.js";
export const putDepartamentosRoute = (app) => {
    app.put("/departamentos/:id", {
        schema: {
            params: z.object({
                id: z.string().uuid("ID inválido"),
            }),
            body: z.object({
                nome: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
                descricao: z.string().optional(),
                cidadeId: z.string().uuid().optional(),
                prioridade: z.enum(["Baixa", "Média", "Alta", "Urgente"]),
                motivos: z.array(z.string()).optional().default([]),
                adminId: z.string().uuid().optional(),
            }),
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const { nome, descricao, cidadeId, prioridade, motivos, adminId } = request.body;
        try {
            const departamentoExiste = await db
                .select({
                id: schema.departamentos.dep_id,
                cidadeId: schema.departamentos.cid_id,
            })
                .from(schema.departamentos)
                .where(eq(schema.departamentos.dep_id, id))
                .limit(1);
            if (departamentoExiste.length === 0) {
                return reply.status(404).send({
                    message: "Departamento não encontrado",
                });
            }
            let resolvedCidadeId = cidadeId ?? departamentoExiste[0].cidadeId;
            if (adminId) {
                const [admin] = await db
                    .select({
                    id: schema.administradores.adm_id,
                    cidadeId: schema.administradores.cid_id,
                })
                    .from(schema.administradores)
                    .where(eq(schema.administradores.adm_id, adminId));
                if (!admin) {
                    return reply
                        .status(400)
                        .send({ message: "Administrador não encontrado" });
                }
                if (admin.cidadeId) {
                    if (admin.cidadeId !== departamentoExiste[0].cidadeId) {
                        return reply.status(403).send({
                            message: "Você não tem permissão para alterar departamentos de outra cidade",
                        });
                    }
                    resolvedCidadeId = admin.cidadeId;
                }
                else if (!resolvedCidadeId) {
                    return reply.status(400).send({
                        message: "Cidade é obrigatória para administradores globais",
                    });
                }
            }
            if (!resolvedCidadeId) {
                return reply
                    .status(400)
                    .send({ message: "Cidade é obrigatória para o departamento" });
            }
            await db
                .update(schema.departamentos)
                .set({
                dep_nome: nome,
                dep_descricao: descricao,
                cid_id: resolvedCidadeId,
                dep_prioridade: prioridade,
                dep_motivos: motivos ?? [],
            })
                .where(eq(schema.departamentos.dep_id, id));
            return reply.send({ message: "Departamento atualizado com sucesso" });
        }
        catch (error) {
            console.error("Erro ao atualizar departamento:", error);
            return reply
                .status(500)
                .send({ message: "Erro ao atualizar departamento" });
        }
    });
};
