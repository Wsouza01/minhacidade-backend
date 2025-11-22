const fs = require("fs");

// lê o arquivo TS original
let content = fs.readFileSync("./drizzle.config.ts", "utf8");

// converte para CommonJS
content = content
	.replace(
		'import { defineConfig } from "drizzle-kit";',
		'const { defineConfig } = require("drizzle-kit");',
	)
	.replace("export default", "module.exports =");

fs.writeFileSync("./drizzle.config.js", content);

console.log("✔ drizzle.config.js gerado com sucesso");
