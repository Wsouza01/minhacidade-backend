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
CREATE TABLE "anexo" (
	"anx_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"anx_tipo" text NOT NULL,
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
CREATE TABLE "cidades" (
	"cid_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cid_nome" text NOT NULL,
	"cid_estado" text NOT NULL,
	"cid_ativo" boolean DEFAULT true NOT NULL,
	"cid_padrao" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departamentos" (
	"dep_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dep_nome" text NOT NULL,
	"dep_descricao" text,
	"cid_id" uuid
);
--> statement-breakpoint
CREATE TABLE "etapa" (
	"eta_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"eta_descricao" text NOT NULL,
	"eta_data_inicio" date,
	"eta_data_fim" date,
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
	"fun_matricula" varchar(50),
	"fun_requer_troca_senha" boolean DEFAULT false NOT NULL,
	"fun_tipo" text DEFAULT 'servidor' NOT NULL,
	"fun_ativo" boolean DEFAULT true NOT NULL,
	"dep_id" uuid,
	"cid_id" uuid,
	CONSTRAINT "funcionario_fun_email_unique" UNIQUE("fun_email"),
	CONSTRAINT "funcionario_fun_cpf_unique" UNIQUE("fun_cpf"),
	CONSTRAINT "funcionario_fun_login_unique" UNIQUE("fun_login"),
	CONSTRAINT "funcionario_fun_matricula_unique" UNIQUE("fun_matricula")
);
--> statement-breakpoint
CREATE TABLE "notificacao" (
	"not_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"not_titulo" text,
	"not_mensagem" text,
	"not_tipo" text,
	"not_lida" boolean DEFAULT false,
	"not_data" timestamp DEFAULT now(),
	"cha_id" uuid,
	"usu_id" uuid,
	"fun_id" uuid
);
--> statement-breakpoint
CREATE TABLE "tokens_recuperacao" (
	"tok_id" text PRIMARY KEY NOT NULL,
	"tok_token" text NOT NULL,
	"tok_email" text NOT NULL,
	"tok_tipo_usuario" text NOT NULL,
	"tok_usado" timestamp with time zone,
	"tok_expira_em" timestamp with time zone NOT NULL,
	"tok_criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tokens_recuperacao_tok_token_unique" UNIQUE("tok_token")
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"usu_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usu_nome" text NOT NULL,
	"usu_email" text NOT NULL,
	"usu_cpf" text NOT NULL,
	"usu_data_nascimento" date NOT NULL,
	"usu_criado" timestamp DEFAULT now() NOT NULL,
	"usu_login" text NOT NULL,
	"usu_senha" text NOT NULL,
	"usu_tipo" text DEFAULT 'municipe' NOT NULL,
	"usu_ativo" boolean DEFAULT true NOT NULL,
	"usu_tentativas_login" integer DEFAULT 0,
	"usu_bloqueado_ate" timestamp,
	"usu_endereco" jsonb NOT NULL,
	"cid_id" uuid,
	CONSTRAINT "usuarios_usu_email_unique" UNIQUE("usu_email"),
	CONSTRAINT "usuarios_usu_cpf_unique" UNIQUE("usu_cpf"),
	CONSTRAINT "usuarios_usu_login_unique" UNIQUE("usu_login")
);
--> statement-breakpoint
ALTER TABLE "administradores" ADD CONSTRAINT "administradores_cid_id_cidades_cid_id_fk" FOREIGN KEY ("cid_id") REFERENCES "public"."cidades"("cid_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anexo" ADD CONSTRAINT "anexo_cha_id_chamado_cha_id_fk" FOREIGN KEY ("cha_id") REFERENCES "public"."chamado"("cha_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chamado" ADD CONSTRAINT "chamado_cha_departamento_departamentos_dep_id_fk" FOREIGN KEY ("cha_departamento") REFERENCES "public"."departamentos"("dep_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chamado" ADD CONSTRAINT "chamado_cha_responsavel_funcionario_fun_id_fk" FOREIGN KEY ("cha_responsavel") REFERENCES "public"."funcionario"("fun_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chamado" ADD CONSTRAINT "chamado_usu_id_usuarios_usu_id_fk" FOREIGN KEY ("usu_id") REFERENCES "public"."usuarios"("usu_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chamado" ADD CONSTRAINT "chamado_cat_id_categoria_cat_id_fk" FOREIGN KEY ("cat_id") REFERENCES "public"."categoria"("cat_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departamentos" ADD CONSTRAINT "departamentos_cid_id_cidades_cid_id_fk" FOREIGN KEY ("cid_id") REFERENCES "public"."cidades"("cid_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etapa" ADD CONSTRAINT "etapa_cha_id_chamado_cha_id_fk" FOREIGN KEY ("cha_id") REFERENCES "public"."chamado"("cha_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funcionario" ADD CONSTRAINT "funcionario_dep_id_departamentos_dep_id_fk" FOREIGN KEY ("dep_id") REFERENCES "public"."departamentos"("dep_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funcionario" ADD CONSTRAINT "funcionario_cid_id_cidades_cid_id_fk" FOREIGN KEY ("cid_id") REFERENCES "public"."cidades"("cid_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_cha_id_chamado_cha_id_fk" FOREIGN KEY ("cha_id") REFERENCES "public"."chamado"("cha_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_usu_id_usuarios_usu_id_fk" FOREIGN KEY ("usu_id") REFERENCES "public"."usuarios"("usu_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_fun_id_funcionario_fun_id_fk" FOREIGN KEY ("fun_id") REFERENCES "public"."funcionario"("fun_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_cid_id_cidades_cid_id_fk" FOREIGN KEY ("cid_id") REFERENCES "public"."cidades"("cid_id") ON DELETE no action ON UPDATE no action;