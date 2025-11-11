/**
 * Connection Test Runner
 *
 * Simple script to run the connection test
 */

import { ConnectionTest } from './connection-test';

async function runConnectionTest() {
	console.log('🎯 Solana Forensics - Connection Test Runner\n');

	const test = new ConnectionTest();

	try {
		await test.runTest();
		console.log('\n🎉 All tests passed! Ready for attack simulations.');
	} catch (error) {
		console.error('\n💥 Test failed:', error);
		process.exit(1);
	} finally {
		await test.cleanup();
		// Exit the process after cleanup
		process.exit(0);
	}
}

runConnectionTest();
