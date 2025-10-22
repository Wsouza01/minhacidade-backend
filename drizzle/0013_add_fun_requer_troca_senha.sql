-- Add fun_requer_troca_senha column to funcionario table
ALTER TABLE "funcionario" ADD COLUMN "fun_requer_troca_senha" boolean NOT NULL DEFAULT false;
