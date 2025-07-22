import { reset, seed } from 'drizzle-seed';
import { db, sql } from './connection.ts';
import { schema } from './schema/index.ts';

// Função para gerar CPF válido (sem máscara)
function generateCPF(): string {
  const rand = () => Math.floor(Math.random() * 9);
  const base = Array.from({ length: 9 }, rand);

  const calcDigit = (arr: number[], factor: number) => {
    const sum = arr.reduce((total, num, idx) => total + num * (factor - idx), 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const digit1 = calcDigit(base, 10);
  const digit2 = calcDigit([...base, digit1], 11);
  return [...base, digit1, digit2].join('');
}

// Reseta o banco e faz o seed
await reset(db, schema);

await seed(db, schema).refine((f) => ({
  usuarios: {
    count: 20,
    columns: {
      usu_nome: f.fullName(),
      usu_email: f.email(),
      usu_cpf: f.string(),
      usu_data_nascimento: f.date(),
      usu_login: f.lastName(),
      usu_senha: f.string(),
    },
  }
}));

await sql.end();
