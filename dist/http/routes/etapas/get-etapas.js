import { db } from '../../../db/index.js'
import { schema } from '../../../db/schema/index.js'
export const getEtapasRoute = (app) => {
  app.get('/etapas', async (_, reply) => {
    const etapas = await db.select().from(schema.etapas)
    reply.send(etapas)
  })
}
