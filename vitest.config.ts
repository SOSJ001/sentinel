import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		// Test environment configuration
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/test/setup.ts'],

		// Test file patterns
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: ['node_modules', 'dist', '.svelte-kit'],

		// Coverage configuration
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'src/test/',
				'**/*.d.ts',
				'**/*.config.{js,ts}',
				'**/vite.config.ts'
			]
		},

		// Test timeout
		testTimeout: 10000,

		// Mock configuration for Solana
		mockReset: true,
		clearMocks: true,

		// Svelte-specific configuration
		environmentOptions: {
			jsdom: {
				resources: 'usable'
			}
		}
	}
});
