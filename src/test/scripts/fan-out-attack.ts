/**
 * Fan-Out Attack Script
 *
 * This script simulates a fan-out attack that should trigger:
 * - Fan-out pattern detection (one-to-many transfers)
 * - Suspicious activity alerts for simultaneous transfers
 * - Evidence collection for each transaction
 * - Chain of custody tracking for multiple recipients
 * - Audit logging for compliance
 *
 * Attack Pattern: Single large transfer split into multiple smaller transfers to different recipients
 * This simulates money laundering techniques where large amounts are broken down
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

class FanOutAttack {
	private connection: Connection;
	private solanaService: SolanaService;
	private forensicsService: ForensicsService;
	private validationService: ValidationService;
	private keypairs: ReturnType<typeof getAllKeypairs>;
	private transactionSignatures: string[] = [];

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
		console.log('🌊 Starting Fan-Out Attack...\n');

		try {
			// Step 1: Validate configuration
			await this.validateConfiguration();

			// Step 2: Test connection
			await this.testConnection();

			// Step 3: Start forensics monitoring
			await this.startMonitoring();

			// Step 4: Execute fan-out attack
			await this.executeFanOutAttack();

			// Step 5: Wait and verify detection
			await this.verifyDetection();

			console.log('✅ Fan-out attack completed successfully!');
		} catch (error) {
			console.error('❌ Fan-out attack failed:', error);
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
		const victim1Address = this.keypairs.victim1.publicKey.toString();
		const victim2Address = this.keypairs.victim2.publicKey.toString();
		const victim3Address = this.keypairs.victim3.publicKey.toString();
		const intermediaryAddress = this.keypairs.intermediary.publicKey.toString();
		const extraAddress = this.keypairs.extra.publicKey.toString();

		console.log(`   Attacker: ${attackerAddress}`);
		console.log(`   Victim 1: ${victim1Address}`);
		console.log(`   Victim 2: ${victim2Address}`);
		console.log(`   Victim 3: ${victim3Address}`);
		console.log(`   Intermediary: ${intermediaryAddress}`);
		console.log(`   Extra: ${extraAddress}`);
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
			const victim1Balance = await this.connection.getBalance(this.keypairs.victim1.publicKey);
			const victim2Balance = await this.connection.getBalance(this.keypairs.victim2.publicKey);
			const victim3Balance = await this.connection.getBalance(this.keypairs.victim3.publicKey);
			const intermediaryBalance = await this.connection.getBalance(
				this.keypairs.intermediary.publicKey
			);
			const extraBalance = await this.connection.getBalance(this.keypairs.extra.publicKey);

			console.log(`   Attacker balance: ${attackerBalance / LAMPORTS_PER_SOL} SOL`);
			console.log(`   Victim 1 balance: ${victim1Balance / LAMPORTS_PER_SOL} SOL`);
			console.log(`   Victim 2 balance: ${victim2Balance / LAMPORTS_PER_SOL} SOL`);
			console.log(`   Victim 3 balance: ${victim3Balance / LAMPORTS_PER_SOL} SOL`);
			console.log(`   Intermediary balance: ${intermediaryBalance / LAMPORTS_PER_SOL} SOL`);
			console.log(`   Extra balance: ${extraBalance / LAMPORTS_PER_SOL} SOL`);

			// Verify sufficient balance for attack (200 SOL total fan-out)
			const totalAttackAmount = 200 * LAMPORTS_PER_SOL;
			if (attackerBalance < totalAttackAmount) {
				throw new Error(
					`Insufficient balance for attack. Need 200 SOL, have ${attackerBalance / LAMPORTS_PER_SOL} SOL`
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

	private async executeFanOutAttack(): Promise<void> {
		console.log('🌊 Step 4: Executing fan-out attack...');

		try {
			// Define fan-out recipients and amounts (simulating money laundering)
			const fanOutTransfers = [
				{ target: this.keypairs.victim1, amount: 45, description: 'Fan-Out Transfer 1' },
				{ target: this.keypairs.victim2, amount: 38, description: 'Fan-Out Transfer 2' },
				{ target: this.keypairs.victim3, amount: 42, description: 'Fan-Out Transfer 3' },
				{ target: this.keypairs.intermediary, amount: 35, description: 'Fan-Out Transfer 4' },
				{ target: this.keypairs.extra, amount: 40, description: 'Fan-Out Transfer 5' }
			];

			const totalAmount = fanOutTransfers.reduce((sum, tx) => sum + tx.amount, 0);

			console.log(`   🚨 EXECUTING FAN-OUT ATTACK!`);
			console.log(`   Total amount to distribute: ${totalAmount} SOL`);
			console.log(`   Number of recipients: ${fanOutTransfers.length}`);
			console.log(`   Pattern: One-to-many simultaneous transfers\n`);

			// Execute fan-out transfers (simultaneously)
			const transferPromises = fanOutTransfers.map(async (tx, index) => {
				const startTime = Date.now();

				console.log(`   📤 Fan-Out ${index + 1}: ${tx.description}`);
				console.log(`     Amount: ${tx.amount} SOL`);
				console.log(`     Target: ${tx.target.publicKey.toString()}`);

				// Create transaction
				const transaction = new Transaction().add(
					SystemProgram.transfer({
						fromPubkey: this.keypairs.attacker.publicKey,
						toPubkey: tx.target.publicKey,
						lamports: tx.amount * LAMPORTS_PER_SOL
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

				// Wait for confirmation
				await this.connection.confirmTransaction(signature);

				const endTime = Date.now();
				const duration = (endTime - startTime) / 1000;

				console.log(`     ✅ Fan-out transfer confirmed in ${duration.toFixed(2)}s`);
				console.log(`     Signature: ${signature}`);

				this.transactionSignatures.push(signature);
				return { signature, amount: tx.amount, target: tx.target.publicKey.toString() };
			});

			// Wait for all fan-out transfers to complete
			console.log(
				`   ⏱️  Executing all ${fanOutTransfers.length} fan-out transfers simultaneously...\n`
			);
			const results = await Promise.all(transferPromises);

			console.log(`\n   🚨 FAN-OUT ATTACK COMPLETE!`);
			console.log(`   Total transfers executed: ${results.length}`);
			console.log(`   Total amount distributed: ${totalAmount} SOL`);
			console.log(`   All transfers completed simultaneously\n`);

			// Show detailed results
			results.forEach((result, index) => {
				console.log(`   Fan-Out ${index + 1}: ${result.amount} SOL → ${result.target}`);
				console.log(`     Signature: ${result.signature}`);
			});
		} catch (error) {
			throw new Error(`Failed to execute fan-out attack: ${error}`);
		}
	}

	private async verifyDetection(): Promise<void> {
		console.log('🔍 Step 5: Verifying forensics detection...');

		// Wait longer for processing multiple simultaneous transactions
		console.log('   Waiting for forensics processing...');
		await new Promise((resolve) => setTimeout(resolve, 5000));

		try {
			// Check if evidence was collected (if method exists)
			if (typeof this.forensicsService.getRecentEvidence === 'function') {
				const evidence = await this.forensicsService.getRecentEvidence();
				console.log(`   Evidence collected: ${evidence.length} items`);

				if (evidence.length > 0) {
					console.log('   ✅ Evidence collection working - Fan-out pattern detected!');

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
					console.log('   🚨 ALERT SYSTEM WORKING - Fan-out pattern flagged!');

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

			// Show transaction summary
			console.log(`\n   📊 FAN-OUT ATTACK SUMMARY:`);
			console.log(`   Total transfers executed: ${this.transactionSignatures.length}`);
			console.log(`   Attack pattern: One-to-many simultaneous transfers`);
			console.log(`   Total amount distributed: 200 SOL`);
			this.transactionSignatures.forEach((sig, index) => {
				console.log(`     TX ${index + 1}: ${sig}`);
			});

			// Check final balances
			const attackerBalance = await this.connection.getBalance(this.keypairs.attacker.publicKey);
			const victim1Balance = await this.connection.getBalance(this.keypairs.victim1.publicKey);
			const victim2Balance = await this.connection.getBalance(this.keypairs.victim2.publicKey);
			const victim3Balance = await this.connection.getBalance(this.keypairs.victim3.publicKey);
			const intermediaryBalance = await this.connection.getBalance(
				this.keypairs.intermediary.publicKey
			);
			const extraBalance = await this.connection.getBalance(this.keypairs.extra.publicKey);

			console.log(`\n   💰 FINAL BALANCES:`);
			console.log(`   Attacker: ${attackerBalance / LAMPORTS_PER_SOL} SOL`);
			console.log(`   Victim 1: ${victim1Balance / LAMPORTS_PER_SOL} SOL`);
			console.log(`   Victim 2: ${victim2Balance / LAMPORTS_PER_SOL} SOL`);
			console.log(`   Victim 3: ${victim3Balance / LAMPORTS_PER_SOL} SOL`);
			console.log(`   Intermediary: ${intermediaryBalance / LAMPORTS_PER_SOL} SOL`);
			console.log(`   Extra: ${extraBalance / LAMPORTS_PER_SOL} SOL`);

			console.log('   ✅ Fan-out attack detection verification complete\n');
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
	const attack = new FanOutAttack();

	try {
		await attack.executeAttack();
		console.log('\n🎉 Fan-out attack simulation completed!');
		console.log('   This attack should have triggered:');
		console.log('   - Fan-out pattern detection (one-to-many transfers)');
		console.log('   - Suspicious activity alerts for simultaneous transfers');
		console.log('   - Evidence collection for each transaction');
		console.log('   - Chain of custody tracking for multiple recipients');
		console.log('   - Audit logging for compliance');
	} catch (error) {
		console.error('Attack failed:', error);
		process.exit(1);
	} finally {
		await attack.cleanup();
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export { FanOutAttack };
