import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	define: {
		global: 'globalThis',
		'process.env': '{}'
	},
	optimizeDeps: {
		include: ['buffer'],
		exclude: []
	},
	resolve: {
		alias: {
			buffer: 'buffer'
		}
	},
	build: {
		rollupOptions: {
			external: []
		},
		commonjsOptions: {
			include: [/buffer/, /node_modules/]
		}
	},
	ssr: {
		noExternal: ['@solana/web3.js'],
		external: ['buffer']
	},
	server: {
		fs: {
			allow: ['..']
		}
	}
});
