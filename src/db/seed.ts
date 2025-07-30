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

await reset(db, schema);

await seed(db, schema).refine((f) => ({
  usuarios: {
    count: 20,
    columns: {
      usu_nome: f.fullName(),
      usu_email: f.email(),
      usu_cpf: f.default({ defaultValue: generateCPF() }),
      usu_data_nascimento: f.date({ minDate: '1980-01-01', maxDate: '2005-12-31' }),
      usu_login: f.firstName(),
      usu_senha: f.string(),
    },
  },

  departamentos: {
    count: 5,
    columns: {
      dep_nome: f.companyName(),
      dep_descricao: f.loremIpsum(),
    },
  },

  funcionarios: {
    count: 10,
    columns: {
      fun_nome: f.fullName(),
      fun_email: f.email(),
      fun_cpf: f.default({ defaultValue: generateCPF() }),
      fun_data_nascimento: f.date({ minDate: '1980-01-01', maxDate: '2000-12-31' }),
      fun_login: f.firstName(),
      fun_senha: f.string(),
      dep_id: f.default({ defaultValue: null }), // Será preenchido automaticamente
    },
  },

  categorias: {
    count: 5,
    columns: {
      cat_nome: f.string(),
      cat_descricao: f.loremIpsum(),
    },
  },

  chamados: {
    count: 15,
    columns: {
      cha_titulo: f.loremIpsum({ sentencesCount: 1 }),
      cha_descricao: f.loremIpsum({ sentencesCount: 3 }),
      cha_data_fechamento: f.datetime(),
      cha_data_abertura: f.datetime(),
      cha_nome: f.fullName(),
      cha_cep: f.string(),
      cha_numero_endereco: f.string(), // Corrigido: usando string diretamente
      cha_prioridade: f.valuesFromArray({ values: ['Baixa', 'Média', 'Alta'] }),
      cha_departamento: f.default({ defaultValue: null }), // Será preenchido automaticamente
      cha_responsavel: f.default({ defaultValue: null }), // Será preenchido automaticamente
      usu_id: f.default({ defaultValue: null }), // Será preenchido automaticamente
      cat_id: f.default({ defaultValue: null }), // Será preenchido automaticamente
    },
  },

  notificacoes: {
    count: 20,
    columns: {
      ntf_canal: f.valuesFromArray({ values: ['Email', 'SMS', 'Push'] }),
      ntf_mensagem: f.loremIpsum(),
      ntf_data_envio: f.datetime(),
      ntf_lida: f.valuesFromArray({ values: ['Sim', 'Não'] }),
      usu_id: f.default({ defaultValue: null }), // Será preenchido automaticamente
      cha_id: f.default({ defaultValue: null }), // Será preenchido automaticamente
    },
  },

  anexos: {
    count: 20,
    columns: {
      ane_tipo: f.valuesFromArray({ values: ['pdf', 'imagem', 'outro'] }),
      ane_caminho: f.string(),
    },
  },

  etapas: {
    count: 10,
    columns: {
      eta_descricao: f.loremIpsum(),
      eta_data_inicio: f.date({ minDate: '2024-01-01', maxDate: '2024-06-01' }),
      eta_data_fim: f.date({ minDate: '2024-06-02', maxDate: '2024-12-31' }),
      eta_nome: f.string(),
    },
  },
}));

await sql.end();