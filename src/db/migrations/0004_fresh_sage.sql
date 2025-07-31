ALTER TABLE "usuario" RENAME TO "usuarios";--> statement-breakpoint
ALTER TABLE "usuarios" DROP CONSTRAINT "usuario_usu_email_unique";--> statement-breakpoint
ALTER TABLE "usuarios" DROP CONSTRAINT "usuario_usu_cpf_unique";--> statement-breakpoint
ALTER TABLE "usuarios" DROP CONSTRAINT "usuario_usu_login_unique";--> statement-breakpoint
ALTER TABLE "chamado" DROP CONSTRAINT "chamado_usu_id_usuario_usu_id_fk";
--> statement-breakpoint
ALTER TABLE "notificacao" DROP CONSTRAINT "notificacao_usu_id_usuario_usu_id_fk";
--> statement-breakpoint
ALTER TABLE "usuarios" DROP CONSTRAINT "usuario_cid_id_cidades_cid_id_fk";
--> statement-breakpoint
ALTER TABLE "chamado" ADD CONSTRAINT "chamado_usu_id_usuarios_usu_id_fk" FOREIGN KEY ("usu_id") REFERENCES "public"."usuarios"("usu_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_usu_id_usuarios_usu_id_fk" FOREIGN KEY ("usu_id") REFERENCES "public"."usuarios"("usu_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_cid_id_cidades_cid_id_fk" FOREIGN KEY ("cid_id") REFERENCES "public"."cidades"("cid_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_usu_email_unique" UNIQUE("usu_email");--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_usu_cpf_unique" UNIQUE("usu_cpf");--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_usu_login_unique" UNIQUE("usu_login");