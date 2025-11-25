import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../db/index.js';
import { departamentos } from '../../../db/schema/departamentos.js';
const getPrioridadesByDepartamentoRequestSchema = z.object({
    departamentoId: z.string().uuid(),
});
export const getPrioridadesByDepartamentoRoute = (app) => {
    app.get('/prioridades/departamento/:departamentoId', {
        schema: {
            params: getPrioridadesByDepartamentoRequestSchema,
        },
    }, async (request, reply) => {
        const { departamentoId } = request.params;
        // Verificar se o departamento existe
        const departamento = await db
            .select()
            .from(departamentos)
            .where(eq(departamentos.dep_id, departamentoId))
            .limit(1);
        if (departamento.length === 0) {
            return reply.status(404).send({ error: 'Departamento não encontrado' });
        }
        // Por enquanto, vamos retornar prioridades baseadas no tipo de departamento
        const depNome = departamento[0].dep_nome.toLowerCase();
        let prioridades = [];
        if (depNome.includes('saúde') ||
            depNome.includes('saude') ||
            depNome.includes('emergência')) {
            // Departamentos críticos podem ter prioridades específicas
            prioridades = ['Emergencial', 'Alta', 'Média', 'Baixa'];
        }
        else if (depNome.includes('infraestrutura') ||
            depNome.includes('obras')) {
            // Infraestrutura pode precisar de classificação diferente
            prioridades = ['Crítica', 'Alta', 'Média', 'Baixa'];
        }
        else {
            // Prioridades padrão para outros departamentos
            prioridades = ['Alta', 'Média', 'Baixa'];
        }
        reply.send(prioridades);
    });
};
