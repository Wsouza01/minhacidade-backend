import { getUsersRoute } from "./get-users";
import { postUsersRoute } from "./post-users";
import { getCategoriasRoute } from "./get-categorias";
import { postCategoriasRoute } from "./post-categorias";
import { getDepartamentosRoute } from "./get-departamentos";
import { postDepartamentosRoute } from "./post-departamentos";
import { getFuncionariosRoute } from "./get-funcionarios";
import { postFuncionariosRoute } from "./post-funcionarios";
import { getChamadosRoute } from "./get-chamados";
import { postChamadosRoute } from "./post-chamados";
import { getAnexosRoute } from "./get-anexos";
import { postAnexosRoute } from "./post-anexos";
import { getEtapasRoute } from "./get-etapas";
import { postEtapasRoute } from "./post-etapas";

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
