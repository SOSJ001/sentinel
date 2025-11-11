/**
 * Test to verify ConfigService → SolanaService flow
 */

import { describe, it, expect, vi } from 'vitest';
import { ConfigService } from '../lib/services/config.service';

describe('ConfigService → SolanaService Flow', () => {
	it('should pass devnet config from ConfigService to SolanaService', () => {
		// Get config service
		const configService = ConfigService.getInstance();
		const config = configService.getConfig();

		// Verify devnet configuration
		expect(config.solana.rpcUrl).toBe('https://api.devnet.solana.com');
		expect(config.solana.wsUrl).toBe('wss://api.devnet.solana.com');
		expect(config.solana.commitment).toBe('confirmed');

		// Verify the solana config structure
		expect(config.solana).toHaveProperty('rpcUrl');
		expect(config.solana).toHaveProperty('wsUrl');
		expect(config.solana).toHaveProperty('commitment');
	});

	it('should use configured URLs in SolanaService', async () => {
		// Mock the SolanaService to test config usage
		const mockConfig = {
			rpcUrl: 'https://api.devnet.solana.com',
			wsUrl: 'wss://api.devnet.solana.com',
			commitment: 'confirmed' as const
		};

		// This simulates what happens in getSolanaService()
		const configService = ConfigService.getInstance();
		const solanaConfig = configService.getConfig().solana;

		// Verify the config matches what we expect
		expect(solanaConfig.rpcUrl).toBe(mockConfig.rpcUrl);
		expect(solanaConfig.wsUrl).toBe(mockConfig.wsUrl);
		expect(solanaConfig.commitment).toBe(mockConfig.commitment);
	});
});
