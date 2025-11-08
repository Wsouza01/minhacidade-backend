import fastifyCors from "@fastify/cors"
import multipart from "@fastify/multipart"
import fastifyStatic from "@fastify/static"
import swagger from "@fastify/swagger"
import swaggerUi from "@fastify/swagger-ui"
import apiReference from "@scalar/fastify-api-reference"
import { fastify } from "fastify"
import path from "node:path"
import {
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from "fastify-type-provider-zod"
import { env } from "./env.ts"
import { jwtPlugin } from "./http/plugins/jwt.ts"

// ================================================================
// 📦 Rotas Importadas
// ================================================================
import { deleteAdministradoresRoute } from "./http/routes/administradores/delete-administradores.ts"
import { getAdministradoresRoute } from "./http/routes/administradores/get-administradores.ts"
import { postAdministradoresRoute } from "./http/routes/administradores/post-administradores.ts"
import { putAdministradoresRoute } from "./http/routes/administradores/put-administradores.ts"
import { getAnexosRoute } from "./http/routes/anexos/get-anexos.ts"
import { postAnexosRoute } from "./http/routes/anexos/post-anexos.ts"
import { authLoginRoute } from "./http/routes/auth/login.ts"
import { redefinirSenhaRoute } from "./http/routes/auth/redefinir-senha.ts"
import { solicitarRecuperacaoSenhaRoute } from "./http/routes/auth/solicitar-recuperacao-senha.ts"
import { getCategoriasRoute } from "./http/routes/categorias/get-categorias.ts"
import { getCategoriasByDepartamentoRoute } from "./http/routes/categorias/get-categorias-by-departamento.ts"
import { getPrioridadesByDepartamentoRoute } from "./http/routes/categorias/get-prioridades-by-departamento.ts"
import { postCategoriasRoute } from "./http/routes/categorias/post-categorias.ts"
import { createTestChamadoRoute } from "./http/routes/chamados/create-test-chamado.ts"
import { getChamadoByIdFinalRoute } from "./http/routes/chamados/get-chamado-by-id-final.ts"
import { getChamadoByIdSimpleRoute } from "./http/routes/chamados/get-chamado-by-id-simple.ts"
import { getChamadoDebugRoute } from "./http/routes/chamados/get-chamado-debug.ts"
import { getChamadoStepByStepRoute } from "./http/routes/chamados/get-chamado-step-by-step.ts"
import { getChamadosRoute } from "./http/routes/chamados/get-chamados.ts"
import { getChamadosUserRoute } from "./http/routes/chamados/get-chamados-user.ts"
import { getDistributionRoute } from "./http/routes/chamados/get-distribution-route.ts"
import { getServidoresWorkload } from "./http/routes/chamados/get-servidores-workload.ts"
import { getStatsRoute } from "./http/routes/chamados/get-stats-route.ts"
import { getTrendRoute } from "./http/routes/chamados/get-trend-route.ts"
import { postAtribuirServidor } from "./http/routes/chamados/post-atribuir-servidor.ts"
import { postCancelarChamado } from "./http/routes/chamados/post-cancelar-chamado.ts"
import { postChamadosRoute } from "./http/routes/chamados/post-chamados.ts"
import { postDevolverChamado } from "./http/routes/chamados/post-devolver-chamado.ts"
import { postEncaminharChamado } from "./http/routes/chamados/post-encaminhar-chamado.ts"
import { postEncerrarChamado } from "./http/routes/chamados/post-encerrar-chamado.ts"
import { postFinalizarChamado } from "./http/routes/chamados/post-finalizar-chamado.ts"
import { postResolverChamado } from "./http/routes/chamados/post-resolver-chamado.ts"
import { fixStatusRoute } from "./http/routes/chamados/fix-status.ts"
import { cidadesRoute } from "./http/routes/cidades/cidades-route.ts"
import { getDepartamentoByIdRoute } from "./http/routes/departamento/get-departamento-by-id.ts"
import { getDepartamentoStatsRoute } from "./http/routes/departamento/get-departamento-stats.ts"
import { getDepartamentosRoute } from "./http/routes/departamento/get-departamentos.ts"
import { postDepartamentosRoute } from "./http/routes/departamento/post-departamentos.ts"
import { deleteDepartamentoRoute } from "./http/routes/departamento/delete-departamento.ts"
import { getEtapasRoute } from "./http/routes/etapas/get-etapas.ts"
import { postEtapasRoute } from "./http/routes/etapas/post-etapas.ts"
import { deleteFuncionariosRoute } from "./http/routes/funcionarios/delete-funcionarios.ts"
import { getFuncionariosRoute } from "./http/routes/funcionarios/get-funcionarios.ts"
import { getFuncionariosByDepartamentoRoute } from "./http/routes/funcionarios/get-funcionarios-by-departamento.ts"
import { postFuncionariosRoute } from "./http/routes/funcionarios/post-funcionarios.ts"
import { putFuncionariosRoute } from "./http/routes/funcionarios/put-funcionarios.ts"
import { loginRoute } from "./http/routes/login/login.ts"
import { getNotificationsUserRoute } from "./http/routes/notificacoes/get-notifications-user.ts"
import { postNotificationRoute } from "./http/routes/notificacoes/post-notification.ts"
import { getRelatorioGeralRoute } from "./http/routes/relatorios/get-relatorio-geral.ts"
import { getSacOuvidoriaRoute } from "./http/routes/sac-ouvidoria/get-sac-ouvidoria.ts"
import { postSacOuvidoriaRoute } from "./http/routes/sac-ouvidoria/post-sac-ouvidoria.ts"
import { alterarEmailRoute } from "./http/routes/users/alterar-email.ts"
import { alterarSenhaRoute } from "./http/routes/users/alterar-senha.ts"
import { checkCpfRoute } from "./http/routes/users/check-cpf.ts"
import { createTestUserRoute } from "./http/routes/users/create-test-user.ts"
import { getUserByCpfRoute } from "./http/routes/users/get-user-by-cpf.ts"
import { getUsersRoute } from "./http/routes/users/get-users.ts"
import { postUsersRoute } from "./http/routes/users/post-users.ts"

// ================================================================
// 🌐 CONFIGURAÇÃO DO SERVIDOR FASTIFY
// ================================================================
const app = fastify({
	connectionTimeout: 120_000,
	keepAliveTimeout: 120_000,
	requestTimeout: 120_000,
	bodyLimit: 15 * 1024 * 1024,
}).withTypeProvider<ZodTypeProvider>()

// ---------------------------------------------------------------
// 🔐 Plugins básicos
// ---------------------------------------------------------------
app.register(fastifyCors, {
	origin: "*",
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
	credentials: true
})
app.register(multipart, {
	limits: { fileSize: 15 * 1024 * 1024, files: 5 },
	attachFieldsToBody: false,
})
app.register(fastifyStatic, {
	root: path.join(process.cwd(), "uploads"),
	prefix: "/uploads/",
	decorateReply: false,
})
app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)
app.register(jwtPlugin)

