import bcrypt from "bcrypt";
import { db } from "./connection.ts";
import { anexos } from "./schema/anexos.ts";
import { categorias } from "./schema/categorias.ts";
import { chamados } from "./schema/chamados.ts";
import { cidades } from "./schema/cidades.ts";
import { departamentos } from "./schema/departamentos.ts";
import { etapas } from "./schema/etapas.ts";
import { funcionarios } from "./schema/funcionarios.ts";
import { notificacoes } from "./schema/notificacoes.ts";
import { usuarios } from "./schema/usuarios.ts";

// Função para gerar CPF válido
function generateCPF(): string {
  const rand = () => Math.floor(Math.random() * 9);
  const base = Array.from({ length: 9 }, rand);

  const calcDigit = (arr: number[], factor: number) => {
    const sum = arr.reduce(
      (total, num, idx) => total + num * (factor - idx),
      0
    );
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const digit1 = calcDigit(base, 10);
  const digit2 = calcDigit([...base, digit1], 11);
  return [...base, digit1, digit2].join("");
}

// Função para formatar datas no formato YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Função para pegar um motivo aleatório do array de motivos
function getRandomMotivo(motivos: string[]): string {
  const randomIndex = Math.floor(Math.random() * motivos.length);
  return motivos[randomIndex];
}

async function runSeed() {
  try {
    console.log("Iniciando seed...");

    // Limpar tabelas na ordem correta
    await db.delete(anexos);
    await db.delete(notificacoes);
    await db.delete(chamados);
    await db.delete(etapas);
    await db.delete(categorias);
    await db.delete(funcionarios);
    await db.delete(usuarios);
    await db.delete(departamentos);
    await db.delete(cidades);

    console.log("Tabelas limpas");

    // Inserir cidades
    const [cidadePadrao] = await db
      .insert(cidades)
      .values([
        {
          cid_nome: "Santana de Parnaíba",
          cid_estado: "SP",
          cid_padrao: true,
          cid_ativo: true,
        },
        {
          cid_nome: "Barueri",
          cid_estado: "SP",
          cid_padrao: false,
          cid_ativo: true,
        },
        {
          cid_nome: "Osasco",
          cid_estado: "SP",
          cid_padrao: false,
          cid_ativo: true,
        },
      ])
      .returning();
    console.log("Cidades inseridas");

    // Inserir departamentos com motivos e prioridades
    const departamentosInseridos = await db
      .insert(departamentos)
      .values([
        {
          dep_nome: "Educação",
          dep_descricao: "Secretaria de Educação",
          dep_motivo: JSON.stringify({
            "Problema na infraestrutura das escolas": ["Alta", "Média"],
            "Solicitação de material didático": ["Baixa"],
            "Falta de professores": ["Alta", "Média"],
            "Reclamação sobre a qualidade da merenda escolar": ["Média"],
            "Problema com transporte escolar": ["Alta"],
          }),
        },
        {
          dep_nome: "Saúde",
          dep_descricao: "Secretaria de Saúde",
          dep_motivo: JSON.stringify({
            "Falta de medicamentos nos postos de saúde": ["Alta"],
            "Demora no atendimento médico": ["Média", "Alta"],
            "Queixa sobre atendimento de emergência": ["Alta"],
            "Problema no agendamento de consultas": ["Média"],
            "Falta de profissionais em unidades de saúde": ["Alta", "Média"],
          }),
        },
        {
          dep_nome: "Infraestrutura",
          dep_descricao: "Secretaria de Obras e Urbanismo",
          dep_motivo: JSON.stringify({
            "Buraco na rua que precisa de reparo": ["Alta", "Média"],
            "Problema com a iluminação pública": ["Média"],
            "Solicitação de pavimentação": ["Alta"],
            "Alagamento em via pública": ["Alta"],
            "Queixa sobre calçamento irregular": ["Média"],
          }),
        },
        {
          dep_nome: "Segurança",
          dep_descricao: "Secretaria de Segurança",
          dep_motivo: JSON.stringify({
            "Aumento da criminalidade na área": ["Alta"],
            "Solicitação de ronda policial": ["Média"],
            "Denúncia de tráfico de drogas": ["Alta"],
            "Queixa sobre falta de segurança em praças públicas": ["Média"],
            "Problema com sinalização de trânsito": ["Média"],
          }),
        },
        {
          dep_nome: "Meio Ambiente",
          dep_descricao: "Secretaria de Meio Ambiente",
          dep_motivo: JSON.stringify({
            "Denúncia de poluição do ar": ["Alta", "Média"],
            "Solicitação de limpeza de áreas verdes": ["Baixa", "Média"],
            "Queixa sobre desmatamento ilegal": ["Alta"],
            "Problema com o descarte inadequado de lixo": ["Alta"],
            "Reclamação sobre animais soltos nas ruas": ["Baixa"],
          }),
        },
      ])
      .returning();
    console.log("Departamentos inseridos");

    // Inserir categorias
    const categoriasInseridas = await db
      .insert(categorias)
      .values([
        {
          cat_nome: "Urgente",
          cat_descricao: "Categoria para chamados urgentes",
        },
        {
          cat_nome: "Normal",
          cat_descricao: "Categoria para chamados não urgentes",
        },
      ])
      .returning();
    console.log("Categorias inseridas");

    // Inserir usuários (metade com senha criptografada e metade com senha em texto simples)
    const usuariosInseridos = [];
    for (let i = 0; i < 20; i++) {
      const senha =
        i < 10
          ? await bcrypt.hash("senha123", 10) // Criptografada para os primeiros 10 usuários
          : "senha123"; // Senha em texto simples para os últimos 10 usuários

      const [usuario] = await db
        .insert(usuarios)
        .values({
          usu_nome: `Usuário ${i + 1}`,
          usu_email: `usuario${i + 1}@exemplo.com`.toLowerCase(),
          usu_cpf: generateCPF(),
          usu_data_nascimento: formatDate(
            new Date(
              1980 + Math.floor(Math.random() * 25),
              Math.floor(Math.random() * 12),
              Math.floor(Math.random() * 28) + 1
            )
          ),
          usu_login: `user${i + 1}`,
          usu_senha: senha,
          usu_endereco: {
            cep: "00000000",
            logradouro: "Rua Exemplo",
            numero: (i + 100).toString(),
            complemento: "",
            bairro: "Centro",
            cidade: cidadePadrao.cid_nome,
            estado: cidadePadrao.cid_estado,
          },
          cid_id: cidadePadrao.cid_id,
          usu_tipo: "municipe",
          usu_ativo: true,
        })
        .returning();

      usuariosInseridos.push(usuario);
    }

    console.log("Usuários inseridos");

    // Inserir funcionários
    const funcionariosInseridos = [];
    for (let i = 0; i < 10; i++) {
      const [funcionario] = await db
        .insert(funcionarios)
        .values({
          fun_nome: `Funcionário ${i + 1}`,
          fun_email: `funcionario${i + 1}@prefeitura.com`.toLowerCase(),
          fun_cpf: generateCPF(),
          fun_data_nascimento: formatDate(
            new Date(
              1980 + Math.floor(Math.random() * 20),
              Math.floor(Math.random() * 12),
              Math.floor(Math.random() * 28) + 1
            )
          ),
          fun_login: `func${i + 1}`,
          fun_senha: await bcrypt.hash("senha123", 10), // Senha criptografada
          dep_id:
            departamentosInseridos[i % departamentosInseridos.length].dep_id,
        })
        .returning();
      funcionariosInseridos.push(funcionario);
    }

    console.log("Funcionários inseridos");

    // Inserir chamados com motivação aleatória do departamento
    for (let i = 0; i < 10; i++) {
      const departamento =
        departamentosInseridos[i % departamentosInseridos.length];

      // Converter dep_motivo para string[] e pegar um motivo aleatório
      const motivos = JSON.parse(departamento.dep_motivo); // Agora dep_motivo é JSON e precisa ser parseado
      const motivoAleatorio = getRandomMotivo(Object.keys(motivos)); // Pega um motivo aleatório
      const prioridadeAleatoria = getRandomMotivo(motivos[motivoAleatorio]); // Pega uma prioridade aleatória

      await db.insert(chamados).values({
        cha_descricao: `Chamado de teste ${i + 1}`,
        cha_nome: `Chamado ${i + 1}`,
        cha_data_fechamento: new Date(2025, 5, 10), // Garantir que seja um objeto Date
        cha_departamento: departamento.dep_id,
        cha_responsavel:
          funcionariosInseridos[i % funcionariosInseridos.length].fun_id,
        cha_cep: "00000000",
        cha_numero_endereco: "123",
        cha_motivo: motivoAleatorio, // Usando motivo aleatório
        cha_prioridade: prioridadeAleatoria, // Usando prioridade aleatória
        usu_id: usuariosInseridos[i % usuariosInseridos.length].usu_id,
        cat_id: categoriasInseridas[i % categoriasInseridas.length].cat_id,
      });
    }

    console.log("Chamados inseridos");

    console.log("✅ Seed concluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao executar seed:", error);
  } finally {
    process.exit(0);
  }
}

runSeed();
