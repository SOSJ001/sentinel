<!--
	Main Dashboard
	Landing page that explains the two main components and their purposes
	Helps users understand when to use Wallet Monitor vs Forensics Dashboard
-->

<script lang="ts">
	import { goto } from '$app/navigation';

	// Navigation state
	let selectedComponent = '';

	function navigateToWalletMonitor() {
		goto('/wallet-monitor');
	}

	function navigateToForensicsDashboard() {
		goto('/forensics-dashboard');
	}
</script>

<div class="min-h-screen bg-gray-900">
	<!-- Header -->
	<header class="bg-gray-800 border-b border-gray-700">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center py-6">
				<div>
					<h1 class="text-3xl font-bold text-blue-400">Solana Forensics Platform</h1>
					<p class="text-gray-300 mt-2">
						Professional-grade blockchain investigation and monitoring tools
					</p>
				</div>
				<div class="flex items-center space-x-4">
					<div class="w-3 h-3 rounded-full bg-green-500"></div>
					<span class="text-sm text-gray-300">System Online</span>
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
		<!-- Introduction -->
		<div class="text-center mb-12">
			<h2 class="text-2xl font-semibold text-white mb-4">Choose Your Investigation Tool</h2>
			<p class="text-gray-300 max-w-3xl mx-auto">
				Select the appropriate tool based on your investigation needs. Each component serves a
				specific purpose in the forensics workflow.
			</p>
		</div>

		<!-- Component Selection Cards -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
			<!-- Wallet Monitor Card -->
			<div
				class="bg-gray-800 rounded-lg p-8 border border-gray-700 hover:border-blue-500 transition-colors"
			>
				<div class="flex items-center mb-6">
					<div class="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							></path>
						</svg>
					</div>
					<div>
						<h3 class="text-xl font-semibold text-white">Wallet Monitor</h3>
						<p class="text-gray-400">Real-time monitoring & analysis</p>
					</div>
				</div>

				<div class="space-y-4 mb-6">
					<div class="flex items-start">
						<div class="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
						<div>
							<h4 class="text-sm font-medium text-white">Live Transaction Monitoring</h4>
							<p class="text-sm text-gray-300">
								Monitor specific wallet addresses in real-time for suspicious activity
							</p>
						</div>
					</div>
					<div class="flex items-start">
						<div class="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
						<div>
							<h4 class="text-sm font-medium text-white">Automated Alert System</h4>
							<p class="text-sm text-gray-300">
								Receive instant notifications for suspicious patterns and large transfers
							</p>
						</div>
					</div>
					<div class="flex items-start">
						<div class="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
						<div>
							<h4 class="text-sm font-medium text-white">Transaction Tracing</h4>
							<p class="text-sm text-gray-300">
								Follow the flow of funds through the blockchain network
							</p>
						</div>
					</div>
				</div>

				<div class="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4 mb-6">
					<h4 class="text-sm font-medium text-blue-300 mb-2">When to Use:</h4>
					<ul class="text-sm text-blue-200 space-y-1">
						<li>• Investigating a specific wallet address</li>
						<li>• Monitoring ongoing suspicious activity</li>
						<li>• Real-time threat detection</li>
						<li>• Following money trails</li>
					</ul>
				</div>

				<button
					on:click={navigateToWalletMonitor}
					class="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
				>
					Start Wallet Monitoring
				</button>
			</div>

			<!-- Forensics Dashboard Card -->
			<div
				class="bg-gray-800 rounded-lg p-8 border border-gray-700 hover:border-green-500 transition-colors"
			>
				<div class="flex items-center mb-6">
					<div class="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							></path>
						</svg>
					</div>
					<div>
						<h3 class="text-xl font-semibold text-white">Forensics Dashboard</h3>
						<p class="text-gray-400">Evidence management & analysis</p>
					</div>
				</div>

				<div class="space-y-4 mb-6">
					<div class="flex items-start">
						<div class="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
						<div>
							<h4 class="text-sm font-medium text-white">Evidence Collection</h4>
							<p class="text-sm text-gray-300">
								Create, organize, and manage forensic evidence with proper chain of custody
							</p>
						</div>
					</div>
					<div class="flex items-start">
						<div class="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
						<div>
							<h4 class="text-sm font-medium text-white">Case Management</h4>
							<p class="text-sm text-gray-300">
								Organize investigations into cases with proper documentation and metadata
							</p>
						</div>
					</div>
					<div class="flex items-start">
						<div class="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
						<div>
							<h4 class="text-sm font-medium text-white">Analysis & Reporting</h4>
							<p class="text-sm text-gray-300">
								Analyze evidence, generate reports, and maintain audit trails
							</p>
						</div>
					</div>
				</div>

				<div class="bg-green-900 bg-opacity-30 border border-green-700 rounded-lg p-4 mb-6">
					<h4 class="text-sm font-medium text-green-300 mb-2">When to Use:</h4>
					<ul class="text-sm text-green-200 space-y-1">
						<li>• Managing collected evidence</li>
						<li>• Building case files</li>
						<li>• Generating reports</li>
						<li>• Maintaining chain of custody</li>
					</ul>
				</div>

				<button
					on:click={navigateToForensicsDashboard}
					class="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
				>
					Open Forensics Dashboard
				</button>
			</div>
		</div>

		<!-- Workflow Explanation -->
		<div class="bg-gray-800 rounded-lg p-8 border border-gray-700">
			<h3 class="text-xl font-semibold text-white mb-6">Investigation Workflow</h3>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div class="text-center">
					<div
						class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"
					>
						<span class="text-2xl font-bold text-white">1</span>
					</div>
					<h4 class="text-lg font-medium text-white mb-2">Monitor</h4>
					<p class="text-gray-300 text-sm">
						Use Wallet Monitor to track suspicious addresses and detect real-time threats
					</p>
				</div>
				<div class="text-center">
					<div
						class="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4"
					>
						<span class="text-2xl font-bold text-white">2</span>
					</div>
					<h4 class="text-lg font-medium text-white mb-2">Collect</h4>
					<p class="text-gray-300 text-sm">
						Gather evidence and create proper documentation with chain of custody
					</p>
				</div>
				<div class="text-center">
					<div
						class="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4"
					>
						<span class="text-2xl font-bold text-white">3</span>
					</div>
					<h4 class="text-lg font-medium text-white mb-2">Analyze</h4>
					<p class="text-gray-300 text-sm">
						Use Forensics Dashboard to analyze evidence and generate comprehensive reports
					</p>
				</div>
			</div>
		</div>

		<!-- Quick Actions -->
		<div class="mt-12 text-center">
			<h3 class="text-lg font-semibold text-white mb-4">Quick Actions</h3>
			<div class="flex flex-wrap justify-center gap-4">
				<button
					on:click={navigateToWalletMonitor}
					class="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
				>
					Monitor New Wallet
				</button>
				<button
					on:click={navigateToForensicsDashboard}
					class="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
				>
					View All Evidence
				</button>
			</div>
		</div>
	</main>
</div>
