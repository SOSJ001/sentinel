#!/usr/bin/env node

/**
 * Test Runner Script for Solana Forensics MVP
 *
 * This script provides different testing modes:
 * - Unit tests: Fast, isolated tests
 * - Integration tests: Test with real Solana devnet
 * - Forensics tests: Test forensics-specific features
 * - Performance tests: Load testing
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

const testModes = {
	unit: 'npm run test:run -- --reporter=verbose',
	integration: 'npm run test:run -- --reporter=verbose --grep="integration"',
	forensics: 'npm run test:run -- --reporter=verbose --grep="forensics"',
	performance: 'npm run test:run -- --reporter=verbose --grep="performance"',
	coverage: 'npm run test:coverage',
	ui: 'npm run test:ui'
};

function runTests(mode = 'unit') {
	console.log(`🧪 Running ${mode} tests...`);

	if (!testModes[mode]) {
		console.error(`❌ Unknown test mode: ${mode}`);
		console.log('Available modes:', Object.keys(testModes).join(', '));
		process.exit(1);
	}

	try {
		execSync(testModes[mode], { stdio: 'inherit' });
		console.log(`✅ ${mode} tests completed successfully`);
	} catch (error) {
		console.error(`❌ ${mode} tests failed:`, error.message);
		process.exit(1);
	}
}

// Parse command line arguments
const args = process.argv.slice(2);
const mode = args[0] || 'unit';

// Check if test files exist
if (!existsSync('src/test/setup.ts')) {
	console.error('❌ Test setup file not found. Run npm install first.');
	process.exit(1);
}

console.log('🚀 Solana Forensics MVP - Test Runner');
console.log('=====================================');

runTests(mode);
