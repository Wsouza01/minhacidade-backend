CREATE TABLE "tokens_recuperacao" (
	"tok_id" uuid PRIMARY KEY NOT NULL,
	"tok_token" text NOT NULL,
	"tok_email" text NOT NULL,
	"tok_tipo_usuario" text NOT NULL,
	"tok_usado" timestamp with time zone,
	"tok_expira_em" timestamp with time zone NOT NULL,
	"tok_criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tokens_recuperacao_tok_token_unique" UNIQUE("tok_token")
);
