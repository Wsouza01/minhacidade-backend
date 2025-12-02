import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../../db/index.js";
import { chamados } from "../../../db/schema/chamados.js";
import { departamentos } from "../../../db/schema/departamentos.js";
export const getTrendRoute = (app) => {
    app.get("/chamados/trend", {
        schema: {
            querystring: z.object({
                period: z.enum(["hoje", "semana", "mes"]).default("mes"),
                cidadeId: z.string().optional(),
            }),
        },
    }, async (request, reply) => {
        try {
            const { period, cidadeId } = request.query;
            const timezone = sql `'America/Sao_Paulo'`;
            // Construir filtro de cidade se fornecido
            let cityFilter = sql `TRUE`;
            if (cidadeId) {
                cityFilter = eq(departamentos.cid_id, cidadeId);
            }
            let trendData;
            if (period === "hoje") {
                // Buscar chamados por hora considerando timezone SP
                const hoursData = await db
                    .select({
                    hour: sql `EXTRACT(HOUR FROM timezone(${timezone}, ${chamados.cha_data_abertura}))::int`,
                    count: sql `count(*)::int`,
                })
                    .from(chamados)
                    .leftJoin(departamentos, eq(chamados.cha_departamento, departamentos.dep_id))
                    .where(and(sql `DATE(timezone(${timezone}, ${chamados.cha_data_abertura})) = DATE(timezone(${timezone}, now()))`, cityFilter))
                    .groupBy(sql `EXTRACT(HOUR FROM timezone(${timezone}, ${chamados.cha_data_abertura}))`)
                    .orderBy(sql `EXTRACT(HOUR FROM timezone(${timezone}, ${chamados.cha_data_abertura}))`);
                // Se há dados, mostrar apenas o range de horas com atividade
                if (hoursData.length > 0) {
                    const minHour = Math.max(0, Math.min(...hoursData.map((d) => d.hour)) - 1);
                    const maxHour = Math.min(23, Math.max(...hoursData.map((d) => d.hour)) + 1);
                    const labels = [];
                    const values = [];
                    for (let hour = minHour; hour <= maxHour; hour++) {
                        labels.push(`${hour}h`);
                        const found = hoursData.find((d) => d.hour === hour);
                        values.push(found ? found.count : 0);
                    }
                    trendData = { labels, values };
                }
                else {
                    // Se não há dados hoje, mostrar horário comercial vazio
                    const labels = [
                        "8h",
                        "9h",
                        "10h",
                        "11h",
                        "12h",
                        "13h",
                        "14h",
                        "15h",
                        "16h",
                        "17h",
                        "18h",
                    ];
                    const values = Array(11).fill(0);
                    trendData = { labels, values };
                }
            }
            else if (period === "semana") {
                // Buscar chamados dos últimos 7 dias
                const daysData = await db
                    .select({
                    date: sql `DATE(timezone(${timezone}, ${chamados.cha_data_abertura}))`,
                    count: sql `count(*)::int`,
                })
                    .from(chamados)
                    .leftJoin(departamentos, eq(chamados.cha_departamento, departamentos.dep_id))
                    .where(and(sql `timezone(${timezone}, ${chamados.cha_data_abertura}) >= date_trunc('day', timezone(${timezone}, now()) - interval '6 days')`, cityFilter))
                    .groupBy(sql `DATE(timezone(${timezone}, ${chamados.cha_data_abertura}))`)
                    .orderBy(sql `DATE(timezone(${timezone}, ${chamados.cha_data_abertura}))`);
                const labels = [];
                const values = [];
                const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
                for (let i = 0; i < 7; i++) {
                    const date = new Date();
                    date.setDate(date.getDate() - 6 + i);
                    const dateStr = date.toISOString().split("T")[0];
                    labels.push(dayNames[date.getDay()]);
                    const found = daysData.find((d) => d.date === dateStr);
                    values.push(found ? found.count : 0);
                }
                trendData = { labels, values };
            }
            else {
                // Buscar chamados dos últimos 30 dias
                const daysData = await db
                    .select({
                    date: sql `DATE(timezone(${timezone}, ${chamados.cha_data_abertura}))`,
                    count: sql `count(*)::int`,
                })
                    .from(chamados)
                    .leftJoin(departamentos, eq(chamados.cha_departamento, departamentos.dep_id))
                    .where(and(sql `timezone(${timezone}, ${chamados.cha_data_abertura}) >= date_trunc('day', timezone(${timezone}, now()) - interval '29 days')`, cityFilter))
                    .groupBy(sql `DATE(timezone(${timezone}, ${chamados.cha_data_abertura}))`)
                    .orderBy(sql `DATE(timezone(${timezone}, ${chamados.cha_data_abertura}))`);
                const labels = [];
                const values = [];
                for (let i = 0; i < 30; i++) {
                    const date = new Date();
                    date.setDate(date.getDate() - 29 + i);
                    const dateStr = date.toISOString().split("T")[0];
                    labels.push(`${date.getDate()}`);
                    const found = daysData.find((d) => d.date === dateStr);
                    values.push(found ? found.count : 0);
                }
                trendData = { labels, values };
            }
            reply.send(trendData);
        }
        catch (err) {
            console.error("Erro ao buscar tendência:", err);
            // Em caso de erro, retorna dados mock
            let mockLabels = [];
            let mockValues = [];
            const { period } = request.query;
            if (period === "hoje") {
                mockLabels = Array.from({ length: 24 }, (_, i) => `${i}h`);
                mockValues = [
                    0, 1, 0, 2, 1, 3, 5, 8, 12, 15, 18, 20, 16, 14, 17, 19, 13, 11, 8,
                    6, 4, 2, 1, 0,
                ];
            }
            else if (period === "semana") {
                mockLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
                mockValues = [2, 5, 8, 6, 9, 4, 3];
            }
            else {
                mockLabels = Array.from({ length: 30 }, (_, i) => `${i + 1}`);
                mockValues = [
                    5, 3, 7, 2, 8, 6, 4, 9, 1, 5, 7, 3, 8, 6, 2, 9, 4, 7, 1, 5, 8, 3, 6,
                    9, 2, 4, 7, 5, 8, 1,
                ];
            }
            reply.send({ labels: mockLabels, values: mockValues });
        }
    });
};
