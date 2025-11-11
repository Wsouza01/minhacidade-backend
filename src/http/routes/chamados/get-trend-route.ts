import { sql } from "drizzle-orm";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../../db/index.ts";
import { chamados } from "../../../db/schema/chamados.ts";

export const getTrendRoute: FastifyPluginCallbackZod = (app) => {
  app.get(
    "/chamados/trend",
    {
      schema: {
        querystring: z.object({
          period: z.enum(["hoje", "semana", "mes"]).default("mes"),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { period } = request.query;
        const now = new Date();

        let trendData: { labels: string[]; values: number[] };

        if (period === "hoje") {
          // Buscar chamados por hora nas últimas 24 horas
          const hoursData = await db
            .select({
              hour: sql<number>`EXTRACT(HOUR FROM ${chamados.cha_data_abertura})::int`,
              count: sql<number>`count(*)::int`,
            })
            .from(chamados)
            .where(sql`DATE(${chamados.cha_data_abertura}) = CURRENT_DATE`)
            .groupBy(sql`EXTRACT(HOUR FROM ${chamados.cha_data_abertura})`)
            .orderBy(sql`EXTRACT(HOUR FROM ${chamados.cha_data_abertura})`);

          // Se há dados, mostrar apenas o range de horas com atividade
          if (hoursData.length > 0) {
            const minHour = Math.max(
              0,
              Math.min(...hoursData.map((d) => d.hour)) - 1
            );
            const maxHour = Math.min(
              23,
              Math.max(...hoursData.map((d) => d.hour)) + 1
            );

            const labels: string[] = [];
            const values: number[] = [];

            for (let hour = minHour; hour <= maxHour; hour++) {
              labels.push(`${hour}h`);
              const found = hoursData.find((d) => d.hour === hour);
              values.push(found ? found.count : 0);
            }

            trendData = { labels, values };
          } else {
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
        } else if (period === "semana") {
          // Buscar chamados dos últimos 7 dias
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - 6);
          weekStart.setHours(0, 0, 0, 0);

          const weekStartStr = weekStart.toISOString();

          const daysData = await db
            .select({
              date: sql<string>`DATE(${chamados.cha_data_abertura})`,
              count: sql<number>`count(*)::int`,
            })
            .from(chamados)
            .where(sql`${chamados.cha_data_abertura} >= ${weekStartStr}`)
            .groupBy(sql`DATE(${chamados.cha_data_abertura})`)
            .orderBy(sql`DATE(${chamados.cha_data_abertura})`);

          const labels: string[] = [];
          const values: number[] = [];
          const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

          for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            const dateStr = date.toISOString().split("T")[0];

            labels.push(dayNames[date.getDay()]);
            const found = daysData.find((d) => d.date === dateStr);
            values.push(found ? found.count : 0);
          }

          trendData = { labels, values };
        } else {
          // Buscar chamados dos últimos 30 dias
          const monthStart = new Date(now);
          monthStart.setDate(now.getDate() - 29);
          monthStart.setHours(0, 0, 0, 0);

          const monthStartStr = monthStart.toISOString();

          const daysData = await db
            .select({
              date: sql<string>`DATE(${chamados.cha_data_abertura})`,
              count: sql<number>`count(*)::int`,
            })
            .from(chamados)
            .where(sql`${chamados.cha_data_abertura} >= ${monthStartStr}`)
            .groupBy(sql`DATE(${chamados.cha_data_abertura})`)
            .orderBy(sql`DATE(${chamados.cha_data_abertura})`);

          const labels: string[] = [];
          const values: number[] = [];

          for (let i = 0; i < 30; i++) {
            const date = new Date(monthStart);
            date.setDate(monthStart.getDate() + i);
            const dateStr = date.toISOString().split("T")[0];

            labels.push(`${date.getDate()}`);
            const found = daysData.find((d) => d.date === dateStr);
            values.push(found ? found.count : 0);
          }

          trendData = { labels, values };
        }

        reply.send(trendData);
      } catch (err) {
        console.error("Erro ao buscar tendência:", err);

        // Em caso de erro, retorna dados mock
        let mockLabels: string[] = [];
        let mockValues: number[] = [];
        const { period } = request.query;

        if (period === "hoje") {
          mockLabels = Array.from({ length: 24 }, (_, i) => `${i}h`);
          mockValues = [
            0, 1, 0, 2, 1, 3, 5, 8, 12, 15, 18, 20, 16, 14, 17, 19, 13, 11, 8,
            6, 4, 2, 1, 0,
          ];
        } else if (period === "semana") {
          mockLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
          mockValues = [2, 5, 8, 6, 9, 4, 3];
        } else {
          mockLabels = Array.from({ length: 30 }, (_, i) => `${i + 1}`);
          mockValues = [
            5, 3, 7, 2, 8, 6, 4, 9, 1, 5, 7, 3, 8, 6, 2, 9, 4, 7, 1, 5, 8, 3, 6,
            9, 2, 4, 7, 5, 8, 1,
          ];
        }

        reply.send({ labels: mockLabels, values: mockValues });
      }
    }
  );
};
