-- Verificar distribuição de cidades
SELECT cid_nome, cid_id FROM cidades;

-- Verificar distribuição de departamentos por cidade
SELECT c.cid_nome, COUNT(d.dep_id) as total_departamentos
FROM cidades c
LEFT JOIN departamentos d ON c.cid_id = d.cid_id
GROUP BY c.cid_id, c.cid_nome;

-- Verificar distribuição de funcionarios por cidade
SELECT c.cid_nome, COUNT(f.fun_id) as total_funcionarios
FROM cidades c
LEFT JOIN funcionarios f ON c.cid_id = f.cid_id
GROUP BY c.cid_id, c.cid_nome;

-- Verificar distribuição de usuarios por cidade
SELECT c.cid_nome, COUNT(u.usu_id) as total_usuarios
FROM cidades c
LEFT JOIN usuarios u ON c.cid_id = u.cid_id
GROUP BY c.cid_id, c.cid_nome;

-- Verificar distribuição de chamados por cidade (via departamento)
SELECT c.cid_nome, COUNT(ch.cha_id) as total_chamados
FROM cidades c
LEFT JOIN departamentos d ON c.cid_id = d.cid_id
LEFT JOIN chamados ch ON d.dep_id = ch.cha_departamento
GROUP BY c.cid_id, c.cid_nome;
