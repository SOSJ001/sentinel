/**
 * Test local RPC endpoint detection
 */

import { describe, it, expect } from 'vitest';

// Mock the isLocalRpc method for testing
function isLocalRpc(rpcUrl: string): boolean {
	const localPatterns = [
		'localhost',
		'127.0.0.1',
		'192.168.',
		'10.0.',
		'172.',
		'::1', // IPv6 localhost
		'0.0.0.0'
	];

	return localPatterns.some((pattern) => rpcUrl.includes(pattern));
}

// Mock the determineCluster method for testing
function determineCluster(rpcUrl: string): 'mainnet-beta' | 'testnet' | 'devnet' {
	// Handle local RPC endpoints first
	if (isLocalRpc(rpcUrl)) {
		// For local RPC, we need to determine the cluster by querying the endpoint
		// For now, we'll default to devnet for local development
		return 'devnet';
	}

	// Handle remote endpoints
	if (rpcUrl.includes('devnet')) {
		return 'devnet';
	} else if (rpcUrl.includes('testnet')) {
		return 'testnet';
	} else if (rpcUrl.includes('mainnet') || rpcUrl.includes('api.mainnet-beta')) {
		return 'mainnet-beta';
	} else if (rpcUrl.includes('helius')) {
		return rpcUrl.includes('devnet') ? 'devnet' : 'mainnet-beta';
	} else {
		return 'mainnet-beta';
	}
}

describe('Local RPC Detection', () => {
	it('should detect localhost URLs as local', () => {
		expect(isLocalRpc('http://localhost:8899')).toBe(true);
		expect(isLocalRpc('https://localhost:8899')).toBe(true);
		expect(isLocalRpc('ws://localhost:8899')).toBe(true);
	});

	it('should detect 127.0.0.1 URLs as local', () => {
		expect(isLocalRpc('http://127.0.0.1:8899')).toBe(true);
		expect(isLocalRpc('https://127.0.0.1:8899')).toBe(true);
	});

	it('should detect private network IPs as local', () => {
		expect(isLocalRpc('http://192.168.1.100:8899')).toBe(true);
		expect(isLocalRpc('http://10.0.0.1:8899')).toBe(true);
		expect(isLocalRpc('http://172.16.0.1:8899')).toBe(true);
	});

	it('should detect IPv6 localhost as local', () => {
		expect(isLocalRpc('http://[::1]:8899')).toBe(true);
		expect(isLocalRpc('https://[::1]:8899')).toBe(true);
	});

	it('should not detect remote URLs as local', () => {
		expect(isLocalRpc('https://api.devnet.solana.com')).toBe(false);
		expect(isLocalRpc('https://api.mainnet-beta.solana.com')).toBe(false);
		expect(isLocalRpc('https://mainnet.helius-rpc.com/...')).toBe(false);
	});

	it('should return devnet for local RPC endpoints', () => {
		expect(determineCluster('http://localhost:8899')).toBe('devnet');
		expect(determineCluster('http://127.0.0.1:8899')).toBe('devnet');
		expect(determineCluster('http://192.168.1.100:8899')).toBe('devnet');
		expect(determineCluster('http://10.0.0.1:8899')).toBe('devnet');
	});

	it('should still work for remote endpoints', () => {
		expect(determineCluster('https://api.devnet.solana.com')).toBe('devnet');
		expect(determineCluster('https://api.mainnet-beta.solana.com')).toBe('mainnet-beta');
		expect(determineCluster('https://api.testnet.solana.com')).toBe('testnet');
	});
});
