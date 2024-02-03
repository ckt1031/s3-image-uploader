import esbuild from "esbuild";
import process from "process";
import builtins from 'builtin-modules'

const prod = (process.argv[2] === 'production');

esbuild.build({
	entryPoints: ['main.ts'],
	bundle: true,
	external: [
		'obsidian',
		'electron',
		'@codemirror/autocomplete',
		'@codemirror/collab',
		'@codemirror/commands',
		'@codemirror/language',
		'@codemirror/lint',
		'@codemirror/search',
		'@codemirror/state',
		'@codemirror/view',
		'@lezer/common',
		'@lezer/highlight',
		'@lezer/lr',
		...builtins],
	format: 'cjs',
	//watch: !prod,
	legalComments: 'none',
	target: 'es2022',
	logLevel: "info",
	sourcemap: prod ? false : 'inline',
	treeShaking: true,
	minify: prod,
	outfile: 'main.js',
}).catch(() => process.exit(1));
