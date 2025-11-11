import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Solana Web3.js
vi.mock('@solana/web3.js', () => ({
	Connection: vi.fn().mockImplementation(() => ({
		onAccountChange: vi.fn(),
		getAccountInfo: vi.fn(),
		getConfirmedSignaturesForAddress2: vi.fn(),
		getTransaction: vi.fn(),
		disconnect: vi.fn(),
		getVersion: vi.fn().mockResolvedValue({ 'solana-core': '1.16.0' }),
		getSlot: vi.fn().mockResolvedValue(12345),
		getEpochInfo: vi.fn().mockResolvedValue({
			epoch: 1,
			slotIndex: 100,
			slotsInEpoch: 1000,
			absoluteSlot: 12345,
			blockHeight: 1000
		}),
		getSupply: vi.fn().mockResolvedValue({
			value: {
				total: 1000000,
				circulating: 800000,
				nonCirculating: 200000,
				nonCirculatingAccounts: []
			}
		}),
		removeAccountChangeListener: vi.fn()
	})),
	PublicKey: vi.fn().mockImplementation((key) => ({ toString: () => key })),
	LAMPORTS_PER_SOL: 1000000000
}));

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
	send: vi.fn(),
	close: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	readyState: 1
}));

// Mock node-notifier
vi.mock('node-notifier', () => ({
	notify: vi.fn()
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

// Mock console methods for cleaner test output
global.console = {
	...console,
	log: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	info: vi.fn()
};

// Mock DOM methods that might be used by Svelte components
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
});
