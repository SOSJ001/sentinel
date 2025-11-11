/**
 * High-Value Attack Runner
 *
 * Executes a high-value transfer attack to test forensics detection
 */

import { HighValueAttack } from './high-value-attack';

async function runHighValueAttack() {
	console.log('💰 Solana Forensics - High-Value Attack Simulation\n');

	const attack = new HighValueAttack();

	try {
		await attack.executeAttack();
		console.log('\n🎉 High-value attack simulation completed!');
		console.log('   This attack should have triggered:');
		console.log('   - High-value transaction alerts');
		console.log('   - Evidence collection with SHA-256 integrity');
		console.log('   - Chain of custody tracking');
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

runHighValueAttack();
