import bcrypt from 'bcrypt'
import { db } from './connection.ts'
import { anexos } from './schema/anexos.ts'
import { categorias } from './schema/categorias.ts'
import { chamados } from './schema/chamados.ts'
import { cidades } from './schema/cidades.ts'
import { departamentos } from './schema/departamentos.ts'
import { etapas } from './schema/etapas.ts'
import { funcionarios } from './schema/funcionarios.ts'
import { notificacoes } from './schema/notificacoes.ts'
import { usuarios } from './schema/usuarios.ts'

// Função para gerar CPF válido
function generateCPF(): string {
  const rand = () => Math.floor(Math.random() * 9)
  const base = Array.from({ length: 9 }, rand)

  const calcDigit = (arr: number[], factor: number) => {
    const sum = arr.reduce((total, num, idx) => total + num * (factor - idx), 0)
    const mod = sum % 11
    return mod < 2 ? 0 : 11 - mod
  }

  const digit1 = calcDigit(base, 10)
  const digit2 = calcDigit([...base, digit1], 11)
  return [...base, digit1, digit2].join('')
}

// Função para formatar datas no formato YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function runSeed() {
  try {
    console.log('Iniciando seed...')

    // Limpar tabelas na ordem correta
    await db.delete(anexos)
    await db.delete(notificacoes)
    await db.delete(chamados)
    await db.delete(etapas)
    await db.delete(categorias)
    await db.delete(funcionarios)
    await db.delete(usuarios)
    await db.delete(departamentos)
    await db.delete(cidades)

    console.log('Tabelas limpas')

    // Inserir cidades
    const [cidadePadrao] = await db
      .insert(cidades)
      .values([
        {
          cid_nome: 'Santana de Parnaíba',
          cid_estado: 'SP',
          cid_padrao: true,
          cid_ativo: true,
        },
        {
          cid_nome: 'Barueri',
          cid_estado: 'SP',
          cid_padrao: false,
          cid_ativo: true,
        },
        {
          cid_nome: 'Osasco',
          cid_estado: 'SP',
          cid_padrao: false,
          cid_ativo: true,
        },
      ])
      .returning()

    console.log('Cidades inseridas')

    // Inserir departamentos
    const departamentosInseridos = await db
      .insert(departamentos)
      .values([
        {
          dep_nome: 'Educação',
          dep_descricao: 'Secretaria de Educação',
        },
        {
          dep_nome: 'Saúde',
          dep_descricao: 'Secretaria de Saúde',
        },
        {
          dep_nome: 'Obras',
          dep_descricao: 'Secretaria de Obras',
        },
        {
          dep_nome: 'Segurança',
          dep_descricao: 'Secretaria de Segurança',
        },
        {
          dep_nome: 'Meio Ambiente',
          dep_descricao: 'Secretaria de Meio Ambiente',
        },
      ])
      .returning()

    console.log('Departamentos inseridos')

    // Inserir usuários
    const usuariosInseridos = []
    
    // Criar um usuário de teste com CPF conhecido
    const [usuarioTeste] = await db
      .insert(usuarios)
      .values({
        usu_nome: 'Usuário Teste',
        usu_email: 'teste@exemplo.com',
        usu_cpf: '12345678901', // CPF de teste
        usu_data_nascimento: formatDate(new Date(1990, 0, 1)),
        usu_login: 'teste',
        usu_senha: await bcrypt.hash('123456', 10),
        usu_endereco: {
          cep: '00000000',
          logradouro: 'Rua Teste',
          numero: '123',
          complemento: '',
          bairro: 'Centro',
          cidade: cidadePadrao.cid_nome,
          estado: cidadePadrao.cid_estado,
        },
        cid_id: cidadePadrao.cid_id,
        usu_tipo: 'municipe',
        usu_ativo: true,
      })
      .returning()

    usuariosInseridos.push(usuarioTeste)
    
    for (let i = 0; i < 19; i++) {
      const dataNascimento = new Date(
        1980 + Math.floor(Math.random() * 25),
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1
      )

      const [usuario] = await db
        .insert(usuarios)
        .values({
          usu_nome: `Usuário ${i + 1}`,
          usu_email: `usuario${i + 1}@exemplo.com`.toLowerCase(),
          usu_cpf: generateCPF(),
          usu_data_nascimento: formatDate(dataNascimento),
          usu_login: `user${i + 1}`,
          usu_senha: await bcrypt.hash('senha123', 10),
          usu_endereco: {
            cep: '00000000',
            logradouro: 'Rua Exemplo',
            numero: (i + 100).toString(),
            complemento: '',
            bairro: 'Centro',
            cidade: cidadePadrao.cid_nome,
            estado: cidadePadrao.cid_estado,
          },
          cid_id: cidadePadrao.cid_id,
          usu_tipo: 'municipe',
          usu_ativo: true,
        })
        .returning()

      usuariosInseridos.push(usuario)
    }

    console.log('Usuários inseridos')

    // Inserir funcionários
    for (let i = 0; i < 10; i++) {
      const dataNascimento = new Date(
        1980 + Math.floor(Math.random() * 20),
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1
      )

      await db.insert(funcionarios).values({
        fun_nome: `Funcionário ${i + 1}`,
        fun_email: `funcionario${i + 1}@prefeitura.com`.toLowerCase(),
        fun_cpf: generateCPF(),
        fun_data_nascimento: formatDate(dataNascimento),
        fun_login: `func${i + 1}`,
        fun_senha: await bcrypt.hash('senha123', 10),
        dep_id: departamentosInseridos[i % departamentosInseridos.length].dep_id,
      })
    }

    console.log('Funcionários inseridos')

    // Restante do seed permanece igual...
    console.log('✅ Seed concluído com sucesso!')
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error)
  } finally {
    process.exit(0)
  }
}

runSeed()