/**
 * Attack Simulation Wallet Configuration
 *
 * Fill in your 6 wallet addresses from Backpack wallet below.
 * These wallets will be used for attack simulation testing.
 */

export const attackWallets = {
	// Main attacker wallet - initiates suspicious transactions
	attacker: 'G2Rqg3EpKvt45uEbHDUaoYcYUE9mmgxZZ28WNeGeVB1j',

	// Victim wallets - receive suspicious transactions
	victims: {
		victim1: 'HtkVwLh82FK1Aw5VNckHTdRCmXpmy8agxKequynEvrjz', // For high-value transfers
		victim2: 'DiczGCcXXRX3KSNy3jQY2oMShNSKzaHcU2ArJkA7quuW', // For rapid transactions
		victim3: 'EB6BBHUvDimDmk7P2uEvK9Yj3Xsi7E3LCYv8RHY7NhRN' // For fan-out patterns
	},

	// Intermediary wallets - for complex transaction chains
	intermediary: 'BhNG7AioGi1dxicsG2n4tDQrEzHp23fGMgUEVV9fzvFb',

	// Extra wallet - for additional test scenarios
	extra: 'FtPDnYX1rX8psKCQ1xDUovQQKLmmwdmiu26asyyRLPe2'
};

// Attack thresholds (from test.env.ts)
export const attackThresholds = {
	highValue: 100, // SOL - triggers high-value alert
	fastTransaction: 60, // seconds - rapid transaction detection
	suspiciousAmount: 1000 // SOL - suspicious activity threshold
};

// Local validator configuration
export const localRpcConfig = {
	rpcUrl: 'http://127.0.0.1:8899',
	wsUrl: 'ws://127.0.0.1:8900',
	commitment: 'confirmed' as const
};

// Helper function to validate wallet addresses are configured
export function validateWalletConfig(): boolean {
	const wallets = [
		attackWallets.attacker,
		attackWallets.victims.victim1,
		attackWallets.victims.victim2,
		attackWallets.victims.victim3,
		attackWallets.intermediary,
		attackWallets.extra
	];

	const allConfigured = wallets.every(
		(wallet) => wallet && !wallet.includes('YOUR_') && wallet.length > 32
	);

	if (!allConfigured) {
		console.error('❌ Please configure all wallet addresses in src/test/config/attack-wallets.ts');
		return false;
	}

	console.log('✅ All wallet addresses configured');
	return true;
}

// Get all wallet addresses as an array
export function getAllWallets(): string[] {
	return [
		attackWallets.attacker,
		attackWallets.victims.victim1,
		attackWallets.victims.victim2,
		attackWallets.victims.victim3,
		attackWallets.intermediary,
		attackWallets.extra
	];
}
