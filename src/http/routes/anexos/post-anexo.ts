import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { eq } from 'drizzle-orm'
import type { FastifyPluginCallback } from 'fastify'
import { db } from '../../../db/index.ts'
import { anexos } from '../../../db/schema/anexos.ts'
import { chamados } from '../../../db/schema/chamados.ts'

export const postAnexoRoute: FastifyPluginCallback = (app) => {
  app.post('/anexos', async (request, reply) => {
    try {
      // Obter arquivo do multipart
      const data = await request.file()

      if (!data) {
        return reply.status(400).send({ error: 'Nenhum arquivo enviado' })
      }

      // Obter campos do form
      const chamado_id = data.fields.chamado_id?.value as string
      const tipo = data.fields.tipo?.value as string

      if (!chamado_id) {
        return reply.status(400).send({ error: 'chamado_id é obrigatório' })
      }

      // Verificar se o chamado existe
      const chamado = await db
        .select()
        .from(chamados)
        .where(eq(chamados.cha_id, chamado_id))
        .limit(1)

      if (chamado.length === 0) {
        return reply.status(404).send({ error: 'Chamado não encontrado' })
      }

      // Criar diretório de uploads se não existir
      const uploadsDir = path.join(process.cwd(), 'uploads', 'anexos')
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }

      // Gerar nome único para o arquivo
      const timestamp = Date.now()
      const extension = data.filename.split('.').pop()
      const filename = `${chamado_id}_${timestamp}.${extension}`
      const filepath = path.join(uploadsDir, filename)

      // Salvar arquivo
      await pipeline(data.file, fs.createWriteStream(filepath))

      // Criar URL do arquivo (ajuste conforme sua configuração de servidor)
      const fileUrl = `/uploads/anexos/${filename}`

      // Salvar registro no banco
      const novoAnexo = await db
        .insert(anexos)
        .values({
          anx_tipo: tipo || data.mimetype,
          anx_url: fileUrl,
          cha_id: chamado_id,
        })
        .returning()

      console.log('✅ Anexo salvo:', novoAnexo[0])

      reply.status(201).send({
        message: 'Anexo enviado com sucesso',
        anexo: novoAnexo[0],
      })
    } catch (error) {
      console.error('Erro ao fazer upload de anexo:', error)
      reply.status(500).send({ error: 'Erro ao fazer upload do anexo' })
    }
  })
}
