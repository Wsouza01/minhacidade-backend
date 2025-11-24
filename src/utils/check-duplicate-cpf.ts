import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { administradores } from "../db/schema/administradores.js";
import { funcionarios } from "../db/schema/funcionarios.js";
import { usuarios } from "../db/schema/usuarios.js";
import { verifyCPF } from "./cpfHash.js";

/**
 * Verifica se um CPF já existe no banco de dados
 * Busca em: administradores, funcionarios e usuarios
 * @param cpf - CPF a ser verificado (com ou sem formatação)
 * @param excludeId - ID opcional para excluir da busca (usado em updates)
 * @returns true se o CPF já existe, false caso contrário
 */
export async function checkDuplicateCPF(
	cpf: string,
	excludeId?: string,
): Promise<boolean> {
	// Remove formatação do CPF
	const cleanCPF = cpf.replace(/[.-]/g, "");

	// Buscar em administradores
	const admins = await db
		.select({
			adm_id: administradores.adm_id,
			adm_cpf: administradores.adm_cpf,
		})
		.from(administradores);

	for (const admin of admins) {
		if (excludeId && admin.adm_id === excludeId) continue;
		const match = await verifyCPF(cleanCPF, admin.adm_cpf);
		if (match) return true;
	}

	// Buscar em funcionarios
	const funcs = await db
		.select({ fun_id: funcionarios.fun_id, fun_cpf: funcionarios.fun_cpf })
		.from(funcionarios);

	for (const func of funcs) {
		if (excludeId && func.fun_id === excludeId) continue;
		const match = await verifyCPF(cleanCPF, func.fun_cpf);
		if (match) return true;
	}

	// Buscar em usuarios
	const users = await db
		.select({ usu_id: usuarios.usu_id, usu_cpf: usuarios.usu_cpf })
		.from(usuarios);

	for (const user of users) {
		if (excludeId && user.usu_id === excludeId) continue;
		const match = await verifyCPF(cleanCPF, user.usu_cpf);
		if (match) return true;
	}

	return false; // CPF não encontrado, pode ser usado
}

/**
 * Retorna uma mensagem de erro amigável informando onde o CPF já está cadastrado
 * @param cpf - CPF a ser verificado (com ou sem formatação)
 * @param excludeId - ID opcional para excluir da busca (usado em updates)
 */
export async function getCPFDuplicateMessage(
	cpf: string,
	excludeId?: string,
): Promise<string | null> {
	const cleanCPF = cpf.replace(/[.-]/g, "");

	// Buscar em administradores
	const admins = await db
		.select({
			id: administradores.adm_id,
			nome: administradores.adm_nome,
			cpf: administradores.adm_cpf,
		})
		.from(administradores);

	for (const admin of admins) {
		if (excludeId && admin.id === excludeId) continue;
		const match = await verifyCPF(cleanCPF, admin.cpf);
		if (match) {
			return `CPF já cadastrado para o administrador: ${admin.nome}`;
		}
	}

	// Buscar em funcionarios
	const funcs = await db
		.select({
			id: funcionarios.fun_id,
			nome: funcionarios.fun_nome,
			cpf: funcionarios.fun_cpf,
		})
		.from(funcionarios);

	for (const func of funcs) {
		if (excludeId && func.id === excludeId) continue;
		const match = await verifyCPF(cleanCPF, func.cpf);
		if (match) {
			return `CPF já cadastrado para o funcionário: ${func.nome}`;
		}
	}

	// Buscar em usuarios
	const users = await db
		.select({
			id: usuarios.usu_id,
			nome: usuarios.usu_nome,
			cpf: usuarios.usu_cpf,
		})
		.from(usuarios);

	for (const user of users) {
		if (excludeId && user.id === excludeId) continue;
		const match = await verifyCPF(cleanCPF, user.cpf);
		if (match) {
			return `CPF já cadastrado para o usuário: ${user.nome}`;
		}
	}

	return null;
}
