import { db } from "../../../db/index.js";
import { usuarios } from "../../../db/schema/usuarios.js";
import { verifyCPF } from "../../../utils/cpfHash.js";
export const checkCpfRoute = (app) => {
    app.get("/users/check-cpf/:cpf", async (request, reply) => {
        const { cpf } = request.params;
        // Buscar todos os usuários
        const allUsers = await db
            .select({ usu_cpf: usuarios.usu_cpf })
            .from(usuarios);
        // Verificar se algum hash corresponde ao CPF
        for (const user of allUsers) {
            const match = await verifyCPF(cpf, user.usu_cpf);
            if (match) {
                return reply.send({ exists: true });
            }
        }
        return reply.send({ exists: false });
    });
};
