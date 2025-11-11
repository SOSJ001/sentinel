/**
 * Test cluster detection logic
 */

import { describe, it, expect } from 'vitest';

// Mock the determineCluster method for testing
function determineCluster(rpcUrl: string): string {
	if (rpcUrl.includes('devnet')) {
		return 'devnet';
	} else if (rpcUrl.includes('testnet')) {
		return 'testnet';
	} else if (rpcUrl.includes('mainnet') || rpcUrl.includes('api.mainnet-beta')) {
		return 'mainnet-beta';
	} else if (rpcUrl.includes('helius')) {
		// Helius URLs can be either mainnet or devnet, check the URL pattern
		return rpcUrl.includes('devnet') ? 'devnet' : 'mainnet-beta';
	} else {
		// Default fallback - try to determine from URL structure
		return 'mainnet-beta';
	}
}

describe('Cluster Detection', () => {
	it('should detect devnet correctly', () => {
		expect(determineCluster('https://api.devnet.solana.com')).toBe('devnet');
		expect(determineCluster('wss://api.devnet.solana.com')).toBe('devnet');
		expect(determineCluster('https://devnet.helius-rpc.com/...')).toBe('devnet');
	});

	it('should detect mainnet correctly', () => {
		expect(determineCluster('https://api.mainnet-beta.solana.com')).toBe('mainnet-beta');
		expect(determineCluster('https://mainnet.helius-rpc.com/...')).toBe('mainnet-beta');
		expect(determineCluster('https://solana-mainnet.g.alchemy.com/...')).toBe('mainnet-beta');
	});

	it('should detect testnet correctly', () => {
		expect(determineCluster('https://api.testnet.solana.com')).toBe('testnet');
	});

	it('should handle Helius URLs correctly', () => {
		expect(determineCluster('https://devnet.helius-rpc.com/?api-key=...')).toBe('devnet');
		expect(determineCluster('https://mainnet.helius-rpc.com/?api-key=...')).toBe('mainnet-beta');
	});

	it('should default to mainnet-beta for unknown URLs', () => {
		expect(determineCluster('https://custom-rpc.com')).toBe('mainnet-beta');
		expect(determineCluster('https://unknown-endpoint.com')).toBe('mainnet-beta');
	});
});
