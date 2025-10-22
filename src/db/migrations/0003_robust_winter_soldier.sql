ALTER TABLE "funcionario" ADD COLUMN "fun_matricula" varchar(50);--> statement-breakpoint
ALTER TABLE "funcionario" ADD CONSTRAINT "funcionario_fun_matricula_unique" UNIQUE("fun_matricula");