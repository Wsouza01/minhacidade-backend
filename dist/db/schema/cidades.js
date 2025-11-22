import { boolean, pgTable, text } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
export const cidades = pgTable('cidades', {
    cid_id: text('cid_id')
        .primaryKey()
        .$defaultFn(() => uuidv7()),
    cid_nome: text('cid_nome').notNull(),
    cid_estado: text('cid_estado').notNull(),
    cid_ativo: boolean('cid_ativo').notNull().default(true),
    cid_padrao: boolean('cid_padrao').notNull().default(false),
});
