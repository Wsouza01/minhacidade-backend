ALTER TABLE "departamentos" RENAME COLUMN "dep_qtdchamados" TO "dep_qtdChamados";--> statement-breakpoint
ALTER TABLE "departamentos" ADD COLUMN "dep_motivo" jsonb NOT NULL;