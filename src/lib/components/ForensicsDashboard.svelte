<!--
	Forensics Dashboard
	Comprehensive dashboard for cyber forensics professionals
	Shows evidence, alerts, chain of custody, and analysis
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		getForensicsService,
		getValidationService,
		getAuditService,
		getEvidenceService
	} from '../services';
	import type {
		ForensicEvidence,
		ForensicsAlert,
		ChainOfCustodyEntry,
		EvidenceCollection,
		EvidenceAnalysis,
		RiskAssessment
	} from '../types/forensics.types';
	import PatternDetectionPanel from './PatternDetectionPanel.svelte';
	import RiskAssessmentPanel from './RiskAssessmentPanel.svelte';
	import RecommendationsPanel from './RecommendationsPanel.svelte';

	// Reactive state
	let evidence: ForensicEvidence[] = [];
	let alerts: ForensicsAlert[] = [];
	let chainOfCustody: ChainOfCustodyEntry[] = [];
	let collections: EvidenceCollection[] = [];
	let analysis: EvidenceAnalysis[] = [];
	let auditLogs: any[] = [];

	// Service instances (initialized in onMount)
	let forensicsService: any;
	let validationService: any;
	let auditService: any;
	let evidenceService: any;

	// Detection data
	let detectedPatterns: string[] = [];
	let riskAssessment: RiskAssessment | null = null as RiskAssessment | null;
	let recommendations: string[] = [];
	let validationRules: any[] = [];

	// UI state
	let activeTab = 'evidence';
	let selectedEvidence: ForensicEvidence | null = null;
	let showCreateEvidence = false;
	let showCreateCollection = false;
	let searchQuery = '';
	let filterType = 'all';
	let filterPriority = 'all';
	let isDarkMode = true; // Default to dark mode for forensics professionals

	// Form data
	let newEvidence = {
		transactionId: '',
		evidenceType: 'suspicious_transaction' as any,
		description: '',
		investigator: '',
		caseId: '',
		priority: 'medium' as any,
		tags: '',
		notes: ''
	};

	let newCollection = {
		caseId: '',
		title: '',
		description: '',
		investigator: '',
		priority: 'medium' as any,
		classification: 'confidential' as any,
		jurisdiction: '',
		retentionPeriod: 2555
	};

	// Subscriptions
	let evidenceUnsubscribe: () => void;
	let alertsUnsubscribe: () => void;
	let chainOfCustodyUnsubscribe: () => void;
	let collectionsUnsubscribe: () => void;
	let analysisUnsubscribe: () => void;
	let auditLogsUnsubscribe: () => void;

	onMount(() => {
		// Initialize services (client-side only)
		forensicsService = getForensicsService();
		validationService = getValidationService();
		auditService = getAuditService();
		evidenceService = getEvidenceService();

		// Load validation rules
		validationRules = validationService.getRules();

		// Subscribe to stores
		evidenceUnsubscribe = forensicsService.evidence.subscribe((store: ForensicEvidence[]) => {
			evidence = store;
		});

		alertsUnsubscribe = forensicsService.alerts.subscribe((store: ForensicsAlert[]) => {
			alerts = store;
		});

		chainOfCustodyUnsubscribe = forensicsService.chainOfCustody.subscribe(
			(store: ChainOfCustodyEntry[]) => {
				chainOfCustody = store;
			}
		);

		collectionsUnsubscribe = evidenceService.collections.subscribe(
			(store: EvidenceCollection[]) => {
				collections = store;
			}
		);

		analysisUnsubscribe = evidenceService.analysis.subscribe((store: EvidenceAnalysis[]) => {
			analysis = store;
		});

		auditLogsUnsubscribe = auditService.auditLogs.subscribe((store: any[]) => {
			auditLogs = store;
		});

		// Load initial data
		loadInitialData();
	});

	onDestroy(() => {
		// Unsubscribe from stores
		evidenceUnsubscribe?.();
		alertsUnsubscribe?.();
		chainOfCustodyUnsubscribe?.();
		collectionsUnsubscribe?.();
		analysisUnsubscribe?.();
		auditLogsUnsubscribe?.();
	});

	async function loadInitialData() {
		try {
			// Load recent evidence
			const recentEvidence = await evidenceService.searchEvidence({
				query: '',
				filters: {},
				limit: 50,
				offset: 0
			});
			evidence = recentEvidence;

			// Load recent alerts
			const recentAlerts = await forensicsService.getAlertsBySeverity('critical');
			alerts = recentAlerts;

			// Load recent audit logs
			const recentAuditLogs = await auditService.getAuditLogs({
				limit: 100,
				offset: 0
			});
			auditLogs = recentAuditLogs;
		} catch (error) {
			// Failed to load initial data
		}
	}

	async function createEvidence() {
		try {
			const evidence = await forensicsService.createEvidence(
				newEvidence.transactionId,
				newEvidence.evidenceType,
				newEvidence.description,
				{},
				newEvidence.investigator,
				newEvidence.caseId
			);

			// Update evidence metadata
			evidence.metadata.priority = newEvidence.priority;
			evidence.metadata.tags = newEvidence.tags.split(',').map((tag) => tag.trim());
			evidence.metadata.notes = newEvidence.notes;

			// Reset form
			newEvidence = {
				transactionId: '',
				evidenceType: 'suspicious_transaction',
				description: '',
				investigator: '',
				caseId: '',
				priority: 'medium',
				tags: '',
				notes: ''
			};

			showCreateEvidence = false;
		} catch (error) {
			// Failed to create evidence
		}
	}

	async function createCollection() {
		try {
			const collection = await evidenceService.createCollection(
				newCollection.caseId,
				newCollection.title,
				newCollection.description,
				newCollection.investigator,
				{
					tags: [],
					priority: newCollection.priority,
					classification: newCollection.classification,
					jurisdiction: newCollection.jurisdiction,
					retentionPeriod: newCollection.retentionPeriod
				}
			);

			// Reset form
			newCollection = {
				caseId: '',
				title: '',
				description: '',
				investigator: '',
				priority: 'medium',
				classification: 'confidential',
				jurisdiction: '',
				retentionPeriod: 2555
			};

			showCreateCollection = false;
		} catch (error) {
			// Failed to create collection
		}
	}

	async function analyzeEvidence(evidenceId: string) {
		try {
			const analysis = await evidenceService.analyzeEvidence(
				evidenceId,
				'suspicious_patterns',
				'current_user'
			);
		} catch (error) {
			// Failed to analyze evidence
		}
	}

	async function exportEvidence(evidenceId: string) {
		try {
			const exportData = await evidenceService.exportEvidence(
				evidenceId,
				'json',
				{
					includeChainOfCustody: true,
					includeAnalysis: true,
					encryptionEnabled: false
				},
				'current_user'
			);
		} catch (error) {
			// Failed to export evidence
		}
	}

	// Filter functions
	function getFilteredEvidence() {
		let filtered = evidence;

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(e) =>
					e.description.toLowerCase().includes(query) ||
					e.id.toLowerCase().includes(query) ||
					e.transactionId.toLowerCase().includes(query)
			);
		}

		if (filterType !== 'all') {
			filtered = filtered.filter((e) => e.evidenceType === filterType);
		}

		if (filterPriority !== 'all') {
			filtered = filtered.filter((e) => e.metadata.priority === filterPriority);
		}

		return filtered;
	}

	function getFilteredAlerts() {
		return alerts.filter((alert) => alert.status === 'new' || alert.status === 'acknowledged');
	}

	function getCriticalAlerts() {
		return alerts.filter(
			(alert) => alert.severity === 'critical' || alert.severity === 'emergency'
		);
	}

	// Utility functions
	function formatTimestamp(timestamp: number): string {
		return new Date(timestamp).toLocaleString();
	}

	function getSeverityColor(severity: string): string {
		switch (severity) {
			case 'emergency':
				return 'text-red-600 bg-red-100';
			case 'critical':
				return 'text-red-500 bg-red-50';
			case 'warning':
				return 'text-yellow-600 bg-yellow-100';
			case 'info':
				return 'text-blue-600 bg-blue-100';
			default:
				return 'text-gray-600 bg-gray-100';
		}
	}

	function getPriorityColor(priority: string): string {
		switch (priority) {
			case 'critical':
				return 'text-red-600 bg-red-100';
			case 'high':
				return 'text-orange-600 bg-orange-100';
			case 'medium':
				return 'text-yellow-600 bg-yellow-100';
			case 'low':
				return 'text-green-600 bg-green-100';
			default:
				return 'text-gray-600 bg-gray-100';
		}
	}
