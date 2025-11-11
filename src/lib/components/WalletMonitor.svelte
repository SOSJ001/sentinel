<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import { getClientSolanaService } from '$lib/services/client-solana.service';
	import { getConfigService } from '$lib/services/index';
	import AlertPanel from './AlertPanel.svelte';
	import TransactionLog from './TransactionLog.svelte';
	import TracingFlow from './TracingFlow.svelte';

	// State management
	export let walletAddress = '';
	export let isMonitoring = false;
	export let connectionStatus = 'disconnected';
	export let alertCount = 0;

	// Service instance (initialized in onMount)
	let solanaService: any;
	let configService: any;

	// Forensics-specific state
	let evidenceChain: string[] = [];
	let monitoringStartTime: Date | null = null;
	let sessionId: string = '';

	// Real-time monitoring state
	let alerts: any[] = [];
	let transactions: any[] = [];

	// Validation rules
	let validationRules = {
		maxAmount: 100, // SOL
		maxSpeed: 60, // seconds between transactions
		suspiciousPatterns: true,
		mixerDetection: true
	};

	// Save validation rules to config when changed
	function saveValidationRules() {
		if (configService) {
			configService.updateThresholdsConfig({
				maxAmount: validationRules.maxAmount,
				maxSpeed: validationRules.maxSpeed
			});
		}
	}

	// Generate session ID for chain of custody
	let unsubscribeAlerts: (() => void) | null = null;
	let unsubscribeTransactions: (() => void) | null = null;

	// Enhanced evidence tracking
	let transactionCount = 0;
	let suspiciousPatterns: string[] = [];
	let riskScore = 0;

	onMount(() => {
		// Initialize services (client-side only)
		configService = getConfigService();

		// Load validation rules from config
		const config = configService.getConfig();
		if (config.thresholds) {
			validationRules.maxAmount = config.thresholds.maxAmount || 100;
			validationRules.maxSpeed = config.thresholds.maxSpeed || 60;
		}

		getClientSolanaService().then((service) => {
			solanaService = service;
			sessionId = generateSessionId();
			monitoringStartTime = new Date();

			// Subscribe to alerts and transactions
			unsubscribeAlerts = solanaService.alerts.subscribe((newAlerts: any[]) => {
				alerts = newAlerts;
				alertCount = newAlerts.length;

				// Add new alerts to evidence chain
				newAlerts.forEach((alert) => {
					const timestamp = new Date().toISOString();
					evidenceChain.push(
						`Alert: ${alert.severity?.toUpperCase() || 'UNKNOWN'} - ${alert.title || 'Unknown Alert'} at ${timestamp}`
					);

					// Add alert details if available
					if (alert.description) {
						evidenceChain.push(`  Description: ${alert.description}`);
					}
					if (alert.walletAddress) {
						evidenceChain.push(
							`  Wallet: ${alert.walletAddress.slice(0, 8)}...${alert.walletAddress.slice(-8)}`
						);
					}
					if (alert.transactionHash) {
						evidenceChain.push(
							`  Transaction: ${alert.transactionHash.slice(0, 8)}...${alert.transactionHash.slice(-8)}`
						);
					}
					if (alert.amount) {
						evidenceChain.push(`  Amount: ${alert.amount} SOL`);
					}
				});

				// Update risk score
				riskScore = calculateRiskScore();
			});

			unsubscribeTransactions = solanaService.transactions.subscribe((newTransactions: any[]) => {
				transactions = newTransactions;
				transactionCount = newTransactions.length;

				// Add new transactions to evidence chain
				newTransactions.forEach((tx) => {
					const timestamp = new Date().toISOString();
					evidenceChain.push(
						`Transaction: ${tx.hash?.slice(0, 8) || 'Unknown'}...${tx.hash?.slice(-8) || 'Unknown'} - ${tx.amount || 0} ${tx.token || 'SOL'} at ${timestamp}`
					);

					// Add transaction details if available
					if (tx.from) {
						evidenceChain.push(`  From: ${tx.from.slice(0, 8)}...${tx.from.slice(-8)}`);
					}
					if (tx.to) {
						evidenceChain.push(`  To: ${tx.to.slice(0, 8)}...${tx.to.slice(-8)}`);
					}
					if (tx.type) {
						evidenceChain.push(`  Type: ${tx.type}`);
					}
					if (tx.status) {
						evidenceChain.push(`  Status: ${tx.status}`);
					}
					if (tx.fee) {
						evidenceChain.push(`  Fee: ${tx.fee} SOL`);
					}

					// Check for suspicious patterns
					if (tx.evidence?.isSuspicious) {
						const patternType = tx.evidence.flags?.join(', ') || 'Unknown Pattern';
						suspiciousPatterns.push(patternType);
						evidenceChain.push(`  Suspicious Pattern: ${patternType}`);
						evidenceChain.push(`  Risk Score: ${tx.evidence.riskScore || 0}/100`);
					}
				});

				// Update risk score
				riskScore = calculateRiskScore();
			});
		});

		// Return cleanup function for onMount
		return () => {
			if (unsubscribeAlerts) {
				unsubscribeAlerts();
			}
			if (unsubscribeTransactions) {
				unsubscribeTransactions();
			}
		};
	});

	function generateSessionId(): string {
		return `FORE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	function calculateRiskScore(): number {
		let score = 0;

		// Base risk from alerts
		alerts.forEach((alert) => {
			switch (alert.severity) {
				case 'critical':
					score += 30;
					break;
				case 'high':
					score += 20;
					break;
				case 'medium':
					score += 10;
					break;
				case 'low':
					score += 5;
					break;
			}
		});

		// Risk from suspicious patterns
		score += suspiciousPatterns.length * 15;

		// Risk from transaction volume
		if (transactionCount > 10) score += 10;
		if (transactionCount > 50) score += 20;

		// Cap at 100
		return Math.min(score, 100);
	}

	async function startMonitoring() {
		if (!walletAddress) {
			alert('Please enter a wallet address');
			return;
		}

		try {
			connectionStatus = 'connecting';
			isMonitoring = true;
			monitoringStartTime = new Date();

			// Initialize evidence chain
			evidenceChain = [
				`Session ${sessionId} started at ${monitoringStartTime.toISOString()}`,
				`Monitoring wallet: ${walletAddress}`,
				`Validation rules: Max Amount: ${validationRules.maxAmount} SOL, Max Speed: ${validationRules.maxSpeed}s, Suspicious Patterns: ${validationRules.suspiciousPatterns ? 'ON' : 'OFF'}, Mixer Detection: ${validationRules.mixerDetection ? 'ON' : 'OFF'}`
			];

			const connected = await solanaService.connect(walletAddress);

			if (connected) {
				connectionStatus = 'connected';
				// Start monitoring with validation rules and wallet address
				await solanaService.startMonitoring({
					...validationRules,
					monitoredWallet: walletAddress,
					walletAddress: walletAddress
				});
			} else {
				connectionStatus = 'error';
				isMonitoring = false;
			}
		} catch (error) {
			connectionStatus = 'error';
			isMonitoring = false;
		}
	}

	function stopMonitoring() {
		isMonitoring = false;
		connectionStatus = 'disconnected';
		solanaService.disconnect();

		// Add session summary to evidence chain
		const endTime = new Date();
		evidenceChain.push(`Session ${sessionId} stopped at ${endTime.toISOString()}`);
		evidenceChain.push(`Session Summary:`);
		evidenceChain.push(
			`  Duration: ${Math.round((endTime.getTime() - monitoringStartTime!.getTime()) / 1000)}s`
		);
		evidenceChain.push(`  Alerts Generated: ${alertCount}`);
		evidenceChain.push(`  Transactions Monitored: ${transactionCount}`);
		evidenceChain.push(`  Suspicious Patterns: ${suspiciousPatterns.length}`);
		evidenceChain.push(`  Risk Score: ${riskScore}/100`);
	}

	function exportEvidence() {
		// Prompt user to stop monitoring if still active
		if (isMonitoring) {
			const shouldStop = confirm(
				'Monitoring is still active. To export complete evidence, monitoring will be stopped. Continue?'
			);

			if (shouldStop) {
				stopMonitoring();
			} else {
				return; // User cancelled
			}
		}

		const evidence = {
			sessionId,
			walletAddress,
			startTime: monitoringStartTime,
			endTime: new Date(),
			evidenceChain,
			alertCount,
			transactionCount,
			suspiciousPatterns,
			riskScore,
			validationRules,
			alerts: alerts.map((alert) => ({
				id: alert.id,
				severity: alert.severity,
				title: alert.title,
				description: alert.description,
				timestamp: alert.timestamp,
				walletAddress: alert.walletAddress,
				transactionHash: alert.transactionHash,
				amount: alert.amount
			})),
			transactions: transactions.map((tx) => ({
				hash: tx.hash,
				from: tx.from,
				to: tx.to,
				amount: tx.amount,
				token: tx.token,
				type: tx.type,
				status: tx.status,
				fee: tx.fee,
				timestamp: tx.timestamp,
				evidence: tx.evidence
			}))
		};

		const blob = new Blob([JSON.stringify(evidence, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `forensics-evidence-${sessionId}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function validateWalletAddress(address: string): boolean {
		// Basic Solana address validation
		return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
	}
</script>

<div class="wallet-monitor">
	<!-- Header -->
	<header class="bg-gray-800 border-b border-gray-700 p-4">
		<div class="max-w-7xl mx-auto flex justify-between items-center">
			<div>
				<div class="flex items-center space-x-4 mb-2">
					<h1 class="text-2xl font-bold text-blue-400">Solana Forensics Monitor</h1>
					<button
						on:click={() => (window.location.href = '/')}
						class="text-gray-400 hover:text-white text-sm underline"
					>
						← Back to Dashboard
					</button>
				</div>
				<p class="text-gray-400">Professional-grade transaction monitoring and analysis</p>
			</div>
			<div class="flex items-center space-x-4">
				<div class="flex items-center space-x-2">
					<div
						class="w-3 h-3 rounded-full {connectionStatus === 'connected'
							? 'bg-green-500'
							: connectionStatus === 'connecting'
								? 'bg-yellow-500'
								: 'bg-red-500'}"
					></div>
					<span class="text-sm capitalize">{connectionStatus}</span>
				</div>
				{#if alertCount > 0}
					<div class="bg-red-600 text-white px-2 py-1 rounded text-sm">
						{alertCount} Alerts
					</div>
				{/if}
				<button
					on:click={() => (window.location.href = '/forensics-dashboard')}
					class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
				>
					View Evidence
				</button>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto p-4">
		<!-- Wallet Input Section -->
		<section class="bg-gray-800 rounded-lg p-6 mb-6">
			<h2 class="text-xl font-semibold text-white mb-4">Wallet Monitoring</h2>

			<!-- Wallet Address Input with Buttons -->
			<div class="flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
				<div class="flex-1">
					<label for="wallet-address" class="block text-sm font-medium text-white mb-2">
						Wallet Address
					</label>
					<input
						id="wallet-address"
						type="text"
						bind:value={walletAddress}
						placeholder="Enter Solana wallet address..."
						class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
						disabled={isMonitoring}
					/>
					{#if walletAddress && !validateWalletAddress(walletAddress)}
						<p class="text-red-400 text-sm mt-1">Invalid wallet address format</p>
					{/if}
				</div>

				<!-- Action Buttons -->
				<div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
					<button
						on:click={startMonitoring}
						disabled={!walletAddress || !validateWalletAddress(walletAddress) || isMonitoring}
						class="px-4 sm:px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors text-sm sm:text-base"
					>
						{isMonitoring ? 'Monitoring...' : 'Start Monitoring'}
					</button>

					<button
						on:click={stopMonitoring}
						disabled={!isMonitoring}
						class="px-4 sm:px-6 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors text-sm sm:text-base"
					>
						Stop
					</button>
				</div>
			</div>

			<!-- Validation Rules -->
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
				<div>
					<label for="max-amount" class="block text-sm font-medium text-white mb-2">
						Max Amount (SOL)
					</label>
					<input
						id="max-amount"
						type="number"
						bind:value={validationRules.maxAmount}
						on:change={saveValidationRules}
						class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
						disabled={isMonitoring}
					/>
				</div>
				<div>
					<label for="max-speed" class="block text-sm font-medium text-white mb-2">
						Max Speed (seconds)
					</label>
					<input
						id="max-speed"
						type="number"
						bind:value={validationRules.maxSpeed}
						on:change={saveValidationRules}
						class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
						disabled={isMonitoring}
					/>
				</div>
				<div class="sm:col-span-2 lg:col-span-1 flex flex-col justify-center space-y-3">
					<label class="flex items-center" for="suspicious-patterns">
						<input
							type="checkbox"
							bind:checked={validationRules.suspiciousPatterns}
							class="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
							disabled={isMonitoring}
							id="suspicious-patterns"
						/>
						<span class="ml-2 text-sm text-white">Suspicious Patterns</span>
					</label>
					<label class="flex items-center" for="mixer-detection">
						<input
							type="checkbox"
							bind:checked={validationRules.mixerDetection}
							class="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
							disabled={isMonitoring}
							id="mixer-detection"
						/>
						<span class="ml-2 text-sm text-white">Mixer Detection</span>
					</label>
				</div>
			</div>
		</section>

		<!-- Evidence Chain -->
		<section class="bg-gray-800 rounded-lg p-6 mb-6">
			<div class="flex justify-between items-center mb-4">
				<h2 class="text-xl font-semibold">Evidence Chain</h2>
				<button
					on:click={exportEvidence}
					class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
				>
					Export Evidence
				</button>
			</div>

			<div class="bg-gray-900 rounded-md p-4 max-h-40 overflow-y-auto">
				{#each evidenceChain as entry}
					<div class="text-sm text-gray-300 font-mono mb-1">{entry}</div>
				{/each}
			</div>
		</section>

		<!-- Dashboard Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Alert Panel -->
			<div class="lg:col-span-1">
				<AlertPanel bind:alertCount />
			</div>

			<!-- Transaction Log -->
			<div class="lg:col-span-2">
				<TransactionLog />
			</div>
		</div>

		<!-- Tracing Flow -->
		<div class="mt-6">
			<TracingFlow />
		</div>
	</main>
</div>

<style>
	.wallet-monitor {
		font-family:
			'Inter',
			system-ui,
			-apple-system,
			sans-serif;
	}
</style>
