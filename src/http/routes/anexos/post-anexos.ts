import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import type { FastifyPluginCallback } from 'fastify'
import { db } from '../../../db/index.ts'
import { schema } from '../../../db/schema/index.ts'

export const postAnexosRoute: FastifyPluginCallback = (app) => {
  // Rota para upload de arquivo usando parts()
  app.post(
    '/anexos/upload',
    {
      config: {
        bodyLimit: 20 * 1024 * 1024,
        timeout: 300_000,
      },
    },
    async (request, reply) => {
      // Timeout global de 90 segundos (ngrok precisa de mais tempo)
      const uploadTimeoutMs = 240_000
      const timeout = setTimeout(() => {
        console.error('⏱️ TIMEOUT: Upload demorou mais que', uploadTimeoutMs)
        if (!reply.sent) {
          reply.status(408).send({ error: 'Timeout no upload' })
        }
      }, uploadTimeoutMs)
      // impedir timeout nativo do socket
      request.raw.setTimeout(uploadTimeoutMs + 60_000)

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

        // Salvar arquivo com timeout
        const writeStream = fs.createWriteStream(filepath)
        try {
          await pipeline(fileData.file, writeStream)
          console.log('✅ Arquivo salvo no disco')
        } catch (saveError) {
          console.error('❌ Erro ao salvar arquivo:', saveError)
          // Limpar arquivo parcial se houver
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath)
          }
          throw saveError
        }

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

        clearTimeout(timeout)

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

        clearTimeout(timeout)

        if (!reply.sent) {
          reply.status(500).send({
            error: 'Erro ao fazer upload do anexo',
            details:
              error instanceof Error ? error.message : 'Erro desconhecido',
          })
        }
      }
    },
  )

  // Rota antiga para compatibilidade (apenas URL)
  app.post('/anexos', async (request, reply) => {
    try {
      const body = request.body as any
      const { tipo, url, chamado_id } = body

      if (!(tipo && url && chamado_id)) {
        return reply
          .status(400)
          .send({ error: 'Campos obrigatórios: tipo, url, chamado_id' })
      }

      await db.insert(schema.anexos).values({
        anx_tipo: tipo,
        anx_url: url,
        cha_id: chamado_id,
      })

      reply.status(201).send({ message: 'Anexo criado' })
    } catch (error) {
      console.error('Erro ao criar anexo:', error)
      reply.status(500).send({ error: 'Erro ao criar anexo' })
    }
  })
}
