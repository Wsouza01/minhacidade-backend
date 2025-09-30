import { fastifyCors } from "@fastify/cors";
import { fastify } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { env } from "./env.ts";
import { getAnexosRoute } from "./http/routes/anexos/get-anexos.ts";
import { postAnexosRoute } from "./http/routes/anexos/post-anexos.ts";
import { getCategoriasRoute } from "./http/routes/categorias/get-categorias.ts";
import { postCategoriasRoute } from "./http/routes/categorias/post-categorias.ts";
import { getCategoriasByDepartamentoRoute } from "./http/routes/categorias/get-categorias-by-departamento.ts";
import { getPrioridadesByDepartamentoRoute } from "./http/routes/categorias/get-prioridades-by-departamento.ts";
import { getChamadosRoute } from "./http/routes/chamados/get-chamados.ts";
import { getChamadoByIdFinalRoute } from "./http/routes/chamados/get-chamado-by-id-final.ts";
import { getChamadoByIdSimpleRoute } from "./http/routes/chamados/get-chamado-by-id-simple.ts";
import { getChamadoDebugRoute } from "./http/routes/chamados/get-chamado-debug.ts";
import { getChamadoStepByStepRoute } from "./http/routes/chamados/get-chamado-step-by-step.ts";
import { getChamadosUserRoute } from "./http/routes/chamados/get-chamados-user.ts";
import { getStatsRoute } from "./http/routes/chamados/get-stats-route.ts";
import { getDistributionRoute } from "./http/routes/chamados/get-distribution-route.ts";
import { getTrendRoute } from "./http/routes/chamados/get-trend-route.ts";
import { postChamadosRoute } from "./http/routes/chamados/post-chamados.ts";
import { createTestChamadoRoute } from "./http/routes/chamados/create-test-chamado.ts";
import { getDepartamentosRoute } from "./http/routes/departamento/get-departamentos.ts";
import { postDepartamentosRoute } from "./http/routes/departamento/post-departamentos.ts";
import { getDepartamentoStatsRoute } from "./http/routes/departamento/get-departamento-stats.ts";
import { getDepartamentoByIdRoute } from "./http/routes/departamento/get-departamento-by-id.ts";
import { getEtapasRoute } from "./http/routes/etapas/get-etapas.ts";
import { postEtapasRoute } from "./http/routes/etapas/post-etapas.ts";
import { getFuncionariosRoute } from "./http/routes/funcionarios/get-funcionarios.ts";
import { postFuncionariosRoute } from "./http/routes/funcionarios/post-funcionarios.ts";
import { loginRoute } from "./http/routes/login/login.ts";
import { checkCpfRoute } from "./http/routes/users/check-cpf.ts";
import { getUsersRoute } from "./http/routes/users/get-users.ts";
import { getUserByCpfRoute } from "./http/routes/users/get-user-by-cpf.ts";
import { createTestUserRoute } from "./http/routes/users/create-test-user.ts";
import { postUsersRoute } from "./http/routes/users/post-users.ts";
import { alterarSenhaRoute } from "./http/routes/users/alterar-senha.ts";
import { alterarEmailRoute } from "./http/routes/users/alterar-email.ts";
import { cidadesRoute } from "./http/routes/cidades/cidades-route.ts";
import { getNotificationsUserRoute } from "./http/routes/notificacoes/get-notifications-user.ts";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.register(fastifyCors, {
  origin: "*",
});

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.get("/health", () => {
  return "OK";
});

app.register(loginRoute);
app.register(postUsersRoute);
app.register(checkCpfRoute);
app.register(getFuncionariosRoute);
app.register(postFuncionariosRoute);
app.register(getEtapasRoute);
app.register(cidadesRoute);
app.register(postEtapasRoute);
app.register(getDepartamentosRoute);
app.register(postDepartamentosRoute);
app.register(getDepartamentoStatsRoute);
app.register(getDepartamentoByIdRoute);
app.register(getChamadosRoute);
app.register(getChamadoByIdFinalRoute);
app.register(getChamadoByIdSimpleRoute);
app.register(getChamadoDebugRoute);
app.register(getChamadoStepByStepRoute);
app.register(getStatsRoute);
app.register(getDistributionRoute);
app.register(getTrendRoute);
app.register(getChamadosUserRoute);
app.register(postChamadosRoute);
app.register(createTestChamadoRoute);
app.register(getCategoriasRoute);
app.register(postCategoriasRoute);
app.register(getCategoriasByDepartamentoRoute);
app.register(getPrioridadesByDepartamentoRoute);
app.register(getAnexosRoute);
app.register(postAnexosRoute);
app.register(getUsersRoute);
app.register(getUserByCpfRoute);
app.register(createTestUserRoute);
app.register(alterarSenhaRoute);
app.register(alterarEmailRoute);
app.register(getNotificationsUserRoute);

app.listen({ port: env.PORT });
