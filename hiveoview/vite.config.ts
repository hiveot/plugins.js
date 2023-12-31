import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';
import { nodeLoaderPlugin } from '@vavite/node-loader/plugin';
import Icons from 'unplugin-icons/vite'

/** @type {import("vite").UserConfig} */
export default defineConfig({
	plugins: [
		sveltekit(),
		nodeLoaderPlugin(),
		Icons({ compiler: 'svelte' })
	],
	// icons alias
	resolve: {
		alias: {
			// process: 'process/browser',
			// stream: 'stream-browserify',
			// zlib: "browserify-zlib",
			// util: 'util/',
			"@hivelib": path.resolve('./hivelib'),
			"@lib": path.resolve(__dirname, './src/lib'),
			"@icons": path.resolve('./node_modules/svelte-materialdesign-icons/dist')
		}
	},
	// workaround for ReferenceError: process is not defined in browser (using node util package)
	// see also https://github.com/vitejs/vite/issues/1973
	define: {
		'process.env': process.env
	}
});
