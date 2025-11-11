/**
 * Client-side only Solana Service wrapper
 * This prevents SSR issues with the Solana Web3.js library
 */

import { browser } from '$app/environment';

let solanaService: any = null;

export async function getClientSolanaService() {
	if (!browser) {
		// Return a mock service for SSR
		return {
			connect: async () => false,
			startMonitoring: () => {},
			disconnect: () => {},
			isServiceConnected: () => false,
			alerts: { subscribe: () => () => {} },
			transactions: { subscribe: () => () => {} },
			traceData: { subscribe: () => () => {} }
		};
	}

	if (!solanaService) {
		// Dynamically import the actual service only in browser
		const { getSolanaService } = await import('./index');
		solanaService = getSolanaService();
	}

	return solanaService;
}
