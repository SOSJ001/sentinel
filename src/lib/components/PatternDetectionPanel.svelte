<script lang="ts">
	/**
	 * Pattern Detection Panel
	 * Displays detected attack patterns (circular, fan-out, clustering)
	 */

	export let patterns: string[] = [];
	export let isDarkMode = true;

	// Pattern type detection
	function getPatternIcon(pattern: string): string {
		if (pattern.includes('Circular') || pattern.includes('circular')) return '🔄';
		if (pattern.includes('Fan-out') || pattern.includes('fan-out')) return '🌊';
		if (pattern.includes('Rapid') || pattern.includes('rapid')) return '⚡';
		if (pattern.includes('mixer') || pattern.includes('Mixer')) return '🚨';
		if (pattern.includes('Clustering') || pattern.includes('clustering')) return '🔗';
		return '⚠️';
	}

	function getPatternSeverity(pattern: string): string {
		if (pattern.includes('Circular') || pattern.includes('mixer')) return 'emergency';
		if (pattern.includes('Fan-out') || pattern.includes('Rapid')) return 'critical';
		return 'warning';
	}

	function getSeverityColor(severity: string): string {
		switch (severity) {
			case 'emergency':
				return isDarkMode
					? 'bg-red-900 border-red-700 text-red-300'
					: 'bg-red-100 border-red-300 text-red-800';
			case 'critical':
				return isDarkMode
					? 'bg-orange-900 border-orange-700 text-orange-300'
					: 'bg-orange-100 border-orange-300 text-orange-800';
			case 'warning':
				return isDarkMode
					? 'bg-yellow-900 border-yellow-700 text-yellow-300'
					: 'bg-yellow-100 border-yellow-300 text-yellow-800';
			default:
				return isDarkMode
					? 'bg-gray-800 border-gray-600 text-gray-300'
					: 'bg-gray-100 border-gray-300 text-gray-700';
		}
	}
</script>

<div class="{isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6">
	<div class="flex items-center justify-between mb-4">
		<h3 class="text-lg font-medium {isDarkMode ? 'text-white' : 'text-gray-900'}">
			🔍 Pattern Detection
		</h3>
		<span
			class="px-3 py-1 text-sm font-medium rounded-full {isDarkMode
				? 'bg-blue-900 text-blue-300'
				: 'bg-blue-100 text-blue-800'}"
		>
			{patterns.length} Pattern{patterns.length !== 1 ? 's' : ''} Detected
		</span>
	</div>

	{#if patterns.length === 0}
		<div class="text-center py-8">
			<p class="text-sm {isDarkMode ? 'text-gray-400' : 'text-gray-500'}">
				✅ No suspicious patterns detected
			</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each patterns as pattern, index}
				{@const severity = getPatternSeverity(pattern)}
				<div class="border rounded-lg p-4 {getSeverityColor(severity)}">
					<div class="flex items-start space-x-3">
						<span class="text-2xl">{getPatternIcon(pattern)}</span>
						<div class="flex-1">
							<p class="text-sm font-medium">{pattern}</p>
							<div class="mt-2 flex items-center space-x-2">
								<span class="text-xs uppercase tracking-wide opacity-75">Severity: {severity}</span>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
