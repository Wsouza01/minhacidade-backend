import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { sacOuvidoria } from "../../../db/schema/sac-ouvidoria.js";
import { usuarios } from "../../../db/schema/usuarios.js";
export const postSacOuvidoriaRoute = (app) => {
    app.post("/sac-ouvidoria", async (request, reply) => {
        try {
            console.log("📥 Recebendo registro SAC/Ouvidoria");
            // Obter campos do formulário multipart
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ error: "Multipart data obrigatório" });
            }
            // Extrair campos
            const tipo = data.fields.tipo?.value;
            const descricao = data.fields.descricao?.value;
            const usuario_id = data.fields.usuario_id?.value;
            // Validar campos obrigatórios
            if (!tipo || !descricao || !usuario_id) {
                return reply.status(400).send({
                    error: "tipo, descricao e usuario_id são obrigatórios",
                });
            }
            if (descricao.length < 10 || descricao.length > 1000) {
                return reply.status(400).send({
                    error: "A descrição deve ter entre 10 e 1000 caracteres",
                });
            }
            // Validar tipo
            if (!["Elogio", "Reclamação", "Solicitação", "Sugestão"].includes(tipo)) {
                return reply.status(400).send({
                    error: "Tipo inválido",
                });
            }
            console.log("✅ Campos validados:", { tipo, usuario_id });
            // Verificar se o usuário existe
            const userExists = await db
                .select({ usu_id: usuarios.usu_id })
                .from(usuarios)
                .where(eq(usuarios.usu_id, usuario_id));
            if (!userExists || userExists.length === 0) {
                console.log("❌ Usuário não encontrado:", usuario_id);
                return reply.status(404).send({
                    error: "Usuário não encontrado",
                });
            }
            console.log("✅ Usuário encontrado, processando...");
            let anexoUrl = null;
            // Se houver arquivo anexado, fazer upload
            if (data.file) {
                console.log("📎 Arquivo detectado:", data.filename);
                // Criar diretório de uploads se não existir
                const uploadsDir = path.join(process.cwd(), "uploads", "sac-ouvidoria");
                if (!fs.existsSync(uploadsDir)) {
                    fs.mkdirSync(uploadsDir, { recursive: true });
                }
                // Gerar nome único para o arquivo
                const timestamp = Date.now();
                const randomStr = Math.random().toString(36).substring(2, 8);
                const extension = data.filename.split(".").pop();
                const filename = `${timestamp}_${randomStr}.${extension}`;
                const filepath = path.join(uploadsDir, filename);
                // Salvar arquivo
                await pipeline(data.file, fs.createWriteStream(filepath));
                // Criar URL do arquivo
                anexoUrl = `/uploads/sac-ouvidoria/${filename}`;
                console.log("✅ Arquivo salvo:", anexoUrl);
            }
            // Criar registro de SAC/Ouvidoria
            const result = await db
                .insert(sacOuvidoria)
                .values({
                sac_tipo: tipo,
                sac_descricao: descricao,
                sac_anexo_url: anexoUrl,
                usu_id: usuario_id,
            })
                .returning();
            const sacRecord = result[0];
            console.log("✅ Registro criado com sucesso:", sacRecord.sac_id);
            return reply.status(201).send({
                sac_id: sacRecord.sac_id,
                sac_tipo: sacRecord.sac_tipo,
                sac_descricao: sacRecord.sac_descricao,
                sac_anexo_url: sacRecord.sac_anexo_url,
                usu_id: sacRecord.usu_id,
                sac_data_criacao: sacRecord.sac_data_criacao?.toISOString() ?? "",
                message: "Registro de SAC/Ouvidoria criado com sucesso",
            });
        }
        catch (error) {
            console.error("❌ Erro ao criar registro de SAC/Ouvidoria:", error);
            return reply.status(500).send({
                error: "Erro ao criar registro",
                message: error instanceof Error ? error.message : "Erro desconhecido",
            });
        }
    });
};
