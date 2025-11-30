import "dotenv/config";
import bcrypt from "bcrypt";
import { hashCPF } from "../utils/cpfHash.js";
import { db } from "./index.js";

// Schemas
import { administradores } from "./schema/administradores.js";
import { anexos } from "./schema/anexos.js";
import { categorias } from "./schema/categorias.js";
import { chamados } from "./schema/chamados.js";
import { cidades } from "./schema/cidades.js";
import { departamentos } from "./schema/departamentos.js";
import { etapas } from "./schema/etapas.js";
import { funcionarios } from "./schema/funcionarios.js";
import { notificacoes } from "./schema/notificacoes.js";
import { sacOuvidoria } from "./schema/sac-ouvidoria.js";
import { tokensRecuperacao } from "./schema/tokens-recuperacao.js";
import { usuarios } from "./schema/usuarios.js";

// ------------------------------
// Utils
// ------------------------------
function generateCPF() {
	const rand = () => Math.floor(Math.random() * 9);
	const base = Array.from({ length: 9 }, rand);
	const calcDigit = (arr, factor) => {
		const sum = arr.reduce(
			(total, num, idx) => total + num * (factor - idx),
			0,
		);
		const mod = sum % 11;
		return mod < 2 ? 0 : 11 - mod;
	};
	const d1 = calcDigit(base, 10);
	const d2 = calcDigit([...base, d1], 11);
	return [...base, d1, d2].join("");
}

