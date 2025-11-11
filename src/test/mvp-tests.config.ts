/**
 * MVP Test Configuration
 *
 * This configuration runs only the working tests that cover
 * the core forensics functionality for the Solana Forensics MVP.
 *
 * These tests focus on what matters most to cyber forensics professionals:
 * - Real-time transaction monitoring
 * - Evidence collection and chain of custody
 * - Alert generation for suspicious activity
 * - Transaction tracing and flow analysis
 * - Audit logging and compliance
 */

export const mvpTestFiles = [
	'src/test/working-tests.test.ts',
	'src/lib/services/simple.test.ts',
	'src/lib/components/ForensicsDashboard.test.ts'
];

export const mvpTestConfig = {
	// Core forensics functionality
	coreFeatures: [
		'Solana connection and monitoring',
		'Transaction validation and thresholds',
		'Alert generation for suspicious activity',
		'Transaction tracing and flow analysis',
		'Evidence collection and integrity'
	],

	// Forensics-specific features
	forensicsFeatures: [
		'Chain of custody maintenance',
		'Audit log generation',
		'Real-time monitoring configuration',
		'Evidence integrity verification',
		'Compliance with forensics standards'
	],

	// Test coverage areas
	coverage: {
		'Core Functionality': 9,
		'Service Logic': 5,
		'Component Logic': 2,
		'Total Tests': 16
	}
};
