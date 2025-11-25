import path from 'node:path';
import { fastifyCors } from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { fastifySwagger } from '@fastify/swagger';
import ScalarApiReference from '@scalar/fastify-api-reference';
import { fastify } from 'fastify';
import { serializerCompiler, validatorCompiler, } from 'fastify-type-provider-zod';
import { env } from './env.js';
import { jwtPlugin } from './http/plugins/jwt.js';
// ================================================================
// 📦 Rotas Importadas
// ================================================================
import { deleteAdministradoresRoute } from './http/routes/administradores/delete-administradores.js';
import { getAdministradoresRoute } from './http/routes/administradores/get-administradores.js';
import { getFuncionariosPorAdminRoute } from './http/routes/administradores/get-funcionarios-por-admin.js';
import { postAdministradoresRoute } from './http/routes/administradores/post-administradores.js';
import { designateAttendantRoute } from './http/routes/administradores/post-designate-attendant.js';
import { putAdministradoresRoute } from './http/routes/administradores/put-administradores.js';
import { getAnexosRoute } from './http/routes/anexos/get-anexos.js';
import { postAnexosRoute } from './http/routes/anexos/post-anexos.js';
import { authLoginRoute } from './http/routes/auth/login.js';
import { redefinirSenhaRoute } from './http/routes/auth/redefinir-senha.js';
import { solicitarRecuperacaoSenhaRoute } from './http/routes/auth/solicitar-recuperacao-senha.js';
import { getCategoriasRoute } from './http/routes/categorias/get-categorias.js';
import { getCategoriasByDepartamentoRoute } from './http/routes/categorias/get-categorias-by-departamento.js';
import { getPrioridadesByDepartamentoRoute } from './http/routes/categorias/get-prioridades-by-departamento.js';
import { postCategoriasRoute } from './http/routes/categorias/post-categorias.js';
import { createTestChamadoRoute } from './http/routes/chamados/create-test-chamado.js';
import { fixStatusRoute } from './http/routes/chamados/fix-status.js';
import { getChamadoByIdFinalRoute } from './http/routes/chamados/get-chamado-by-id-final.js';
import { getChamadosRoute } from './http/routes/chamados/get-chamados.js';
import { getChamadosUserRoute } from './http/routes/chamados/get-chamados-user.js';
import { getDistributionRoute } from './http/routes/chamados/get-distribution-route.js';
import { getServidoresWorkload } from './http/routes/chamados/get-servidores-workload.js';
import { getStatsRoute } from './http/routes/chamados/get-stats-route.js';
import { getTrendRoute } from './http/routes/chamados/get-trend-route.js';
import { postAtribuirServidor } from './http/routes/chamados/post-atribuir-servidor.js';
import { postCancelarChamado } from './http/routes/chamados/post-cancelar-chamado.js';
import { postChamadosRoute } from './http/routes/chamados/post-chamados.js';
import { postEncaminharChamado } from './http/routes/chamados/post-encaminhar-chamado.js';
import { postEncerrarChamado } from './http/routes/chamados/post-encerrar-chamado.js';
import { postResolverChamado } from './http/routes/chamados/post-resolver-chamado.js';
import { cidadesRoute } from './http/routes/cidades/cidades-route.js';
import { deleteDepartamentoRoute } from './http/routes/departamento/delete-departamento.js';
import { getDepartamentoByIdRoute } from './http/routes/departamento/get-departamento-by-id.js';
import { getDepartamentoStatsRoute } from './http/routes/departamento/get-departamento-stats.js';
import { getDepartamentosRoute } from './http/routes/departamento/get-departamentos.js';
import { postDepartamentosRoute } from './http/routes/departamento/post-departamentos.js';
import { getEtapasRoute } from './http/routes/etapas/get-etapas.js';
import { postEtapasRoute } from './http/routes/etapas/post-etapas.js';
import { deleteFuncionariosRoute } from './http/routes/funcionarios/delete-funcionarios.js';
import { getFuncionariosRoute } from './http/routes/funcionarios/get-funcionarios.js';
import { getFuncionariosByDepartamentoRoute } from './http/routes/funcionarios/get-funcionarios-by-departamento.js';
import { postFuncionariosRoute } from './http/routes/funcionarios/post-funcionarios.js';
import { putFuncionariosRoute } from './http/routes/funcionarios/put-funcionarios.js';
import { loginRoute } from './http/routes/login/login.js';
import { deleteNotificationRoute } from './http/routes/notificacoes/delete-notification.js';
import { getNotificationsUserRoute } from './http/routes/notificacoes/get-notifications-user.js';
import { postNotificationRoute } from './http/routes/notificacoes/post-notification.js';
import { getRelatorioGeralRoute } from './http/routes/relatorios/get-relatorio-geral.js';
import { getSacByCidadeRoute } from './http/routes/sac-ouvidoria/get-sac-by-cidade.js';
import { getSacOuvidoriaRoute } from './http/routes/sac-ouvidoria/get-sac-ouvidoria.js';
import { postSacOuvidoriaRoute } from './http/routes/sac-ouvidoria/post-sac-ouvidoria.js';
import { getServidorByIdRoute } from './http/routes/servidores/get-servidor-by-id.js';
import { alterarSenhaServidorRoute } from './http/routes/servidores/put-alterar-senha.js';
import { alterarEmailRoute } from './http/routes/users/alterar-email.js';
import { alterarSenhaRoute } from './http/routes/users/alterar-senha.js';
import { checkCpfRoute } from './http/routes/users/check-cpf.js';
import { getUserByCpfRoute } from './http/routes/users/get-user-by-cpf.js';
import { getUsersRoute } from './http/routes/users/get-users.js';
import { postUsersRoute } from './http/routes/users/post-users.js';
// ================================================================
// 🌐 CONFIGURAÇÃO DO SERVIDOR FASTIFY
// ================================================================
const app = fastify({
    connectionTimeout: 120_000,
    keepAliveTimeout: 120_000,
    requestTimeout: 120_000,
    bodyLimit: 15 * 1024 * 1024,
}).withTypeProvider();
// ---------------------------------------------------------------
// 🔐 Plugins básicos
// ---------------------------------------------------------------
app.register(fastifyCors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
});
app.register(multipart, {
    limits: { fileSize: 15 * 1024 * 1024, files: 5 },
    attachFieldsToBody: false,
});
app.register(fastifyStatic, {
    root: path.join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
    decorateReply: false,
});
app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);
app.register(jwtPlugin);
// ---------------------------------------------------------------
// 📘 SWAGGER / OPENAPI CONFIG
// ---------------------------------------------------------------
app.register(fastifySwagger, {
    openapi: {
        info: {
            title: 'MinhaCidade+ API',
            description: 'API REST para gestão municipal',
            version: '1.0.0',
        },
        servers: [
            {
                url: 'http://localhost:3333',
                description: 'Development server',
            },
        ],
    },
});
app.register(ScalarApiReference, {
    routePrefix: '/docs',
});
// ---------------------------------------------------------------
// 🩺 Healthcheck
// ---------------------------------------------------------------
app.get('/health', () => 'OK');
// ---------------------------------------------------------------
// 🔗 Registro de Rotas
// ---------------------------------------------------------------
app.register(authLoginRoute);
app.register(solicitarRecuperacaoSenhaRoute);
app.register(redefinirSenhaRoute);
app.register(loginRoute);
app.register(getAdministradoresRoute);
app.register(getFuncionariosPorAdminRoute);
app.register(postAdministradoresRoute);
app.register(designateAttendantRoute);
app.register(putAdministradoresRoute);
app.register(deleteAdministradoresRoute);
app.register(postUsersRoute);
app.register(checkCpfRoute);
app.register(getFuncionariosRoute);
app.register(getFuncionariosByDepartamentoRoute);
app.register(getServidorByIdRoute);
app.register(alterarSenhaServidorRoute);
app.register(postFuncionariosRoute);
app.register(putFuncionariosRoute);
app.register(deleteFuncionariosRoute);
app.register(getEtapasRoute);
app.register(cidadesRoute);
app.register(postEtapasRoute);
app.register(getDepartamentosRoute);
app.register(postDepartamentosRoute);
app.register(deleteDepartamentoRoute);
app.register(getDepartamentoStatsRoute);
app.register(getDepartamentoByIdRoute);
app.register(getChamadosRoute);
app.register(getServidoresWorkload);
app.register(getChamadoByIdFinalRoute);
app.register(getStatsRoute);
app.register(getDistributionRoute);
app.register(getTrendRoute);
app.register(getChamadosUserRoute);
app.register(postChamadosRoute);
app.register(postEncaminharChamado);
app.register(postAtribuirServidor);
app.register(postResolverChamado);
app.register(postEncerrarChamado);
app.register(postCancelarChamado);
app.register(fixStatusRoute);
app.register(createTestChamadoRoute);
app.register(getCategoriasRoute);
app.register(postCategoriasRoute);
app.register(getCategoriasByDepartamentoRoute);
app.register(getPrioridadesByDepartamentoRoute);
app.register(getAnexosRoute);
app.register(postAnexosRoute);
app.register(getUsersRoute);
app.register(getUserByCpfRoute);
app.register(alterarSenhaRoute);
app.register(alterarEmailRoute);
app.register(getNotificationsUserRoute);
app.register(postNotificationRoute);
app.register(deleteNotificationRoute);
app.register(getRelatorioGeralRoute);
app.register(getSacOuvidoriaRoute);
app.register(postSacOuvidoriaRoute);
app.register(getSacByCidadeRoute);
// ================================================================
// 🚀 Inicialização
// ================================================================
app
    .listen({ port: env.PORT, host: '0.0.0.0' })
    .then(() => {
    console.log(`✅ Servidor rodando em http://localhost:${env.PORT}`);
    console.log(`📘 Docs avaiable at: http://localhost:${env.PORT}/docs`);
})
    .catch((err) => {
    console.error('❌ Erro ao iniciar o servidor:', err);
    process.exit(1);
});
