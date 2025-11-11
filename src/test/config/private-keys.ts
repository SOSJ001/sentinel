/**
 * Private Keys Configuration for Attack Simulation
 *
 * ⚠️  SECURITY WARNING: This file contains sensitive private keys!
 * - Never commit this file to version control
 * - Only use for local testing
 * - Keep this file secure and private
 *
 * To export private keys from Backpack:
 * 1. Click on wallet in Backpack
 * 2. Go to Settings (gear icon)
 * 3. Click "Export Private Key"
 * 4. Copy the array of numbers (e.g., [174, 47, 154, 16, ...])
 * 5. Paste it below replacing the placeholder
 */

export const privateKeys = {
	// Main attacker wallet - initiates suspicious transactions
	attacker: [
		// PASTE_ATTACKER_PRIVATE_KEY_ARRAY_HERE
		'2Euq89MgJdkRARHwMV2agtEGSX2UrjWovqNrewozGrXNwBLNsZeZ7cUTLAQnwz15vPogVYuXsEucuQiHzXu6uzZo'
	],

	// Victim wallets - receive suspicious transactions
	victims: {
		victim1: [
			// PASTE_VICTIM1_PRIVATE_KEY_ARRAY_HERE
			'3jKk46AUZyXP8Z45LhX1X9TLY8YXgqkboo1hWJeLANRGcoNVp2TPY42VANUrJggDaT17EGkGLEZHXR5EEJyVX5qz'
		],
		victim2: [
			// PASTE_VICTIM2_PRIVATE_KEY_ARRAY_HERE
			'RwypSfkG3U3sP8CAniuBdZD9xefuqTXR1omZq2od28jUQYYweLVtwCLbf2RqZWB1qMSuYUZyWx2AqGyL3R5DCUk'
		],
		victim3: [
			// PASTE_VICTIM3_PRIVATE_KEY_ARRAY_HERE
			'RyFBtX94qisbXEzNdm6tZJB1zxeN95rgea75SUV8W4epXnShNww6ogEPw2w2hPmjTbQFGXUqrLz3inqdqCQc7jA'
		]
	},

	// Intermediary wallet - for complex transaction chains
	intermediary: [
		// PASTE_INTERMEDIARY_PRIVATE_KEY_ARRAY_HERE
		'4YqchQznCH499ddhAUL6yYSMVFEWvR5pWkEz5mJ2Z9qmQCLMBF78PnaoYRDTttCb1N1i4TiTM99t8BycVd83XJx1'
	],

	// Extra wallet - for additional test scenarios
	extra: [
		// PASTE_EXTRA_PRIVATE_KEY_ARRAY_HERE
		'2fD6bFC756WihM8xm3evjdgc8cR3j9cWSy5icB73MFqMmbeYdJ3eabyajMpwbGqJYaQ5vRF4j6EH6PbRmNbZXky8'
	]
};

// Helper function to create Keypair from private key array
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

export function createKeypairFromPrivateKey(privateKeyArray: number[] | string[]): Keypair {
	// Handle both byte arrays and base58 strings
	if (typeof privateKeyArray[0] === 'string') {
		// Convert base58 string to byte array
		const base58String = privateKeyArray[0] as string;
		const secretKey = bs58.decode(base58String);
		return Keypair.fromSecretKey(secretKey);
	} else {
		// Use byte array directly
		return Keypair.fromSecretKey(new Uint8Array(privateKeyArray as number[]));
	}
}

// Helper function to get all keypairs
export function getAllKeypairs() {
	return {
		attacker: createKeypairFromPrivateKey(privateKeys.attacker),
		victim1: createKeypairFromPrivateKey(privateKeys.victims.victim1),
		victim2: createKeypairFromPrivateKey(privateKeys.victims.victim2),
		victim3: createKeypairFromPrivateKey(privateKeys.victims.victim3),
		intermediary: createKeypairFromPrivateKey(privateKeys.intermediary),
		extra: createKeypairFromPrivateKey(privateKeys.extra)
	};
}

// Validation function to check if private keys are configured
export function validatePrivateKeys(): boolean {
	const keys = [
		privateKeys.attacker,
		privateKeys.victims.victim1,
		privateKeys.victims.victim2,
		privateKeys.victims.victim3,
		privateKeys.intermediary,
		privateKeys.extra
	];

	const allConfigured = keys.every((keyArray) => {
		// Check if it's a valid array with content
		if (!Array.isArray(keyArray) || keyArray.length === 0) return false;

		// Check if it's a base58 string (what we have)
		if (typeof keyArray[0] === 'string') {
			return keyArray[0].length > 50 && !keyArray[0].includes('PASTE_');
		}

		// Check if it's a byte array (64 numbers)
		if (typeof keyArray[0] === 'number') {
			return keyArray.length === 64 && !keyArray.includes(0);
		}

		return false;
	});

	if (!allConfigured) {
		console.error('❌ Please configure all private keys in src/test/config/private-keys.ts');
		console.error('   Export private keys from Backpack and paste the arrays');
		return false;
	}

	console.log('✅ All private keys configured');
	return true;
}

// Security reminder
console.log('🔐 Private keys loaded - keep this file secure!');
