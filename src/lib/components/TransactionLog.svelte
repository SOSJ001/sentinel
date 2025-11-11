<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import { getClientSolanaService } from '$lib/services/client-solana.service';

	// Transaction state
	let transactions: Transaction[] = [];
	let filteredTransactions: Transaction[] = [];
	let transactionStore = writable<Transaction[]>([]);

	// Service instance (initialized in onMount)
	let solanaService: any;
	let unsubscribeTransactions: (() => void) | null = null;

	// Filter state
	let searchTerm = '';
	let filterType = 'all';
	let filterStatus = 'all';
	let sortBy = 'timestamp';
	let sortOrder = 'desc';

	// Pagination
	let currentPage = 1;
	let itemsPerPage = 20;
	let totalPages = 1;

	// Transaction interface for forensics
	interface Transaction {
		id: string;
		hash: string;
		timestamp: Date;
		type: 'transfer' | 'swap' | 'stake' | 'unstake' | 'unknown';
		from: string;
		to: string;
		amount: number;
		token: string;
		status: 'confirmed' | 'pending' | 'failed';
		blockHeight: number;
		fee: number;
		signature: string;
		evidence: {
			isSuspicious: boolean;
			riskScore: number;
			flags: string[];
			metadata: Record<string, any>;
		};
	}

	// Type colors
	const typeColors = {
		transfer: 'bg-blue-600',
		swap: 'bg-purple-600',
		stake: 'bg-green-600',
		unstake: 'bg-yellow-600',
		unknown: 'bg-gray-600'
	};

	// Status colors
	const statusColors = {
		confirmed: 'text-green-400',
		pending: 'text-yellow-400',
		failed: 'text-red-400'
	};

	onMount(() => {
		// Initialize service (client-side only)
		getClientSolanaService().then((service) => {
			solanaService = service;

			// Subscribe to transactions from solana service
			const unsubscribe = solanaService.transactions.subscribe((newTransactions: Transaction[]) => {
				transactions = newTransactions;
				applyFilters();
			});

			// Store unsubscribe function for cleanup
			unsubscribeTransactions = unsubscribe;
		});

		// Return cleanup function
		return () => {
			if (unsubscribeTransactions) {
				unsubscribeTransactions();
			}
		};
	});

	function applyFilters() {
		let filtered = [...transactions];

		// Search filter
		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			filtered = filtered.filter(
				(tx) =>
					tx.hash.toLowerCase().includes(term) ||
					tx.from.toLowerCase().includes(term) ||
					tx.to.toLowerCase().includes(term) ||
					tx.type.toLowerCase().includes(term)
			);
		}

		// Type filter
		if (filterType !== 'all') {
			filtered = filtered.filter((tx) => tx.type === filterType);
		}

		// Status filter
		if (filterStatus !== 'all') {
			filtered = filtered.filter((tx) => tx.status === filterStatus);
		}

		// Sort
		filtered.sort((a, b) => {
			let aValue, bValue;

			switch (sortBy) {
				case 'timestamp':
					aValue = a.timestamp.getTime();
					bValue = b.timestamp.getTime();
					break;
				case 'amount':
					aValue = a.amount;
					bValue = b.amount;
					break;
				case 'riskScore':
					aValue = a.evidence.riskScore;
					bValue = b.evidence.riskScore;
					break;
				default:
					aValue = (a as any)[sortBy];
					bValue = (b as any)[sortBy];
			}

			if (sortOrder === 'asc') {
				return aValue > bValue ? 1 : -1;
			} else {
				return aValue < bValue ? 1 : -1;
			}
		});

		filteredTransactions = filtered;
		totalPages = Math.ceil(filtered.length / itemsPerPage);
		currentPage = 1;
	}

	function exportTransactions() {
		const exportData = {
			exportedAt: new Date().toISOString(),
			totalTransactions: transactions.length,
			filteredTransactions: filteredTransactions.length,
			transactions: filteredTransactions.map((tx) => ({
				...tx,
				timestamp: tx.timestamp.toISOString(),
				evidence: tx.evidence
			}))
		};

		const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `transactions-${new Date().toISOString().split('T')[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);
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

	function formatAmount(amount: number, token: string): string {
		if (token === 'SOL') {
			return `${amount.toFixed(4)} SOL`;
		}
		return `${amount.toFixed(2)} ${token}`;
	}

	function getRiskColor(riskScore: number): string {
		if (riskScore >= 80) return 'text-red-400';
		if (riskScore >= 60) return 'text-orange-400';
		if (riskScore >= 40) return 'text-yellow-400';
		return 'text-green-400';
	}

	// Reactive statements
	$: applyFilters();
	$: paginatedTransactions = filteredTransactions.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);
</script>

<div class="transaction-log bg-gray-800 rounded-lg p-6 h-full max-h-[32rem] overflow-y-auto">
	<!-- Header -->
	<div class="flex justify-between items-center mb-6">
		<h2 class="text-xl font-semibold">Transaction Log</h2>
		<div class="flex items-center space-x-4">
			<span class="text-sm text-gray-400">
				{filteredTransactions.length} of {transactions.length} transactions
			</span>
			<button
				on:click={exportTransactions}
				class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
			>
				Export
			</button>
		</div>
	</div>

	<!-- Filters -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
		<!-- Search -->
		<div>
			<input
				type="text"
				placeholder="Search transactions..."
				bind:value={searchTerm}
				class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>

		<!-- Type Filter -->
		<div>
			<select
				bind:value={filterType}
				class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				<option value="all">All Types</option>
				<option value="transfer">Transfer</option>
				<option value="swap">Swap</option>
				<option value="stake">Stake</option>
				<option value="unstake">Unstake</option>
				<option value="unknown">Unknown</option>
			</select>
		</div>

		<!-- Status Filter -->
		<div>
			<select
				bind:value={filterStatus}
				class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				<option value="all">All Status</option>
				<option value="confirmed">Confirmed</option>
				<option value="pending">Pending</option>
				<option value="failed">Failed</option>
			</select>
		</div>

		<!-- Sort -->
		<div>
			<select
				bind:value={sortBy}
				class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				<option value="timestamp">Sort by Time</option>
				<option value="amount">Sort by Amount</option>
				<option value="riskScore">Sort by Risk</option>
			</select>
		</div>
	</div>

	<!-- Transactions Table -->
	<div class="bg-gray-900 rounded-lg overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-gray-700">
					<tr>
						<th
							class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
						>
							Transaction
						</th>
						<th
							class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
						>
							Type
						</th>
						<th
							class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
						>
							From/To
						</th>
						<th
							class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
						>
							Amount
						</th>
						<th
							class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
						>
							Risk
						</th>
						<th
							class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
						>
							Status
						</th>
						<th
							class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
						>
							Time
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-700">
					{#each paginatedTransactions as tx (tx.id)}
						<tr class="hover:bg-gray-800 transition-colors">
							<!-- Transaction Hash -->
							<td class="px-4 py-3">
								<div class="flex items-center space-x-2">
									<span class="font-mono text-sm text-blue-400">
										{tx.hash.slice(0, 8)}...{tx.hash.slice(-8)}
									</span>
									{#if tx.evidence.isSuspicious}
										<span class="text-red-400">⚠️</span>
									{/if}
								</div>
							</td>

							<!-- Type -->
							<td class="px-4 py-3">
								<div class="flex flex-col space-y-1">
									<span
										class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {typeColors[
											tx.type
										]} text-white"
									>
										{tx.type}
									</span>
									{#if tx.evidence.flags.length > 0}
										<div class="flex flex-wrap gap-1">
											{#each tx.evidence.flags as flag}
												<span
													class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-600 text-white"
													title={flag}
												>
													{flag}
												</span>
											{/each}
										</div>
									{/if}
								</div>
							</td>

							<!-- From/To -->
							<td class="px-4 py-3">
								<div class="text-sm">
									<div class="text-gray-300">
										From: <span class="font-mono text-blue-400"
											>{tx.from.slice(0, 8)}...{tx.from.slice(-8)}</span
										>
									</div>
									<div class="text-gray-300">
										To: <span class="font-mono text-green-400"
											>{tx.to.slice(0, 8)}...{tx.to.slice(-8)}</span
										>
									</div>
								</div>
							</td>

							<!-- Amount -->
							<td class="px-4 py-3">
								<div class="text-sm font-medium text-white">
									{formatAmount(tx.amount, tx.token)}
								</div>
								<div class="text-xs text-gray-400">
									Fee: {tx.fee.toFixed(6)} SOL
								</div>
							</td>

							<!-- Risk Score -->
							<td class="px-4 py-3">
								<div class="flex flex-col space-y-1">
									<span class="text-sm font-medium {getRiskColor(tx.evidence.riskScore)}">
										{tx.evidence.riskScore}%
									</span>
									{#if tx.evidence.flags.length > 0}
										<span class="text-xs text-gray-400">
											{tx.evidence.flags.length} pattern{tx.evidence.flags.length !== 1 ? 's' : ''}
										</span>
									{/if}
								</div>
							</td>

							<!-- Status -->
							<td class="px-4 py-3">
								<span class="text-sm font-medium {statusColors[tx.status]}">
									{tx.status}
								</span>
							</td>

							<!-- Time -->
							<td class="px-4 py-3">
								<div class="text-sm text-gray-300">
									{getTimeAgo(tx.timestamp)}
								</div>
								<div class="text-xs text-gray-400">
									{tx.timestamp.toLocaleString()}
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="7" class="px-4 py-8 text-center text-gray-400">
								<div class="text-4xl mb-2">📊</div>
								<p>No transactions found</p>
								<p class="text-sm">Start monitoring to see transactions</p>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Pagination -->
	{#if totalPages > 1}
		<div class="flex justify-between items-center mt-4">
			<div class="text-sm text-gray-400">
				Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(
					currentPage * itemsPerPage,
					filteredTransactions.length
				)} of {filteredTransactions.length} transactions
			</div>
			<div class="flex space-x-2">
				<button
					on:click={() => (currentPage = Math.max(1, currentPage - 1))}
					disabled={currentPage === 1}
					class="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded text-sm"
				>
					Previous
				</button>
				<span class="px-3 py-1 text-sm text-gray-300">
					Page {currentPage} of {totalPages}
				</span>
				<button
					on:click={() => (currentPage = Math.min(totalPages, currentPage + 1))}
					disabled={currentPage === totalPages}
					class="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded text-sm"
				>
					Next
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.transaction-log {
		font-family:
			'Inter',
			system-ui,
			-apple-system,
			sans-serif;
	}
</style>
