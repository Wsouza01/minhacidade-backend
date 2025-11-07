CREATE TABLE "sac_ouvidoria" (
	"sac_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sac_tipo" text NOT NULL,
	"sac_descricao" text NOT NULL,
	"sac_anexo_url" text,
	"usu_id" uuid,
	"sac_data_criacao" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "funcionario" RENAME TO "funcionarios";--> statement-breakpoint
ALTER TABLE "funcionarios" DROP CONSTRAINT "funcionario_fun_email_unique";--> statement-breakpoint
ALTER TABLE "funcionarios" DROP CONSTRAINT "funcionario_fun_cpf_unique";--> statement-breakpoint
ALTER TABLE "funcionarios" DROP CONSTRAINT "funcionario_fun_login_unique";--> statement-breakpoint
ALTER TABLE "funcionarios" DROP CONSTRAINT "funcionario_fun_matricula_unique";--> statement-breakpoint
ALTER TABLE "chamado" DROP CONSTRAINT "chamado_cha_responsavel_funcionario_fun_id_fk";
--> statement-breakpoint
ALTER TABLE "funcionarios" DROP CONSTRAINT "funcionario_dep_id_departamentos_dep_id_fk";
--> statement-breakpoint
ALTER TABLE "funcionarios" DROP CONSTRAINT "funcionario_cid_id_cidades_cid_id_fk";
--> statement-breakpoint
ALTER TABLE "notificacao" DROP CONSTRAINT "notificacao_fun_id_funcionario_fun_id_fk";
--> statement-breakpoint
ALTER TABLE "sac_ouvidoria" ADD CONSTRAINT "sac_ouvidoria_usu_id_usuarios_usu_id_fk" FOREIGN KEY ("usu_id") REFERENCES "public"."usuarios"("usu_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chamado" ADD CONSTRAINT "chamado_cha_responsavel_funcionarios_fun_id_fk" FOREIGN KEY ("cha_responsavel") REFERENCES "public"."funcionarios"("fun_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funcionarios" ADD CONSTRAINT "funcionarios_dep_id_departamentos_dep_id_fk" FOREIGN KEY ("dep_id") REFERENCES "public"."departamentos"("dep_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funcionarios" ADD CONSTRAINT "funcionarios_cid_id_cidades_cid_id_fk" FOREIGN KEY ("cid_id") REFERENCES "public"."cidades"("cid_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_fun_id_funcionarios_fun_id_fk" FOREIGN KEY ("fun_id") REFERENCES "public"."funcionarios"("fun_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funcionarios" ADD CONSTRAINT "funcionarios_fun_email_unique" UNIQUE("fun_email");--> statement-breakpoint
ALTER TABLE "funcionarios" ADD CONSTRAINT "funcionarios_fun_cpf_unique" UNIQUE("fun_cpf");--> statement-breakpoint
ALTER TABLE "funcionarios" ADD CONSTRAINT "funcionarios_fun_login_unique" UNIQUE("fun_login");--> statement-breakpoint
ALTER TABLE "funcionarios" ADD CONSTRAINT "funcionarios_fun_matricula_unique" UNIQUE("fun_matricula");