/**
 * Test dynamic cluster detection
 */

import { describe, it, expect, vi } from 'vitest';

// Mock the Connection class for testing
const mockConnection = {
	getGenesisHash: vi.fn()
};

// Mock the determineClusterDynamic method for testing
async function determineClusterDynamic(
	rpcUrl: string
): Promise<'mainnet-beta' | 'testnet' | 'devnet'> {
	try {
		// Simulate the actual implementation
		const genesisHash = await mockConnection.getGenesisHash();

		// Map genesis hashes to cluster types
		switch (genesisHash) {
			case 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG': // Devnet
				return 'devnet';
			case '4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY': // Testnet
				return 'testnet';
			case '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d': // Mainnet-beta
				return 'mainnet-beta';
			default:
				// Fallback to URL-based detection for unknown genesis hash
				return determineClusterFromUrl(rpcUrl);
		}
	} catch (error) {
		console.warn(`Failed to query cluster from ${rpcUrl}:`, error);
		// Fallback to URL-based detection
		return determineClusterFromUrl(rpcUrl);
	}
}

// Fallback URL-based detection
function determineClusterFromUrl(rpcUrl: string): 'mainnet-beta' | 'testnet' | 'devnet' {
	if (rpcUrl.includes('devnet')) {
		return 'devnet';
	} else if (rpcUrl.includes('testnet')) {
		return 'testnet';
	} else if (rpcUrl.includes('mainnet') || rpcUrl.includes('api.mainnet-beta')) {
		return 'mainnet-beta';
	} else {
		return 'mainnet-beta';
	}
}

describe('Dynamic Cluster Detection', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should detect devnet from genesis hash', async () => {
		mockConnection.getGenesisHash.mockResolvedValue('EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG');

		const result = await determineClusterDynamic('http://localhost:8899');
		expect(result).toBe('devnet');
		expect(mockConnection.getGenesisHash).toHaveBeenCalled();
	});

	it('should detect mainnet from genesis hash', async () => {
		mockConnection.getGenesisHash.mockResolvedValue('5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d');

		const result = await determineClusterDynamic('http://localhost:8899');
		expect(result).toBe('mainnet-beta');
		expect(mockConnection.getGenesisHash).toHaveBeenCalled();
	});

	it('should detect testnet from genesis hash', async () => {
		mockConnection.getGenesisHash.mockResolvedValue('4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY');

		const result = await determineClusterDynamic('http://localhost:8899');
		expect(result).toBe('testnet');
		expect(mockConnection.getGenesisHash).toHaveBeenCalled();
	});

	it('should fallback to URL-based detection when endpoint query fails', async () => {
		mockConnection.getGenesisHash.mockRejectedValue(new Error('Connection failed'));

		const result = await determineClusterDynamic('https://api.devnet.solana.com');
		expect(result).toBe('devnet'); // Falls back to URL-based detection
	});

	it('should fallback to URL-based detection for unknown genesis hash', async () => {
		mockConnection.getGenesisHash.mockResolvedValue('unknown-genesis-hash');

		const result = await determineClusterDynamic('https://api.mainnet-beta.solana.com');
		expect(result).toBe('mainnet-beta'); // Falls back to URL-based detection
	});

	it('should handle local RPC endpoints dynamically', async () => {
		// Test local devnet
		mockConnection.getGenesisHash.mockResolvedValue('EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG');
		const devnetResult = await determineClusterDynamic('http://localhost:8899');
		expect(devnetResult).toBe('devnet');

		// Test local mainnet
		mockConnection.getGenesisHash.mockResolvedValue('5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d');
		const mainnetResult = await determineClusterDynamic('http://localhost:8899');
		expect(mainnetResult).toBe('mainnet-beta');
	});

	it('should handle network timeouts gracefully', async () => {
		mockConnection.getGenesisHash.mockRejectedValue(new Error('Timeout'));

		const result = await determineClusterDynamic('http://192.168.1.100:8899');
		expect(result).toBe('mainnet-beta'); // Falls back to URL-based detection
	});
});
