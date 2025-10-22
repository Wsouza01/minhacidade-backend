CREATE TABLE "administradores" (
	"adm_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"adm_nome" text NOT NULL,
	"adm_email" text NOT NULL,
	"adm_cpf" text NOT NULL,
	"adm_data_nascimento" date NOT NULL,
	"adm_criado" timestamp DEFAULT now() NOT NULL,
	"adm_login" text NOT NULL,
	"adm_senha" text NOT NULL,
	"adm_ativo" boolean DEFAULT true NOT NULL,
	"adm_tentativas_login" integer DEFAULT 0,
	"adm_bloqueado_ate" timestamp,
	"cid_id" uuid,
	CONSTRAINT "administradores_adm_email_unique" UNIQUE("adm_email"),
	CONSTRAINT "administradores_adm_cpf_unique" UNIQUE("adm_cpf"),
	CONSTRAINT "administradores_adm_login_unique" UNIQUE("adm_login")
);
--> statement-breakpoint
ALTER TABLE "departamentos" ADD COLUMN "cid_id" uuid;--> statement-breakpoint
ALTER TABLE "funcionario" ADD COLUMN "cid_id" uuid;--> statement-breakpoint
ALTER TABLE "administradores" ADD CONSTRAINT "administradores_cid_id_cidades_cid_id_fk" FOREIGN KEY ("cid_id") REFERENCES "public"."cidades"("cid_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departamentos" ADD CONSTRAINT "departamentos_cid_id_cidades_cid_id_fk" FOREIGN KEY ("cid_id") REFERENCES "public"."cidades"("cid_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funcionario" ADD CONSTRAINT "funcionario_cid_id_cidades_cid_id_fk" FOREIGN KEY ("cid_id") REFERENCES "public"."cidades"("cid_id") ON DELETE no action ON UPDATE no action;