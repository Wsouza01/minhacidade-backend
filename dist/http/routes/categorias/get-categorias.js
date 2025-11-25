import { db } from '../../../db/index.js';
import { categorias } from '../../../db/schema/categorias.js';
export const getCategoriasRoute = (app) => {
    app.get('/categorias', async (_, reply) => {
        const results = await db.select().from(categorias);
        reply.send(results);
    });
};
