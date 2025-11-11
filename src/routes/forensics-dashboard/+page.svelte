<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	let ForensicsDashboard: any = null;
	let isLoading = true;

	onMount(async () => {
		if (browser) {
			const module = await import('$lib/components/ForensicsDashboard.svelte');
			ForensicsDashboard = module.default;
			isLoading = false;
		}
	});
</script>

{#if browser && !isLoading && ForensicsDashboard}
	<svelte:component this={ForensicsDashboard} />
{:else}
	<div class="min-h-screen bg-gray-900 flex items-center justify-center">
		<div class="text-center">
			<div
				class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"
			></div>
			<p class="text-gray-300">Loading Forensics Dashboard...</p>
		</div>
	</div>
{/if}
