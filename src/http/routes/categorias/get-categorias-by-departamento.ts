import { eq } from "drizzle-orm"
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { db } from "../../../db/connection.ts"
import { categorias } from "../../../db/schema/categorias.ts"
import { departamentos } from "../../../db/schema/departamentos.ts"

const getCategoriasByDepartamentoRequestSchema = z.object({
	departamentoId: z.string().uuid(),
})

export const getCategoriasByDepartamentoRoute: FastifyPluginCallbackZod = (
	app,
) => {
	app.get(
		"/categorias/departamento/:departamentoId",
		{
			schema: {
				params: getCategoriasByDepartamentoRequestSchema,
			},
		},
		async (request, reply) => {
			const { departamentoId } = request.params

			// Verificar se o departamento existe
			const departamento = await db
				.select()
				.from(departamentos)
				.where(eq(departamentos.dep_id, departamentoId))
				.limit(1)

			if (departamento.length === 0) {
				return reply.status(404).send({ error: "Departamento não encontrado" })
			}

			// Por enquanto, vamos retornar categorias baseadas no nome do departamento
			// Em uma implementação real, haveria uma tabela de relacionamento entre departamentos e categorias
			const depNome = departamento[0].dep_nome.toLowerCase()

			let categoriasFiltradas: any[] = []

			if (depNome.includes("educação") || depNome.includes("educacao")) {
				categoriasFiltradas = [
					{
						cat_id: "edu-1",
						cat_nome: "Infraestrutura escolar",
						cat_descricao: "Problemas com prédios, salas, etc.",
					},
					{
						cat_id: "edu-2",
						cat_nome: "Material didático",
						cat_descricao: "Falta de livros, equipamentos",
					},
					{
						cat_id: "edu-3",
						cat_nome: "Transporte escolar",
						cat_descricao: "Problemas com ônibus escolar",
					},
					{
						cat_id: "edu-4",
						cat_nome: "Merenda escolar",
						cat_descricao: "Qualidade e quantidade da alimentação",
					},
				]
			} else if (depNome.includes("saúde") || depNome.includes("saude")) {
				categoriasFiltradas = [
					{
						cat_id: "sau-1",
						cat_nome: "Atendimento médico",
						cat_descricao: "Consultas, exames, especialistas",
					},
					{
						cat_id: "sau-2",
						cat_nome: "Medicamentos",
						cat_descricao: "Falta de remédios na farmácia",
					},
					{
						cat_id: "sau-3",
						cat_nome: "Infraestrutura de saúde",
						cat_descricao: "Equipamentos, instalações",
					},
					{
						cat_id: "sau-4",
						cat_nome: "Agendamento",
						cat_descricao: "Dificuldades para marcar consultas",
					},
				]
			} else if (
				depNome.includes("infraestrutura") ||
				depNome.includes("obras")
			) {
				categoriasFiltradas = [
					{
						cat_id: "inf-1",
						cat_nome: "Pavimentação",
						cat_descricao: "Problemas com asfalto, buracos",
					},
					{
						cat_id: "inf-2",
						cat_nome: "Iluminação pública",
						cat_descricao: "Postes queimados, falta de luz",
					},
					{
						cat_id: "inf-3",
						cat_nome: "Sinalização",
						cat_descricao: "Placas de trânsito, faixas",
					},
					{
						cat_id: "inf-4",
						cat_nome: "Limpeza urbana",
						cat_descricao: "Coleta de lixo, varrição",
					},
				]
			} else if (
				depNome.includes("segurança") ||
				depNome.includes("seguranca")
			) {
				categoriasFiltradas = [
					{
						cat_id: "seg-1",
						cat_nome: "Policiamento",
						cat_descricao: "Falta de segurança nas ruas",
					},
					{
						cat_id: "seg-2",
						cat_nome: "Semáforos",
						cat_descricao: "Problemas com semáforos",
					},
					{
						cat_id: "seg-3",
						cat_nome: "Radares",
						cat_descricao: "Equipamentos de velocidade",
					},
					{
						cat_id: "seg-4",
						cat_nome: "Segurança pública",
						cat_descricao: "Câmeras, iluminação de segurança",
					},
				]
			} else if (
				depNome.includes("meio ambiente") ||
				depNome.includes("ambiental")
			) {
				categoriasFiltradas = [
					{
						cat_id: "amb-1",
						cat_nome: "Poda de árvores",
						cat_descricao: "Árvores que precisam de poda",
					},
					{
						cat_id: "amb-2",
						cat_nome: "Coleta seletiva",
						cat_descricao: "Reciclagem e coleta seletiva",
					},
					{
						cat_id: "amb-3",
						cat_nome: "Poluição",
						cat_descricao: "Denúncias de poluição",
					},
					{
						cat_id: "amb-4",
						cat_nome: "Preservação",
						cat_descricao: "Proteção de áreas verdes",
					},
				]
			} else {
				// Categorias genéricas para outros departamentos
				const allCategorias = await db.select().from(categorias)
				categoriasFiltradas = allCategorias
			}

			reply.send(categoriasFiltradas)
		},
	)
}
