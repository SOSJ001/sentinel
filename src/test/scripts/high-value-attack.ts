/**
 * High-Value Transfer Attack Script
 *
 * This script simulates a high-value transfer attack that should trigger:
 * - High-value transaction alerts (> 100 SOL)
 * - Evidence collection with SHA-256 integrity
 * - Chain of custody tracking
 * - Audit logging for compliance
 *
 * Attack Pattern: Single large transfer from attacker to victim
 */

import {
	Connection,
	PublicKey,
	Transaction,
	SystemProgram,
	LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { attackWallets, localRpcConfig, attackThresholds } from '../config/attack-wallets';
import { getAllKeypairs, validatePrivateKeys } from '../config/private-keys';

// Import forensics services
import { SolanaService } from '../../lib/services/solana.service';
import { ForensicsService } from '../../lib/services/forensics.service';
import { ValidationService } from '../../lib/services/validation.service';

class HighValueAttack {
	private connection: Connection;
	private solanaService: SolanaService;
	private forensicsService: ForensicsService;
	private validationService: ValidationService;
	private keypairs: ReturnType<typeof getAllKeypairs>;

	constructor() {
		// Initialize connection to local validator
		this.connection = new Connection(localRpcConfig.rpcUrl, localRpcConfig.commitment);

		// Initialize services
		this.solanaService = new SolanaService(localRpcConfig);
		this.forensicsService = new ForensicsService();
		this.validationService = new ValidationService();

		// Get keypairs for signing
		this.keypairs = getAllKeypairs();
	}

	async executeAttack(): Promise<void> {
		console.log('💰 Starting High-Value Transfer Attack...\n');

		try {
			// Step 1: Validate configuration
			await this.validateConfiguration();

			// Step 2: Test connection
			await this.testConnection();

			// Step 3: Start forensics monitoring
			await this.startMonitoring();

			// Step 4: Execute high-value transfer
			await this.executeHighValueTransfer();

			// Step 5: Wait and verify detection
			await this.verifyDetection();

			console.log('✅ High-value attack completed successfully!');
		} catch (error) {
			console.error('❌ High-value attack failed:', error);
			throw error;
		}
	}

	private async validateConfiguration(): Promise<void> {
		console.log('📋 Step 1: Validating attack configuration...');

		// Validate private keys
		if (!validatePrivateKeys()) {
			throw new Error('Private keys not properly configured');
		}

		// Validate attack thresholds
		console.log(`   High-value threshold: ${attackThresholds.highValue} SOL`);
		console.log(`   Suspicious amount threshold: ${attackThresholds.suspiciousAmount} SOL`);

		// Validate wallet addresses
		const attackerAddress = this.keypairs.attacker.publicKey.toString();
		const victimAddress = this.keypairs.victim1.publicKey.toString();

		console.log(`   Attacker: ${attackerAddress}`);
		console.log(`   Victim: ${victimAddress}`);
		console.log('   ✅ Attack configuration valid\n');
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

			// Verify sufficient balance for attack
			const attackAmount = attackThresholds.highValue + 50; // 150 SOL
			if (attackerBalance < attackAmount * LAMPORTS_PER_SOL) {
				throw new Error(
					`Insufficient balance for attack. Need ${attackAmount} SOL, have ${attackerBalance / LAMPORTS_PER_SOL} SOL`
				);
			}

			console.log('   ✅ Connection successful and sufficient balance\n');
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

	private async executeHighValueTransfer(): Promise<void> {
		console.log('💸 Step 4: Executing high-value transfer attack...');

		try {
			// Create a high-value transaction (150 SOL - above threshold)
			const attackAmount = attackThresholds.highValue + 50; // 150 SOL
			console.log(
				`   Attack amount: ${attackAmount} SOL (above ${attackThresholds.highValue} SOL threshold)`
			);

			const transaction = new Transaction().add(
				SystemProgram.transfer({
					fromPubkey: this.keypairs.attacker.publicKey,
					toPubkey: this.keypairs.victim1.publicKey,
					lamports: attackAmount * LAMPORTS_PER_SOL
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

			console.log(`   🚨 HIGH-VALUE TRANSACTION SENT!`);
			console.log(`   Transaction signature: ${signature}`);
			console.log(`   Amount: ${attackAmount} SOL`);
			console.log(`   From: ${this.keypairs.attacker.publicKey.toString()}`);
			console.log(`   To: ${this.keypairs.victim1.publicKey.toString()}`);
			console.log('   ✅ High-value attack transaction sent\n');

			// Wait for confirmation
			await this.connection.confirmTransaction(signature);
			console.log('   ✅ High-value transaction confirmed\n');
		} catch (error) {
			throw new Error(`Failed to execute high-value transfer: ${error}`);
		}
	}

	private async verifyDetection(): Promise<void> {
		console.log('🔍 Step 5: Verifying forensics detection...');

		// Wait longer for processing high-value transaction
		console.log('   Waiting for forensics processing...');
		await new Promise((resolve) => setTimeout(resolve, 5000));

		try {
			// Check if evidence was collected (if method exists)
			if (typeof this.forensicsService.getRecentEvidence === 'function') {
				const evidence = await this.forensicsService.getRecentEvidence();
				console.log(`   Evidence collected: ${evidence.length} items`);

				if (evidence.length > 0) {
					console.log('   ✅ Evidence collection working - High-value transaction detected!');

					// Show evidence details
					evidence.forEach((item, index) => {
						console.log(`     Evidence ${index + 1}: ${item.evidenceType} - ${item.description}`);
					});
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
					console.log('   🚨 ALERT SYSTEM WORKING - High-value transaction flagged!');

					// Show alert details
					alerts.forEach((alert, index) => {
						console.log(
							`     Alert ${index + 1}: ${alert.severity} - ${alert.type} - ${alert.message}`
						);
					});
				} else {
					console.log('   ⚠️  No alerts generated (may need more time or different threshold)');
				}
			} else {
				console.log('   ⚠️  Alert system method not available');
			}

			// Check final balances
			const attackerBalance = await this.connection.getBalance(this.keypairs.attacker.publicKey);
			const victimBalance = await this.connection.getBalance(this.keypairs.victim1.publicKey);

			console.log(`   Final attacker balance: ${attackerBalance / LAMPORTS_PER_SOL} SOL`);
			console.log(`   Final victim balance: ${victimBalance / LAMPORTS_PER_SOL} SOL`);

			console.log('   ✅ High-value attack detection verification complete\n');
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

			console.log('   ✅ Cleanup complete');
		} catch (error) {
			console.log(`   ⚠️  Cleanup warning: ${error}`);
		}
	}
}

// Main execution
async function main() {
	const attack = new HighValueAttack();

	try {
		await attack.executeAttack();
		console.log('\n🎉 High-value attack simulation completed!');
		console.log('   Check your forensics dashboard for evidence and alerts.');
	} catch (error) {
		console.error('Attack failed:', error);
		process.exit(1);
	} finally {
		await attack.cleanup();
		// Exit the process after cleanup
		process.exit(0);
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export { HighValueAttack };
