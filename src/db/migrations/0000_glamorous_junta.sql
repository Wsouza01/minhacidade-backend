CREATE TABLE "Departamento" (
	"dep_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dep_nome" text NOT NULL,
	"dep_descricao" text
);
--> statement-breakpoint
CREATE TABLE "Usuario" (
	"usu_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usu_nome" text NOT NULL,
	"usu_email" text NOT NULL,
	"usu_cpf" text NOT NULL,
	"usu_data_nascimento" date NOT NULL,
	"usu_criado" timestamp DEFAULT now() NOT NULL,
	"usu_login" text NOT NULL,
	"usu_senha" text NOT NULL
);