</script>

<div class="min-h-screen {isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}">
	<!-- Header -->
	<header class="{isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-sm border-b">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center py-4">
				<div>
					<div class="flex items-center space-x-4 mb-2">
						<h1 class="text-2xl font-bold {isDarkMode ? 'text-white' : 'text-gray-900'}">
							Forensics Dashboard
						</h1>
						<button
							on:click={() => (window.location.href = '/')}
							class="text-sm {isDarkMode
								? 'text-gray-400 hover:text-white'
								: 'text-gray-600 hover:text-gray-900'} underline"
						>
							← Back to Dashboard
						</button>
					</div>
					<p class="text-sm {isDarkMode ? 'text-gray-300' : 'text-gray-600'}">
						Cyber forensics investigation platform
					</p>
				</div>
				<div class="flex space-x-4">
					<button
						on:click={() => (window.location.href = '/wallet-monitor')}
						class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
					>
						Monitor Wallet
					</button>
					<button
						on:click={() => (showCreateEvidence = true)}
						class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
					>
						Create Evidence
					</button>
					<button
						on:click={() => (showCreateCollection = true)}
						class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
					>
						Create Collection
					</button>
				</div>
			</div>
		</div>
	</header>

	<!-- Navigation Tabs -->
	<nav class="{isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} border-b">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex space-x-8">
				<button
					on:click={() => (activeTab = 'detection')}
					class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'detection'
						? 'border-blue-500 text-blue-400'
						: isDarkMode
							? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				>
					🔍 Detection ({detectedPatterns.length})
				</button>
				<button
					on:click={() => (activeTab = 'evidence')}
					class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'evidence'
						? 'border-blue-500 text-blue-400'
						: isDarkMode
							? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				>
					Evidence ({evidence.length})
				</button>
				<button
					on:click={() => (activeTab = 'alerts')}
					class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'alerts'
						? 'border-blue-500 text-blue-400'
						: isDarkMode
							? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				>
					Alerts ({alerts.length})
				</button>
				<button
					on:click={() => (activeTab = 'collections')}
					class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'collections'
						? 'border-blue-500 text-blue-400'
						: isDarkMode
							? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				>
					Collections ({collections.length})
				</button>
				<button
					on:click={() => (activeTab = 'analysis')}
					class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'analysis'
						? 'border-blue-500 text-blue-400'
						: isDarkMode
							? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				>
					Analysis ({analysis.length})
				</button>
				<button
					on:click={() => (activeTab = 'audit')}
					class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'audit'
						? 'border-blue-500 text-blue-400'
						: isDarkMode
							? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				>
					Audit Logs ({auditLogs.length})
				</button>
			</div>
		</div>
	</nav>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<!-- Detection Tab -->
		{#if activeTab === 'detection'}
			<div class="space-y-6">
				<!-- Stats Overview -->
				<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
					<div class="{isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm {isDarkMode ? 'text-gray-400' : 'text-gray-600'}">Active Rules</p>
								<p class="text-2xl font-bold {isDarkMode ? 'text-white' : 'text-gray-900'}">
									{validationRules.filter((r) => r.enabled).length}
								</p>
							</div>
							<div class="{isDarkMode ? 'bg-blue-900' : 'bg-blue-100'} p-3 rounded-full text-2xl">
								⚙️
							</div>
						</div>
					</div>

					<div class="{isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm {isDarkMode ? 'text-gray-400' : 'text-gray-600'}">
									Patterns Detected
								</p>
								<p class="text-2xl font-bold {isDarkMode ? 'text-white' : 'text-gray-900'}">
									{detectedPatterns.length}
								</p>
							</div>
							<div
								class="{isDarkMode ? 'bg-purple-900' : 'bg-purple-100'} p-3 rounded-full text-2xl"
							>
								🔍
							</div>
						</div>
					</div>

					<div class="{isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm {isDarkMode ? 'text-gray-400' : 'text-gray-600'}">Risk Level</p>
								<p class="text-2xl font-bold {isDarkMode ? 'text-white' : 'text-gray-900'}">
									{riskAssessment?.overall || 0}
								</p>
							</div>
							<div class="{isDarkMode ? 'bg-red-900' : 'bg-red-100'} p-3 rounded-full text-2xl">
								📊
							</div>
						</div>
					</div>

					<div class="{isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm {isDarkMode ? 'text-gray-400' : 'text-gray-600'}">
									Actions Required
								</p>
								<p class="text-2xl font-bold {isDarkMode ? 'text-white' : 'text-gray-900'}">
									{recommendations.length}
								</p>
							</div>
							<div class="{isDarkMode ? 'bg-green-900' : 'bg-green-100'} p-3 rounded-full text-2xl">
								💡
							</div>
						</div>
					</div>
				</div>

				<!-- Detection Panels Grid -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<!-- Pattern Detection Panel -->
					<PatternDetectionPanel patterns={detectedPatterns} {isDarkMode} />

					<!-- Risk Assessment Panel -->
					<RiskAssessmentPanel {riskAssessment} {isDarkMode} />
				</div>

				<!-- Recommendations Panel (Full Width) -->
				<RecommendationsPanel {recommendations} {isDarkMode} />

				<!-- Validation Rules Table -->
				<div class="{isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow">
					<div class="px-6 py-4 border-b {isDarkMode ? 'border-gray-700' : 'border-gray-200'}">
						<h3 class="text-lg font-medium {isDarkMode ? 'text-white' : 'text-gray-900'}">
							Active Detection Rules
						</h3>
					</div>
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y {isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}">
							<thead class={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
								<tr>
									<th
										class="px-6 py-3 text-left text-xs font-medium {isDarkMode
											? 'text-gray-300'
											: 'text-gray-500'} uppercase tracking-wider"
									>
										Rule Name
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium {isDarkMode
											? 'text-gray-300'
											: 'text-gray-500'} uppercase tracking-wider"
									>
										Severity
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium {isDarkMode
											? 'text-gray-300'
											: 'text-gray-500'} uppercase tracking-wider"
									>
										Status
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium {isDarkMode
											? 'text-gray-300'
											: 'text-gray-500'} uppercase tracking-wider"
									>
										Tags
									</th>
								</tr>
							</thead>
							<tbody class="divide-y {isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}">
								{#each validationRules as rule}
									<tr class={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
										<td class="px-6 py-4 whitespace-nowrap">
											<div
												class="text-sm font-medium {isDarkMode ? 'text-white' : 'text-gray-900'}"
											>
												{rule.name}
											</div>
											<div class="text-xs {isDarkMode ? 'text-gray-400' : 'text-gray-500'}">
												{rule.description}
											</div>
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											<span
												class="px-2 py-1 text-xs font-medium rounded-full {getSeverityColor(
													rule.severity
												)}"
											>
												{rule.severity}
											</span>
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											<span
												class="px-2 py-1 text-xs font-medium rounded-full {rule.enabled
													? isDarkMode
														? 'bg-green-900 text-green-300'
														: 'bg-green-100 text-green-800'
													: isDarkMode
														? 'bg-gray-700 text-gray-400'
														: 'bg-gray-100 text-gray-600'}"
											>
												{rule.enabled ? 'Enabled' : 'Disabled'}
											</span>
										</td>
										<td class="px-6 py-4">
											<div class="flex flex-wrap gap-1">
												{#each rule.metadata.tags as tag}
													<span
														class="px-2 py-1 text-xs rounded {isDarkMode
															? 'bg-gray-700 text-gray-300'
															: 'bg-gray-200 text-gray-700'}"
													>
														{tag}
													</span>
												{/each}
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		{/if}

		<!-- Evidence Tab -->
		{#if activeTab === 'evidence'}
			<div class="space-y-6">
				<!-- Search and Filters -->
				<div class="{isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow">
					<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div>
							<label
								for="search-input"
								class="block text-sm font-medium {isDarkMode
									? 'text-gray-300'
									: 'text-gray-700'} mb-2">Search</label
							>
							<input
								id="search-input"
								type="text"
								bind:value={searchQuery}
								placeholder="Search evidence..."
								class="w-full px-3 py-2 {isDarkMode
									? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
									: 'bg-white border-gray-300'} border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label
								for="type-select"
								class="block text-sm font-medium {isDarkMode
									? 'text-gray-300'
									: 'text-gray-700'} mb-2">Type</label
							>
							<select
								id="type-select"
								bind:value={filterType}
								class="w-full px-3 py-2 {isDarkMode
									? 'bg-gray-700 border-gray-600 text-white'
									: 'bg-white border-gray-300'} border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="all">All Types</option>
								<option value="suspicious_transaction">Suspicious Transaction</option>
								<option value="large_transfer">Large Transfer</option>
								<option value="rapid_movement">Rapid Movement</option>
								<option value="mixer_interaction">Mixer Interaction</option>
								<option value="potential_hack">Potential Hack</option>
							</select>
						</div>
						<div>
							<label
								for="priority-select"
								class="block text-sm font-medium {isDarkMode
									? 'text-gray-300'
									: 'text-gray-700'} mb-2">Priority</label
							>
							<select
								id="priority-select"
								bind:value={filterPriority}
								class="w-full px-3 py-2 {isDarkMode
									? 'bg-gray-700 border-gray-600 text-white'
									: 'bg-white border-gray-300'} border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="all">All Priorities</option>
								<option value="low">Low</option>
								<option value="medium">Medium</option>
								<option value="high">High</option>
								<option value="critical">Critical</option>
							</select>
						</div>
						<div class="flex items-end">
							<button
								on:click={loadInitialData}
								class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
							>
								Refresh
							</button>
						</div>
					</div>
				</div>

				<!-- Evidence List -->
				<div class="{isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow">
					<div class="px-6 py-4 border-b {isDarkMode ? 'border-gray-700' : 'border-gray-200'}">
						<h3 class="text-lg font-medium {isDarkMode ? 'text-white' : 'text-gray-900'}">
							Evidence ({getFilteredEvidence().length})
						</h3>
					</div>
					<div class="divide-y {isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}">
						{#each getFilteredEvidence() as item}
							<div class="p-6 {isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}">
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<div class="flex items-center space-x-3">
											<h4 class="text-sm font-medium {isDarkMode ? 'text-white' : 'text-gray-900'}">
												{item.id}
											</h4>
											<span
												class="px-2 py-1 text-xs font-medium rounded-full {getPriorityColor(
													item.metadata.priority
												)}"
											>
												{item.metadata.priority}
											</span>
											<span
												class="px-2 py-1 text-xs font-medium rounded-full {isDarkMode
													? 'bg-blue-900 text-blue-300'
													: 'bg-blue-100 text-blue-800'}"
											>
												{item.evidenceType}
											</span>
										</div>
										<p class="mt-1 text-sm {isDarkMode ? 'text-gray-300' : 'text-gray-600'}">
											{item.description}
										</p>
										<div class="mt-2 text-xs {isDarkMode ? 'text-gray-400' : 'text-gray-500'}">
											<span>Transaction: {item.transactionId}</span>
											<span class="mx-2">•</span>
											<span>Created: {formatTimestamp(item.timestamp)}</span>
											<span class="mx-2">•</span>
											<span>Investigator: {item.metadata.investigator}</span>
										</div>
									</div>
									<div class="flex space-x-2">
										<button
											on:click={() => analyzeEvidence(item.id)}
											class="text-blue-400 hover:text-blue-300 text-sm font-medium"
										>
											Analyze
										</button>
										<button
											on:click={() => exportEvidence(item.id)}
											class="text-green-400 hover:text-green-300 text-sm font-medium"
										>
											Export
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Alerts Tab -->
		{#if activeTab === 'alerts'}
			<div class="space-y-6">
				<!-- Critical Alerts -->
				{#if getCriticalAlerts().length > 0}
					<div
						class="{isDarkMode
							? 'bg-red-900 border-red-700'
							: 'bg-red-50 border-red-200'} border rounded-lg p-6"
					>
						<h3 class="text-lg font-medium {isDarkMode ? 'text-red-300' : 'text-red-900'} mb-4">
							Critical Alerts ({getCriticalAlerts().length})
						</h3>
						<div class="space-y-3">
							{#each getCriticalAlerts() as alert}
								<div
									class="{isDarkMode
										? 'bg-gray-800 border-red-700'
										: 'bg-white border-red-200'} p-4 rounded-md border"
								>
									<div class="flex items-center justify-between">
										<div>
											<h4
												class="text-sm font-medium {isDarkMode ? 'text-red-300' : 'text-red-900'}"
											>
												{alert.title}
											</h4>
											<p class="text-sm {isDarkMode ? 'text-red-400' : 'text-red-700'}">
												{alert.description}
											</p>
											<p class="text-xs {isDarkMode ? 'text-red-500' : 'text-red-600'} mt-1">
												{formatTimestamp(alert.timestamp)} • {alert.walletAddress}
											</p>
										</div>
										<span
											class="px-2 py-1 text-xs font-medium rounded-full {getSeverityColor(
												alert.severity
											)}"
										>
											{alert.severity}
										</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- All Alerts -->
				<div class="{isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow">
					<div class="px-6 py-4 border-b {isDarkMode ? 'border-gray-700' : 'border-gray-200'}">
						<h3 class="text-lg font-medium {isDarkMode ? 'text-white' : 'text-gray-900'}">
							All Alerts ({alerts.length})
						</h3>
					</div>
					<div class="divide-y {isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}">
						{#each getFilteredAlerts() as alert}
							<div class="p-6 {isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}">
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<div class="flex items-center space-x-3">
											<h4 class="text-sm font-medium {isDarkMode ? 'text-white' : 'text-gray-900'}">
												{alert.title}
											</h4>
											<span
												class="px-2 py-1 text-xs font-medium rounded-full {getSeverityColor(
													alert.severity
												)}"
											>
												{alert.severity}
											</span>
											<span
												class="px-2 py-1 text-xs font-medium rounded-full {isDarkMode
													? 'bg-gray-700 text-gray-300'
													: 'bg-gray-100 text-gray-800'}"
											>
												{alert.status}
											</span>
										</div>
										<p class="mt-1 text-sm {isDarkMode ? 'text-gray-300' : 'text-gray-600'}">
											{alert.description}
										</p>
										<div class="mt-2 text-xs {isDarkMode ? 'text-gray-400' : 'text-gray-500'}">
											<span>Transaction: {alert.transactionId}</span>
											<span class="mx-2">•</span>
											<span>Wallet: {alert.walletAddress}</span>
											<span class="mx-2">•</span>
											<span>Created: {formatTimestamp(alert.timestamp)}</span>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Collections Tab -->
		{#if activeTab === 'collections'}
			<div class="space-y-6">
				<div class="{isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow">
					<div class="px-6 py-4 border-b {isDarkMode ? 'border-gray-700' : 'border-gray-200'}">
						<h3 class="text-lg font-medium {isDarkMode ? 'text-white' : 'text-gray-900'}">
							Evidence Collections ({collections.length})
						</h3>
					</div>
					<div class="divide-y {isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}">
						{#each collections as collection}
							<div class="p-6 {isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}">
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<h4 class="text-sm font-medium {isDarkMode ? 'text-white' : 'text-gray-900'}">
											{collection.title}
										</h4>
										<p class="mt-1 text-sm {isDarkMode ? 'text-gray-300' : 'text-gray-600'}">
											{collection.description}
										</p>
										<div class="mt-2 text-xs {isDarkMode ? 'text-gray-400' : 'text-gray-500'}">
											<span>Case: {collection.caseId}</span>
											<span class="mx-2">•</span>
											<span>Evidence: {collection.evidenceIds.length}</span>
											<span class="mx-2">•</span>
											<span>Created: {formatTimestamp(collection.createdAt)}</span>
											<span class="mx-2">•</span>
											<span>Status: {collection.status}</span>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Analysis Tab -->
		{#if activeTab === 'analysis'}
			<div class="space-y-6">
				<div class="{isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow">
					<div class="px-6 py-4 border-b {isDarkMode ? 'border-gray-700' : 'border-gray-200'}">
						<h3 class="text-lg font-medium {isDarkMode ? 'text-white' : 'text-gray-900'}">
							Evidence Analysis ({analysis.length})
						</h3>
					</div>
					<div class="divide-y {isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}">
						{#each analysis as item}
							<div class="p-6 {isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}">
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<h4 class="text-sm font-medium {isDarkMode ? 'text-white' : 'text-gray-900'}">
											{item.analysisType}
										</h4>
										<p class="mt-1 text-sm {isDarkMode ? 'text-gray-300' : 'text-gray-600'}">
											{item.results.summary}
										</p>
										<div class="mt-2 text-xs {isDarkMode ? 'text-gray-400' : 'text-gray-500'}">
											<span>Evidence: {item.evidenceId}</span>
											<span class="mx-2">•</span>
											<span>Risk Score: {item.results.riskScore}</span>
											<span class="mx-2">•</span>
											<span>Confidence: {item.confidence}%</span>
											<span class="mx-2">•</span>
											<span>Analyzed: {formatTimestamp(item.analyzedAt)}</span>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Audit Tab -->
		{#if activeTab === 'audit'}
			<div class="space-y-6">
				<div class="{isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow">
					<div class="px-6 py-4 border-b {isDarkMode ? 'border-gray-700' : 'border-gray-200'}">
						<h3 class="text-lg font-medium {isDarkMode ? 'text-white' : 'text-gray-900'}">
							Audit Logs ({auditLogs.length})
						</h3>
					</div>
					<div class="divide-y {isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}">
						{#each auditLogs.slice(0, 50) as log}
							<div class="p-6 {isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}">
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<div class="flex items-center space-x-3">
											<h4 class="text-sm font-medium {isDarkMode ? 'text-white' : 'text-gray-900'}">
												{log.action}
											</h4>
											<span
												class="px-2 py-1 text-xs font-medium rounded-full {getPriorityColor(
													log.details.riskLevel
												)}"
											>
												{log.details.riskLevel}
											</span>
										</div>
										<p class="mt-1 text-sm {isDarkMode ? 'text-gray-300' : 'text-gray-600'}">
											{log.details.description}
										</p>
										<div class="mt-2 text-xs {isDarkMode ? 'text-gray-400' : 'text-gray-500'}">
											<span>Actor: {log.actor}</span>
											<span class="mx-2">•</span>
											<span>Resource: {log.resource}</span>
											<span class="mx-2">•</span>
											<span>Timestamp: {formatTimestamp(log.timestamp)}</span>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</main>

	<!-- Create Evidence Modal -->
	{#if showCreateEvidence}
		<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div
				class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md {isDarkMode
					? 'bg-gray-800 border-gray-700'
					: 'bg-white'}"
			>
				<div class="mt-3">
					<h3 class="text-lg font-medium {isDarkMode ? 'text-white' : 'text-gray-900'} mb-4">
						Create Evidence
					</h3>
					<form on:submit|preventDefault={createEvidence} class="space-y-4">
						<div>
							<label
								for="transaction-id"
								class="block text-sm font-medium {isDarkMode
									? 'text-gray-300'
									: 'text-gray-700'} mb-1">Transaction ID</label
							>
							<input
								id="transaction-id"
								type="text"
								bind:value={newEvidence.transactionId}
								required
								class="w-full px-3 py-2 {isDarkMode
									? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
									: 'bg-white border-gray-300'} border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label
								for="evidence-type"
								class="block text-sm font-medium {isDarkMode
									? 'text-gray-300'
									: 'text-gray-700'} mb-1">Evidence Type</label
							>
							<select
								id="evidence-type"
								bind:value={newEvidence.evidenceType}
								class="w-full px-3 py-2 {isDarkMode
									? 'bg-gray-700 border-gray-600 text-white'
									: 'bg-white border-gray-300'} border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="suspicious_transaction">Suspicious Transaction</option>
								<option value="large_transfer">Large Transfer</option>
								<option value="rapid_movement">Rapid Movement</option>
								<option value="mixer_interaction">Mixer Interaction</option>
								<option value="potential_hack">Potential Hack</option>
							</select>
						</div>
						<div>
							<label
								for="description"
								class="block text-sm font-medium {isDarkMode
									? 'text-gray-300'
									: 'text-gray-700'} mb-1">Description</label
							>
							<textarea
								id="description"
								bind:value={newEvidence.description}
								required
								rows="3"
								class="w-full px-3 py-2 {isDarkMode
									? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
									: 'bg-white border-gray-300'} border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							></textarea>
						</div>
						<div>
							<label
								for="investigator"
								class="block text-sm font-medium {isDarkMode
									? 'text-gray-300'
									: 'text-gray-700'} mb-1">Investigator</label
							>
							<input
								id="investigator"
								type="text"
								bind:value={newEvidence.investigator}
								required
								class="w-full px-3 py-2 {isDarkMode
									? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
									: 'bg-white border-gray-300'} border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label
								for="case-id"
								class="block text-sm font-medium {isDarkMode
									? 'text-gray-300'
									: 'text-gray-700'} mb-1">Case ID</label
							>
							<input
								id="case-id"
								type="text"
								bind:value={newEvidence.caseId}
								class="w-full px-3 py-2 {isDarkMode
									? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
									: 'bg-white border-gray-300'} border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<div class="flex space-x-4">
							<button
								type="submit"
								class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
							>
								Create
							</button>
							<button
								type="button"
								on:click={() => (showCreateEvidence = false)}
								class="flex-1 {isDarkMode
									? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
									: 'bg-gray-300 text-gray-700 hover:bg-gray-400'} px-4 py-2 rounded-md transition-colors"
							>
								Cancel
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	{/if}

	<!-- Create Collection Modal -->
	{#if showCreateCollection}
		<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div
				class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md {isDarkMode
					? 'bg-gray-800 border-gray-700'
					: 'bg-white'}"
			>
				<div class="mt-3">
					<h3 class="text-lg font-medium {isDarkMode ? 'text-white' : 'text-gray-900'} mb-4">
						Create Collection
					</h3>
					<form on:submit|preventDefault={createCollection} class="space-y-4">
						<div>
							<label
								for="collection-case-id"
								class="block text-sm font-medium {isDarkMode
									? 'text-gray-300'
									: 'text-gray-700'} mb-1">Case ID</label
							>
							<input
								id="collection-case-id"
								type="text"
								bind:value={newCollection.caseId}
								required
								class="w-full px-3 py-2 {isDarkMode
									? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
									: 'bg-white border-gray-300'} border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label
								for="collection-title"
								class="block text-sm font-medium {isDarkMode
									? 'text-gray-300'
									: 'text-gray-700'} mb-1">Title</label
							>
							<input
								id="collection-title"
								type="text"
								bind:value={newCollection.title}
								required
								class="w-full px-3 py-2 {isDarkMode
									? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
									: 'bg-white border-gray-300'} border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label
								for="collection-description"
								class="block text-sm font-medium {isDarkMode
									? 'text-gray-300'
									: 'text-gray-700'} mb-1">Description</label
							>
							<textarea
								id="collection-description"
								bind:value={newCollection.description}
								required
								rows="3"
								class="w-full px-3 py-2 {isDarkMode
									? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
									: 'bg-white border-gray-300'} border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							></textarea>
						</div>
						<div>
							<label
								for="collection-investigator"
								class="block text-sm font-medium {isDarkMode
									? 'text-gray-300'
									: 'text-gray-700'} mb-1">Investigator</label
							>
							<input
								id="collection-investigator"
								type="text"
								bind:value={newCollection.investigator}
								required
								class="w-full px-3 py-2 {isDarkMode
									? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
									: 'bg-white border-gray-300'} border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<div class="flex space-x-4">
							<button
								type="submit"
								class="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
							>
								Create
							</button>
							<button
								type="button"
								on:click={() => (showCreateCollection = false)}
								class="flex-1 {isDarkMode
									? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
									: 'bg-gray-300 text-gray-700 hover:bg-gray-400'} px-4 py-2 rounded-md transition-colors"
							>
								Cancel
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	{/if}
</div>
