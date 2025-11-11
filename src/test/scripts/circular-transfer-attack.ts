/**
 * Circular Transfer Attack Script
 *
 * This script simulates a circular transfer attack that should trigger:
 * - Circular transfer pattern detection (wash trading)
 * - Suspicious activity alerts for circular flows
 * - Evidence collection for each transaction in the cycle
 * - Chain of custody tracking for circular patterns
 * - Audit logging for compliance
 *
 * Attack Pattern: Circular transfer chain where funds flow through multiple wallets
 * and eventually return to the original sender (wash trading simulation)
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

class CircularTransferAttack {
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
		console.log('🔄 Starting Circular Transfer Attack...\n');

		try {
			// Step 1: Validate configuration
			await this.validateConfiguration();

			// Step 2: Test connection
			await this.testConnection();

			// Step 3: Start forensics monitoring
			await this.startMonitoring();

			// Step 4: Execute circular transfer attack
			await this.executeCircularTransferAttack();

			// Step 5: Wait and verify detection
			await this.verifyDetection();

			console.log('✅ Circular transfer attack completed successfully!');
		} catch (error) {
			console.error('❌ Circular transfer attack failed:', error);
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

		console.log(`   Attacker: ${attackerAddress}`);
		console.log(`   Victim 1: ${victim1Address}`);
		console.log(`   Victim 2: ${victim2Address}`);
		console.log(`   Victim 3: ${victim3Address}`);
		console.log(`   Intermediary: ${intermediaryAddress}`);
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

			console.log(`   Attacker balance: ${attackerBalance / LAMPORTS_PER_SOL} SOL`);
			console.log(`   Victim 1 balance: ${victim1Balance / LAMPORTS_PER_SOL} SOL`);
			console.log(`   Victim 2 balance: ${victim2Balance / LAMPORTS_PER_SOL} SOL`);
			console.log(`   Victim 3 balance: ${victim3Balance / LAMPORTS_PER_SOL} SOL`);
			console.log(`   Intermediary balance: ${intermediaryBalance / LAMPORTS_PER_SOL} SOL`);

			// Verify sufficient balance for attack (100 SOL for circular transfers)
			const totalAttackAmount = 100 * LAMPORTS_PER_SOL;
			if (attackerBalance < totalAttackAmount) {
				throw new Error(
					`Insufficient balance for attack. Need 100 SOL, have ${attackerBalance / LAMPORTS_PER_SOL} SOL`
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

	private async executeCircularTransferAttack(): Promise<void> {
		console.log('🔄 Step 4: Executing circular transfer attack...');

		try {
			// Define circular transfer chain (wash trading pattern)
			const circularTransfers = [
				{
					from: this.keypairs.attacker,
					to: this.keypairs.victim1,
					amount: 100,
					description: 'Circular Transfer 1: Attacker → Victim 1'
				},
				{
					from: this.keypairs.victim1,
					to: this.keypairs.victim2,
					amount: 95,
					description: 'Circular Transfer 2: Victim 1 → Victim 2'
				},
				{
					from: this.keypairs.victim2,
					to: this.keypairs.victim3,
					amount: 90,
					description: 'Circular Transfer 3: Victim 2 → Victim 3'
				},
				{
					from: this.keypairs.victim3,
					to: this.keypairs.intermediary,
					amount: 85,
					description: 'Circular Transfer 4: Victim 3 → Intermediary'
				},
				{
					from: this.keypairs.intermediary,
					to: this.keypairs.attacker,
					amount: 80,
					description: 'Circular Transfer 5: Intermediary → Attacker (COMPLETE CYCLE)'
				}
			];

			console.log(`   🚨 EXECUTING CIRCULAR TRANSFER ATTACK!`);
			console.log(`   Total transfers in cycle: ${circularTransfers.length}`);
			console.log(`   Pattern: Circular flow with decreasing amounts (wash trading)`);
			console.log(`   Final return to attacker: 80 SOL\n`);

			// Execute circular transfers sequentially
			for (let i = 0; i < circularTransfers.length; i++) {
				const transfer = circularTransfers[i];
				const startTime = Date.now();

				console.log(`   🔄 Circular Transfer ${i + 1}: ${transfer.description}`);
				console.log(`     Amount: ${transfer.amount} SOL`);
				console.log(`     From: ${transfer.from.publicKey.toString()}`);
				console.log(`     To: ${transfer.to.publicKey.toString()}`);

				// Create transaction
				const transaction = new Transaction().add(
					SystemProgram.transfer({
						fromPubkey: transfer.from.publicKey,
						toPubkey: transfer.to.publicKey,
						lamports: transfer.amount * LAMPORTS_PER_SOL
					})
				);

				// Get recent blockhash
				const { blockhash } = await this.connection.getLatestBlockhash();
				transaction.recentBlockhash = blockhash;
				transaction.feePayer = transfer.from.publicKey;

				// Sign and send transaction
				transaction.sign(transfer.from);
				const signature = await this.connection.sendTransaction(transaction, [transfer.from]);

				// Wait for confirmation
				await this.connection.confirmTransaction(signature);

				const endTime = Date.now();
				const duration = (endTime - startTime) / 1000;

				console.log(`     ✅ Circular transfer confirmed in ${duration.toFixed(2)}s`);
				console.log(`     Signature: ${signature}`);

				this.transactionSignatures.push(signature);

				// Small delay between transfers to simulate realistic timing
				if (i < circularTransfers.length - 1) {
					console.log(`     ⏱️  Waiting 3 seconds before next transfer...`);
					await new Promise((resolve) => setTimeout(resolve, 3000));
				}
			}

			console.log(`\n   🚨 CIRCULAR TRANSFER ATTACK COMPLETE!`);
			console.log(`   Total transfers in cycle: ${this.transactionSignatures.length}`);
			console.log(`   Circular pattern: Funds returned to original sender`);
			console.log(`   Wash trading simulation: Complete\n`);
		} catch (error) {
			throw new Error(`Failed to execute circular transfer attack: ${error}`);
		}
	}

	private async verifyDetection(): Promise<void> {
		console.log('🔍 Step 5: Verifying forensics detection...');

		// Wait longer for processing circular transfer pattern
		console.log('   Waiting for forensics processing...');
		await new Promise((resolve) => setTimeout(resolve, 5000));

		try {
			// Check if evidence was collected (if method exists)
			if (typeof this.forensicsService.getRecentEvidence === 'function') {
				const evidence = await this.forensicsService.getRecentEvidence();
				console.log(`   Evidence collected: ${evidence.length} items`);

				if (evidence.length > 0) {
					console.log('   ✅ Evidence collection working - Circular transfer pattern detected!');

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
					console.log('   🚨 ALERT SYSTEM WORKING - Circular transfer pattern flagged!');

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
			console.log(`\n   📊 CIRCULAR TRANSFER SUMMARY:`);
			console.log(`   Total transfers in cycle: ${this.transactionSignatures.length}`);
			console.log(`   Attack pattern: Circular transfer chain (wash trading)`);
			console.log(`   Flow: Attacker → Victim1 → Victim2 → Victim3 → Intermediary → Attacker`);
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

			console.log(`\n   💰 FINAL BALANCES:`);
			console.log(`   Attacker: ${attackerBalance / LAMPORTS_PER_SOL} SOL`);
			console.log(`   Victim 1: ${victim1Balance / LAMPORTS_PER_SOL} SOL`);
			console.log(`   Victim 2: ${victim2Balance / LAMPORTS_PER_SOL} SOL`);
			console.log(`   Victim 3: ${victim3Balance / LAMPORTS_PER_SOL} SOL`);
			console.log(`   Intermediary: ${intermediaryBalance / LAMPORTS_PER_SOL} SOL`);

			console.log('   ✅ Circular transfer attack detection verification complete\n');
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
	const attack = new CircularTransferAttack();

	try {
		await attack.executeAttack();
		console.log('\n🎉 Circular transfer attack simulation completed!');
		console.log('   This attack should have triggered:');
		console.log('   - Circular transfer pattern detection (wash trading)');
		console.log('   - Suspicious activity alerts for circular flows');
		console.log('   - Evidence collection for each transaction in the cycle');
		console.log('   - Chain of custody tracking for circular patterns');
		console.log('   - Audit logging for compliance');
	} catch (error) {
		console.error('Attack failed:', error);
		process.exit(1);
	} finally {
		await attack.cleanup();
		console.log('\n🏁 Script completed - exiting...');
		process.exit(0);
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export { CircularTransferAttack };
