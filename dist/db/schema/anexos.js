import { pgTable, text } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { chamados } from './chamados.js';
export const anexos = pgTable('anexo', {
    anx_id: text('anx_id')
        .primaryKey()
        .$defaultFn(() => uuidv7()),
    anx_tipo: text('anx_tipo').notNull(),
    anx_url: text('anx_url').notNull(),
    cha_id: text('cha_id')
        .references(() => chamados.cha_id)
        .$defaultFn(() => uuidv7()),
});
