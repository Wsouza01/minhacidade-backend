import bcrypt from "bcrypt";
/**
 * Gera um hash bcrypt para um CPF
 * @param cpf - CPF com ou sem formatação (XXX.XXX.XXX-XX ou XXXXXXXXXXX)
 * @returns Hash bcrypt do CPF limpo
 */
export async function hashCPF(cpf) {
    const cleanCPF = cpf.replace(/\D/g, "");
    return bcrypt.hash(cleanCPF, 10);
}
/**
 * Verifica se um CPF corresponde a um hash bcrypt
 * @param cpf - CPF com ou sem formatação
 * @param hash - Hash bcrypt armazenado no banco
 * @returns true se o CPF corresponde ao hash, false caso contrário
 */
export async function verifyCPF(cpf, hash) {
    const cleanCPF = cpf.replace(/\D/g, "");
    return bcrypt.compare(cleanCPF, hash);
}
