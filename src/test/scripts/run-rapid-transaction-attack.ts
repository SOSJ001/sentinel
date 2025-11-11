/**
 * Rapid Transaction Attack Runner
 *
 * Executes a rapid transaction attack to test forensics detection
 */

import { RapidTransactionAttack } from './rapid-transaction-attack';

async function runRapidTransactionAttack() {
	console.log('⚡ Solana Forensics - Rapid Transaction Attack Simulation\n');

	const attack = new RapidTransactionAttack();

	try {
		await attack.executeAttack();
		console.log('\n🎉 Rapid transaction attack simulation completed!');
		console.log('   This attack should have triggered:');
		console.log('   - Rapid transaction alerts (< 60 seconds between transactions)');
		console.log('   - Suspicious activity patterns');
		console.log('   - Evidence collection for each transaction');
		console.log('   - Chain of custody tracking for multiple transactions');
		console.log('   - Audit logging for compliance');
	} catch (error) {
		console.error('\n💥 Attack failed:', error);
		process.exit(1);
	} finally {
		await attack.cleanup();
		// Exit the process after cleanup
		process.exit(0);
	}
}

runRapidTransactionAttack();
