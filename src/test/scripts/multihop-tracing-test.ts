/**
 * Multi-hop Tracing Scenario Script
 *
 * This script creates a complex multi-hop transaction scenario
 * that can be traced using the multi-hop tracing mode.
 *
 * USAGE:
 * npm run test:multihop
 *
 * This will:
 * 1. Generate a complex transaction with multiple hops
 * 2. Display the transaction signature
 * 3. Instruct you to use the main project UI to trace it with multi-hop mode
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

class MultiHopTracingScenario {
	private connection: Connection;
	private keypairs: ReturnType<typeof getAllKeypairs>;
	private transactionSignature: string = '';

	constructor() {
		// Initialize connection to local validator
		this.connection = new Connection(localRpcConfig.rpcUrl, localRpcConfig.commitment);

		// Get keypairs for signing
		this.keypairs = getAllKeypairs();
	}

	async executeScenario(): Promise<void> {
		console.log('🔄 Starting Multi-hop Tracing Scenario...\n');
		console.log('📝 Creating complex transaction with multiple hops\n');

		try {
			// Step 1: Validate configuration
			await this.validateConfiguration();

			// Step 2: Test connection
			await this.testConnection();

			// Step 3: Create multi-hop transaction
			await this.createMultiHopTransaction();

			// Step 4: Display results and instructions
			await this.displayInstructions();

			console.log('\n✅ Multi-hop Tracing Scenario completed successfully!');
		} catch (error) {
			console.error('❌ Multi-hop Tracing Scenario failed:', error);
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
		const intermediaryAddress = this.keypairs.intermediary.publicKey.toString();

		console.log(`   Attacker: ${attackerAddress}`);
		console.log(`   Victim 1: ${victim1Address}`);
		console.log(`   Victim 2: ${victim2Address}`);
		console.log(`   Intermediary: ${intermediaryAddress}`);
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

			if (attackerBalance < 15 * LAMPORTS_PER_SOL) {
				throw new Error('Insufficient balance for multi-hop scenario. Need at least 15 SOL');
			}

			console.log('   ✅ Connection successful\n');
		} catch (error) {
			throw new Error(`Connection failed: ${error}`);
		}
	}

	private async createMultiHopTransaction(): Promise<void> {
		console.log('🔄 Step 3: Creating multi-hop transaction...');

		try {
			// Create a complex transaction with multiple transfers in sequence
			// This simulates a complex DeFi operation or money laundering scheme

			const transaction = new Transaction();

			// Add multiple transfer instructions to create a multi-hop scenario
			// Hop 1: Attacker → Victim 1
			transaction.add(
				SystemProgram.transfer({
					fromPubkey: this.keypairs.attacker.publicKey,
					toPubkey: this.keypairs.victim1.publicKey,
					lamports: 3 * LAMPORTS_PER_SOL
				})
			);

			// Hop 2: Attacker → Victim 2 (parallel transfer)
			transaction.add(
				SystemProgram.transfer({
					fromPubkey: this.keypairs.attacker.publicKey,
					toPubkey: this.keypairs.victim2.publicKey,
					lamports: 2 * LAMPORTS_PER_SOL
				})
			);

			// Hop 3: Attacker → Intermediary
			transaction.add(
				SystemProgram.transfer({
					fromPubkey: this.keypairs.attacker.publicKey,
					toPubkey: this.keypairs.intermediary.publicKey,
					lamports: 4 * LAMPORTS_PER_SOL
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

			this.transactionSignature = signature;
			console.log('   ✅ Multi-hop transaction created');
			console.log(`   Signature: ${signature}`);
			console.log(`   Instructions: 3 transfer instructions`);
			console.log(`   Total amount: 9 SOL distributed across 3 recipients`);
			console.log(`   Complexity: Multi-hop within single transaction\n`);
		} catch (error) {
			throw new Error(`Failed to create multi-hop transaction: ${error}`);
		}
	}

	private async displayInstructions(): Promise<void> {
		console.log('📖 Step 4: Multi-hop Tracing Instructions...');

		console.log('\n🎯 MULTI-HOP SCENARIO CREATED!');
		console.log('   Use the main project UI to trace this complex transaction:\n');

		console.log('📋 Transaction Signature to Trace:');
		console.log(`   ${this.transactionSignature}`);

		console.log('\n🔍 How to Test Multi-hop Tracing:');
		console.log('   1. Start the main project: npm run dev');
		console.log('   2. Open: http://localhost:5173/wallet-monitor');
		console.log('   3. Navigate to "Transaction Tracing" section');
		console.log('   4. Select "Multi-hop" tracing mode');
		console.log('   5. Paste the signature above into the input field');
		console.log('   6. Click "Start Trace"');
		console.log('   7. View the multi-hop trace results');

		console.log('\n📊 Expected Results:');
		console.log('   - Single transaction with 3 internal hops');
		console.log('   - Attacker → Victim 1 (3 SOL)');
		console.log('   - Attacker → Victim 2 (2 SOL)');
		console.log('   - Attacker → Intermediary (4 SOL)');
		console.log('   - All hops within the same transaction signature');
		console.log('   - Risk assessment based on multi-hop complexity');

		console.log('\n💡 Tips:');
		console.log('   - Use "Multi-hop" mode for this scenario');
		console.log('   - Compare with "Chain" mode to see the difference');
		console.log('   - Check how the UI displays multiple hops vs separate transactions');

		console.log('\n✅ Instructions complete\n');
	}

	async cleanup(): Promise<void> {
		console.log('🧹 Cleaning up...');
		try {
			console.log('   ✅ Cleanup complete');
		} catch (error) {
			console.log(`   ⚠️  Cleanup warning: ${error}`);
		}
	}
}

// Main execution
async function main() {
	const scenario = new MultiHopTracingScenario();

	try {
		await scenario.executeScenario();
		console.log('\n🎉 Multi-hop Tracing Scenario Completed!');
		console.log('\n📋 Scenario Summary:');
		console.log('   ✅ Configuration validated');
		console.log('   ✅ Connection tested');
		console.log('   ✅ Multi-hop transaction created');
		console.log('   ✅ Instructions provided');
		console.log('\n💡 Use the main project UI to test multi-hop tracing!');
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

export { MultiHopTracingScenario };
