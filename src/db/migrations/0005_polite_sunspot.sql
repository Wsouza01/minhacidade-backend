ALTER TABLE "usuarios" ADD COLUMN "usu_tentativas_login" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "usu_bloqueado_ate" timestamp;