/**
 * Transaction Tracing Scenario Script
 *
 * This script creates a tracing scenario by generating transactions
 * that can be traced using the main project's UI.
 *
 * USAGE:
 * npm run test:tracing
 *
 * This will:
 * 1. Generate a series of interconnected transactions
 * 2. Display the transaction signatures
 * 3. Instruct you to use the main project UI to trace them
 *
 * The main project UI handles all the actual tracing functionality.
 */

import {
	Connection,
	PublicKey,
	Transaction,
	SystemProgram,
	LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { localRpcConfig } from '../config/attack-wallets';
import { getAllKeypairs, validatePrivateKeys } from '../config/private-keys';

class TransactionTracingScenario {
	private connection: Connection;
	private keypairs: ReturnType<typeof getAllKeypairs>;
	private transactionSignatures: string[] = [];

	constructor() {
		// Initialize connection to local validator
		this.connection = new Connection(localRpcConfig.rpcUrl, localRpcConfig.commitment);

		// Get keypairs for signing
		this.keypairs = getAllKeypairs();
	}

	async executeScenario(): Promise<void> {
		console.log('🔍 Starting Transaction Tracing Scenario...\n');
		console.log('📝 Creating interconnected transactions for tracing\n');

		try {
			// Step 1: Validate configuration
			await this.validateConfiguration();

			// Step 2: Test connection
			await this.testConnection();

			// Step 3: Create tracing scenario
			await this.createTracingScenario();

			// Step 4: Display results and instructions
			await this.displayInstructions();

			console.log('\n✅ Transaction Tracing Scenario completed successfully!');
		} catch (error) {
			console.error('❌ Transaction Tracing Scenario failed:', error);
			throw error;
		}
	}

	private async validateConfiguration(): Promise<void> {
		console.log('📋 Step 1: Validating configuration...');

		// Validate private keys
		if (!validatePrivateKeys()) {
			throw new Error('Private keys not properly configured');
		}

		const attackerAddress = this.keypairs.attacker.publicKey.toString();
		const victim1Address = this.keypairs.victim1.publicKey.toString();
		const victim2Address = this.keypairs.victim2.publicKey.toString();

		console.log(`   Attacker: ${attackerAddress}`);
		console.log(`   Victim 1: ${victim1Address}`);
		console.log(`   Victim 2: ${victim2Address}`);
		console.log('   ✅ Configuration valid\n');
	}

	private async testConnection(): Promise<void> {
		console.log('🔌 Step 2: Testing connection...');

		try {
			// Test direct connection to blockchain
			const version = await this.connection.getVersion();
			console.log(`   Solana version: ${version['solana-core']}`);

			// Test account access
			const attackerBalance = await this.connection.getBalance(this.keypairs.attacker.publicKey);
			console.log(`   Attacker balance: ${attackerBalance / LAMPORTS_PER_SOL} SOL`);

			if (attackerBalance < 10 * LAMPORTS_PER_SOL) {
				throw new Error('Insufficient balance for tracing scenario. Need at least 10 SOL');
			}

			console.log('   ✅ Connection successful\n');
		} catch (error) {
			throw new Error(`Connection failed: ${error}`);
		}
	}

	private async createTracingScenario(): Promise<void> {
		console.log('🔗 Step 3: Creating tracing scenario...');

		try {
			// Create a multi-hop transaction chain for tracing
			const transactions = [
				{
					from: this.keypairs.attacker,
					to: this.keypairs.victim1,
					amount: 5,
					description: 'Initial Transfer: Attacker → Victim 1'
				},
				{
					from: this.keypairs.victim1,
					to: this.keypairs.victim2,
					amount: 4.5,
					description: 'Second Hop: Victim 1 → Victim 2'
				},
				{
					from: this.keypairs.victim2,
					to: this.keypairs.intermediary,
					amount: 4,
					description: 'Third Hop: Victim 2 → Intermediary'
				}
			];

			for (let i = 0; i < transactions.length; i++) {
				const tx = transactions[i];

				const transaction = new Transaction().add(
					SystemProgram.transfer({
						fromPubkey: tx.from.publicKey,
						toPubkey: tx.to.publicKey,
						lamports: tx.amount * LAMPORTS_PER_SOL
					})
				);

				const { blockhash } = await this.connection.getLatestBlockhash();
				transaction.recentBlockhash = blockhash;
				transaction.feePayer = tx.from.publicKey;

				transaction.sign(tx.from);
				const signature = await this.connection.sendTransaction(transaction, [tx.from]);
				await this.connection.confirmTransaction(signature);

				this.transactionSignatures.push(signature);
				console.log(`   ✅ ${tx.description}`);
				console.log(`      Signature: ${signature}`);

				// Wait between transactions to ensure proper ordering
				if (i < transactions.length - 1) {
					await new Promise((resolve) => setTimeout(resolve, 2000));
				}
			}

			console.log(
				`   ✅ Tracing scenario created: ${this.transactionSignatures.length} transactions\n`
			);
		} catch (error) {
			throw new Error(`Failed to create tracing scenario: ${error}`);
		}
	}

	private async displayInstructions(): Promise<void> {
		console.log('📖 Step 4: Tracing Instructions...');

		console.log('\n🎯 TRACING SCENARIO CREATED!');
		console.log('   Use the main project UI to trace these transactions:\n');

		console.log('📋 Transaction Signatures to Trace:');
		this.transactionSignatures.forEach((sig, index) => {
			console.log(`   ${index + 1}. ${sig}`);
		});

		console.log('\n🔍 How to Test Tracing:');
		console.log('   1. Start the main project: npm run dev');
		console.log('   2. Open: http://localhost:5173/wallet-monitor');
		console.log('   3. Navigate to "Transaction Tracing" section');
		console.log('   4. Paste any signature above into the input field');
		console.log('   5. Click "Start Trace"');
		console.log('   6. View the trace results and risk assessment');
		console.log('   7. Test the "Export Trace" functionality');

		console.log('\n📊 Expected Results:');
		console.log('   - 3-hop transaction chain (5 SOL → 4.5 SOL → 4 SOL)');
		console.log('   - Risk assessment should show normal to medium risk');
		console.log('   - Trace path should show all 4 wallet addresses');
		console.log('   - Export should generate valid JSON evidence');

		console.log('\n💡 Tips:');
		console.log('   - Start with the first signature for full chain tracing');
		console.log('   - Try the second/third signatures for partial chain tracing');
		console.log('   - Check the risk scores and pattern detection');
		console.log('   - Verify the export functionality works');

		console.log('\n✅ Instructions complete\n');
	}

	async cleanup(): Promise<void> {
		console.log('🧹 Cleaning up...');
		try {
			// Connection cleanup (Connection doesn't have removeAllListeners)
			// Just log completion
			console.log('   ✅ Cleanup complete');
		} catch (error) {
			console.log(`   ⚠️  Cleanup warning: ${error}`);
		}
	}
}

// Main execution
async function main() {
	const scenario = new TransactionTracingScenario();

	try {
		await scenario.executeScenario();
		console.log('\n🎉 Transaction Tracing Scenario Completed!');
		console.log('\n📋 Scenario Summary:');
		console.log('   ✅ Configuration validated');
		console.log('   ✅ Connection tested');
		console.log('   ✅ Tracing scenario created');
		console.log('   ✅ Instructions provided');
		console.log('\n💡 Use the main project UI to test transaction tracing!');
	} catch (error) {
		console.error('\n❌ Scenario failed:', error);
		process.exit(1);
	} finally {
		await scenario.cleanup();
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export { TransactionTracingScenario };
