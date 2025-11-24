import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z
    .string()
    .min(1)
    .refine(
      (value) =>
        value.startsWith('postgres://') || value.startsWith('postgresql://'),
      {
        message: 'DATABASE_URL deve começar com postgres:// ou postgresql://',
      },
    ),
  JWT_SECRET: z.string().min(1).default('minha-cidade-secret-key-2025'),
  SMTP_HOST: z.string().min(1).default('smtp.ethereal.email'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().min(1).default('seu-email@ethereal.email'),
  SMTP_PASS: z.string().min(1).default('sua-senha-ethereal'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
})
export const env = envSchema.parse(process.env)
