<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import { getSolanaService } from '$lib/services';

	// Props
	export let alertCount = 0;

	// Alert state
	let alerts: Alert[] = [];
	let alertStore = writable<Alert[]>([]);

	// Service instance (initialized in onMount)
	let solanaService: any;

	// Alert types for forensics
	interface Alert {
		id: string;
		timestamp: Date;
		type:
			| 'suspicious_amount'
			| 'rapid_transaction'
			| 'mixer_detected'
			| 'pattern_anomaly'
			| 'security_threat';
		severity: 'low' | 'medium' | 'high' | 'critical';
		title: string;
		description: string;
		walletAddress: string;
		transactionHash?: string;
		transactionSignature?: string;
		amount?: number;
		evidence: string[];
		status: 'new' | 'investigating' | 'resolved' | 'false_positive';
	}

	// Severity colors
	const severityColors = {
		low: 'bg-blue-600',
		medium: 'bg-yellow-600',
		high: 'bg-orange-600',
		critical: 'bg-red-600'
	};

	// Alert type icons
	const alertIcons = {
		suspicious_amount: '💰',
		rapid_transaction: '⚡',
		mixer_detected: '🔄',
		pattern_anomaly: '📊',
		security_threat: '🚨'
	};

	onMount(() => {
		// Initialize service (client-side only)
		solanaService = getSolanaService();

		// Subscribe to alerts from solana service
		const unsubscribe = solanaService.alerts.subscribe((newAlerts: Alert[]) => {
			alerts = newAlerts;
			alertCount = newAlerts.length;
			alertStore.set(newAlerts);
		});

		return unsubscribe;
	});

	function updateAlertStatus(alertId: string, status: Alert['status']) {
		alerts = alerts.map((alert) => (alert.id === alertId ? { ...alert, status } : alert));
		alertStore.set(alerts);
	}

	function exportAlert(alert: Alert) {
		const alertData = {
			...alert,
			exportedAt: new Date().toISOString(),
			exportedBy: 'Forensics Investigator'
		};

		const blob = new Blob([JSON.stringify(alertData, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `alert-${alert.id}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function clearResolvedAlerts() {
		alerts = alerts.filter((alert) => alert.status !== 'resolved');
		alertStore.set(alerts);
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

	async function copyToClipboard(text: string, type: string) {
		try {
			await navigator.clipboard.writeText(text);
		} catch (err) {
			console.error('Failed to copy: ', err);
		}
	}
</script>

<div class="alert-panel bg-gray-800 rounded-lg p-6 h-full">
	<!-- Header -->
	<div class="flex justify-between items-center mb-4">
		<h2 class="text-xl font-semibold text-white">Security Alerts</h2>
		<div class="flex items-center space-x-2">
			<span class="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium">
				{alertCount}
			</span>
		</div>
	</div>

	<!-- Alert Summary -->
	<div class="flex space-x-3 mb-6">
		{#if alerts.filter((alert) => alert.severity === 'critical').length > 0}
			<div class="bg-red-600 text-white px-4 py-2 rounded-lg">
				<div class="text-sm font-medium">Critical</div>
				<div class="text-lg font-bold">
					{alerts.filter((alert) => alert.severity === 'critical').length}
				</div>
			</div>
		{/if}

		{#if alerts.filter((alert) => alert.severity === 'high').length > 0}
			<div class="bg-orange-600 text-white px-4 py-2 rounded-lg">
				<div class="text-sm font-medium">High</div>
				<div class="text-lg font-bold">
					{alerts.filter((alert) => alert.severity === 'high').length}
				</div>
			</div>
		{/if}
	</div>

	<!-- Alerts List -->
	<div class="space-y-3 max-h-96 overflow-y-auto">
		{#each alerts as alert (alert.id)}
			<div
				class="rounded-lg p-4 {alert.severity === 'critical'
					? 'bg-red-600'
					: alert.severity === 'high'
						? 'bg-orange-600'
						: 'bg-gray-700'}"
			>
				<!-- Alert Header -->
				<div class="flex justify-between items-start mb-3">
					<div class="flex items-start space-x-3 flex-1 min-w-0">
						<span
							class="text-xs px-2 py-1 bg-black bg-opacity-40 rounded text-white font-medium flex-shrink-0"
						>
							{alert.severity.toUpperCase()}
						</span>
						<div class="min-w-0 flex-1">
							<h3 class="font-bold text-white text-base truncate">{alert.title}</h3>
							<p class="text-white text-sm leading-relaxed line-clamp-2">{alert.description}</p>
							{#if alert.title && (alert.title.includes('Fan-Out') || alert.title.includes('Circular') || alert.title.includes('Rapid') || alert.title.includes('Large Transfer'))}
								<div class="mt-2 flex flex-wrap gap-1">
									{#if alert.title.includes('Fan-Out')}
										<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-700 text-white">
											🌊 Fan-Out Pattern
										</span>
									{/if}
									{#if alert.title.includes('Circular')}
										<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-700 text-white">
											🔄 Circular Transfer
										</span>
									{/if}
									{#if alert.title.includes('Rapid')}
										<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-700 text-white">
											⚡ Rapid Movement
										</span>
									{/if}
									{#if alert.title.includes('Large Transfer') || alert.title.includes('High-Value')}
										<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-700 text-white">
											💰 High-Value Transfer
										</span>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Alert Details -->
				<div class="text-white text-sm mb-3 space-y-1">
					{#if alert.walletAddress}
						<div class="flex items-center space-x-2">
							<span class="text-xs text-white opacity-80">Wallet:</span>
							<button
								on:click={() => copyToClipboard(alert.walletAddress, 'Wallet Address')}
								class="font-mono text-xs text-white hover:text-yellow-200 cursor-pointer transition-colors underline decoration-dotted"
								title="Click to copy full wallet address"
							>
								{alert.walletAddress.slice(0, 8)}...{alert.walletAddress.slice(-8)}
							</button>
						</div>
					{/if}
					{#if alert.transactionSignature}
						<div class="flex items-center space-x-2">
							<span class="text-xs text-white opacity-80">Signature:</span>
							<button
								on:click={() =>
									copyToClipboard(alert.transactionSignature, 'Transaction Signature')}
								class="font-mono text-xs text-white hover:text-yellow-200 cursor-pointer transition-colors underline decoration-dotted"
								title="Click to copy full transaction signature"
							>
								{alert.transactionSignature.slice(0, 12)}...{alert.transactionSignature.slice(-12)}
							</button>
						</div>
					{:else if alert.transactionHash}
						<div class="flex items-center space-x-2">
							<span class="text-xs text-white opacity-80">Tx:</span>
							<button
								on:click={() => copyToClipboard(alert.transactionHash, 'Transaction Hash')}
								class="font-mono text-xs text-white hover:text-yellow-200 cursor-pointer transition-colors underline decoration-dotted"
								title="Click to copy full transaction hash"
							>
								{alert.transactionHash.slice(0, 8)}...{alert.transactionHash.slice(-8)} - {getTimeAgo(
									alert.timestamp
								)}
							</button>
						</div>
					{/if}
					{#if alert.amount}
						<div class="flex items-center space-x-2">
							<span class="text-xs text-white opacity-80">Amount:</span>
							<span class="font-mono text-xs text-white">
								{alert.amount} SOL
							</span>
						</div>
					{/if}
				</div>

				<!-- Alert Actions -->
				<div class="flex justify-end">
					<button
						on:click={() => exportAlert(alert)}
						class="bg-black bg-opacity-40 hover:bg-opacity-60 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
					>
						Export
					</button>
				</div>
			</div>
		{:else}
			<div class="text-center text-gray-400 py-8">
				<div class="text-4xl mb-2">🔍</div>
				<p>No alerts detected</p>
				<p class="text-sm">Start monitoring to see alerts</p>
			</div>
		{/each}
	</div>
</div>

<style>
	.alert-panel {
		font-family:
			'Inter',
			system-ui,
			-apple-system,
			sans-serif;
	}

	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
