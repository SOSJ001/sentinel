<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import { getClientSolanaService } from '$lib/services/client-solana.service';

	// Tracing state
	let traceData: TraceData | null = null;
	let isTracing = false;
	let selectedTransaction: string | null = null;
	let tracingMode: 'auto' | 'chain' | 'multihop' = 'auto';
	let errorMessage: string | null = null;

	// Service instance (initialized in onMount)
	let solanaService: any;

	// Trace data interface
	interface TraceData {
		id: string;
		startTransaction: string;
		endTransaction: string;
		totalAmount: number;
		totalTransactions: number;
		duration: number; // in seconds
		path: TraceNode[];
		riskAssessment: {
			overallRisk: number;
			mixerInvolved: boolean;
			suspiciousPatterns: string[];
			evidence: string[];
		};
		createdAt: Date;
	}

	interface TraceNode {
		id: string;
		address: string;
		type: 'wallet' | 'exchange' | 'mixer' | 'unknown';
		amount: number;
		timestamp: Date;
		transactionHash: string;
		riskScore: number;
		metadata: Record<string, any>;
		direction: 'send' | 'receive';
	}

	// Node type colors
	const nodeColors = {
		wallet: 'bg-blue-600',
		exchange: 'bg-green-600',
		mixer: 'bg-red-600',
		unknown: 'bg-gray-600'
	};

	// Risk colors
	const riskColors = {
		low: 'border-green-500',
		medium: 'border-yellow-500',
		high: 'border-orange-500',
		critical: 'border-red-500'
	};

	onMount(async () => {
		try {
			// Initialize service (client-side only)
			solanaService = await getClientSolanaService();

			// Subscribe to trace data from solana service
			const unsubscribe = solanaService.traceData.subscribe((newTraceData: TraceData | null) => {
				traceData = newTraceData;
			});

			return unsubscribe;
		} catch (error) {
			console.error('Failed to initialize Solana service:', error);
		}
	});

	async function startTrace(transactionHash: string) {
		if (!transactionHash) {
			errorMessage = 'Please enter a transaction hash';
			return;
		}

		// Validate transaction hash format (basic check)
		if (transactionHash.length < 32) {
			errorMessage =
				'Invalid transaction hash format. Transaction hashes should be at least 32 characters.';
			return;
		}

		try {
			errorMessage = null;
			isTracing = true;
			selectedTransaction = transactionHash;

			// Check if service is connected
			if (!solanaService.isServiceConnected()) {
				const connected = await solanaService.connect(); // Connect to service

				if (!connected) {
					throw new Error(
						'Failed to connect to Solana network. Please check your connection settings.'
					);
				}
			}

			// Start tracing through solana service with selected mode
			await solanaService.startTrace(transactionHash, tracingMode);

			isTracing = false; // Reset after trace completes
		} catch (error: any) {
			const errorMsg = error?.message || String(error);
			if (errorMsg.includes('Transaction not found')) {
				errorMessage =
					'Transaction not found, run the attack script again to get new transactions hash.';
			} else if (errorMsg.includes('Failed to connect')) {
				errorMessage =
					'Failed to connect to Solana network. Please check your connection settings.';
			} else {
				errorMessage = `Failed to start trace: ${errorMsg}`;
			}
			isTracing = false;
			traceData = null;
		}
	}

	function stopTrace() {
		isTracing = false;
		traceData = null;
		selectedTransaction = null;
		errorMessage = null;
	}

	function exportTrace() {
		if (!traceData) return;

		const exportData = {
			...traceData,
			exportedAt: new Date().toISOString(),
			exportedBy: 'Forensics Investigator'
		};

		const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `trace-${traceData.id}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function getRiskLevel(riskScore: number): keyof typeof riskColors {
		if (riskScore >= 80) return 'critical';
		if (riskScore >= 60) return 'high';
		if (riskScore >= 40) return 'medium';
		return 'low';
	}

	function formatDuration(seconds: number): string {
		if (seconds < 60) return `${seconds}s`;
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
		const hours = Math.floor(minutes / 60);
		return `${hours}h ${minutes % 60}m`;
	}

	function formatAmount(amount: number): string {
		if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M SOL`;
		if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K SOL`;
		return `${amount.toFixed(4)} SOL`;
	}

	function getTimeAgo(timestamp: Date): string {
		const now = new Date();
		const diff = now.getTime() - timestamp.getTime();
		const minutes = Math.floor(diff / 60000);

		if (minutes < 1) return 'Just now';
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}
</script>

<div class="tracing-flow bg-gray-800 rounded-lg p-6">
	<!-- Header -->
	<div class="flex justify-between items-center mb-6">
		<h2 class="text-xl font-semibold">Transaction Tracing</h2>
		<div class="flex items-center space-x-4">
			{#if traceData}
				<button
					on:click={exportTrace}
					class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
				>
					Export Trace
				</button>
			{/if}
		</div>
	</div>

	<!-- Trace Input -->
	<div class="bg-gray-700 rounded-lg p-4 mb-6">
		<div class="space-y-4">
			<!-- Tracing Mode Selection -->
			<div class="flex items-center space-x-4">
				<span class="text-sm font-medium text-gray-300">Tracing Mode:</span>
				<div class="flex space-x-2">
					<button
						on:click={() => (tracingMode = 'auto')}
						class="px-3 py-1 text-xs rounded-md {tracingMode === 'auto'
							? 'bg-blue-600 text-white'
							: 'bg-gray-600 text-gray-300 hover:bg-gray-500'}"
						disabled={isTracing}
					>
						Auto
					</button>
					<button
						on:click={() => (tracingMode = 'chain')}
						class="px-3 py-1 text-xs rounded-md {tracingMode === 'chain'
							? 'bg-blue-600 text-white'
							: 'bg-gray-600 text-gray-300 hover:bg-gray-500'}"
						disabled={isTracing}
					>
						Chain
					</button>
					<button
						on:click={() => (tracingMode = 'multihop')}
						class="px-3 py-1 text-xs rounded-md {tracingMode === 'multihop'
							? 'bg-blue-600 text-white'
							: 'bg-gray-600 text-gray-300 hover:bg-gray-500'}"
						disabled={isTracing}
					>
						Multi-hop
					</button>
				</div>
				<div class="text-xs text-gray-400">
					{tracingMode === 'auto'
						? 'Auto-detect based on transaction complexity'
						: tracingMode === 'chain'
							? 'Follow separate transactions over time'
							: 'Analyze complex transactions with multiple hops'}
				</div>
			</div>

			<!-- Transaction Input -->
			<div class="flex flex-col space-y-2">
				<div class="flex items-center space-x-4">
					<input
						type="text"
						placeholder="Enter transaction hash to trace..."
						bind:value={selectedTransaction}
						on:input={() => (errorMessage = null)}
						class="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
						disabled={isTracing}
					/>
					{#if isTracing}
						<button
							on:click={stopTrace}
							class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium flex items-center space-x-2"
						>
							<span>Stop Tracing</span>
							<span class="animate-pulse">⏸</span>
						</button>
					{:else if traceData}
						<button
							on:click={stopTrace}
							class="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md font-medium"
						>
							Clear Results
						</button>
					{:else}
						<button
							on:click={() => startTrace(selectedTransaction || '')}
							disabled={!selectedTransaction}
							class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md font-medium"
						>
							Start Trace
						</button>
					{/if}
				</div>
				{#if errorMessage}
					<div class="bg-red-900/50 border border-red-600 rounded-md p-3 text-red-200 text-sm">
						<div class="flex items-center space-x-2">
							<span>⚠️</span>
							<span>{errorMessage}</span>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Trace Results -->
	{#if traceData}
		<div class="space-y-6">
			<!-- Trace Summary -->
			<div class="bg-gray-700 rounded-lg p-4">
				<h3 class="text-lg font-semibold mb-4">Trace Summary</h3>
				<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div class="text-center">
						<div class="text-2xl font-bold text-blue-400">{traceData.totalTransactions}</div>
						<div class="text-sm text-gray-400">Transactions</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-green-400">
							{formatAmount(traceData.totalAmount)}
						</div>
						<div class="text-sm text-gray-400">Total Amount</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-yellow-400">
							{formatDuration(traceData.duration)}
						</div>
						<div class="text-sm text-gray-400">Duration</div>
					</div>
					<div class="text-center">
						<div
							class="text-2xl font-bold {getRiskLevel(traceData.riskAssessment.overallRisk) ===
							'critical'
								? 'text-red-400'
								: getRiskLevel(traceData.riskAssessment.overallRisk) === 'high'
									? 'text-orange-400'
									: getRiskLevel(traceData.riskAssessment.overallRisk) === 'medium'
										? 'text-yellow-400'
										: 'text-green-400'}"
						>
							{traceData.riskAssessment.overallRisk}%
						</div>
						<div class="text-sm text-gray-400">Risk Score</div>
					</div>
				</div>
			</div>

			<!-- Risk Assessment -->
			<div class="bg-gray-700 rounded-lg p-4">
				<h3 class="text-lg font-semibold mb-4">Risk Assessment</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<h4 class="font-medium mb-2">Flags</h4>
						<div class="space-y-2">
							{#each traceData.riskAssessment.suspiciousPatterns as pattern}
								<div class="flex items-center space-x-2">
									<span class="w-2 h-2 bg-red-500 rounded-full"></span>
									<span class="text-sm text-gray-300">{pattern}</span>
								</div>
							{/each}
							{#if traceData.riskAssessment.mixerInvolved}
								<div class="flex items-center space-x-2">
									<span class="w-2 h-2 bg-red-500 rounded-full"></span>
									<span class="text-sm text-red-400 font-medium">Mixer/Tumbler Detected</span>
								</div>
							{/if}
						</div>
					</div>
					<div>
						<h4 class="font-medium mb-2">Evidence</h4>
						<div class="space-y-1">
							{#each traceData.riskAssessment.evidence as evidence}
								<div class="text-sm bg-gray-600 rounded px-2 py-1 font-mono text-gray-300">
									{evidence}
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Trace Path -->
			<div class="bg-gray-700 rounded-lg p-4">
				<h3 class="text-lg font-semibold mb-4">Trace Path</h3>
				<div class="space-y-4">
					{#each traceData.path as node, index (node.id)}
						<div class="flex items-center space-x-4">
							<!-- Connection Line -->
							{#if index > 0}
								<div class="w-8 flex justify-center">
									<div class="flex flex-col items-center">
										<div class="w-0.5 h-6 bg-gray-500"></div>
										<div class="text-green-400 text-lg">↓</div>
									</div>
								</div>
							{:else}
								<div class="w-8"></div>
							{/if}

							<!-- Node -->
							<div
								class="flex-1 bg-gray-600 rounded-lg p-4 border-l-4 {riskColors[
									getRiskLevel(node.riskScore)
								]}"
							>
								<div class="flex justify-between items-start mb-2">
									<div class="flex items-center space-x-3">
										<div
											class="w-8 h-8 rounded-full {nodeColors[
												node.type
											]} flex items-center justify-center text-white text-sm font-bold"
										>
											{index + 1}
										</div>
										<div>
											<div class="flex items-center space-x-2">
												<span class="font-medium text-white">{node.type.toUpperCase()}</span>
												<span
													class="px-2 py-1 text-xs rounded-full {node.direction === 'send'
														? 'bg-red-600 text-white'
														: 'bg-green-600 text-white'}"
												>
													{node.direction === 'send' ? 'SEND' : 'RECEIVE'}
												</span>
											</div>
											<div class="text-sm text-gray-400 font-mono">
												{node.address.slice(0, 8)}...{node.address.slice(-8)}
											</div>
										</div>
									</div>
									<div class="text-right">
										<div
											class="text-lg font-bold {node.direction === 'send'
												? 'text-red-400'
												: 'text-green-400'}"
										>
											{node.direction === 'send' ? '-' : '+'}{formatAmount(node.amount)}
										</div>
										<div class="text-sm text-gray-400">{getTimeAgo(node.timestamp)}</div>
									</div>
								</div>

								<!-- Transaction Details -->
								<div class="text-sm text-gray-300 space-y-1">
									<div>
										Tx: <span class="font-mono text-blue-400"
											>{node.transactionHash.slice(0, 8)}...{node.transactionHash.slice(-8)}</span
										>
									</div>
									<div>
										Risk: <span
											class="{getRiskLevel(node.riskScore) === 'critical'
												? 'text-red-400'
												: getRiskLevel(node.riskScore) === 'high'
													? 'text-orange-400'
													: getRiskLevel(node.riskScore) === 'medium'
														? 'text-yellow-400'
														: 'text-green-400'} font-medium">{node.riskScore}%</span
										>
									</div>
								</div>

								<!-- Metadata -->
								{#if Object.keys(node.metadata).length > 0}
									<div class="mt-2 pt-2 border-t border-gray-500">
										<div class="text-xs text-gray-400">Metadata:</div>
										<div class="text-xs font-mono text-gray-300">
											{JSON.stringify(node.metadata, null, 2)}
										</div>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{:else}
		<div class="text-center text-gray-400 py-12">
			<div class="text-6xl mb-4">🔍</div>
			<h3 class="text-xl font-semibold mb-2">No Trace Data</h3>
			<p>Enter a transaction hash above to start tracing</p>
			<p class="text-sm mt-2">Trace the flow of funds through the blockchain</p>
		</div>
	{/if}
</div>

<style>
	.tracing-flow {
		font-family:
			'Inter',
			system-ui,
			-apple-system,
			sans-serif;
	}
</style>
