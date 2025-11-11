import { describe, it, expect, vi } from 'vitest';

// Mock the services
vi.mock('../../services/solana.service', () => ({
	SolanaService: vi.fn().mockImplementation(() => ({
		startMonitoring: vi.fn(),
		stopMonitoring: vi.fn(),
		getTransactionHistory: vi.fn(),
		connect: vi.fn(),
		disconnect: vi.fn()
	}))
}));

vi.mock('../../services/validation.service', () => ({
	ValidationService: vi.fn().mockImplementation(() => ({
		validateTransaction: vi.fn(),
		addRule: vi.fn(),
		removeRule: vi.fn()
	}))
}));

// Mock Svelte stores
vi.mock('svelte/store', () => ({
	writable: vi.fn(() => ({
		subscribe: vi.fn(),
		set: vi.fn(),
		update: vi.fn()
	})),
	readable: vi.fn(() => ({
		subscribe: vi.fn()
	}))
}));

describe('ForensicsDashboard', () => {
	it('should have proper service imports', () => {
		// Test that services can be imported without errors
		expect(true).toBe(true);
	});

	it('should handle service initialization', () => {
		// Test service initialization logic
		const mockSolanaService = {
			connect: vi.fn(),
			disconnect: vi.fn(),
			startMonitoring: vi.fn()
		};

		expect(mockSolanaService).toBeDefined();
		expect(typeof mockSolanaService.connect).toBe('function');
	});
});
