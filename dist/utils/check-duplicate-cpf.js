import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { administradores } from '../db/schema/administradores.js';
import { funcionarios } from '../db/schema/funcionarios.js';
import { usuarios } from '../db/schema/usuarios.js';
/**
 * Verifica se um CPF já existe no banco de dados
 * Busca em: administradores, funcionarios e usuarios
 * @param cpf - CPF a ser verificado (com ou sem formatação)
 * @param excludeId - ID opcional para excluir da busca (usado em updates)
 * @returns true se o CPF já existe, false caso contrário
 */
export async function checkDuplicateCPF(cpf, excludeId) {
    // Remove formatação do CPF
    const cleanCPF = cpf.replace(/[.-]/g, '');
    // Buscar em administradores
    const adminWithCPF = await db
        .select()
        .from(administradores)
        .where(eq(administradores.adm_cpf, cleanCPF))
        .limit(1);
    if (adminWithCPF.length > 0) {
        // Se está excluindo um ID específico, verifica se não é o mesmo registro
        if (excludeId && adminWithCPF[0].adm_id === excludeId) {
            // É o mesmo registro, continua verificando outras tabelas
        }
        else {
            return true; // CPF duplicado encontrado
        }
    }
    // Buscar em funcionarios
    const funcionarioWithCPF = await db
        .select()
        .from(funcionarios)
        .where(eq(funcionarios.fun_cpf, cleanCPF))
        .limit(1);
    if (funcionarioWithCPF.length > 0) {
        if (excludeId && funcionarioWithCPF[0].fun_id === excludeId) {
            // É o mesmo registro
        }
        else {
            return true; // CPF duplicado encontrado
        }
    }
    // Buscar em usuarios
    const usuarioWithCPF = await db
        .select()
        .from(usuarios)
        .where(eq(usuarios.usu_cpf, cleanCPF))
        .limit(1);
    if (usuarioWithCPF.length > 0) {
        if (excludeId && usuarioWithCPF[0].usu_id === excludeId) {
            // É o mesmo registro
        }
        else {
            return true; // CPF duplicado encontrado
        }
    }
    return false; // CPF não encontrado, pode ser usado
}
/**
 * Retorna uma mensagem de erro amigável informando onde o CPF já está cadastrado
 * @param cpf - CPF a ser verificado (com ou sem formatação)
 * @param excludeId - ID opcional para excluir da busca (usado em updates)
 */
export async function getCPFDuplicateMessage(cpf, excludeId) {
    const cleanCPF = cpf.replace(/[.-]/g, '');
    const adminWithCPF = await db
        .select({ id: administradores.adm_id, nome: administradores.adm_nome })
        .from(administradores)
        .where(eq(administradores.adm_cpf, cleanCPF))
        .limit(1);
    if (adminWithCPF.length > 0 && adminWithCPF[0].id !== excludeId) {
        return `CPF já cadastrado para o administrador: ${adminWithCPF[0].nome}`;
    }
    const funcionarioWithCPF = await db
        .select({ id: funcionarios.fun_id, nome: funcionarios.fun_nome })
        .from(funcionarios)
        .where(eq(funcionarios.fun_cpf, cleanCPF))
        .limit(1);
    if (funcionarioWithCPF.length > 0 && funcionarioWithCPF[0].id !== excludeId) {
        return `CPF já cadastrado para o funcionário: ${funcionarioWithCPF[0].nome}`;
    }
    const usuarioWithCPF = await db
        .select({ id: usuarios.usu_id, nome: usuarios.usu_nome })
        .from(usuarios)
        .where(eq(usuarios.usu_cpf, cleanCPF))
        .limit(1);
    if (usuarioWithCPF.length > 0 && usuarioWithCPF[0].id !== excludeId) {
        return `CPF já cadastrado para o usuário: ${usuarioWithCPF[0].nome}`;
    }
    return null;
}
