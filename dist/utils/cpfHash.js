import bcrypt from "bcrypt";
/**
 * Criptografa um CPF usando bcrypt
 * @param cpf - CPF com ou sem formatação
 * @returns Hash bcrypt do CPF
 */
export async function hashCPF(cpf) {
    const cleanCPF = cpf.replace(/\D/g, ""); // Remove formatação
    return bcrypt.hash(cleanCPF, 10);
}
/**
 * Verifica se um CPF corresponde ao hash armazenado
 * @param cpf - CPF com ou sem formatação
 * @param hash - Hash bcrypt armazenado no banco
 * @returns true se o CPF corresponde ao hash
 */
export async function verifyCPF(cpf, hash) {
    const cleanCPF = cpf.replace(/\D/g, "");
    return bcrypt.compare(cleanCPF, hash);
}
