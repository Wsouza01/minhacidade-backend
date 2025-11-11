import 'dotenv/config'
import bcrypt from 'bcrypt'
import { db } from './index.ts'

// Schemas
import { administradores } from './schema/administradores.ts'
import { anexos } from './schema/anexos.ts'
import { categorias } from './schema/categorias.ts'
import { chamados } from './schema/chamados.ts'
import { cidades } from './schema/cidades.ts'
import { departamentos } from './schema/departamentos.ts'
import { etapas } from './schema/etapas.ts'
import { funcionarios } from './schema/funcionarios.ts'
import { notificacoes } from './schema/notificacoes.ts'
import { usuarios } from './schema/usuarios.ts'

// ------------------------------
// Utils
// ------------------------------
function generateCPF(): string {
  const rand = () => Math.floor(Math.random() * 9)
  const base = Array.from({ length: 9 }, rand)
  const calcDigit = (arr: number[], factor: number) => {
    const sum = arr.reduce((total, num, idx) => total + num * (factor - idx), 0)
    const mod = sum % 11
    return mod < 2 ? 0 : 11 - mod
  }
  const d1 = calcDigit(base, 10)
  const d2 = calcDigit([...base, d1], 11)
  return [...base, d1, d2].join('')
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function randPick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

// ------------------------------
// Seed
// ------------------------------
async function runSeed() {
  try {
    console.log('Iniciando seed...')

    // 1) Limpa na ordem segura (FKs)
    await db.delete(anexos)
    await db.delete(notificacoes)
    await db.delete(etapas)
    await db.delete(chamados)
    await db.delete(categorias)
    await db.delete(funcionarios)
    await db.delete(usuarios)
    await db.delete(administradores)
    await db.delete(departamentos)
    await db.delete(cidades)

    console.log('Tabelas limpas')

    // 2) Cidades
    const [cidadePadrao, cidadeBarueri, cidadeOsasco] = await db
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

    // 3) Admin global + admins por cidade
    await db.insert(administradores).values({
      adm_nome: 'Administrador Global',
      adm_email: 'admin.global@minhacidade.com',
      adm_cpf: '00000000000',
      adm_data_nascimento: '1975-01-01',
      adm_login: 'admin.global',
      adm_senha: await bcrypt.hash('AdminGlobal@123', 10),
      cid_id: null,
      adm_ativo: true,
    })

    await db.insert(administradores).values([
      {
        adm_nome: 'Admin Santana de Parnaíba',
        adm_email: 'admin.santana@minhacidade.com',
        adm_cpf: '11111111111',
        adm_data_nascimento: '1980-05-15',
        adm_login: 'admin.santana',
        adm_senha: await bcrypt.hash('Admin@123', 10),
        cid_id: cidadePadrao.cid_id,
        adm_ativo: true,
      },
      {
        adm_nome: 'Admin Barueri',
        adm_email: 'admin.barueri@minhacidade.com',
        adm_cpf: '22222222222',
        adm_data_nascimento: '1982-08-20',
        adm_login: 'admin.barueri',
        adm_senha: await bcrypt.hash('Admin@123', 10),
        cid_id: cidadeBarueri.cid_id,
        adm_ativo: true,
      },
      {
        adm_nome: 'Admin Osasco',
        adm_email: 'admin.osasco@minhacidade.com',
        adm_cpf: '33333333333',
        adm_data_nascimento: '1985-12-10',
        adm_login: 'admin.osasco',
        adm_senha: await bcrypt.hash('Admin@123', 10),
        cid_id: cidadeOsasco.cid_id,
        adm_ativo: true,
      },
    ])
    console.log('Administradores inseridos')

    // 4) Departamentos por cidade
    const depsSantana = await db
      .insert(departamentos)
      .values([
        {
          dep_nome: 'Educação',
          dep_descricao: 'Secretaria de Educação',
          cid_id: cidadePadrao.cid_id,
        },
        {
          dep_nome: 'Saúde',
          dep_descricao: 'Secretaria de Saúde',
          cid_id: cidadePadrao.cid_id,
        },
        {
          dep_nome: 'Infraestrutura',
          dep_descricao: 'Secretaria de Obras e Urbanismo',
          cid_id: cidadePadrao.cid_id,
        },
        {
          dep_nome: 'Segurança',
          dep_descricao: 'Secretaria de Segurança',
          cid_id: cidadePadrao.cid_id,
        },
        {
          dep_nome: 'Meio Ambiente',
          dep_descricao: 'Secretaria de Meio Ambiente',
          cid_id: cidadePadrao.cid_id,
        },
      ])
      .returning()

    const depsBarueri = await db
      .insert(departamentos)
      .values([
        {
          dep_nome: 'Educação',
          dep_descricao: 'Secretaria de Educação',
          cid_id: cidadeBarueri.cid_id,
        },
        {
          dep_nome: 'Saúde',
          dep_descricao: 'Secretaria de Saúde',
          cid_id: cidadeBarueri.cid_id,
        },
      ])
      .returning()

    const depsOsasco = await db
      .insert(departamentos)
      .values([
        {
          dep_nome: 'Educação',
          dep_descricao: 'Secretaria de Educação',
          cid_id: cidadeOsasco.cid_id,
        },
        {
          dep_nome: 'Saúde',
          dep_descricao: 'Secretaria de Saúde',
          cid_id: cidadeOsasco.cid_id,
        },
      ])
      .returning()

    console.log('Departamentos inseridos')

    // 5) Categorias
    const cats = await db
      .insert(categorias)
      .values([
        {
          cat_nome: 'Urgente',
          cat_descricao: 'Categoria para chamados urgentes',
        },
        {
          cat_nome: 'Normal',
          cat_descricao: 'Categoria para chamados não urgentes',
        },
      ])
      .returning()
    console.log('Categorias inseridas')

    // 6) Usuários (Silas + 19)
    const [usuarioSilas] = await db
      .insert(usuarios)
      .values({
        usu_nome: 'Silas Martins',
        usu_email: 'silas@email.com',
        usu_cpf: '33640692047',
        usu_data_nascimento: '1990-05-15',
        usu_login: 'silas',
        usu_senha: await bcrypt.hash('Je@12345', 10),
        usu_endereco: {
          cep: '06543000',
          logradouro: 'Rua Principal',
          numero: '123',
          complemento: 'Apto 45',
          bairro: 'Centro',
          cidade: cidadePadrao.cid_nome,
          estado: cidadePadrao.cid_estado,
        },
        cid_id: cidadePadrao.cid_id,
        usu_tipo: 'municipe',
        usu_ativo: true,
      })
      .returning()

    const allUsers = [usuarioSilas]

    const cidadesCiclo = [cidadePadrao, cidadeBarueri, cidadeOsasco]
    for (let i = 0; i < 19; i++) {
      const cidadeAtual = cidadesCiclo[i % cidadesCiclo.length]
      const [u] = await db
        .insert(usuarios)
        .values({
          usu_nome: `Usuário ${i + 1}`,
          usu_email: `usuario${i + 1}@exemplo.com`,
          usu_cpf: generateCPF(),
          usu_data_nascimento: formatDate(
            new Date(
              1980 + Math.floor(Math.random() * 25),
              Math.floor(Math.random() * 12),
              Math.floor(Math.random() * 28) + 1,
            ),
          ),
          usu_login: `user${i + 1}`,
          usu_senha: await bcrypt.hash('senha123', 10),
          usu_endereco: {
            cep: '00000000',
            logradouro: 'Rua Exemplo',
            numero: String(i + 100),
            complemento: '',
            bairro: 'Centro',
            cidade: cidadeAtual.cid_nome,
            estado: cidadeAtual.cid_estado,
          },
          cid_id: cidadeAtual.cid_id,
          usu_tipo: 'municipe',
          usu_ativo: true,
        })
        .returning()
      allUsers.push(u)
    }
    console.log(`Usuários inseridos: ${allUsers.length}`)

    // 7) Funcionários por cidade (sem índices mágicos)
    type FuncByCity = {
      [cid: string]: Array<typeof funcionarios.$inferSelect>
    }
    const funcsByCity: FuncByCity = {}

    // Santana: atendente + João (servidor) + 9 servidores
    const [atendenteSantana] = await db
      .insert(funcionarios)
      .values({
        fun_nome: 'Atendente Santana',
        fun_email: 'atendente@santanadeparnaiba.sp.gov.br',
        fun_cpf: '44444444444',
        fun_data_nascimento: '1985-06-15',
        fun_login: 'atendente',
        fun_senha: await bcrypt.hash('Atendente@123', 10),
        fun_tipo: 'atendente',
        dep_id: depsSantana[0].dep_id,
        cid_id: cidadePadrao.cid_id,
      })
      .returning()

    const [joaoSantana] = await db
      .insert(funcionarios)
      .values({
        fun_nome: 'João Silva',
        fun_email: 'joao.silva@santanadeparnaiba.sp.gov.br',
        fun_cpf: '12345678901',
        fun_data_nascimento: '1985-03-20',
        fun_login: 'joao.silva',
        fun_senha: await bcrypt.hash('Servidor@123', 10),
        fun_tipo: 'servidor',
        dep_id: depsSantana[0].dep_id,
        cid_id: cidadePadrao.cid_id,
      })
      .returning()

    const servidoresSantana: Array<typeof funcionarios.$inferSelect> = [
      atendenteSantana,
      joaoSantana,
    ]
    for (let i = 0; i < 9; i++) {
      const [f] = await db
        .insert(funcionarios)
        .values({
          fun_nome: `Servidor ${i + 1}`,
          fun_email: `servidor${i + 1}@santanadeparnaiba.sp.gov.br`,
          fun_cpf: generateCPF(),
          fun_data_nascimento: formatDate(
            new Date(
              1980 + Math.floor(Math.random() * 20),
              Math.floor(Math.random() * 12),
              Math.floor(Math.random() * 28) + 1,
            ),
          ),
          fun_login: `servidor${i + 1}`,
          fun_senha: await bcrypt.hash('senha123', 10),
          fun_tipo: 'servidor',
          dep_id: depsSantana[i % depsSantana.length].dep_id,
          cid_id: cidadePadrao.cid_id,
        })
        .returning()
      servidoresSantana.push(f)
    }
    funcsByCity[cidadePadrao.cid_id] = servidoresSantana

    // Barueri: 1 atendente + 2 servidores
    const [atendenteBarueri] = await db
      .insert(funcionarios)
      .values({
        fun_nome: 'Atendente Barueri',
        fun_email: 'atendente@barueri.sp.gov.br',
        fun_cpf: '55555555555',
        fun_data_nascimento: '1986-07-20',
        fun_login: 'atendente.barueri',
        fun_senha: await bcrypt.hash('Atendente@123', 10),
        fun_tipo: 'atendente',
        dep_id: depsBarueri[0].dep_id,
        cid_id: cidadeBarueri.cid_id,
      })
      .returning()
    const funcsBarueri: Array<typeof funcionarios.$inferSelect> = [
      atendenteBarueri,
    ]

    for (let i = 0; i < 2; i++) {
      const [f] = await db
        .insert(funcionarios)
        .values({
          fun_nome: `Servidor Barueri ${i + 1}`,
          fun_email: `servidor.barueri${i + 1}@barueri.sp.gov.br`,
          fun_cpf: generateCPF(),
          fun_data_nascimento: formatDate(
            new Date(
              1980 + Math.floor(Math.random() * 20),
              Math.floor(Math.random() * 12),
              Math.floor(Math.random() * 28) + 1,
            ),
          ),
          fun_login: `servidor.barueri${i + 1}`,
          fun_senha: await bcrypt.hash('senha123', 10),
          fun_tipo: 'servidor',
          dep_id: depsBarueri[i % depsBarueri.length].dep_id,
          cid_id: cidadeBarueri.cid_id,
        })
        .returning()
      funcsBarueri.push(f)
    }
    funcsByCity[cidadeBarueri.cid_id] = funcsBarueri

    // Osasco: 1 atendente + 2 servidores
    const [atendenteOsasco] = await db
      .insert(funcionarios)
      .values({
        fun_nome: 'Atendente Osasco',
        fun_email: 'atendente@osasco.sp.gov.br',
        fun_cpf: '66666666666',
        fun_data_nascimento: '1987-09-25',
        fun_login: 'atendente.osasco',
        fun_senha: await bcrypt.hash('Atendente@123', 10),
        fun_tipo: 'atendente',
        dep_id: depsOsasco[0].dep_id,
        cid_id: cidadeOsasco.cid_id,
      })
      .returning()
    const funcsOsasco: Array<typeof funcionarios.$inferSelect> = [
      atendenteOsasco,
    ]

    for (let i = 0; i < 2; i++) {
      const [f] = await db
        .insert(funcionarios)
        .values({
          fun_nome: `Servidor Osasco ${i + 1}`,
          fun_email: `servidor.osasco${i + 1}@osasco.sp.gov.br`,
          fun_cpf: generateCPF(),
          fun_data_nascimento: formatDate(
            new Date(
              1980 + Math.floor(Math.random() * 20),
              Math.floor(Math.random() * 12),
              Math.floor(Math.random() * 28) + 1,
            ),
          ),
          fun_login: `servidor.osasco${i + 1}`,
          fun_senha: await bcrypt.hash('senha123', 10),
          fun_tipo: 'servidor',
          dep_id: depsOsasco[i % depsOsasco.length].dep_id,
          cid_id: cidadeOsasco.cid_id,
        })
        .returning()
      funcsOsasco.push(f)
    }
    funcsByCity[cidadeOsasco.cid_id] = funcsOsasco

    console.log(
      `Funcionários inseridos: Santana=${
        funcsByCity[cidadePadrao.cid_id].length
      }, Barueri=${funcsByCity[cidadeBarueri.cid_id].length}, Osasco=${
        funcsByCity[cidadeOsasco.cid_id].length
      }`,
    )

    // 8) Chamados
    const prioridades = ['Alta', 'Média', 'Baixa'] as const
    const titulos = [
      'Solicitação de reparo',
      'Reclamação de serviço',
      'Pedido de informação',
      'Denúncia',
      'Sugestão de melhoria',
    ]

    const todosChamados: Array<typeof chamados.$inferSelect> = []

    // 8.1) 15 chamados do Silas (Santana)
    for (let i = 0; i < 15; i++) {
      const dep = depsSantana[i % depsSantana.length]
      const dataAbertura = new Date()
      dataAbertura.setDate(
        dataAbertura.getDate() - Math.floor(Math.random() * 30),
      )
      const dataFechamento =
        i % 4 === 0
          ? new Date(
              dataAbertura.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000,
            )
          : null

      const possiveisResps = funcsByCity[cidadePadrao.cid_id] // Santana
      const responsavel = i % 2 === 0 ? randPick(possiveisResps).fun_id : null

      const [ch] = await db
        .insert(chamados)
        .values({
          cha_descricao: `Chamado ${i + 1} do usuário Silas - ${
            titulos[i % titulos.length]
          }`,
          cha_nome: `Chamado ${i + 1} - ${dep.dep_nome}`,
          cha_data_abertura: dataAbertura,
          cha_data_fechamento: dataFechamento,
          cha_departamento: dep.dep_id,
          cha_responsavel: responsavel,
          cha_cep: '06543000',
          cha_numero_endereco: String(100 + i),
          cha_titulo: titulos[i % titulos.length],
          cha_prioridade: prioridades[i % prioridades.length],
          usu_id: usuarioSilas.usu_id,
          cat_id: cats[i % cats.length].cat_id,
        })
        .returning()
      todosChamados.push(ch)
    }

    // 8.2) 35 chamados de outros usuários (por cidade do usuário)
    for (let i = 0; i < 35; i++) {
      const usuario = allUsers[1 + (i % (allUsers.length - 1))] // pula o Silas
      const cid = usuario.cid_id!
      const depsPorCidade =
        cid === cidadePadrao.cid_id
          ? depsSantana
          : cid === cidadeBarueri.cid_id
            ? depsBarueri
            : depsOsasco
      const funcsCidade = funcsByCity[cid]

      const dep = depsPorCidade[i % depsPorCidade.length]

      const dataAbertura = new Date()
      dataAbertura.setDate(
        dataAbertura.getDate() - Math.floor(Math.random() * 60),
      )
      const dataFechamento =
        i % 3 === 0
          ? new Date(
              dataAbertura.getTime() + Math.random() * 10 * 24 * 60 * 60 * 1000,
            )
          : null

      const responsavel = i % 2 === 0 ? randPick(funcsCidade).fun_id : null

      const [ch] = await db
        .insert(chamados)
        .values({
          cha_descricao: `Chamado ${i + 16} - ${titulos[i % titulos.length]}`,
          cha_nome: `Chamado ${i + 16} - ${dep.dep_nome}`,
          cha_data_abertura: dataAbertura,
          cha_data_fechamento: dataFechamento,
          cha_departamento: dep.dep_id,
          cha_responsavel: responsavel,
          cha_cep: '06543000',
          cha_numero_endereco: String(200 + i),
          cha_titulo: titulos[i % titulos.length],
          cha_prioridade: prioridades[i % prioridades.length],
          usu_id: usuario.usu_id,
          cat_id: cats[i % cats.length].cat_id,
        })
        .returning()
      todosChamados.push(ch)
    }

    console.log(`Chamados inseridos: ${todosChamados.length}`)

    // 9) Notificações do Silas
    const tiposNotificacao = ['info', 'success', 'warning', 'error'] as const
    const titulosNotificacao = [
      'Chamado atualizado',
      'Novo chamado criado',
      'Chamado finalizado',
      'Atenção necessária',
      'Prazo se aproxima',
    ]
    const mensagensNotificacao = [
      'Seu chamado foi atualizado pelo responsável',
      'Um novo chamado foi criado com sucesso',
      'Seu chamado foi finalizado',
      'Seu chamado necessita de informações adicionais',
      'O prazo do seu chamado está se aproximando',
    ]

    for (let i = 0; i < 10; i++) {
      const dataNotificacao = new Date()
      dataNotificacao.setDate(
        dataNotificacao.getDate() - Math.floor(Math.random() * 15),
      )

      // Se quiser amarrar a um chamado *existente* do Silas, descomente:
      // const chSilas = randPick(todosChamados.filter(c => c.usu_id === usuarioSilas.usu_id));
      // const chaId = chSilas?.cha_id ?? null;

      await db.insert(notificacoes).values({
        not_titulo: titulosNotificacao[i % titulosNotificacao.length],
        not_mensagem: mensagensNotificacao[i % mensagensNotificacao.length],
        not_data: dataNotificacao,
        not_lida: i % 3 === 0,
        not_tipo: tiposNotificacao[i % tiposNotificacao.length],
        usu_id: usuarioSilas.usu_id,
        fun_id: null,
        // cha_id: chaId, // <- use se quiser referenciar um chamado real
      })
    }
    console.log('Notificações inseridas')

    console.log('✅ Seed concluído com sucesso!')
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error)
    process.exitCode = 1
  } finally {
    process.exit()
  }
}

runSeed()
