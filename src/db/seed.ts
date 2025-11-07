import bcrypt from "bcrypt"
import { db } from "./connection.ts"
import { administradores } from "./schema/administradores.ts"
import { anexos } from "./schema/anexos.ts"
import { categorias } from "./schema/categorias.ts"
import { chamados } from "./schema/chamados.ts"
import { cidades } from "./schema/cidades.ts"
import { departamentos } from "./schema/departamentos.ts"
import { etapas } from "./schema/etapas.ts"
import { funcionarios } from "./schema/funcionarios.ts"
import { notificacoes } from "./schema/notificacoes.ts"
import { usuarios } from "./schema/usuarios.ts"

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
	return [...base, digit1, digit2].join("")
}

// Função para formatar datas no formato YYYY-MM-DD
function formatDate(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")
	return `${year}-${month}-${day}`
}

// Função para pegar um motivo aleatório do array de motivos
function _getRandomMotivo(motivos: string[]): string {
	const randomIndex = Math.floor(Math.random() * motivos.length)
	return motivos[randomIndex]
}

async function runSeed() {
	try {
		console.log("Iniciando seed...")

		// Limpar tabelas na ordem correta
		await db.delete(anexos)
		await db.delete(notificacoes)
		await db.delete(chamados)
		await db.delete(etapas)
		await db.delete(categorias)
		await db.delete(funcionarios)
		await db.delete(usuarios)
		await db.delete(administradores)
		await db.delete(departamentos)
		await db.delete(cidades)

		console.log("Tabelas limpas")

		// Inserir cidades
		const cidadesInseridas = await db
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
			.returning()

		const [cidadePadrao, cidadeBarueri, cidadeOsasco] = cidadesInseridas
		console.log("Cidades inseridas")

		// Inserir ADMIN GLOBAL (sem cidade, gerencia todo o sistema)
		const [_adminGlobal] = await db
			.insert(administradores)
			.values({
				adm_nome: "Administrador Global",
				adm_email: "admin.global@minhacidade.com",
				adm_cpf: "00000000000",
				adm_data_nascimento: "1975-01-01",
				adm_login: "admin.global",
				adm_senha: await bcrypt.hash("AdminGlobal@123", 10),
				cid_id: null, // NULL = admin global
				adm_ativo: true,
			})
			.returning()
		console.log("Admin Global inserido")

		// Inserir ADMINISTRADORES DE CIDADES
		const [_adminSantana] = await db
			.insert(administradores)
			.values({
				adm_nome: "Admin Santana de Parnaíba",
				adm_email: "admin.santana@minhacidade.com",
				adm_cpf: "11111111111",
				adm_data_nascimento: "1980-05-15",
				adm_login: "admin.santana",
				adm_senha: await bcrypt.hash("Admin@123", 10),
				cid_id: cidadePadrao.cid_id,
				adm_ativo: true,
			})
			.returning()

		const [_adminBarueri] = await db
			.insert(administradores)
			.values({
				adm_nome: "Admin Barueri",
				adm_email: "admin.barueri@minhacidade.com",
				adm_cpf: "22222222222",
				adm_data_nascimento: "1982-08-20",
				adm_login: "admin.barueri",
				adm_senha: await bcrypt.hash("Admin@123", 10),
				cid_id: cidadeBarueri.cid_id,
				adm_ativo: true,
			})
			.returning()

		const [_adminOsasco] = await db
			.insert(administradores)
			.values({
				adm_nome: "Admin Osasco",
				adm_email: "admin.osasco@minhacidade.com",
				adm_cpf: "33333333333",
				adm_data_nascimento: "1985-12-10",
				adm_login: "admin.osasco",
				adm_senha: await bcrypt.hash("Admin@123", 10),
				cid_id: cidadeOsasco.cid_id,
				adm_ativo: true,
			})
			.returning()
		console.log("Administradores de cidades inseridos")

		// Inserir departamentos para Santana de Parnaíba (cidade padrão)
		const departamentosSantana = await db
			.insert(departamentos)
			.values([
				{
					dep_nome: "Educação",
					dep_descricao: "Secretaria de Educação",
					cid_id: cidadePadrao.cid_id,
				},
				{
					dep_nome: "Saúde",
					dep_descricao: "Secretaria de Saúde",
					cid_id: cidadePadrao.cid_id,
				},
				{
					dep_nome: "Infraestrutura",
					dep_descricao: "Secretaria de Obras e Urbanismo",
					cid_id: cidadePadrao.cid_id,
				},
				{
					dep_nome: "Segurança",
					dep_descricao: "Secretaria de Segurança",
					cid_id: cidadePadrao.cid_id,
				},
				{
					dep_nome: "Meio Ambiente",
					dep_descricao: "Secretaria de Meio Ambiente",
					cid_id: cidadePadrao.cid_id,
				},
			])
			.returning()

		// Departamentos para Barueri
		const departamentosBarueri = await db
			.insert(departamentos)
			.values([
				{
					dep_nome: "Educação",
					dep_descricao: "Secretaria de Educação",
					cid_id: cidadeBarueri.cid_id,
				},
				{
					dep_nome: "Saúde",
					dep_descricao: "Secretaria de Saúde",
					cid_id: cidadeBarueri.cid_id,
				},
			])
			.returning()

		// Departamentos para Osasco
		const departamentosOsasco = await db
			.insert(departamentos)
			.values([
				{
					dep_nome: "Educação",
					dep_descricao: "Secretaria de Educação",
					cid_id: cidadeOsasco.cid_id,
				},
				{
					dep_nome: "Saúde",
					dep_descricao: "Secretaria de Saúde",
					cid_id: cidadeOsasco.cid_id,
				},
			])
			.returning()

		const _departamentosInseridos = [
			...departamentosSantana,
			...departamentosBarueri,
			...departamentosOsasco,
		]
		console.log("Departamentos inseridos para todas as cidades")

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
			.returning()
		console.log("Categorias inseridas")

		// Inserir usuário específico (Silas) - em Santana de Parnaíba
		const [usuarioSilas] = await db
			.insert(usuarios)
			.values({
				usu_nome: "Silas Martins",
				usu_email: "silas@email.com",
				usu_cpf: "33640692047",
				usu_data_nascimento: "1990-05-15",
				usu_login: "silas",
				usu_senha: await bcrypt.hash("Je@12345", 10),
				usu_endereco: {
					cep: "06543000",
					logradouro: "Rua Principal",
					numero: "123",
					complemento: "Apto 45",
					bairro: "Centro",
					cidade: cidadePadrao.cid_nome,
					estado: cidadePadrao.cid_estado,
				},
				cid_id: cidadePadrao.cid_id,
				usu_tipo: "municipe",
				usu_ativo: true,
			})
			.returning()

		// Inserir usuários adicionais - distribuídos entre as 3 cidades
		const usuariosInseridos = [usuarioSilas]
		const todasAsCidades = [cidadePadrao, cidadeBarueri, cidadeOsasco]

		for (let i = 0; i < 19; i++) {
			const senha = i < 10 ? await bcrypt.hash("senha123", 10) : "senha123"
			// Distribuir usuarios entre as 3 cidades (7 por cidade aproximadamente)
			const cidadeAtual = todasAsCidades[i % 3]

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
							Math.floor(Math.random() * 28) + 1,
						),
					),
					usu_login: `user${i + 1}`,
					usu_senha: senha,
					usu_endereco: {
						cep: "00000000",
						logradouro: "Rua Exemplo",
						numero: (i + 100).toString(),
						complemento: "",
						bairro: "Centro",
						cidade: cidadeAtual.cid_nome,
						estado: cidadeAtual.cid_estado,
					},
					cid_id: cidadeAtual.cid_id,
					usu_tipo: "municipe",
					usu_ativo: true,
				})
				.returning()

			usuariosInseridos.push(usuario)
		}

		console.log("Usuários inseridos")

		// Inserir ATENDENTE para Santana de Parnaíba
		const [funcionarioAtendente] = await db
			.insert(funcionarios)
			.values({
				fun_nome: "Atendente Santana",
				fun_email: "atendente@santanadeparnaiba.sp.gov.br",
				fun_cpf: "44444444444",
				fun_data_nascimento: "1985-06-15",
				fun_login: "atendente",
				fun_senha: await bcrypt.hash("Atendente@123", 10),
				fun_tipo: "atendente",
				dep_id: departamentosSantana[0].dep_id,
				cid_id: cidadePadrao.cid_id,
			})
			.returning()

		// Inserir funcionário específico (João Silva - Servidor)
		// CPF: 123.456.789-01 | Senha: Servidor@123
		const [funcionarioJoao] = await db
			.insert(funcionarios)
			.values({
				fun_nome: "João Silva",
				fun_email: "joao.silva@santanadeparnaiba.sp.gov.br",
				fun_cpf: "12345678901",
				fun_data_nascimento: "1985-03-20",
				fun_login: "joao.silva",
				fun_senha: await bcrypt.hash("Servidor@123", 10),
				fun_tipo: "servidor",
				dep_id: departamentosSantana[0].dep_id, // Departamento de Educação
				cid_id: cidadePadrao.cid_id,
			})
			.returning()

		// Inserir funcionários adicionais (servidores para Santana)
		const funcionariosInseridos = [funcionarioAtendente, funcionarioJoao]
		for (let i = 0; i < 9; i++) {
			const [funcionario] = await db
				.insert(funcionarios)
				.values({
					fun_nome: `Servidor ${i + 1}`,
					fun_email:
						`servidor${i + 1}@santanadeparnaiba.sp.gov.br`.toLowerCase(),
					fun_cpf: generateCPF(),
					fun_data_nascimento: formatDate(
						new Date(
							1980 + Math.floor(Math.random() * 20),
							Math.floor(Math.random() * 12),
							Math.floor(Math.random() * 28) + 1,
						),
					),
					fun_login: `servidor${i + 1}`,
					fun_senha: await bcrypt.hash("senha123", 10), // Senha criptografada
					fun_tipo: "servidor",
					dep_id: departamentosSantana[i % departamentosSantana.length].dep_id,
					cid_id: cidadePadrao.cid_id,
				})
				.returning()
			funcionariosInseridos.push(funcionario)
		}

		// Inserir ATENDENTE para Barueri
		const [funcionarioAtendenteBarueri] = await db
			.insert(funcionarios)
			.values({
				fun_nome: "Atendente Barueri",
				fun_email: "atendente@barueri.sp.gov.br",
				fun_cpf: "55555555555",
				fun_data_nascimento: "1986-07-20",
				fun_login: "atendente.barueri",
				fun_senha: await bcrypt.hash("Atendente@123", 10),
				fun_tipo: "atendente",
				dep_id: departamentosBarueri[0].dep_id,
				cid_id: cidadeBarueri.cid_id,
			})
			.returning()
		funcionariosInseridos.push(funcionarioAtendenteBarueri)

		// Inserir 2 servidores para Barueri
		for (let i = 0; i < 2; i++) {
			const [funcionario] = await db
				.insert(funcionarios)
				.values({
					fun_nome: `Servidor Barueri ${i + 1}`,
					fun_email: `servidor.barueri${i + 1}@barueri.sp.gov.br`.toLowerCase(),
					fun_cpf: generateCPF(),
					fun_data_nascimento: formatDate(
						new Date(
							1980 + Math.floor(Math.random() * 20),
							Math.floor(Math.random() * 12),
							Math.floor(Math.random() * 28) + 1,
						),
					),
					fun_login: `servidor.barueri${i + 1}`,
					fun_senha: await bcrypt.hash("senha123", 10),
					fun_tipo: "servidor",
					dep_id: departamentosBarueri[i % departamentosBarueri.length].dep_id,
					cid_id: cidadeBarueri.cid_id,
				})
				.returning()
			funcionariosInseridos.push(funcionario)
		}

		// Inserir ATENDENTE para Osasco
		const [funcionarioAtendenteOsasco] = await db
			.insert(funcionarios)
			.values({
				fun_nome: "Atendente Osasco",
				fun_email: "atendente@osasco.sp.gov.br",
				fun_cpf: "66666666666",
				fun_data_nascimento: "1987-09-25",
				fun_login: "atendente.osasco",
				fun_senha: await bcrypt.hash("Atendente@123", 10),
				fun_tipo: "atendente",
				dep_id: departamentosOsasco[0].dep_id, // Usar departamento de Osasco
				cid_id: cidadeOsasco.cid_id,
			})
			.returning()
		funcionariosInseridos.push(funcionarioAtendenteOsasco)

		// Inserir 2 servidores para Osasco
		for (let i = 0; i < 2; i++) {
			const [funcionario] = await db
				.insert(funcionarios)
				.values({
					fun_nome: `Servidor Osasco ${i + 1}`,
					fun_email: `servidor.osasco${i + 1}@osasco.sp.gov.br`.toLowerCase(),
					fun_cpf: generateCPF(),
					fun_data_nascimento: formatDate(
						new Date(
							1980 + Math.floor(Math.random() * 20),
							Math.floor(Math.random() * 12),
							Math.floor(Math.random() * 28) + 1,
						),
					),
					fun_login: `servidor.osasco${i + 1}`,
					fun_senha: await bcrypt.hash("senha123", 10),
					fun_tipo: "servidor",
					dep_id: departamentosOsasco[i % departamentosOsasco.length].dep_id,
					cid_id: cidadeOsasco.cid_id,
				})
				.returning()
			funcionariosInseridos.push(funcionario)
		}

		console.log("Funcionários inseridos para todas as cidades")

		// Inserir chamados
		const chamadosInseridos = []
		const prioridades = ["Alta", "Média", "Baixa"]
		const titulos = [
			"Solicitação de reparo",
			"Reclamação de serviço",
			"Pedido de informação",
			"Denúncia",
			"Sugestão de melhoria",
		]

		// Criar 15 chamados para o usuário Silas (todos em Santana de Parnaíba)
		for (let i = 0; i < 15; i++) {
			const departamento = departamentosSantana[i % departamentosSantana.length]

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

			const [chamado] = await db
				.insert(chamados)
				.values({
					cha_descricao: `Chamado ${i + 1} do usuário Silas - ${titulos[i % titulos.length]}`,
					cha_nome: `Chamado ${i + 1} - ${departamento.dep_nome}`,
					cha_data_abertura: dataAbertura,
					cha_data_fechamento: dataFechamento,
					cha_departamento: departamento.dep_id,
					cha_responsavel:
						i % 2 === 0
							? [
									funcionarioAtendente,
									funcionarioJoao,
									...Array.from({ length: 9 }, (_, idx) => ({
										fun_id: funcionariosInseridos[idx + 2].fun_id,
									})),
								][i % 11].fun_id
							: null,
					cha_cep: "06543000",
					cha_numero_endereco: String(100 + i),
					cha_titulo: titulos[i % titulos.length],
					cha_prioridade: prioridades[i % prioridades.length],
					usu_id: usuarioSilas.usu_id,
					cat_id: categoriasInseridas[i % categoriasInseridas.length].cat_id,
				})
				.returning()

			chamadosInseridos.push(chamado)
		}

		// Criar chamados para outros usuários - distribuídos por cidade
		for (let i = 0; i < 35; i++) {
			const usuario =
				usuariosInseridos[1 + (i % (usuariosInseridos.length - 1))] // Skip Silas

			// Determinar qual cidade o usuario pertence e usar departamentos dessa cidade
			let departamentosDisponiveis: typeof departamentosSantana
			let funcionariosDisponiveis: typeof funcionariosInseridos

			if (usuario.cid_id === cidadePadrao.cid_id) {
				// Santana
				departamentosDisponiveis = departamentosSantana
				funcionariosDisponiveis = [
					funcionarioAtendente,
					funcionarioJoao,
					...Array.from(
						{ length: 9 },
						(_, idx) => funcionariosInseridos[idx + 2],
					),
				]
			} else if (usuario.cid_id === cidadeBarueri.cid_id) {
				// Barueri
				departamentosDisponiveis = departamentosBarueri
				funcionariosDisponiveis = [
					funcionarioAtendenteBarueri,
					...Array.from(
						{ length: 2 },
						(_, idx) => funcionariosInseridos[13 + idx],
					),
				]
			} else {
				// Osasco
				departamentosDisponiveis = departamentosOsasco
				funcionariosDisponiveis = [
					funcionarioAtendenteOsasco,
					...Array.from(
						{ length: 2 },
						(_, idx) => funcionariosInseridos[15 + idx],
					),
				]
			}

			const departamento =
				departamentosDisponiveis[i % departamentosDisponiveis.length]

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

			const [chamado] = await db
				.insert(chamados)
				.values({
					cha_descricao: `Chamado ${i + 16} - ${titulos[i % titulos.length]}`,
					cha_nome: `Chamado ${i + 16} - ${departamento.dep_nome}`,
					cha_data_abertura: dataAbertura,
					cha_data_fechamento: dataFechamento,
					cha_departamento: departamento.dep_id,
					cha_responsavel:
						i % 2 === 0
							? funcionariosDisponiveis[i % funcionariosDisponiveis.length]
									.fun_id
							: null,
					cha_cep: "06543000",
					cha_numero_endereco: String(200 + i),
					cha_titulo: titulos[i % titulos.length],
					cha_prioridade: prioridades[i % prioridades.length],
					usu_id: usuario.usu_id,
					cat_id: categoriasInseridas[i % categoriasInseridas.length].cat_id,
				})
				.returning()

			chamadosInseridos.push(chamado)
		}

		console.log("Chamados inseridos")

		// Inserir notificações para o usuário Silas
		const tiposNotificacao = ["info", "success", "warning", "error"]
		const titulosNotificacao = [
			"Chamado atualizado",
			"Novo chamado criado",
			"Chamado finalizado",
			"Atenção necessária",
			"Prazo se aproxima",
		]
		const mensagensNotificacao = [
			"Seu chamado foi atualizado pelo responsável",
			"Um novo chamado foi criado com sucesso",
			"Seu chamado foi finalizado",
			"Seu chamado necessita de informações adicionais",
			"O prazo do seu chamado está se aproximando",
		]

		for (let i = 0; i < 10; i++) {
			const dataNotificacao = new Date()
			dataNotificacao.setDate(
				dataNotificacao.getDate() - Math.floor(Math.random() * 15),
			)

			await db.insert(notificacoes).values({
				not_titulo: titulosNotificacao[i % titulosNotificacao.length],
				not_mensagem: mensagensNotificacao[i % mensagensNotificacao.length],
				not_data_criacao: dataNotificacao,
				not_lida: i % 3 === 0, // 1/3 das notificações já lidas
				not_tipo: tiposNotificacao[i % tiposNotificacao.length],
				usu_id: usuarioSilas.usu_id,
			})
		}

		console.log("Notificações inseridas")

		console.log("✅ Seed concluído com sucesso!")
	} catch (error) {
		console.error("❌ Erro ao executar seed:", error)
	} finally {
		process.exit(0)
	}
}

runSeed()
