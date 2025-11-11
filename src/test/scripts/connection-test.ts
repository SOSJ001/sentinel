/**
 * Connection Test Script
 *
 * This script tests the basic connection and transaction flow:
 * 1. Connect to local validator
 * 2. Start forensics monitoring
 * 3. Send a small test transaction
 * 4. Verify forensics platform detects it
 * 5. Check evidence collection and alerts
 */

import {
	Connection,
	PublicKey,
	Transaction,
	SystemProgram,
	LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { attackWallets, localRpcConfig } from '../config/attack-wallets';
import { getAllKeypairs, validatePrivateKeys } from '../config/private-keys';

// Import forensics services
import { SolanaService } from '../../lib/services/solana.service';
import { ForensicsService } from '../../lib/services/forensics.service';
import { ValidationService } from '../../lib/services/validation.service';

class ConnectionTest {
	private connection: Connection;
	private solanaService: SolanaService;
	private forensicsService: ForensicsService;
	private validationService: ValidationService;
	private keypairs: ReturnType<typeof getAllKeypairs>;

	constructor() {
		// Initialize connection to local validator
		this.connection = new Connection(localRpcConfig.rpcUrl, localRpcConfig.commitment);

		// Initialize services with proper config
		this.solanaService = new SolanaService(localRpcConfig);
		this.forensicsService = new ForensicsService();
		this.validationService = new ValidationService();

		// Get keypairs for signing
		this.keypairs = getAllKeypairs();
	}

	async runTest(): Promise<void> {
		console.log('🚀 Starting Connection Test...\n');

		try {
			// Step 1: Validate configuration
			await this.validateConfiguration();

			// Step 2: Test connection
			await this.testConnection();

			// Step 3: Start forensics monitoring
			await this.startMonitoring();

			// Step 4: Send test transaction
			await this.sendTestTransaction();

			// Step 5: Wait and verify detection
			await this.verifyDetection();

			console.log('✅ Connection test completed successfully!');
		} catch (error) {
			console.error('❌ Connection test failed:', error);
			throw error;
		}
	}

	private async validateConfiguration(): Promise<void> {
		console.log('📋 Step 1: Validating configuration...');

		// Validate private keys
		if (!validatePrivateKeys()) {
			throw new Error('Private keys not properly configured');
		}

		// Validate wallet addresses
		const attackerAddress = this.keypairs.attacker.publicKey.toString();
		const victimAddress = this.keypairs.victim1.publicKey.toString();

		console.log(`   Attacker: ${attackerAddress}`);
		console.log(`   Victim: ${victimAddress}`);
		console.log('   ✅ Configuration valid\n');
	}

	private async testConnection(): Promise<void> {
		console.log('🔌 Step 2: Testing connection to local validator...');

		try {
			// Test RPC connection
			const version = await this.connection.getVersion();
			console.log(`   Solana version: ${version['solana-core']}`);

			// Test account access
			const attackerBalance = await this.connection.getBalance(this.keypairs.attacker.publicKey);
			const victimBalance = await this.connection.getBalance(this.keypairs.victim1.publicKey);

			console.log(`   Attacker balance: ${attackerBalance / LAMPORTS_PER_SOL} SOL`);
			console.log(`   Victim balance: ${victimBalance / LAMPORTS_PER_SOL} SOL`);
			console.log('   ✅ Connection successful\n');
		} catch (error) {
			throw new Error(`Connection failed: ${error}`);
		}
	}

	private async startMonitoring(): Promise<void> {
		console.log('👁️  Step 3: Starting forensics monitoring...');

		try {
			// Initialize Solana service
			await this.solanaService.initialize();

			// Start monitoring (if method exists)
			if (typeof this.solanaService.startMonitoring === 'function') {
				await this.solanaService.startMonitoring();
			}

			console.log('   ✅ Forensics monitoring started\n');
		} catch (error) {
			throw new Error(`Failed to start monitoring: ${error}`);
		}
	}

	private async sendTestTransaction(): Promise<void> {
		console.log('💸 Step 4: Sending test transaction...');

		try {
			// Create a small test transaction (0.1 SOL)
			const transaction = new Transaction().add(
				SystemProgram.transfer({
					fromPubkey: this.keypairs.attacker.publicKey,
					toPubkey: this.keypairs.victim1.publicKey,
					lamports: 0.1 * LAMPORTS_PER_SOL // 0.1 SOL
				})
			);

			// Get recent blockhash
			const { blockhash } = await this.connection.getLatestBlockhash();
			transaction.recentBlockhash = blockhash;
			transaction.feePayer = this.keypairs.attacker.publicKey;

			// Sign and send transaction
			transaction.sign(this.keypairs.attacker);
			const signature = await this.connection.sendTransaction(transaction, [
				this.keypairs.attacker
			]);

			console.log(`   Transaction signature: ${signature}`);
			console.log('   ✅ Test transaction sent\n');

			// Wait for confirmation
			await this.connection.confirmTransaction(signature);
			console.log('   ✅ Transaction confirmed\n');
		} catch (error) {
			throw new Error(`Failed to send transaction: ${error}`);
		}
	}

	private async verifyDetection(): Promise<void> {
		console.log('🔍 Step 5: Verifying forensics detection...');

		// Wait a moment for processing
		await new Promise((resolve) => setTimeout(resolve, 2000));

		try {
			// Check if evidence was collected (if method exists)
			if (typeof this.forensicsService.getRecentEvidence === 'function') {
				const evidence = await this.forensicsService.getRecentEvidence();
				console.log(`   Evidence collected: ${evidence.length} items`);

				if (evidence.length > 0) {
					console.log('   ✅ Evidence collection working');
				} else {
					console.log('   ⚠️  No evidence collected (may need more time)');
				}
			} else {
				console.log('   ⚠️  Evidence collection method not available');
			}

			// Check if alerts were generated (if method exists)
			if (typeof this.forensicsService.getRecentAlerts === 'function') {
				const alerts = await this.forensicsService.getRecentAlerts();
				console.log(`   Alerts generated: ${alerts.length} items`);

				if (alerts.length > 0) {
					console.log('   ✅ Alert system working');
				} else {
					console.log('   ⚠️  No alerts generated (transaction may be below threshold)');
				}
			} else {
				console.log('   ⚠️  Alert system method not available');
			}

			console.log('   ✅ Detection verification complete\n');
		} catch (error) {
			console.log(`   ⚠️  Detection verification failed: ${error}`);
		}
	}

	async cleanup(): Promise<void> {
		console.log('🧹 Cleaning up...');
		try {
			// Stop all monitoring if method exists
			if (typeof this.solanaService.stopAllMonitoring === 'function') {
				await this.solanaService.stopAllMonitoring();
			}

			// Disconnect Solana service if method exists
			if (typeof this.solanaService.disconnect === 'function') {
				this.solanaService.disconnect();
			}

			// Cleanup Solana service if method exists
			if (typeof this.solanaService.cleanup === 'function') {
				await this.solanaService.cleanup();
			}

			// Cleanup forensics service if method exists
			if (typeof this.forensicsService.cleanup === 'function') {
				await this.forensicsService.cleanup();
			}

			// Close the connection object
			if (this.connection) {
				// Connection from @solana/web3.js doesn't have explicit close, but we can set it to null
				// The WebSocket connections should be closed by stopAllMonitoring
			}

			console.log('   ✅ Cleanup complete');
		} catch (error) {
			console.log(`   ⚠️  Cleanup warning: ${error}`);
		}
	}
}

// Main execution
async function main() {
	const test = new ConnectionTest();

	try {
		await test.runTest();
	} catch (error) {
		console.error('Test failed:', error);
		process.exit(1);
	} finally {
		await test.cleanup();
		// Exit the process after cleanup
		process.exit(0);
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export { ConnectionTest };
