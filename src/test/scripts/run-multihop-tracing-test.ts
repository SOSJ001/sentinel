#!/usr/bin/env tsx

/**
 * Runner script for Multi-hop Tracing Scenario
 *
 * Usage:
 *   npm run test:multihop
 *   or
 *   tsx src/test/scripts/run-multihop-tracing-test.ts
 */

import { MultiHopTracingScenario } from './multihop-tracing-test';

async function main() {
	console.log('═══════════════════════════════════════════════════════════');
	console.log('   MULTI-HOP TRACING SCENARIO');
	console.log('   Creating complex transaction for multi-hop tracing');
	console.log('═══════════════════════════════════════════════════════════\n');

	const scenario = new MultiHopTracingScenario();

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
