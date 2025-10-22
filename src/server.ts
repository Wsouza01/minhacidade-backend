import fastifyCors from "@fastify/cors"
import multipart from "@fastify/multipart"
import { fastify } from "fastify"
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod"
import { env } from "./env.ts"
import { jwtPlugin } from "./http/plugins/jwt.ts"
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
import { getStatsRoute } from "./http/routes/chamados/get-stats-route.ts"
import { getTrendRoute } from "./http/routes/chamados/get-trend-route.ts"
import { postAtribuirServidor } from "./http/routes/chamados/post-atribuir-servidor.ts"
import { postChamadosRoute } from "./http/routes/chamados/post-chamados.ts"
import { postEncaminharChamado } from "./http/routes/chamados/post-encaminhar-chamado.ts"
import { postEncerrarChamado } from "./http/routes/chamados/post-encerrar-chamado.ts"
import { postResolverChamado } from "./http/routes/chamados/post-resolver-chamado.ts"
import { cidadesRoute } from "./http/routes/cidades/cidades-route.ts"
import { getDepartamentoByIdRoute } from "./http/routes/departamento/get-departamento-by-id.ts"
import { getDepartamentoStatsRoute } from "./http/routes/departamento/get-departamento-stats.ts"
import { getDepartamentosRoute } from "./http/routes/departamento/get-departamentos.ts"
import { postDepartamentosRoute } from "./http/routes/departamento/post-departamentos.ts"
import { getEtapasRoute } from "./http/routes/etapas/get-etapas.ts"
import { postEtapasRoute } from "./http/routes/etapas/post-etapas.ts"
import { getFuncionariosRoute } from "./http/routes/funcionarios/get-funcionarios.ts"
import { getFuncionariosByDepartamentoRoute } from "./http/routes/funcionarios/get-funcionarios-by-departamento.ts"
import { postFuncionariosRoute } from "./http/routes/funcionarios/post-funcionarios.ts"
import { putFuncionariosRoute } from "./http/routes/funcionarios/put-funcionarios.ts"
import { deleteFuncionariosRoute } from "./http/routes/funcionarios/delete-funcionarios.ts"
import { loginRoute } from "./http/routes/login/login.ts"
import { getNotificationsUserRoute } from "./http/routes/notificacoes/get-notifications-user.ts"
import { postNotificationRoute } from "./http/routes/notificacoes/post-notification.ts"
import { getRelatorioGeralRoute } from "./http/routes/relatorios/get-relatorio-geral.ts"
import { alterarEmailRoute } from "./http/routes/users/alterar-email.ts"
import { alterarSenhaRoute } from "./http/routes/users/alterar-senha.ts"
import { checkCpfRoute } from "./http/routes/users/check-cpf.ts"
import { createTestUserRoute } from "./http/routes/users/create-test-user.ts"
import { getUserByCpfRoute } from "./http/routes/users/get-user-by-cpf.ts"
import { getUsersRoute } from "./http/routes/users/get-users.ts"
import { postUsersRoute } from "./http/routes/users/post-users.ts"

const app = fastify({
  // Aumentar timeouts para suportar ngrok e uploads grandes
  connectionTimeout: 120_000, // 2 minutos
  keepAliveTimeout: 120_000, // 2 minutos
  requestTimeout: 120_000, // 2 minutos
  bodyLimit: 15 * 1024 * 1024, // 15MB
}).withTypeProvider<ZodTypeProvider>()

app.register(fastifyCors, {
  origin: "*",
})

app.register(multipart, {
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
    files: 5, // máximo de 5 arquivos
  },
  attachFieldsToBody: false,
})

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

// Register JWT plugin
app.register(jwtPlugin)

app.get("/health", () => "OK")

// Auth routes
app.register(authLoginRoute)
app.register(solicitarRecuperacaoSenhaRoute)
app.register(redefinirSenhaRoute)
app.register(loginRoute)

// Administradores routes
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
app.register(getDepartamentoStatsRoute)
app.register(getDepartamentoByIdRoute)
app.register(getChamadosRoute)
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

app.listen({ port: env.PORT, host: "0.0.0.0" })
