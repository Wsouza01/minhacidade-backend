CREATE TABLE "anexo" (
	"ane_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ane_tipo" text NOT NULL,
	"anx_url" text NOT NULL,
	"cha_id" uuid
);
--> statement-breakpoint
CREATE TABLE "categoria" (
	"cat_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cat_nome" text NOT NULL,
	"cat_descricao" text
);
--> statement-breakpoint
CREATE TABLE "chamado" (
	"cha_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cha_descricao" text NOT NULL,
	"cha_data_fechamento" timestamp,
	"cha_departamento" uuid,
	"cha_responsavel" uuid,
	"cha_nome" text NOT NULL,
	"cha_cep" text,
	"cha_numero_endereco" text,
	"cha_data_abertura" timestamp DEFAULT now() NOT NULL,
	"cha_titulo" text,
	"cha_prioridade" text,
	"usu_id" uuid,
	"cat_id" uuid
);
--> statement-breakpoint
CREATE TABLE "etapa" (
	"eta_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"eta_descricao" text NOT NULL,
	"eta_data_inicio" date NOT NULL,
	"eta_data_fim" date NOT NULL,
	"eta_nome" text NOT NULL,
	"cha_id" uuid
);
--> statement-breakpoint
CREATE TABLE "funcionario" (
	"fun_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fun_nome" text NOT NULL,
	"fun_email" text NOT NULL,
	"fun_cpf" text NOT NULL,
	"fun_data_nascimento" date NOT NULL,
	"fun_criado" timestamp DEFAULT now() NOT NULL,
	"fun_login" text NOT NULL,
	"fun_senha" text NOT NULL,
	"dep_id" uuid
);
--> statement-breakpoint
CREATE TABLE "notificacao" (
	"ntf_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ntf_canal" text,
	"ntf_mensagem" text,
	"ntf_data_envio" timestamp DEFAULT now(),
	"ntf_lida" text,
	"cha_id" uuid,
	"usu_id" uuid
);
--> statement-breakpoint
ALTER TABLE "anexo" ADD CONSTRAINT "anexo_cha_id_chamado_cha_id_fk" FOREIGN KEY ("cha_id") REFERENCES "public"."chamado"("cha_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chamado" ADD CONSTRAINT "chamado_cha_departamento_departamentos_dep_id_fk" FOREIGN KEY ("cha_departamento") REFERENCES "public"."departamentos"("dep_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chamado" ADD CONSTRAINT "chamado_cha_responsavel_funcionario_fun_id_fk" FOREIGN KEY ("cha_responsavel") REFERENCES "public"."funcionario"("fun_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chamado" ADD CONSTRAINT "chamado_usu_id_usuario_usu_id_fk" FOREIGN KEY ("usu_id") REFERENCES "public"."usuario"("usu_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chamado" ADD CONSTRAINT "chamado_cat_id_categoria_cat_id_fk" FOREIGN KEY ("cat_id") REFERENCES "public"."categoria"("cat_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etapa" ADD CONSTRAINT "etapa_cha_id_chamado_cha_id_fk" FOREIGN KEY ("cha_id") REFERENCES "public"."chamado"("cha_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funcionario" ADD CONSTRAINT "funcionario_dep_id_departamentos_dep_id_fk" FOREIGN KEY ("dep_id") REFERENCES "public"."departamentos"("dep_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_cha_id_chamado_cha_id_fk" FOREIGN KEY ("cha_id") REFERENCES "public"."chamado"("cha_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_usu_id_usuario_usu_id_fk" FOREIGN KEY ("usu_id") REFERENCES "public"."usuario"("usu_id") ON DELETE no action ON UPDATE no action;