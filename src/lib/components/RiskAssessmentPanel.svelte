<script lang="ts">
	/**
	 * Risk Assessment Panel
	 * Displays risk score with visual indicators and factor breakdown
	 */

	import type { RiskAssessment } from '../types/forensics.types';

	export let riskAssessment: RiskAssessment | null = null;
	export let isDarkMode = true;

	function getRiskColor(score: number): string {
		if (score >= 80)
			return isDarkMode
				? 'bg-red-900 border-red-700 text-red-300'
				: 'bg-red-100 border-red-400 text-red-800';
		if (score >= 60)
			return isDarkMode
				? 'bg-orange-900 border-orange-700 text-orange-300'
				: 'bg-orange-100 border-orange-400 text-orange-800';
		if (score >= 40)
			return isDarkMode
				? 'bg-yellow-900 border-yellow-700 text-yellow-300'
				: 'bg-yellow-100 border-yellow-400 text-yellow-800';
		return isDarkMode
			? 'bg-green-900 border-green-700 text-green-300'
			: 'bg-green-100 border-green-400 text-green-800';
	}

	function getRiskLevel(score: number): string {
		if (score >= 80) return 'CRITICAL';
		if (score >= 60) return 'HIGH';
		if (score >= 40) return 'MEDIUM';
		return 'LOW';
	}

	function getFactorBarColor(score: number): string {
		if (score >= 80) return isDarkMode ? 'bg-red-500' : 'bg-red-600';
		if (score >= 60) return isDarkMode ? 'bg-orange-500' : 'bg-orange-600';
		if (score >= 40) return isDarkMode ? 'bg-yellow-500' : 'bg-yellow-600';
		return isDarkMode ? 'bg-green-500' : 'bg-green-600';
	}

	function getFactorLabel(key: string): string {
		const labels: Record<string, string> = {
			mixer: '🔀 Mixer Interaction',
			newWallets: '👛 New Wallets',
			velocity: '⚡ Transaction Velocity',
			amount: '💰 Transaction Amount',
			patterns: '🔍 Suspicious Patterns'
		};
		return labels[key] || key;
	}
</script>

<div class="{isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6">
	<h3 class="text-lg font-medium {isDarkMode ? 'text-white' : 'text-gray-900'} mb-4">
		📊 Risk Assessment
	</h3>

	{#if !riskAssessment}
		<div class="text-center py-8">
			<p class="text-sm {isDarkMode ? 'text-gray-400' : 'text-gray-500'}">No risk data available</p>
		</div>
	{:else}
		<!-- Overall Risk Score -->
		<div class="mb-6">
			<div class="border-2 rounded-lg p-6 text-center {getRiskColor(riskAssessment.overall)}">
				<div class="text-4xl font-bold mb-2">{riskAssessment.overall}</div>
				<div class="text-sm uppercase tracking-wide">
					{getRiskLevel(riskAssessment.overall)} RISK
				</div>
				<div class="mt-2 text-xs opacity-75">Confidence: {riskAssessment.confidence}%</div>
			</div>
		</div>

		<!-- Risk Factors Breakdown -->
		<div class="space-y-4">
			<h4 class="text-sm font-medium {isDarkMode ? 'text-gray-300' : 'text-gray-700'}">
				Risk Factors
			</h4>
			{#each Object.entries(riskAssessment.factors) as [key, value]}
				<div>
					<div class="flex items-center justify-between mb-1">
						<span class="text-sm {isDarkMode ? 'text-gray-300' : 'text-gray-700'}">
							{getFactorLabel(key)}
						</span>
						<span class="text-sm font-medium {isDarkMode ? 'text-gray-200' : 'text-gray-800'}">
							{value}/100
						</span>
					</div>
					<div
						class="{isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2 overflow-hidden"
					>
						<div
							class="{getFactorBarColor(value)} h-full transition-all"
							style="width: {value}%"
						></div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Confidence Indicator -->
		<div class="mt-6 pt-4 border-t {isDarkMode ? 'border-gray-700' : 'border-gray-200'}">
			<div class="flex items-center justify-between">
				<span class="text-sm {isDarkMode ? 'text-gray-400' : 'text-gray-600'}">
					Detection Confidence
				</span>
				<div class="flex items-center space-x-2">
					<div
						class="{isDarkMode
							? 'bg-gray-700'
							: 'bg-gray-200'} rounded-full h-2 w-24 overflow-hidden"
					>
						<div
							class="{riskAssessment.confidence >= 80
								? 'bg-green-500'
								: riskAssessment.confidence >= 60
									? 'bg-yellow-500'
									: 'bg-orange-500'} h-full"
							style="width: {riskAssessment.confidence}%"
						></div>
					</div>
					<span class="text-sm font-medium {isDarkMode ? 'text-gray-200' : 'text-gray-800'}">
						{riskAssessment.confidence}%
					</span>
				</div>
			</div>
		</div>
	{/if}
</div>
