<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	let WalletMonitor: any = null;
	let isLoading = true;

	onMount(async () => {
		if (browser) {
			const module = await import('$lib/components/WalletMonitor.svelte');
			WalletMonitor = module.default;
			isLoading = false;
		}
	});
</script>

{#if browser && !isLoading && WalletMonitor}
	<svelte:component this={WalletMonitor} />
{:else}
	<div class="min-h-screen bg-gray-900 flex items-center justify-center">
		<div class="text-center">
			<div
				class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"
			></div>
			<p class="text-gray-300">Loading Wallet Monitor...</p>
		</div>
	</div>
{/if}
