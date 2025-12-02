import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { schema } from "../../../db/schema/index.js";
const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;
export const postAnexosRoute = (app) => {
    // Rota para upload de arquivo usando multipart
    app.post("/anexos/upload", {
        config: {
            bodyLimit: MAX_UPLOAD_BYTES,
            timeout: 300_000,
        },
    }, async (request, reply) => {
        // Timeout generoso para conexões móveis
        const uploadTimeoutMs = 240_000;
        const timeout = setTimeout(() => {
            console.error("⏱️ TIMEOUT: Upload demorou mais que", uploadTimeoutMs);
            if (!reply.sent) {
                reply.status(408).send({ error: "Timeout no upload" });
            }
        }, uploadTimeoutMs);
        // impedir timeout nativo do socket
        request.raw.setTimeout(uploadTimeoutMs + 60_000);
        try {
            console.log("📥 Recebendo upload de anexo...");
            const file = await request.file({
                limits: { fileSize: MAX_UPLOAD_BYTES },
            });
            if (!file) {
                clearTimeout(timeout);
                console.error("❌ Nenhum arquivo recebido");
                return reply.status(400).send({ error: "Nenhum arquivo enviado" });
            }
            const getFieldValue = (field) => {
                if (!field)
                    return null;
                const rawValue = typeof field === "object" && "value" in field ? field.value : field;
                if (rawValue == null)
                    return null;
                if (typeof rawValue === "string")
                    return rawValue;
                if (Buffer.isBuffer(rawValue))
                    return rawValue.toString();
                return String(rawValue);
            };
            const chamado_id = getFieldValue(file.fields?.chamado_id);
            const tipo = getFieldValue(file.fields?.tipo) || file.mimetype || "anexo";
            if (!chamado_id) {
                clearTimeout(timeout);
                console.error("❌ chamado_id não fornecido");
                return reply.status(400).send({ error: "chamado_id é obrigatório" });
            }
            if (file.file.truncated) {
                clearTimeout(timeout);
                return reply
                    .status(413)
                    .send({ error: "Arquivo excede o limite de 30MB" });
            }
            const [chamadoExistente] = await db
                .select({ id: schema.chamados.cha_id })
                .from(schema.chamados)
                .where(eq(schema.chamados.cha_id, chamado_id))
                .limit(1);
            if (!chamadoExistente) {
                clearTimeout(timeout);
                return reply.status(404).send({ error: "Chamado não encontrado" });
            }
            // Criar diretório de uploads se não existir
            const uploadsDir = path.join(process.cwd(), "uploads", "anexos");
            console.log("📁 Diretório de uploads:", uploadsDir);
            await fs.promises.mkdir(uploadsDir, { recursive: true });
            // Gerar nome único para o arquivo
            const timestamp = Date.now();
            const originalExtension = file.filename
                ? path.extname(file.filename)
                : "";
            const tipoLower = tipo.toLowerCase();
            const guessedExtension = tipoLower.includes("pdf")
                ? ".pdf"
                : tipoLower.includes("png")
                    ? ".png"
                    : tipoLower.includes("jpeg") || tipoLower.includes("jpg")
                        ? ".jpg"
                        : originalExtension;
            const extension = (originalExtension ||
                guessedExtension ||
                ".bin").replace(/^\.+/, ".");
            const filename = `${chamado_id}_${timestamp}${extension}`;
            const filepath = path.join(uploadsDir, filename);
            console.log("💾 Salvando arquivo:", {
                filename,
                filepath,
                extension,
            });
            // Salvar arquivo com timeout
            const writeStream = fs.createWriteStream(filepath);
            try {
                await pipeline(file.file, writeStream);
                console.log("✅ Arquivo salvo no disco");
            }
            catch (saveError) {
                console.error("❌ Erro ao salvar arquivo:", saveError);
                // Limpar arquivo parcial se houver
                if (fs.existsSync(filepath)) {
                    fs.unlinkSync(filepath);
                }
                throw saveError;
            }
            // Criar URL do arquivo
            const fileUrl = `/uploads/anexos/${filename}`;
            console.log("💾 Salvando registro no banco de dados...");
            // Salvar registro no banco
            const novoAnexo = await db
                .insert(schema.anexos)
                .values({
                anx_tipo: tipo,
                anx_url: fileUrl,
                cha_id: chamado_id,
            })
                .returning();
            console.log("✅ Anexo salvo com sucesso:", novoAnexo[0]);
            clearTimeout(timeout);
            reply.status(201).send({
                message: "Anexo enviado com sucesso",
                anexo: novoAnexo[0],
            });
        }
        catch (error) {
            console.error("❌ Erro ao fazer upload de anexo:", error);
            console.error("Stack:", error instanceof Error ? error.stack : "No stack trace");
            clearTimeout(timeout);
            if (!reply.sent) {
                reply.status(500).send({
                    error: "Erro ao fazer upload do anexo",
                    details: error instanceof Error ? error.message : "Erro desconhecido",
                });
            }
        }
    });
    // Rota antiga para compatibilidade (apenas URL)
    app.post("/anexos", async (request, reply) => {
        try {
            const body = request.body;
            const { tipo, url, chamado_id } = body;
            if (!(tipo && url && chamado_id)) {
                return reply
                    .status(400)
                    .send({ error: "Campos obrigatórios: tipo, url, chamado_id" });
            }
            await db.insert(schema.anexos).values({
                anx_tipo: tipo,
                anx_url: url,
                cha_id: chamado_id,
            });
            reply.status(201).send({ message: "Anexo criado" });
        }
        catch (error) {
            console.error("Erro ao criar anexo:", error);
            reply.status(500).send({ error: "Erro ao criar anexo" });
        }
    });
};
