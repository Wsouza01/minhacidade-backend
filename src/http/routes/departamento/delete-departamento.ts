import { eq } from "drizzle-orm"
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { db } from "../../../db/connection.ts"
import { chamados } from "../../../db/schema/chamados.ts"
import { departamentos } from "../../../db/schema/departamentos.ts"

const deleteDepartamentoParamsSchema = z.object({
  id: z.string().uuid(),
})

export const deleteDepartamentoRoute: FastifyPluginCallbackZod = (app) => {
  app.delete(
    "/departamentos/:id",
    {
      schema: {
        params: deleteDepartamentoParamsSchema,
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params

        // Check if there are any tickets associated with the department
        const tickets = await db
          .select()
          .from(chamados)
          .where(eq(chamados.cha_departamento, id))
          .limit(1)

        if (tickets.length > 0) {
          return reply.status(400).send({
            message:
              "Este departamento não pode ser excluído pois existem chamados associados a ele.",
          })
        }

        // Delete the department
        await db.delete(departamentos).where(eq(departamentos.dep_id, id))

        return reply.status(204).send()
      } catch (err) {
        console.error("Erro ao excluir departamento:", err)
        return reply
          .status(500)
          .send({ message: "Erro ao excluir departamento" })
      }
    },
  )
}
