import { eq } from "drizzle-orm";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../../db/index.ts";
import { anexos } from "../../../db/schema/anexos.ts";
import { categorias } from "../../../db/schema/categorias.ts";
import { chamados } from "../../../db/schema/chamados.ts";
import { departamentos } from "../../../db/schema/departamentos.ts";
import { etapas } from "../../../db/schema/etapas.ts";
import { usuarios } from "../../../db/schema/usuarios.ts";
import { env } from "../../../env.ts";

const getChamadoByIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const getChamadoByIdFinalRoute: FastifyPluginCallbackZod = (app) => {
  app.get(
    "/chamados/:id",
    {
      schema: {
        params: getChamadoByIdParamsSchema,
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        console.log("🔍 Buscando chamado ID:", id);

        // Busca básica do chamado
        const chamadoBase = await db
          .select()
          .from(chamados)
          .where(eq(chamados.cha_id, id))
          .limit(1);

        if (chamadoBase.length === 0) {
          return reply.status(404).send({ message: "Chamado não encontrado" });
        }

        const chamado = chamadoBase[0];
        console.log("✅ Chamado encontrado:", chamado.cha_titulo);
        console.log("📋 Departamento ID:", chamado.cha_departamento);
        console.log("👤 Usuário ID:", chamado.usu_id);

        // Buscar informações relacionadas de forma segura
        const [departamento, categoria, usuario, anexosList, etapasList] =
          await Promise.allSettled([
            // Departamento
            chamado.cha_departamento
              ? (async () => {
                  console.log(
                    "🔍 Buscando departamento com ID:",
                    chamado.cha_departamento
                  );
                  const result = await db
                    .select({ dep_nome: departamentos.dep_nome })
                    .from(departamentos)
                    .where(eq(departamentos.dep_id, chamado.cha_departamento!))
                    .limit(1);
                  console.log("📊 Resultado da busca de departamento:", result);
                  return result;
                })()
              : Promise.resolve([]),

            // Categoria
            chamado.cat_id
              ? db
                  .select({ cat_nome: categorias.cat_nome })
                  .from(categorias)
                  .where(eq(categorias.cat_id, chamado.cat_id!))
                  .limit(1)
              : Promise.resolve([]),

            // Usuário
            chamado.usu_id
              ? (async () => {
                  try {
                    console.log("🔍 Buscando usuário com ID:", chamado.usu_id);
                    const result = await db
                      .select({
                        usu_nome: usuarios.usu_nome,
                        usu_email: usuarios.usu_email,
                        usu_cpf: usuarios.usu_cpf,
                      })
                      .from(usuarios)
                      .where(eq(usuarios.usu_id, chamado.usu_id!))
                      .limit(1);
                    console.log("📊 Resultado da busca de usuário:", result);
                    return result;
                  } catch (err) {
                    console.error("❌ Erro ao buscar usuário:", err);
                    return [];
                  }
                })()
              : Promise.resolve([]),

            // Anexos
            db
              .select({
                anx_id: anexos.anx_id,
                anx_tipo: anexos.anx_tipo,
                anx_url: anexos.anx_url,
              })
              .from(anexos)
              .where(eq(anexos.cha_id, id)),

            // Etapas
            db
              .select({
                eta_id: etapas.eta_id,
                eta_nome: etapas.eta_nome,
                eta_descricao: etapas.eta_descricao,
                eta_data_inicio: etapas.eta_data_inicio,
                eta_data_fim: etapas.eta_data_fim,
              })
              .from(etapas)
              .where(eq(etapas.cha_id, id))
              .orderBy(etapas.eta_data_inicio),
          ]);

        // Extrair resultados de forma segura
        const depData =
          departamento.status === "fulfilled" && departamento.value.length > 0
            ? departamento.value[0]
            : null;
        const catData =
          categoria.status === "fulfilled" && categoria.value.length > 0
            ? categoria.value[0]
            : null;
        const usuData =
          usuario.status === "fulfilled" && usuario.value.length > 0
            ? usuario.value[0]
            : null;
        const anexosData =
          anexosList.status === "fulfilled" ? anexosList.value : [];
        const etapasData =
          etapasList.status === "fulfilled" ? etapasList.value : [];

        console.log(
          "🏢 Departamento encontrado:",
          depData?.dep_nome || "Nenhum"
        );
        console.log("👤 Usuário encontrado:", usuData?.usu_nome || "Nenhum");
        console.log("📂 Categoria encontrada:", catData?.cat_nome || "Nenhum");

        // Montar resposta final
        const response = {
          ...chamado,
          // Dados do departamento
          departamento_nome: depData?.dep_nome || null,
          departamento_telefone: null, // Campo não existe no banco ainda
          // Dados da categoria
          categoria_nome: catData?.cat_nome || null,
          // Dados do usuário solicitante
          usuario_nome: usuData?.usu_nome || null,
          usuario_email: usuData?.usu_email || null,
          usuario_telefone: null, // Campo não existe no banco ainda
          usuario_cpf: usuData?.usu_cpf || null,
          // Dados do responsável (deixando nulo por enquanto)
          responsavel_nome: null,
          responsavel_email: null,
          // Anexos
          anexos: anexosData,
          // Etapas ordenadas por data
          etapas: etapasData,
          // Determinar status baseado nos dados
          status: chamado.cha_data_fechamento
            ? "resolvido"
            : chamado.cha_responsavel
            ? "em_andamento"
            : "pendente",
          // Formatação de endereço
          endereco_completo:
            chamado.cha_cep && chamado.cha_numero_endereco
              ? `${chamado.cha_numero_endereco}, CEP: ${chamado.cha_cep}`
              : chamado.cha_cep || "Não informado",
        };

        console.log("✅ Resposta montada com sucesso");
        reply.send(response);
      } catch (err) {
        console.error("❌ Erro detalhado ao buscar chamado:", err);
        console.error(
          "Stack trace:",
          err instanceof Error ? err.stack : "No stack trace"
        );
        reply.status(500).send({
          message: "Erro ao buscar chamado",
          error:
            env.NODE_ENV === "development"
              ? err instanceof Error
                ? err.message
                : "Erro desconhecido"
              : undefined,
        });
      }
    }
  );
};
