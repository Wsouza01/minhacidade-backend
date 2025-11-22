import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import type { FastifyPluginCallback } from 'fastify'
import { db } from '../../../db/index.js'
import { schema } from '../../../db/schema/index.js'

export const postAnexosRouteNew: FastifyPluginCallback = (app) => {
  // Rota para upload de arquivo usando parts()
  app.post('/anexos/upload', async (request, reply) => {
    try {
      console.log('📥 Recebendo upload de anexo...')

      // Processar todos os campos do multipart usando parts()
      const parts = request.parts()

      let fileData: any = null
      let chamado_id: string | null = null
      let tipo: string | null = null

      for await (const part of parts) {
        if (part.type === 'file') {
          console.log('📄 Arquivo recebido:', {
            fieldname: part.fieldname,
            filename: part.filename,
            mimetype: part.mimetype,
            encoding: part.encoding,
          })
          fileData = {
            file: part.file,
            filename: part.filename,
            mimetype: part.mimetype,
            encoding: part.encoding,
          }
        } else {
          // É um campo de texto
          console.log('📝 Campo recebido:', {
            fieldname: part.fieldname,
            value: part.value,
          })

          if (part.fieldname === 'chamado_id') {
            chamado_id = part.value as string
          } else if (part.fieldname === 'tipo') {
            tipo = part.value as string
          }
        }
      }

      console.log('📋 Dados processados:', {
        chamado_id,
        tipo,
        hasFile: !!fileData,
      })

      if (!fileData) {
        console.error('❌ Nenhum arquivo recebido')
        return reply.status(400).send({ error: 'Nenhum arquivo enviado' })
      }

      if (!chamado_id) {
        console.error('❌ chamado_id não fornecido')
        return reply.status(400).send({ error: 'chamado_id é obrigatório' })
      }

      // Criar diretório de uploads se não existir
      const uploadsDir = path.join(process.cwd(), 'uploads', 'anexos')
      console.log('📁 Diretório de uploads:', uploadsDir)

      if (!fs.existsSync(uploadsDir)) {
        console.log('📁 Criando diretório...')
        fs.mkdirSync(uploadsDir, { recursive: true })
      }

      // Gerar nome único para o arquivo
      const timestamp = Date.now()
      const extension = fileData.filename.split('.').pop()
      const filename = `${chamado_id}_${timestamp}.${extension}`
      const filepath = path.join(uploadsDir, filename)

      console.log('💾 Salvando arquivo:', {
        filename,
        filepath,
        extension,
      })

      // Salvar arquivo
      await pipeline(fileData.file, fs.createWriteStream(filepath))
      console.log('✅ Arquivo salvo no disco')

      // Criar URL do arquivo
      const fileUrl = `/uploads/anexos/${filename}`

      console.log('💾 Salvando registro no banco de dados...')

      // Salvar registro no banco
      const novoAnexo = await db
        .insert(schema.anexos)
        .values({
          anx_tipo: tipo || fileData.mimetype,
          anx_url: fileUrl,
          cha_id: chamado_id,
        })
        .returning()

      console.log('✅ Anexo salvo com sucesso:', novoAnexo[0])

      reply.status(201).send({
        message: 'Anexo enviado com sucesso',
        anexo: novoAnexo[0],
      })
    } catch (error) {
      console.error('❌ Erro ao fazer upload de anexo:', error)
      console.error(
        'Stack:',
        error instanceof Error ? error.stack : 'No stack trace',
      )

      reply.status(500).send({
        error: 'Erro ao fazer upload do anexo',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    }
  })
}
