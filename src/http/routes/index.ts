import { getAnexosRoute } from "./anexos/get-anexos.ts";
import { postAnexosRoute } from "./anexos/post-anexos.ts";
import { getCategoriasRoute } from "./categorias/get-categorias.ts";
import { postCategoriasRoute } from "./categorias/post-categorias.ts";
import { getChamadosRoute } from "./chamados/get-chamados.ts";
import { postChamadosRoute } from "./chamados/post-chamados.ts";
import { getDepartamentosRoute } from "./departamento/get-departamentos.ts";
import { postDepartamentosRoute } from "./departamento/post-departamentos.ts";
import { getEtapasRoute } from "./etapas/get-etapas.ts";
import { postEtapasRoute } from "./etapas/post-etapas.ts";
import { getFuncionariosRoute } from "./funcionarios/get-funcionarios.ts";
import { postFuncionariosRoute } from "./funcionarios/post-funcionarios.ts";
import { getUsersRoute } from "./users/get-users.ts";
import { postUsersRoute } from "./users/post-users.ts";

export const usersRoutes = [
  getUsersRoute,
  postUsersRoute,
  getCategoriasRoute,
  postCategoriasRoute,
  getDepartamentosRoute,
  postDepartamentosRoute,
  getFuncionariosRoute,
  postFuncionariosRoute,
  getChamadosRoute,
  postChamadosRoute,
  getAnexosRoute,
  postAnexosRoute,
  getEtapasRoute,
  postEtapasRoute,
];
