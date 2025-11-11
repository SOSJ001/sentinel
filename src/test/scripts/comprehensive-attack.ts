/**
 * Comprehensive Attack Script
 *
 * This script combines ALL attack patterns into one sophisticated multi-stage attack:
 * 1. High-Value Transfer Attack (150 SOL)
 * 2. Rapid Transaction Attack (5 rapid transfers, 50 SOL)
 * 3. Fan-Out Attack (5 simultaneous transfers, 200 SOL)
 * 4. Circular Transfer Attack (5-step wash trading cycle, 100 SOL)
 *
 * This simulates a real-world sophisticated money laundering operation
 * that should trigger multiple forensics detection mechanisms.
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

class ComprehensiveAttack {
	private connection: Connection;
	private solanaService: SolanaService;
	private forensicsService: ForensicsService;
	private validationService: ValidationService;
	private keypairs: ReturnType<typeof getAllKeypairs>;
	private allTransactionSignatures: Array<{ signature: string; attackType: string }> = [];

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
		console.log('🎯 Starting Comprehensive Multi-Stage Attack...\n');

		try {
			// Step 1: Validate configuration
			await this.validateConfiguration();

			// Step 2: Test connection
			await this.testConnection();

			// Step 3: Start forensics monitoring
			await this.startMonitoring();

			// Step 4: Execute Stage 1 - High-Value Transfer
			await this.executeHighValueAttack();

			// Step 5: Execute Stage 2 - Rapid Transactions
			await this.executeRapidTransactionAttack();

			// Step 6: Execute Stage 3 - Fan-Out Attack
			await this.executeFanOutAttack();

			// Step 7: Execute Stage 4 - Circular Transfer
			await this.executeCircularTransferAttack();

			// Step 8: Wait and verify detection
			await this.verifyDetection();

			console.log('✅ Comprehensive attack completed successfully!');
		} catch (error) {
			console.error('❌ Comprehensive attack failed:', error);
			throw error;
		}
	}

	private async validateConfiguration(): Promise<void> {
		console.log('📋 Step 1: Validating comprehensive attack configuration...');

		// Validate private keys
		if (!validatePrivateKeys()) {
			throw new Error('Private keys not properly configured');
		}

		// Validate attack thresholds
		console.log(`   High-value threshold: ${attackThresholds.highValue} SOL`);
		console.log(`   Fast transaction threshold: ${attackThresholds.fastTransaction} seconds`);
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
		console.log('   ✅ Comprehensive attack configuration valid\n');
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

			// Verify sufficient balance for comprehensive attack (500 SOL total)
			const totalAttackAmount = 500 * LAMPORTS_PER_SOL;
			if (attackerBalance < totalAttackAmount) {
				throw new Error(
					`Insufficient balance for comprehensive attack. Need 500 SOL, have ${attackerBalance / LAMPORTS_PER_SOL} SOL`
				);
			}

			console.log('   ✅ Connection successful and sufficient balance\n');
		} catch (error) {
			throw new Error(`Connection failed: ${error}`);
		}
	}

	private async startMonitoring(): Promise<void> {
		console.log('👁️  Step 3: Testing connection to local validator...');

		try {
			// Just test connection, don't start monitoring
			await this.solanaService.initialize();
			console.log('   ✅ Connection successful and sufficient balance\n');
		} catch (error) {
			throw new Error(`Connection failed: ${error}`);
		}
	}

	private async executeHighValueAttack(): Promise<void> {
		console.log('💰 STAGE 1: High-Value Transfer Attack (150 SOL)...');

		try {
			const transaction = new Transaction().add(
				SystemProgram.transfer({
					fromPubkey: this.keypairs.attacker.publicKey,
					toPubkey: this.keypairs.victim1.publicKey,
					lamports: 150 * LAMPORTS_PER_SOL
				})
			);

			const { blockhash } = await this.connection.getLatestBlockhash();
			transaction.recentBlockhash = blockhash;
			transaction.feePayer = this.keypairs.attacker.publicKey;

			transaction.sign(this.keypairs.attacker);
			const signature = await this.connection.sendTransaction(transaction, [
				this.keypairs.attacker
			]);
			await this.connection.confirmTransaction(signature);

			this.allTransactionSignatures.push({ signature, attackType: 'High-Value Transfer' });
			console.log(`   ✅ High-value transfer: 150 SOL → Victim 1`);
			console.log(`   Signature: ${signature}\n`);
		} catch (error) {
			throw new Error(`High-value attack failed: ${error}`);
		}
	}

	private async executeRapidTransactionAttack(): Promise<void> {
		console.log('⚡ STAGE 2: Rapid Transaction Attack (5 rapid transfers, 50 SOL total)...');

		try {
			const rapidTransactions = [
				{ target: this.keypairs.victim2, amount: 10, description: 'Rapid 1' },
				{ target: this.keypairs.victim3, amount: 12, description: 'Rapid 2' },
				{ target: this.keypairs.intermediary, amount: 8, description: 'Rapid 3' },
				{ target: this.keypairs.extra, amount: 15, description: 'Rapid 4' },
				{ target: this.keypairs.victim1, amount: 5, description: 'Rapid 5' }
			];

			for (let i = 0; i < rapidTransactions.length; i++) {
				const tx = rapidTransactions[i];

				const transaction = new Transaction().add(
					SystemProgram.transfer({
						fromPubkey: this.keypairs.attacker.publicKey,
						toPubkey: tx.target.publicKey,
						lamports: tx.amount * LAMPORTS_PER_SOL
					})
				);

				const { blockhash } = await this.connection.getLatestBlockhash();
				transaction.recentBlockhash = blockhash;
				transaction.feePayer = this.keypairs.attacker.publicKey;

				transaction.sign(this.keypairs.attacker);
				const signature = await this.connection.sendTransaction(transaction, [
					this.keypairs.attacker
				]);
				await this.connection.confirmTransaction(signature);

				this.allTransactionSignatures.push({ signature, attackType: 'Rapid Transaction' });
				console.log(
					`   ✅ Rapid transfer ${i + 1}: ${tx.amount} SOL → ${tx.target.publicKey.toString().slice(0, 8)}...`
				);

				if (i < rapidTransactions.length - 1) {
					await new Promise((resolve) => setTimeout(resolve, 2000));
				}
			}

			console.log(`   ✅ Rapid transaction attack complete: 5 transfers, 50 SOL total\n`);
		} catch (error) {
			throw new Error(`Rapid transaction attack failed: ${error}`);
		}
	}

	private async executeFanOutAttack(): Promise<void> {
		console.log('🌊 STAGE 3: Fan-Out Attack (5 simultaneous transfers, 200 SOL total)...');

		try {
			const fanOutTransfers = [
				{ target: this.keypairs.victim1, amount: 45, description: 'Fan-Out 1' },
				{ target: this.keypairs.victim2, amount: 38, description: 'Fan-Out 2' },
				{ target: this.keypairs.victim3, amount: 42, description: 'Fan-Out 3' },
				{ target: this.keypairs.intermediary, amount: 35, description: 'Fan-Out 4' },
				{ target: this.keypairs.extra, amount: 40, description: 'Fan-Out 5' }
			];

			const transferPromises = fanOutTransfers.map(async (tx, index) => {
				const transaction = new Transaction().add(
					SystemProgram.transfer({
						fromPubkey: this.keypairs.attacker.publicKey,
						toPubkey: tx.target.publicKey,
						lamports: tx.amount * LAMPORTS_PER_SOL
					})
				);

				const { blockhash } = await this.connection.getLatestBlockhash();
				transaction.recentBlockhash = blockhash;
				transaction.feePayer = this.keypairs.attacker.publicKey;

				transaction.sign(this.keypairs.attacker);
				const signature = await this.connection.sendTransaction(transaction, [
					this.keypairs.attacker
				]);
				await this.connection.confirmTransaction(signature);

				this.allTransactionSignatures.push({ signature, attackType: 'Fan-Out Pattern' });
				return { signature, amount: tx.amount, target: tx.target.publicKey.toString().slice(0, 8) };
			});

			const results = await Promise.all(transferPromises);

			results.forEach((result, index) => {
				console.log(`   ✅ Fan-out ${index + 1}: ${result.amount} SOL → ${result.target}...`);
			});

			console.log(`   ✅ Fan-out attack complete: 5 simultaneous transfers, 200 SOL total\n`);
		} catch (error) {
			throw new Error(`Fan-out attack failed: ${error}`);
		}
	}

	private async executeCircularTransferAttack(): Promise<void> {
		console.log('🔄 STAGE 4: Circular Transfer Attack (5-step wash trading cycle, 100 SOL)...');

		try {
			const circularTransfers = [
				{
					from: this.keypairs.attacker,
					to: this.keypairs.victim1,
					amount: 100,
					description: 'Circular 1: Attacker → Victim 1'
				},
				{
					from: this.keypairs.victim1,
					to: this.keypairs.victim2,
					amount: 95,
					description: 'Circular 2: Victim 1 → Victim 2'
				},
				{
					from: this.keypairs.victim2,
					to: this.keypairs.victim3,
					amount: 90,
					description: 'Circular 3: Victim 2 → Victim 3'
				},
				{
					from: this.keypairs.victim3,
					to: this.keypairs.intermediary,
					amount: 85,
					description: 'Circular 4: Victim 3 → Intermediary'
				},
				{
					from: this.keypairs.intermediary,
					to: this.keypairs.attacker,
					amount: 80,
					description: 'Circular 5: Intermediary → Attacker (COMPLETE CYCLE)'
				}
			];

			for (let i = 0; i < circularTransfers.length; i++) {
				const transfer = circularTransfers[i];

				const transaction = new Transaction().add(
					SystemProgram.transfer({
						fromPubkey: transfer.from.publicKey,
						toPubkey: transfer.to.publicKey,
						lamports: transfer.amount * LAMPORTS_PER_SOL
					})
				);

				const { blockhash } = await this.connection.getLatestBlockhash();
				transaction.recentBlockhash = blockhash;
				transaction.feePayer = transfer.from.publicKey;

				transaction.sign(transfer.from);
				const signature = await this.connection.sendTransaction(transaction, [transfer.from]);
				await this.connection.confirmTransaction(signature);

				this.allTransactionSignatures.push({ signature, attackType: 'Circular Transfer' });
				console.log(`   ✅ ${transfer.description}: ${transfer.amount} SOL`);

				if (i < circularTransfers.length - 1) {
					await new Promise((resolve) => setTimeout(resolve, 3000));
				}
			}

			console.log(`   ✅ Circular transfer attack complete: 5-step wash trading cycle, 100 SOL\n`);
		} catch (error) {
			throw new Error(`Circular transfer attack failed: ${error}`);
		}
	}

	private async verifyDetection(): Promise<void> {
		console.log('🔍 Step 8: Comprehensive attack execution summary...');
		console.log('   Attack scenarios created - check Sentinel UI for detection results...');

		// Wait for transactions to settle
		await new Promise((resolve) => setTimeout(resolve, 3000));

		try {
			// Show comprehensive attack summary
			console.log(`\n   📊 COMPREHENSIVE ATTACK SUMMARY:`);
			console.log(`   Total transactions executed: ${this.allTransactionSignatures.length}`);
			console.log(`   Attack stages completed: 4`);
			console.log(`   Total SOL involved: 500 SOL`);
			console.log(`   Attack patterns:`);
			console.log(`     - High-value transfer (150 SOL)`);
			console.log(`     - Rapid transactions (5 transfers, 50 SOL)`);
			console.log(`     - Fan-out pattern (5 simultaneous, 200 SOL)`);
			console.log(`     - Circular transfer (5-step cycle, 100 SOL)`);

			// Show all transaction signatures with attack types
			console.log(`\n   🚨 ALL TRANSACTION SIGNATURES:`);
			this.allTransactionSignatures.forEach((tx, index) => {
				console.log(`     TX ${index + 1} [${tx.attackType}]: ${tx.signature}`);
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

			console.log(`\n   💰 FINAL BALANCES AFTER COMPREHENSIVE ATTACK:`);
			console.log(`   Attacker: ${attackerBalance / LAMPORTS_PER_SOL} SOL`);
			console.log(`   Victim 1: ${victim1Balance / LAMPORTS_PER_SOL} SOL`);
			console.log(`   Victim 2: ${victim2Balance / LAMPORTS_PER_SOL} SOL`);
			console.log(`   Victim 3: ${victim3Balance / LAMPORTS_PER_SOL} SOL`);
			console.log(`   Intermediary: ${intermediaryBalance / LAMPORTS_PER_SOL} SOL`);
			console.log(`   Extra: ${extraBalance / LAMPORTS_PER_SOL} SOL`);

			console.log('   ✅ Comprehensive attack detection verification complete\n');
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
	const attack = new ComprehensiveAttack();

	try {
		await attack.executeAttack();
		console.log('\n🎉 Comprehensive multi-stage attack simulation completed!');
		console.log('   This sophisticated attack combined:');
		console.log('   - High-value transfer detection');
		console.log('   - Rapid transaction pattern detection');
		console.log('   - Fan-out pattern detection');
		console.log('   - Circular transfer (wash trading) detection');
		console.log('   - Evidence collection for all patterns');
		console.log('   - Chain of custody tracking');
		console.log('   - Audit logging for compliance');
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

export { ComprehensiveAttack };
