/**
 * Comprehensive Attack Runner
 *
 * Executes a comprehensive multi-stage attack combining all attack patterns
 */

import { ComprehensiveAttack } from './comprehensive-attack';

async function runComprehensiveAttack() {
	console.log('🎯 Solana Forensics - Comprehensive Multi-Stage Attack Simulation\n');

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
		console.error('\n💥 Attack failed:', error);
		process.exit(1);
	} finally {
		await attack.cleanup();
		// Exit the process after cleanup
		process.exit(0);
	}
}

runComprehensiveAttack();
