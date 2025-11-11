#!/usr/bin/env tsx

/**
 * Runner script for Transaction Tracing Scenario
 *
 * Usage:
 *   npm run test:tracing
 *   or
 *   tsx src/test/scripts/run-transaction-tracing-test.ts
 */

import { TransactionTracingScenario } from './transaction-tracing-test';

async function main() {
	console.log('═══════════════════════════════════════════════════════════');
	console.log('   TRANSACTION TRACING SCENARIO');
	console.log('   Creating test transactions for UI tracing');
	console.log('═══════════════════════════════════════════════════════════\n');

	const scenario = new TransactionTracingScenario();

	try {
		await scenario.executeScenario();
		console.log('\n═══════════════════════════════════════════════════════════');
		console.log('   ✅ SCENARIO COMPLETED');
		console.log('═══════════════════════════════════════════════════════════\n');
		process.exit(0);
	} catch (error) {
		console.error('\n═══════════════════════════════════════════════════════════');
		console.error('   ❌ SCENARIO FAILED');
		console.error('═══════════════════════════════════════════════════════════');
		console.error(error);
		process.exit(1);
	} finally {
		await scenario.cleanup();
	}
}

main();
