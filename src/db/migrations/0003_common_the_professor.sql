CREATE TABLE "cidades" (
	"cid_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cid_nome" text NOT NULL,
	"cid_estado" text NOT NULL,
	"cid_ativo" boolean DEFAULT true NOT NULL,
	"cid_padrao" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "usuario" ADD COLUMN "usu_tipo" text DEFAULT 'municipe' NOT NULL;--> statement-breakpoint
ALTER TABLE "usuario" ADD COLUMN "usu_ativo" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "usuario" ADD COLUMN "usu_endereco" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "usuario" ADD COLUMN "cid_id" uuid;--> statement-breakpoint
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_cid_id_cidades_cid_id_fk" FOREIGN KEY ("cid_id") REFERENCES "public"."cidades"("cid_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_usu_email_unique" UNIQUE("usu_email");--> statement-breakpoint
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_usu_cpf_unique" UNIQUE("usu_cpf");--> statement-breakpoint
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_usu_login_unique" UNIQUE("usu_login");