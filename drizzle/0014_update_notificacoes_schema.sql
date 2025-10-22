-- Rename and update notificacoes table schema
-- Drop old constraints first
ALTER TABLE "notificacao" DROP CONSTRAINT IF EXISTS "notificacao_usu_id_usuario_usu_id_fk";
ALTER TABLE "notificacao" DROP CONSTRAINT IF EXISTS "notificacao_cha_id_chamado_cha_id_fk";

-- Drop the table and recreate it with proper schema
DROP TABLE IF EXISTS "notificacao" CASCADE;

-- Create the new notificacoes table with correct schema
CREATE TABLE "notificacao" (
    "not_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "not_titulo" text,
    "not_mensagem" text,
    "not_tipo" text DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    "not_lida" boolean DEFAULT false,
    "not_data" timestamp DEFAULT now(),
    "cha_id" uuid REFERENCES "chamado"("cha_id"),
    "usu_id" uuid REFERENCES "usuario"("usu_id"),
    "fun_id" uuid REFERENCES "funcionario"("fun_id")
);

-- Create index for faster queries
CREATE INDEX "notificacao_usu_id_idx" ON "notificacao"("usu_id");
CREATE INDEX "notificacao_fun_id_idx" ON "notificacao"("fun_id");
CREATE INDEX "notificacao_not_data_idx" ON "notificacao"("not_data");
