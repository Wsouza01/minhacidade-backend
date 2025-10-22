ALTER TABLE "etapa" ALTER COLUMN "eta_data_inicio" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "etapa" ALTER COLUMN "eta_data_fim" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "anexo" ADD COLUMN "anx_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "anexo" ADD COLUMN "anx_tipo" text NOT NULL;--> statement-breakpoint
ALTER TABLE "chamado" ADD COLUMN "cha_titulo" text;--> statement-breakpoint
ALTER TABLE "anexo" DROP COLUMN "ane_id";--> statement-breakpoint
ALTER TABLE "anexo" DROP COLUMN "ane_tipo";--> statement-breakpoint
ALTER TABLE "chamado" DROP COLUMN "cha_motivo:";--> statement-breakpoint
ALTER TABLE "departamentos" DROP COLUMN "dep_qtdChamados";--> statement-breakpoint
ALTER TABLE "departamentos" DROP COLUMN "dep_motivo";