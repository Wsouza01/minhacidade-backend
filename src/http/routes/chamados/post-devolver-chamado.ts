import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { db } from "../../../db/connection.ts"
import { chamados } from "../../../db/schema/chamados.ts"
import { eq } from "drizzle-orm"

export const devolverChamadoRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    "/chamados/:chamadoId/devolver",
    {
      schema: {
        params: z.object({
          chamadoId: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { chamadoId } = request.params

        await db
          .update(chamados)
          .set({ cha_responsavel: null })
          .where(eq(chamados.cha_id, chamadoId))

        return reply.status(204).send()
      } catch (err) {
        console.error("Erro ao devolver chamado:", err)
        reply.status(500).send({ message: "Erro ao devolver chamado" })
      }
    },
  )
}
