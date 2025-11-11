/**
 * Fan-Out Attack Runner
 *
 * Executes a fan-out attack to test forensics detection
 */

import { FanOutAttack } from './fan-out-attack';

async function runFanOutAttack() {
	console.log('🌊 Solana Forensics - Fan-Out Attack Simulation\n');

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
		console.error('\n💥 Attack failed:', error);
		process.exit(1);
	} finally {
		await attack.cleanup();
		// Exit the process after cleanup
		process.exit(0);
	}
}

runFanOutAttack();
