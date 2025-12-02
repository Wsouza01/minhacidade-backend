import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../../db/index.js";
import { chamados } from "../../../db/schema/chamados.js";
import { departamentos } from "../../../db/schema/departamentos.js";
export const getDistributionRoute = (app) => {
    app.get("/chamados/distribution", {
        schema: {
            querystring: z.object({
                period: z.enum(["hoje", "semana", "mes"]).default("mes"),
                cidadeId: z.string().optional(),
            }),
        },
    }, async (request, reply) => {
        try {
            const { period, cidadeId } = request.query;
            // Definir filtro de data baseado no período
            const timezone = sql `'America/Sao_Paulo'`;
            const dateFilter = period === "hoje"
                ? sql `${chamados.cha_data_abertura} >= date_trunc('day', timezone(${timezone}, now()))`
                : period === "semana"
                    ? sql `${chamados.cha_data_abertura} >= date_trunc('day', timezone(${timezone}, now()) - interval '6 days')`
                    : sql `${chamados.cha_data_abertura} >= date_trunc('day', timezone(${timezone}, now()) - interval '29 days')`;
            const cityFilter = cidadeId
                ? eq(departamentos.cid_id, cidadeId)
                : sql `TRUE`;
            // Buscar distribuição por departamento
            const distribution = await db
                .select({
                name: departamentos.dep_nome,
                count: sql `count(${chamados.cha_id})::int`,
            })
                .from(chamados)
                .leftJoin(departamentos, sql `${chamados.cha_departamento} = ${departamentos.dep_id}`)
                .where(and(dateFilter, cityFilter))
                .groupBy(departamentos.dep_nome)
                .orderBy(sql `count(${chamados.cha_id}) DESC`);
            console.log(`✅ Distribuição (${period}):`, distribution);
            reply.send(distribution);
        }
        catch (err) {
            console.error("Erro ao buscar distribuição:", err);
            reply
                .status(500)
                .send({ error: "Erro ao buscar distribuição de chamados" });
        }
    });
};
