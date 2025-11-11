/**
 * Circular Transfer Attack Runner
 *
 * Executes a circular transfer attack to test forensics detection
 */

import { CircularTransferAttack } from './circular-transfer-attack';

async function runCircularTransferAttack() {
	console.log('🔄 Solana Forensics - Circular Transfer Attack Simulation\n');

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
		console.error('\n💥 Attack failed:', error);
		process.exit(1);
	} finally {
		await attack.cleanup();
		console.log('\n🏁 Script completed - exiting...');
		process.exit(0);
	}
}

runCircularTransferAttack();