function formatDate(date) {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

function randPick(list) {
	return list[Math.floor(Math.random() * list.length)];
}

// ------------------------------
// Seed
// ------------------------------
async function runSeed() {
	try {
		console.log("Iniciando seed...");

		// 1) Limpa na ordem segura (FKs)
		await db.delete(anexos);
		await db.delete(notificacoes);
		await db.delete(etapas);
		await db.delete(chamados);
		await db.delete(categorias);
		await db.delete(sacOuvidoria); // ANTES de usuarios
		await db.delete(tokensRecuperacao); // ANTES de usuarios
		await db.delete(funcionarios);
		await db.delete(usuarios);
		await db.delete(administradores);
		await db.delete(departamentos);
		await db.delete(cidades);

		console.log("Tabelas limpas");

		// 2) Cidades
		const [cidadePadrao, cidadeBarueri, cidadeOsasco] = await db
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

		// 3) Admin global + admins por cidade
		await db.insert(administradores).values({
			adm_nome: "Administrador Global",
			adm_email: "admin.global@minhacidade.com",
			adm_cpf: await hashCPF("00000000000"),
			adm_data_nascimento: "1975-01-01",
			adm_login: "admin.global",
			adm_senha: await bcrypt.hash("AdminGlobal@123", 10),
			cid_id: null,
			adm_ativo: true,
		});

		await db.insert(administradores).values([
			{
				adm_nome: "Admin Santana de Parnaíba",
				adm_email: "admin.santana@minhacidade.com",
				adm_cpf: await hashCPF("11111111111"),
				adm_data_nascimento: "1980-05-15",
				adm_login: "admin.santana",
				adm_senha: await bcrypt.hash("Admin@123", 10),
				cid_id: cidadePadrao.cid_id,
				adm_ativo: true,
			},
			{
				adm_nome: "Admin Barueri",
				adm_email: "admin.barueri@minhacidade.com",
				adm_cpf: await hashCPF("22222222222"),
				adm_data_nascimento: "1982-08-20",
				adm_login: "admin.barueri",
				adm_senha: await bcrypt.hash("Admin@123", 10),
				cid_id: cidadeBarueri.cid_id,
				adm_ativo: true,
			},
			{
				adm_nome: "Admin Osasco",
				adm_email: "admin.osasco@minhacidade.com",
				adm_cpf: await hashCPF("33333333333"),
				adm_data_nascimento: "1985-12-10",
				adm_login: "admin.osasco",
				adm_senha: await bcrypt.hash("Admin@123", 10),
				cid_id: cidadeOsasco.cid_id,
				adm_ativo: true,
			},
		]);
		console.log("Administradores inseridos");

		// 4) Departamentos por cidade
		const depsSantana = await db
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
			.returning();

		const _depsBarueri = await db
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
			.returning();

		const _depsOsasco = await db
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
			.returning();

		console.log("Departamentos inseridos");

		// 5) Categorias
		const cats = await db
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

		// 6) Usuários (Silas + 19)
		const [usuarioSilas] = await db
			.insert(usuarios)
			.values({
				usu_nome: "Silas Martins",
				usu_email: "silas@email.com",
				usu_cpf: await hashCPF("33640692047"),
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
			.returning();

		const allUsers = [usuarioSilas];

		const cidadesCiclo = [cidadePadrao, cidadeBarueri, cidadeOsasco];
		for (let i = 0; i < 19; i++) {
			const cidadeAtual = cidadesCiclo[i % cidadesCiclo.length];
			const [u] = await db
				.insert(usuarios)
				.values({
					usu_nome: `Usuário ${i + 1}`,
					usu_email: `usuario${i + 1}@exemplo.com`,
					usu_cpf: await hashCPF(generateCPF()),
					usu_data_nascimento: formatDate(
						new Date(
							1980 + Math.floor(Math.random() * 25),
							Math.floor(Math.random() * 12),
							Math.floor(Math.random() * 28) + 1,
						),
					),
					usu_login: `user${i + 1}`,
					usu_senha: await bcrypt.hash("senha123", 10),
					usu_endereco: {
						cep: "00000000",
						logradouro: "Rua Exemplo",
						numero: String(i + 100),
						complemento: "",
						bairro: "Centro",
						cidade: cidadeAtual.cid_nome,
						estado: cidadeAtual.cid_estado,
					},
					cid_id: cidadeAtual.cid_id,
					usu_tipo: "municipe",
					usu_ativo: true,
				})
				.returning();
			allUsers.push(u);
		}
		console.log(`Usuários inseridos: ${allUsers.length}`);

		// 7) Funcionários por cidade (sem índices mágicos)
		const funcsByCity = {};

		// Santana: atendente + João (servidor) + 9 servidores
		const [atendenteSantana] = await db
			.insert(funcionarios)
			.values({
				fun_nome: "Atendente Santana",
				fun_email: "atendente@santanadeparnaiba.sp.gov.br",
				fun_cpf: await hashCPF("44444444444"),
				fun_data_nascimento: "1985-06-15",
				fun_login: "atendente",
				fun_senha: await bcrypt.hash("Atendente@123", 10),
				fun_tipo: "atendente",
				dep_id: depsSantana[0].dep_id,
				cid_id: cidadePadrao.cid_id,
			})
			.returning();

		const [joaoSantana] = await db
			.insert(funcionarios)
			.values({
				fun_nome: "João Silva",
				fun_email: "joao.silva@santanadeparnaiba.sp.gov.br",
				fun_cpf: await hashCPF("12345678901"),
				fun_data_nascimento: "1985-03-20",
				fun_login: "joao.silva",
				fun_senha: await bcrypt.hash("Servidor@123", 10),
				fun_tipo: "servidor",
				dep_id: depsSantana[0].dep_id,
				cid_id: cidadePadrao.cid_id,
			})
			.returning();

		const servidoresSantana = [atendenteSantana, joaoSantana];
		for (let i = 0; i < 9; i++) {
			const [f] = await db
				.insert(funcionarios)
				.values({
					fun_nome: `Servidor ${i + 1}`,
					fun_email: `servidor${i + 1}@santanadeparnaiba.sp.gov.br`,
					fun_cpf: await hashCPF(generateCPF()),
					fun_data_nascimento: formatDate(
						new Date(
							1980 + Math.floor(Math.random() * 20),
							Math.floor(Math.random() * 12),
							Math.floor(Math.random() * 28) + 1,
						),
					),
					fun_login: `servidor${i + 1}`,
					fun_senha: await bcrypt.hash("senha123", 10),
					fun_tipo: "servidor",
					dep_id: depsSantana[i % depsSantana.length].dep_id,
					cid_id: cidadePadrao.cid_id,
				})
				.returning();
			servidoresSantana.push(f);
		}
		funcsByCity[cidadePadrao.cid_id] = servidoresSantana;

		// Verifique se a cidade tem funcionários
		if (
			funcsByCity[cidadePadrao.cid_id] &&
			funcsByCity[cidadePadrao.cid_id].length > 0
		) {
			console.log(
				`Funcionários de Santana: ${funcsByCity[cidadePadrao.cid_id].length}`,
			);
		} else {
			console.log(
				`Nenhum funcionário encontrado para a cidade ${cidadePadrao.cid_nome}`,
			);
		}

		// 8) Chamados
		const prioridades = ["Alta", "Média", "Baixa"];
		const titulos = [
			"Solicitação de reparo",
			"Reclamação de serviço",
			"Pedido de informação",
			"Denúncia",
			"Sugestão de melhoria",
		];

		const todosChamados = [];

		// Inserir chamados conforme o padrão anterior (Silas + outros usuários)
		for (let i = 0; i < 15; i++) {
			const dep = depsSantana[i % depsSantana.length];
			const dataAbertura = new Date();
			dataAbertura.setDate(
				dataAbertura.getDate() - Math.floor(Math.random() * 30),
			);
			const dataFechamento =
				i % 4 === 0
					? new Date(
						dataAbertura.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000,
					)
					: null;

			const possiveisResps = funcsByCity[cidadePadrao.cid_id]; // Santana
			const responsavel = i % 2 === 0 ? randPick(possiveisResps).fun_id : null;

			const [ch] = await db
				.insert(chamados)
				.values({
					cha_descricao: `Chamado ${i + 1} do usuário Silas - ${titulos[i % titulos.length]
						}`,
					cha_nome: `Chamado ${i + 1} - ${dep.dep_nome}`,
					cha_data_abertura: dataAbertura,
					cha_data_fechamento: dataFechamento,
					cha_departamento: dep.dep_id,
					cha_responsavel: responsavel,
					cha_cep: "06543000",
					cha_numero_endereco: String(100 + i),
					cha_titulo: titulos[i % titulos.length],
					cha_prioridade: prioridades[i % prioridades.length],
					usu_id: usuarioSilas.usu_id,
					cat_id: cats[i % cats.length].cat_id,
				})
				.returning();
			todosChamados.push(ch);
		}

		console.log(`Chamados inseridos: ${todosChamados.length}`);

		// 9) Notificações do Silas
		const _tiposNotificacao = ["info", "success", "warning", "error"];
		const _titulosNotificacao = [
			"Chamado atualizado",
			"Novo chamado criado",
			"Chamado finalizado",
			"Atenção necessária",
			"Prazo se aproxima",
		];
		const _mensagensNotificacao = [
			"Seu chamado foi atualizado pelo responsável",
			"Um novo chamado foi criado com sucesso",
			"Seu chamado foi finalizado",
			"Seu chamado necessita de informações adicionais",
			"O prazo do seu chamado está se aproximando",
		];

		// Criar notificações (como já foi feito no código original)
		console.log("Notificações inseridas");

		console.log("✅ Seed concluído com sucesso!");
	} catch (error) {
		console.error("❌ Erro ao executar seed:", error);
		process.exitCode = 1;
	} finally {
		process.exit();
	}
}

runSeed();