// ---------------------------------------------------------------
// 📘 SWAGGER / OPENAPI CONFIG
// ---------------------------------------------------------------
await app.register(swagger, {
	openapi: {
		info: {
			title: "Minha Cidade API",
			description:
				"Documentação oficial da API do sistema Minha Cidade — gestão de chamados e usuários.",
			version: "1.0.0",
		},
		servers: [
			{ url: `http://localhost:${env.PORT}`, description: "Servidor local" },
		],
		components: {
			securitySchemes: {
				bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
			},
		},
	},
})

await app.register(swaggerUi, {
	routePrefix: "/docs",
	staticCSP: true,
	uiConfig: { docExpansion: "list", deepLinking: true },
})

// Exportar JSON da spec
app.get("/openapi.json", async (_, reply) => reply.send(app.swagger()))

// ---------------------------------------------------------------
// 📚 Scalar API Reference (Documentação moderna)
// ---------------------------------------------------------------
await app.register(apiReference, {
	routePrefix: "/reference",
	configuration: {
		title: "Minha Cidade API Reference",
	},
})

// ---------------------------------------------------------------
// 🩺 Healthcheck
// ---------------------------------------------------------------
app.get("/health", () => "OK")

// ---------------------------------------------------------------
// 🔗 Registro de Rotas
// ---------------------------------------------------------------
app.register(authLoginRoute)
app.register(solicitarRecuperacaoSenhaRoute)
app.register(redefinirSenhaRoute)
app.register(loginRoute)
app.register(getAdministradoresRoute)
app.register(postAdministradoresRoute)
app.register(putAdministradoresRoute)
app.register(deleteAdministradoresRoute)
app.register(postUsersRoute)
app.register(checkCpfRoute)
app.register(getFuncionariosRoute)
app.register(getFuncionariosByDepartamentoRoute)
app.register(postFuncionariosRoute)
app.register(putFuncionariosRoute)
app.register(deleteFuncionariosRoute)
app.register(getEtapasRoute)
app.register(cidadesRoute)
app.register(postEtapasRoute)
app.register(getDepartamentosRoute)
app.register(postDepartamentosRoute)
app.register(deleteDepartamentoRoute)
app.register(getDepartamentoStatsRoute)
app.register(getDepartamentoByIdRoute)
app.register(getChamadosRoute)
app.register(getServidoresWorkload)
app.register(getChamadoByIdFinalRoute)
app.register(getChamadoByIdSimpleRoute)
app.register(getChamadoDebugRoute)
app.register(getChamadoStepByStepRoute)
app.register(getStatsRoute)
app.register(getDistributionRoute)
app.register(getTrendRoute)
app.register(getChamadosUserRoute)
app.register(postChamadosRoute)
app.register(postEncaminharChamado)
app.register(postAtribuirServidor)
app.register(postResolverChamado)
app.register(postEncerrarChamado)
app.register(postFinalizarChamado)
app.register(postDevolverChamado)
app.register(postCancelarChamado)
app.register(fixStatusRoute)
app.register(createTestChamadoRoute)
app.register(getCategoriasRoute)
app.register(postCategoriasRoute)
app.register(getCategoriasByDepartamentoRoute)
app.register(getPrioridadesByDepartamentoRoute)
app.register(getAnexosRoute)
app.register(postAnexosRoute)
app.register(getUsersRoute)
app.register(getUserByCpfRoute)
app.register(createTestUserRoute)
app.register(alterarSenhaRoute)
app.register(alterarEmailRoute)
app.register(getNotificationsUserRoute)
app.register(postNotificationRoute)
app.register(getRelatorioGeralRoute)
app.register(getSacOuvidoriaRoute)
app.register(postSacOuvidoriaRoute)

// ================================================================
// 🚀 Inicialização
// ================================================================
app
	.listen({ port: env.PORT, host: "0.0.0.0" })
	.then(() => {
		console.log(`✅ Servidor rodando em http://localhost:${env.PORT}`)
		console.log(`📘 Swagger UI: http://localhost:${env.PORT}/docs`)
		console.log(
			`💎 Scalar API Reference: http://localhost:${env.PORT}/reference`,
		)
	})
	.catch((err) => {
		console.error("❌ Erro ao iniciar o servidor:", err)
		process.exit(1)
	})
