import "dotenv/config";
import bcrypt from "bcrypt";
import { eq, and, or } from "drizzle-orm";
import { hashCPF } from "../utils/cpfHash.js";
import { db } from "./index.js";
import { administradores } from "./schema/administradores.js";
import { categorias } from "./schema/categorias.js";
import { cidades } from "./schema/cidades.js";
import { departamentos } from "./schema/departamentos.js";
import { chamados } from "./schema/chamados.js";
import { usuarios } from "./schema/usuarios.js";
const citySeeds = [
    {
        name: "Santana de Parnaíba",
        state: "SP",
        padrao: true,
        ativo: true,
    },
    { name: "Barueri", state: "SP", padrao: false, ativo: true },
    { name: "Osasco", state: "SP", padrao: false, ativo: true },
];
const departmentSeeds = [
    {
        name: "Educação",
        description: "Secretaria de Educação",
        city: "Santana de Parnaíba",
    },
    {
        name: "Saúde",
        description: "Secretaria de Saúde",
        city: "Santana de Parnaíba",
    },
    {
        name: "Infraestrutura",
        description: "Secretaria de Obras e Urbanismo",
        city: "Santana de Parnaíba",
    },
    {
        name: "Segurança",
        description: "Secretaria de Segurança",
        city: "Santana de Parnaíba",
    },
    {
        name: "Meio Ambiente",
        description: "Secretaria de Meio Ambiente",
        city: "Santana de Parnaíba",
    },
    {
        name: "Educação",
        description: "Secretaria de Educação",
        city: "Barueri",
    },
    {
        name: "Saúde",
        description: "Secretaria de Saúde",
        city: "Barueri",
    },
    {
        name: "Educação",
        description: "Secretaria de Educação",
        city: "Osasco",
    },
    {
        name: "Saúde",
        description: "Secretaria de Saúde",
        city: "Osasco",
    },
];
const categorySeeds = [
    { name: "Urgente", description: "Categoria para chamados urgentes" },
    { name: "Normal", description: "Categoria para chamados não urgentes" },
];
const adminSeeds = [
    {
        login: "admin.global",
        name: "Administrador Global",
        email: "admin.global@minhacidade.com",
        cpf: "00000000000",
        birthDate: "1975-01-01",
        password: "AdminGlobal@123",
        city: null,
    },
    {
        login: "admin.santana",
        name: "Admin Santana de Parnaíba",
        email: "admin.santana@minhacidade.com",
        cpf: "11111111111",
        birthDate: "1980-05-15",
        password: "Admin@123",
        city: "Santana de Parnaíba",
    },
    {
        login: "admin.barueri",
        name: "Admin Barueri",
        email: "admin.barueri@minhacidade.com",
        cpf: "22222222222",
        birthDate: "1982-08-20",
        password: "Admin@123",
        city: "Barueri",
    },
    {
        login: "admin.osasco",
        name: "Admin Osasco",
        email: "admin.osasco@minhacidade.com",
        cpf: "33333333333",
        birthDate: "1985-12-10",
        password: "Admin@123",
        city: "Osasco",
    },
];
const defaultUser = {
    login: "silas",
    name: "Silas Martins",
    email: "silas@email.com",
    cpf: "33640692047",
    birthDate: "1990-05-15",
    password: "Je@12345",
};
const chamadoSeeds = [
    {
        titulo: "Iluminação pública apagada",
        descricao: "A praça central de Santana está sem iluminação adequada desde a semana passada.",
        departamento: "Infraestrutura",
        prioridade: "Alta",
        categoria: "Urgente",
        cep: "06543000",
        numero: "150",
    },
    {
        titulo: "Reparo de escola municipal",
        descricao: "A cobertura da EMEF Luz do Amanhã está com infiltrações e precisa de manutenção.",
        departamento: "Educação",
        prioridade: "Média",
        categoria: "Normal",
        cep: "06543010",
        numero: "250",
    },
    {
        titulo: "Vacinação pendente",
        descricao: "Paciente relata atraso na aplicação da segunda dose de vacina infantil no posto Cruzeiro.",
        departamento: "Saúde",
        prioridade: "Média",
        categoria: "Normal",
        cep: "06543020",
        numero: "337",
    },
];
async function ensureCities() {
    const cityMap = new Map();
    for (const seed of citySeeds) {
        const [existingCity] = await db
            .select()
            .from(cidades)
            .where(eq(cidades.cid_nome, seed.name))
            .limit(1);
        if (existingCity) {
            const needsUpdate = existingCity.cid_estado !== seed.state ||
                existingCity.cid_padrao !== seed.padrao ||
                existingCity.cid_ativo !== seed.ativo;
            if (needsUpdate) {
                await db
                    .update(cidades)
                    .set({
                    cid_estado: seed.state,
                    cid_padrao: seed.padrao,
                    cid_ativo: seed.ativo,
                })
                    .where(eq(cidades.cid_id, existingCity.cid_id));
            }
            cityMap.set(seed.name, existingCity);
            continue;
        }
        const [createdCity] = await db
            .insert(cidades)
            .values({
            cid_nome: seed.name,
            cid_estado: seed.state,
            cid_padrao: seed.padrao,
            cid_ativo: seed.ativo,
        })
            .returning();
        cityMap.set(seed.name, createdCity);
    }
    return cityMap;
}
async function ensureCategories() {
    for (const seed of categorySeeds) {
        const [existingCategory] = await db
            .select()
            .from(categorias)
            .where(eq(categorias.cat_nome, seed.name))
            .limit(1);
        if (existingCategory) {
            continue;
        }
        await db.insert(categorias).values({
            cat_nome: seed.name,
            cat_descricao: seed.description,
        });
    }
}
async function ensureDepartments(cityMap) {
    for (const seed of departmentSeeds) {
        const city = cityMap.get(seed.city);
        if (!city) {
            continue;
        }
        const [existingDepartment] = await db
            .select()
            .from(departamentos)
            .where(and(eq(departamentos.dep_nome, seed.name), eq(departamentos.cid_id, city.cid_id)))
            .limit(1);
        if (existingDepartment) {
            continue;
        }
        await db.insert(departamentos).values({
            dep_nome: seed.name,
            dep_descricao: seed.description,
            cid_id: city.cid_id,
            dep_prioridade: seed.priority ?? "Média",
            dep_motivos: seed.reasons ?? [],
        });
    }
}
async function ensureAdmins(cityMap) {
    for (const seed of adminSeeds) {
        const cityId = seed.city ? (cityMap.get(seed.city)?.cid_id ?? null) : null;
        const [existingAdmin] = await db
            .select()
            .from(administradores)
            .where(eq(administradores.adm_login, seed.login))
            .limit(1);
        const payload = {
            adm_nome: seed.name,
            adm_email: seed.email,
            adm_cpf: await hashCPF(seed.cpf),
            adm_data_nascimento: seed.birthDate,
            adm_login: seed.login,
            adm_senha: await bcrypt.hash(seed.password, 10),
            cid_id: cityId,
            adm_ativo: true,
        };
        if (existingAdmin) {
            await db
                .update(administradores)
                .set(payload)
                .where(eq(administradores.adm_id, existingAdmin.adm_id));
            continue;
        }
        await db.insert(administradores).values(payload);
    }
}
async function ensureDefaultUser(cityMap) {
    const padraoCity = cityMap.get("Santana de Parnaíba");
    if (!padraoCity) {
        return null;
    }
    const [existingUser] = await db
        .select()
        .from(usuarios)
        .where(eq(usuarios.usu_login, defaultUser.login))
        .limit(1);
    const hashedCpf = await hashCPF(defaultUser.cpf);
    const hashedPassword = existingUser
        ? (existingUser.usu_senha ?? (await bcrypt.hash(defaultUser.password, 10)))
        : await bcrypt.hash(defaultUser.password, 10);
    const payload = {
        usu_nome: defaultUser.name,
        usu_email: defaultUser.email,
        usu_cpf: hashedCpf,
        usu_data_nascimento: defaultUser.birthDate,
        usu_login: defaultUser.login,
        usu_senha: hashedPassword,
        usu_endereco: {
            cep: "06543000",
            logradouro: "Rua Principal",
            numero: "123",
            complemento: "Apto 45",
            bairro: "Centro",
            cidade: padraoCity.cid_nome,
            estado: padraoCity.cid_estado,
        },
        cid_id: padraoCity.cid_id,
        usu_tipo: "municipe",
        usu_ativo: true,
    };
    if (existingUser) {
        const [updatedUser] = await db
            .update(usuarios)
            .set(payload)
            .where(eq(usuarios.usu_id, existingUser.usu_id))
            .returning();
        return {
            userId: updatedUser?.usu_id ?? existingUser.usu_id,
            cityId: padraoCity.cid_id,
        };
    }
    const [createdUser] = await db.insert(usuarios).values(payload).returning();
    return {
        userId: createdUser.usu_id,
        cityId: padraoCity.cid_id,
    };
}
async function ensureDefaultUserChamados(userId, cityId) {
    const [existingChamado] = await db
        .select()
        .from(chamados)
        .where(eq(chamados.usu_id, userId))
        .limit(1);
    if (existingChamado) {
        return;
    }
    const departmentRows = await db
        .select({
        id: departamentos.dep_id,
        name: departamentos.dep_nome,
    })
        .from(departamentos)
        .where(eq(departamentos.cid_id, cityId));
    if (departmentRows.length === 0) {
        return;
    }
    const categoryRows = await db
        .select({
        id: categorias.cat_id,
        name: categorias.cat_nome,
    })
        .from(categorias)
        .where(or(eq(categorias.cat_nome, "Urgente"), eq(categorias.cat_nome, "Normal")));
    const departmentMap = new Map(departmentRows.map((row) => [row.name, row]));
    const categoryMap = new Map(categoryRows.map((row) => [row.name, row]));
    for (const seed of chamadoSeeds) {
        const department = departmentMap.get(seed.departamento);
        const category = categoryMap.get(seed.categoria);
        if (!department || !category) {
            continue;
        }
        const [existing] = await db
            .select()
            .from(chamados)
            .where(and(eq(chamados.usu_id, userId), eq(chamados.cha_titulo, seed.titulo)))
            .limit(1);
        if (existing) {
            continue;
        }
        await db.insert(chamados).values({
            cha_descricao: seed.descricao,
            cha_nome: `Chamado - ${seed.titulo}`,
            cha_prioridade: seed.prioridade,
            cha_titulo: seed.titulo,
            cha_cep: seed.cep,
            cha_numero_endereco: seed.numero,
            cha_departamento: department.id,
            cat_id: category.id,
            usu_id: userId,
            cha_responsavel: null,
            cha_status: seed.status ?? "Pendente",
            cha_data_abertura: seed.dataAbertura ?? new Date(),
            cha_data_fechamento: seed.dataFechamento ?? null,
        });
    }
}
async function runSeed() {
    try {
        console.log("🌱 Seed principal iniciado...");
        const cityMap = await ensureCities();
        await ensureCategories();
        await ensureDepartments(cityMap);
        await ensureAdmins(cityMap);
        const defaultUserInfo = await ensureDefaultUser(cityMap);
        if (defaultUserInfo) {
            await ensureDefaultUserChamados(defaultUserInfo.userId, defaultUserInfo.cityId);
        }
        console.log("✨ Seed finalizado!");
    }
    catch (error) {
        console.error("❌ Erro ao executar seed:", error);
        process.exitCode = 1;
    }
    finally {
        process.exit();
    }
}
runSeed();
