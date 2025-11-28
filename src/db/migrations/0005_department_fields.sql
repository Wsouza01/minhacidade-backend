ALTER TABLE "departamentos"
  ADD COLUMN "dep_prioridade" text NOT NULL DEFAULT 'Média',
  ADD COLUMN "dep_motivos" text[] NOT NULL DEFAULT ARRAY[]::text[];
