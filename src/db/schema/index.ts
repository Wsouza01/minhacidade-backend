import { administradores } from "./administradores.ts"
import { anexos } from "./anexos.ts"
import { categorias } from "./categorias.ts"
import { chamados } from "./chamados.ts"
import { cidades } from "./cidades.ts"
import { departamentos } from "./departamentos.ts"
import { etapas } from "./etapas.ts"
import { funcionarios } from "./funcionarios.ts"
import { notificacoes } from "./notificacoes.ts"
import { sacOuvidoria } from "./sac-ouvidoria.ts"
import { tokensRecuperacao } from "./tokens-recuperacao.ts"
import { usuarios } from "./usuarios.ts"

export const schema = {
	cidades,
	administradores,
	usuarios,
	departamentos,
	funcionarios,
	categorias,
	chamados,
	notificacoes,
	anexos,
	etapas,
	sacOuvidoria,
	tokensRecuperacao,
}
