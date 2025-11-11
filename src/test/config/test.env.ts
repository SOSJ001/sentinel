// Test environment configuration
export const testConfig = {
	// Use Solana devnet for testing
	solana: {
		rpcEndpoint: 'https://api.devnet.solana.com',
		wsEndpoint: 'wss://api.devnet.solana.com',
		commitment: 'confirmed' as const
	},

	// Test wallet addresses (devnet)
	testWallets: {
		highActivity: '11111111111111111111111111111112', // System Program
		lowActivity: '11111111111111111111111111111113', // Token Program
		empty: '11111111111111111111111111111114' // Empty wallet
	},

	// Test transaction thresholds
	thresholds: {
		highValue: 100, // SOL
		fastTransaction: 60, // seconds
		suspiciousAmount: 1000 // SOL
	},

	// Test data
	testTransactions: [
		{
			signature: 'test-sig-1',
			amount: 150, // SOL - should trigger high value alert
			timestamp: Date.now() - 30000, // 30 seconds ago
			sender: 'test-sender',
			receiver: 'test-receiver'
		},
		{
			signature: 'test-sig-2',
			amount: 50, // SOL - normal transaction
			timestamp: Date.now() - 120000, // 2 minutes ago
			sender: 'test-sender-2',
			receiver: 'test-receiver-2'
		}
	]
};
