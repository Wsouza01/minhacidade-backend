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
import { getChamadosRoute } from "./http/routes/chamados/get-chamados.ts";
import { getChamadosUserRoute } from "./http/routes/chamados/get-chamados-user.ts";
import { getStatsRoute } from "./http/routes/chamados/get-stats-route.ts";
import { postChamadosRoute } from "./http/routes/chamados/post-chamados.ts";
import { getDepartamentosRoute } from "./http/routes/departamento/get-departamentos.ts";
import { postDepartamentosRoute } from "./http/routes/departamento/post-departamentos.ts";
import { getEtapasRoute } from "./http/routes/etapas/get-etapas.ts";
import { postEtapasRoute } from "./http/routes/etapas/post-etapas.ts";
import { getFuncionariosRoute } from "./http/routes/funcionarios/get-funcionarios.ts";
import { postFuncionariosRoute } from "./http/routes/funcionarios/post-funcionarios.ts";
import { loginRoute } from "./http/routes/login/login.ts";
import { checkCpfRoute } from "./http/routes/users/check-cpf.ts";
import { getUsersRoute } from "./http/routes/users/get-users.ts";
import { postUsersRoute } from "./http/routes/users/post-users.ts";
import { cidadesRoute } from "./http/routes/cidades/cidades-route.ts";

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
app.register(getChamadosRoute);
app.register(getStatsRoute);
app.register(getChamadosUserRoute);
app.register(postChamadosRoute);
app.register(getCategoriasRoute);
app.register(postCategoriasRoute);
app.register(getAnexosRoute);
app.register(postAnexosRoute);
app.register(getUsersRoute);

app.listen({ port: env.PORT });
