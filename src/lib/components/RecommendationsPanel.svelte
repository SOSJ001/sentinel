<script lang="ts">
	/**
	 * Recommendations Panel
	 * Displays actionable recommendations for investigators
	 */

	export let recommendations: string[] = [];
	export let isDarkMode = true;

	function getRecommendationPriority(recommendation: string): 'critical' | 'high' | 'medium' {
		if (
			recommendation.includes('CRITICAL') ||
			recommendation.includes('escalate') ||
			recommendation.includes('mixer')
		) {
			return 'critical';
		}
		if (recommendation.includes('Investigate') || recommendation.includes('Monitor')) {
			return 'high';
		}
		return 'medium';
	}

	function getPriorityIcon(priority: string): string {
		switch (priority) {
			case 'critical':
				return '🚨';
			case 'high':
				return '⚠️';
			default:
				return '📋';
		}
	}

	function getPriorityColor(priority: string): string {
		switch (priority) {
			case 'critical':
				return isDarkMode ? 'border-l-red-500 bg-red-900/20' : 'border-l-red-600 bg-red-50';
			case 'high':
				return isDarkMode
					? 'border-l-orange-500 bg-orange-900/20'
					: 'border-l-orange-600 bg-orange-50';
			default:
				return isDarkMode ? 'border-l-blue-500 bg-blue-900/20' : 'border-l-blue-600 bg-blue-50';
		}
	}

	function getPriorityTextColor(priority: string): string {
		switch (priority) {
			case 'critical':
				return isDarkMode ? 'text-red-300' : 'text-red-800';
			case 'high':
				return isDarkMode ? 'text-orange-300' : 'text-orange-800';
			default:
				return isDarkMode ? 'text-blue-300' : 'text-blue-800';
		}
	}
</script>

<div class="{isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6">
	<div class="flex items-center justify-between mb-4">
		<h3 class="text-lg font-medium {isDarkMode ? 'text-white' : 'text-gray-900'}">
			💡 Recommendations
		</h3>
		<span
			class="px-3 py-1 text-sm font-medium rounded-full {isDarkMode
				? 'bg-purple-900 text-purple-300'
				: 'bg-purple-100 text-purple-800'}"
		>
			{recommendations.length} Action{recommendations.length !== 1 ? 's' : ''}
		</span>
	</div>

	{#if recommendations.length === 0}
		<div class="text-center py-8">
			<p class="text-sm {isDarkMode ? 'text-gray-400' : 'text-gray-500'}">
				✅ No specific recommendations at this time
			</p>
			<p class="text-xs {isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1">
				Continue standard monitoring procedures
			</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each recommendations as recommendation, index}
				{@const priority = getRecommendationPriority(recommendation)}
				<div
					class="border-l-4 rounded-r-lg p-4 {getPriorityColor(priority)} {isDarkMode
						? 'bg-gray-700/50'
						: 'bg-white'}"
				>
					<div class="flex items-start space-x-3">
						<span class="text-xl flex-shrink-0">{getPriorityIcon(priority)}</span>
						<div class="flex-1 min-w-0">
							<p class="text-sm {getPriorityTextColor(priority)}">{recommendation}</p>
							{#if priority === 'critical'}
								<div class="mt-2">
									<span
										class="inline-flex items-center px-2 py-1 text-xs font-medium rounded {isDarkMode
											? 'bg-red-900 text-red-200'
											: 'bg-red-100 text-red-800'}"
									>
										IMMEDIATE ACTION REQUIRED
									</span>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Action Summary -->
		<div class="mt-6 pt-4 border-t {isDarkMode ? 'border-gray-700' : 'border-gray-200'}">
			<div class="grid grid-cols-3 gap-4 text-center">
				<div>
					<div class="text-2xl font-bold {isDarkMode ? 'text-red-400' : 'text-red-600'}">
						{recommendations.filter((r) => getRecommendationPriority(r) === 'critical').length}
					</div>
					<div class="text-xs {isDarkMode ? 'text-gray-400' : 'text-gray-600'}">Critical</div>
				</div>
				<div>
					<div class="text-2xl font-bold {isDarkMode ? 'text-orange-400' : 'text-orange-600'}">
						{recommendations.filter((r) => getRecommendationPriority(r) === 'high').length}
					</div>
					<div class="text-xs {isDarkMode ? 'text-gray-400' : 'text-gray-600'}">High</div>
				</div>
				<div>
					<div class="text-2xl font-bold {isDarkMode ? 'text-blue-400' : 'text-blue-600'}">
						{recommendations.filter((r) => getRecommendationPriority(r) === 'medium').length}
					</div>
					<div class="text-xs {isDarkMode ? 'text-gray-400' : 'text-gray-600'}">Medium</div>
				</div>
			</div>
		</div>
	{/if}
</div>
